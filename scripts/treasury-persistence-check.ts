import { addTransaction, updateTransaction, deleteTransaction, getAllTransactions, mergeTransactions, replaceTransactions } from '../src/services/db';
import { getTotals } from '../src/services/ledger';
import { createBackup, validateBackup } from '../src/utils/backup';
import type { Transaction, TransactionInput } from '../src/types/transaction';

const date = '2026-11-01T12:00:00Z';
const record = (id: string, type: 'income' | 'expense' | 'debt_given', amount: number): Transaction => ({
  id, type, title: `اختبار ${id}`, amount, occurredAt: date, createdAt: date, updatedAt: date, note: 'بيانات اختبار', emoji: null,
});
const legacy = [record('opening', 'income', 1_000_000), record('expense', 'expense', 100_000), record('loan', 'debt_given', 200_000),
  { ...record('repayment', 'income', 50_000), type: 'debt_repayment', debtId: 'loan' } as Transaction];
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function guard() {
  assert(['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '4175', 'Use only the disposable localhost:4175 test origin.');
}
async function snapshot() { return JSON.stringify((await getAllTransactions()).sort((a, b) => a.id.localeCompare(b.id))); }
async function rejectsWithoutWrites(action: () => Promise<unknown>) {
  const before = await snapshot();
  let rejected = false;
  try { await action(); } catch { rejected = true; }
  assert(rejected, 'Invalid mutation was accepted');
  assert(await snapshot() === before, 'Rejected mutation changed persistent records');
}
async function seed(version: number) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('masroofi-db');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other fixture tabs.'));
  });
  const rows = version === 1 ? legacy.slice(0, 2) : legacy;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('masroofi-db', version);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('transactions', { keyPath: 'id' });
      store.createIndex('occurredAt', 'occurredAt'); store.createIndex('type', 'type');
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions', 'readwrite');
      rows.forEach((item) => tx.objectStore('transactions').put(item));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
  const upgraded = await getAllTransactions();
  assert(upgraded.length === rows.length && upgraded.every((item) => rows.some((old) => JSON.stringify(old) === JSON.stringify(item))), 'Upgrade altered legacy records');
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('masroofi-db');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions');
      const store = tx.objectStore('transactions');
      const valid = db.version === 3 && db.objectStoreNames.length === 1 && store.keyPath === 'id'
        && store.indexNames.contains('type') && store.indexNames.contains('occurredAt');
      tx.oncomplete = () => {
        db.close();
        if (valid) resolve(); else reject(new Error('Upgrade changed store layout'));
      };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
}
const input = (type: TransactionInput['type'], amount: number): TransactionInput => {
  assert(type !== 'debt_repayment', 'Use a debt fixture for repayments');
  return { type, title: `اختبار ${type}`, amount, occurredAt: date };
};

export async function runTreasuryPersistenceChecks() {
  guard();
  const passed: string[] = [];
  await seed(1); await seed(2);
  passed.push('V1 and V2 upgrade to V3 without changing records, metadata or indexes');
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('masroofi-db', 2);
    request.onerror = () => request.error?.name === 'VersionError' ? resolve() : reject(request.error);
    request.onsuccess = () => { request.result.close(); reject(new Error('Old writer was not fenced')); };
  });
  passed.push('Older V2 writers cannot open the upgraded ledger');
  const deposit = await addTransaction(input('treasury_deposit', 400_000));
  const withdrawal = await addTransaction(input('treasury_withdrawal', 100_000));
  const expense = await addTransaction(input('treasury_expense', 50_000));
  let totals = getTotals(await getAllTransactions());
  assert(totals.balance === 450_000 && totals.treasury === 250_000 && totals.expenses === 150_000, 'Incorrect cash/treasury/expense totals');
  passed.push('Deposit, return and direct spending persist with correct independent totals');
  await rejectsWithoutWrites(() => addTransaction(input('treasury_deposit', 450_001)));
  await rejectsWithoutWrites(() => addTransaction(input('treasury_withdrawal', 250_001)));
  await rejectsWithoutWrites(() => addTransaction(input('treasury_expense', 250_001)));
  await rejectsWithoutWrites(() => deleteTransaction(deposit.id));
  await rejectsWithoutWrites(() => updateTransaction(deposit.id, input('treasury_deposit', 100_000)));
  await rejectsWithoutWrites(() => updateTransaction(expense.id, input('expense', 50_000)));
  passed.push('Overdraws, unsafe deposit changes and type changes roll back atomically');
  await updateTransaction(withdrawal.id, input('treasury_withdrawal', 50_000));
  totals = getTotals(await getAllTransactions());
  assert(totals.balance === 400_000 && totals.treasury === 300_000, 'Editing transfer did not update both sides');
  await deleteTransaction(expense.id);
  assert(getTotals(await getAllTransactions()).expenses === 100_000, 'Deleting direct spending did not reverse expenses');
  const backup = validateBackup(JSON.parse(JSON.stringify(createBackup(await getAllTransactions()))));
  const saved = await snapshot();
  await replaceTransactions(legacy);
  await replaceTransactions(backup.transactions);
  assert(await snapshot() === saved, 'Backup round trip changed data');
  await mergeTransactions(backup.transactions);
  assert(await snapshot() === saved, 'Repeated merge changed data');
  await rejectsWithoutWrites(() => replaceTransactions([withdrawal]));
  const competing = { ...withdrawal, id: 'imported-withdrawal', amount: 400_000 };
  await rejectsWithoutWrites(() => mergeTransactions([deposit, competing]));
  passed.push('V3 export/restore and repeated merge preserve records; conflicting imports do not write');
  const race = await Promise.allSettled([250_000, 250_000].map((amount) => addTransaction(input('treasury_expense', amount))));
  assert(race.filter((item) => item.status === 'fulfilled').length === 1, 'Concurrent spending overdrew treasury');
  await replaceTransactions(legacy);
  const cashRace = await Promise.allSettled([500_000, 500_000].map((amount) => addTransaction(input('treasury_deposit', amount))));
  assert(cashRace.filter((item) => item.status === 'fulfilled').length === 1, 'Concurrent deposits exceeded available cash');
  passed.push('Concurrent treasury spending and deposits serialize against latest balances');
  await replaceTransactions(backup.transactions);
  assert(await snapshot() === saved, 'Final fixture differs');
  sessionStorage.setItem('treasury-test-snapshot', saved);
  return { passed, totals: getTotals(await getAllTransactions()), records: backup.transactions.length };
}

export async function verifyTreasuryAfterReload() {
  guard();
  const expected = sessionStorage.getItem('treasury-test-snapshot');
  assert(expected && await snapshot() === expected, 'Reload lost or changed persisted data');
  return { passed: ['Reload preserves every record and all metadata'], totals: getTotals(await getAllTransactions()) };
}
