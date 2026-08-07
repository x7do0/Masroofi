const DB_NAME = 'masroofi-db';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

export interface StoredTransaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  occurredAt: string;
  note: string | null;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('occurredAt', 'occurredAt');
        store.createIndex('type', 'type');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('تعذر فتح قاعدة البيانات المحلية.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('تعذر تنفيذ العملية المحلية.'));
  });
}

export async function getAllTransactions(): Promise<StoredTransaction[]> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const result = await requestToPromise(store.getAll());
    return result.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  } finally {
    db.close();
  }
}

export async function putTransaction(transaction: StoredTransaction): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(tx.objectStore(STORE_NAME).put(transaction));
  } finally {
    db.close();
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(tx.objectStore(STORE_NAME).delete(id));
  } finally {
    db.close();
  }
}

export async function replaceTransactions(transactions: StoredTransaction[]): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const item of transactions) store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('تعذر استرجاع النسخة الاحتياطية.'));
      tx.onabort = () => reject(tx.error ?? new Error('تم إلغاء استرجاع النسخة الاحتياطية.'));
    });
  } finally {
    db.close();
  }
}
