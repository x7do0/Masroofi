import type { Transaction, TransactionInput } from '../types/transaction';
import { assertSameTransactionIdentity, sortTransactions, validateTransactions } from './ledger';

const DB_NAME = 'masroofi-db';
// No store rewrite: the version bump fences old v1 writers that cannot preserve debt links.
const DB_VERSION = 2;
const STORE_NAME = 'transactions';
export const TRANSACTIONS_CHANGED_EVENT = 'masroofi-transactions-changed';
export const TRANSACTIONS_CHANNEL = 'masroofi-transactions';

export type StoredTransaction = Transaction;
export interface MergeResult { added: number; updated: number; total: number }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let abandoned = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('occurredAt', 'occurredAt');
        store.createIndex('type', 'type');
      }
    };
    request.onsuccess = () => {
      if (abandoned) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onblocked = () => {
      abandoned = true;
      reject(new Error('أغلق نوافذ مصروفي القديمة ثم أعد فتح التطبيق لإكمال تحديث التخزين بأمان.'));
    };
    request.onerror = () => reject(request.error ?? new Error('تعذر فتح قاعدة البيانات المحلية.'));
  });
}

export async function getAllTransactions(): Promise<StoredTransaction[]> {
  const db = await openDatabase();
  try {
    return await new Promise<StoredTransaction[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      tx.oncomplete = () => {
        try {
          const result: unknown = request.result;
          validateTransactions(result);
          resolve(sortTransactions(result));
        } catch (cause) { reject(cause); }
      };
      tx.onabort = () => reject(tx.error ?? new Error('تعذر تحميل البيانات المحلية.'));
    });
  } finally { db.close(); }
}

function announceChange(): void {
  // Notifications are best-effort; they must never turn a committed write into a reported failure.
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(TRANSACTIONS_CHANNEL);
      channel.postMessage('changed');
      channel.close();
    }
  } catch { /* Focus/visibility refresh is the fallback when broadcasting is unavailable. */ }
}

interface Mutation<T> { transactions: Transaction[]; result: T }

/** IndexedDB serializes readwrite transactions on this store across tabs. */
async function mutateTransactions<T>(mutate: (current: Transaction[]) => Mutation<T>): Promise<T> {
  const db = await openDatabase();
  try {
    const result = await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      let outcome: T;
      let failure: unknown;
      tx.oncomplete = () => resolve(outcome);
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('تم إلغاء العملية ولم تتغير بياناتك.'));
      request.onsuccess = () => {
        try {
          const current = request.result as Transaction[];
          const next = mutate(current);
          validateTransactions(next.transactions);
          const currentById = new Map(current.map((item) => [item.id, item]));
          const nextIds = new Set(next.transactions.map((item) => item.id));
          for (const item of current) if (!nextIds.has(item.id)) store.delete(item.id);
          for (const item of next.transactions) {
            if (currentById.get(item.id) !== item) store.put(item);
          }
          outcome = next.result;
        } catch (cause) {
          failure = cause;
          tx.abort();
        }
      };
    });
    announceChange();
    return result;
  } finally { db.close(); }
}

function createTransaction(input: TransactionInput, id: string, createdAt: string, updatedAt: string): Transaction {
  return {
    ...input,
    id,
    title: input.title.trim(),
    amount: input.amount,
    occurredAt: input.occurredAt,
    note: input.note?.trim() || null,
    emoji: input.emoji || null,
    createdAt,
    updatedAt,
  };
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
  const snapshot = structuredClone(input);
  return mutateTransactions((current) => {
    const now = new Date().toISOString();
    const item = createTransaction(snapshot, crypto.randomUUID(), now, now);
    return { transactions: [...current, item], result: item };
  });
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const snapshot = structuredClone(input);
  return mutateTransactions((current) => {
    const existing = current.find((item) => item.id === id);
    if (!existing) throw new Error('العملية غير موجودة. ربما حذفت من نافذة أخرى.');
    // Keep local edits newer even after importing a future timestamp or rapid repeated saves.
    const updatedAt = new Date(Math.max(Date.now(), new Date(existing.updatedAt).getTime() + 1)).toISOString();
    const item = createTransaction(snapshot, id, existing.createdAt, updatedAt);
    assertSameTransactionIdentity(existing, item);
    return { transactions: current.map((candidate) => candidate.id === id ? item : candidate), result: undefined };
  });
}

/** Compatibility upsert; the same identity and graph rules apply as to form edits. */
export async function putTransaction(transaction: StoredTransaction): Promise<void> {
  const snapshot = structuredClone(transaction);
  return mutateTransactions((current) => {
    const existing = current.find((item) => item.id === snapshot.id);
    if (existing) assertSameTransactionIdentity(existing, snapshot);
    return {
      transactions: existing ? current.map((item) => item.id === snapshot.id ? snapshot : item) : [...current, snapshot],
      result: undefined,
    };
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return mutateTransactions((current) => {
    const existing = current.find((item) => item.id === id);
    if (!existing) throw new Error('العملية غير موجودة. ربما حذفت من نافذة أخرى.');
    return {
      transactions: current.filter((item) => item.id !== id
        && !(existing.type === 'debt_given' && item.type === 'debt_repayment' && item.debtId === id)),
      result: undefined,
    };
  });
}

export async function replaceTransactions(transactions: StoredTransaction[]): Promise<void> {
  const snapshot = structuredClone(transactions);
  await mutateTransactions(() => ({ transactions: snapshot, result: undefined }));
}

export async function mergeTransactions(transactions: StoredTransaction[]): Promise<MergeResult> {
  const snapshot = structuredClone(transactions);
  return mutateTransactions((current) => {
    validateTransactions(snapshot);
    validateTransactions(current);
    const byId = new Map(current.map((item) => [item.id, item]));
    let added = 0;
    let updated = 0;
    for (const incoming of snapshot) {
      const existing = byId.get(incoming.id);
      if (!existing) {
        byId.set(incoming.id, incoming);
        added += 1;
      } else if (new Date(incoming.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        assertSameTransactionIdentity(existing, incoming);
        byId.set(incoming.id, incoming);
        updated += 1;
      }
    }
    // Independently valid snapshots can conflict (for example concurrent repayments).
    // The mutation runner validates the merged graph before it queues any writes.
    return { transactions: [...byId.values()], result: { added, updated, total: byId.size } };
  });
}
