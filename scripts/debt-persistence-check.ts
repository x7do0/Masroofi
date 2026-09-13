/**
 * Real IndexedDB checks for a disposable local browser origin. With Vite on port
 * 4174 or 4175, run in the browser console (adjust the configured base path):
 * const checks = await import('/Masroofi/scripts/debt-persistence-check.ts');
 * await checks.runDebtPersistenceChecks();
 * Reload or close/reopen the tab, import again, then run:
 * await checks.verifyDebtPersistenceAfterReopen();
 * This resets ONLY the test origin's database and leaves a known debt fixture.
 */
import {
  addTransaction, updateTransaction, deleteTransaction, getAllTransactions,
  replaceTransactions, mergeTransactions, putTransaction,
} from '../src/services/db';
import { getTotals, getDebts, getTransactionTitle } from '../src/services/ledger';
import { createBackup, validateBackup } from '../src/utils/backup';
import type { Transaction } from '../src/types/transaction';

const timestamp = '2026-09-13T09:30:00.000Z';
const newerTimestamp = '2090-01-01T00:00:00.000Z';
const databaseName = 'masroofi-db';
const legacy: Transaction[] = [
  {
    id: 'test-opening', type: 'income', title: 'رصيد اختبار قديم', amount: 1_100_000,
    occurredAt: timestamp, note: 'legacy-v1 fixture', emoji: null,
    createdAt: timestamp, updatedAt: timestamp,
  },
  {
    id: 'test-expense', type: 'expense', title: 'مصروف اختبار قديم', amount: 100_000,
    occurredAt: timestamp, note: null, emoji: '🧾', createdAt: timestamp, updatedAt: timestamp,
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertDisposableOrigin() {
  assert(['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    && ['4174', '4175'].includes(location.port),
  'These checks reset fixture data and may run only on the isolated localhost test ports 4174 or 4175.');
}

async function seedLegacyDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other tabs on this disposable test origin before retrying.'));
  });
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('transactions', { keyPath: 'id' });
      store.createIndex('occurredAt', 'occurredAt');
      store.createIndex('type', 'type');
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('transactions', 'readwrite');
      for (const record of legacy) tx.objectStore('transactions').put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}

async function snapshot() {
  return JSON.stringify((await getAllTransactions()).sort((a, b) => a.id.localeCompare(b.id)));
}

async function verifyUpgradedSchema() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      try {
        assert(db.version === 2, `Legacy database was not upgraded to version 2: ${db.version}`);
        assert(db.objectStoreNames.length === 1 && db.objectStoreNames.contains('transactions'), 'Migration changed the existing store layout');
        const store = db.transaction('transactions', 'readonly').objectStore('transactions');
        assert(store.keyPath === 'id' && store.indexNames.contains('occurredAt') && store.indexNames.contains('type'),
          'Migration changed the existing key or indexes');
        resolve();
      } catch (cause) { reject(cause); } finally { db.close(); }
    };
  });
}

async function rejectedWithoutWrites(action: () => Promise<unknown>, label: string) {
  const before = await snapshot();
  let rejected = false;
  try { await action(); } catch { rejected = true; }
  assert(rejected, `${label}: invalid operation was accepted`);
  assert(await snapshot() === before, `${label}: failed operation partially changed persistent data`);
}

async function expectTotals(expected: Partial<ReturnType<typeof getTotals>>) {
  const records = await getAllTransactions();
  const totals = getTotals(records);
  for (const [key, value] of Object.entries(expected)) {
    assert(totals[key as keyof typeof totals] === value, `${key}: expected ${value}, got ${totals[key as keyof typeof totals]}`);
  }
  return records;
}

export async function runDebtPersistenceChecks() {
  assertDisposableOrigin();
  const passed: string[] = [];
  await seedLegacyDatabase();
  const original = await getAllTransactions();
  assert(original.length === 2 && original.every((record) => legacy.some((old) => JSON.stringify(old) === JSON.stringify(record))),
    'Opening the legacy V1 database changed or dropped income/expense metadata');
  await verifyUpgradedSchema();
  await expectTotals({ income: 1_100_000, expenses: 100_000, balance: 1_000_000, outstanding: 0 });
  passed.push('IndexedDB V1 upgrades to V2 with income/expense records, store, key, and indexes intact');

  let debt = await addTransaction({ type: 'debt_given', title: 'علي للاختبار', amount: 200_000,
    occurredAt: timestamp, note: 'fixture loan', emoji: '🤝' });
  await expectTotals({ balance: 800_000, income: 1_100_000, expenses: 100_000, outstanding: 200_000 });
  let payment = await addTransaction({ type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 50_000, occurredAt: timestamp, note: 'fixture repayment' });
  await expectTotals({ balance: 850_000, income: 1_100_000, outstanding: 150_000 });
  assert(getDebts(await getAllTransactions())[0].status === 'partial', 'Partial payment status is incorrect');
  passed.push('Cases 1–2: persisted loan and partial repayment affect cash without changing income/expense');

  await rejectedWithoutWrites(() => addTransaction({ type: 'debt_repayment', debtId: debt.id,
    title: debt.title, amount: 150_001, occurredAt: timestamp }), 'Overpayment');
  await rejectedWithoutWrites(() => addTransaction({ type: 'debt_repayment', debtId: 'missing-loan',
    title: debt.title, amount: 1, occurredAt: timestamp }), 'Orphan repayment');
  await rejectedWithoutWrites(() => addTransaction({ type: 'income', title: 'unsafe amount',
    amount: Number.MAX_SAFE_INTEGER + 1, occurredAt: timestamp }), 'Unsafe amount');
  passed.push('Case 7: overpayment, orphan reference, and unsafe amount reject without partial writes');

  await updateTransaction(debt.id, { type: 'debt_given', title: debt.title, amount: 250_000, occurredAt: timestamp });
  await expectTotals({ balance: 800_000, outstanding: 200_000 });
  await rejectedWithoutWrites(() => updateTransaction(debt.id, { type: 'debt_given', title: debt.title,
    amount: 49_999, occurredAt: timestamp }), 'Principal below amount paid');
  await updateTransaction(debt.id, { type: 'debt_given', title: debt.title, amount: 200_000, occurredAt: timestamp });
  passed.push('Case 8: principal correction persists; principal below paid is rejected atomically');

  await updateTransaction(payment.id, { type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 25_000, occurredAt: timestamp });
  await expectTotals({ balance: 825_000, outstanding: 175_000 });
  await rejectedWithoutWrites(() => updateTransaction(payment.id, { type: 'debt_repayment', debtId: debt.id,
    title: debt.title, amount: 200_001, occurredAt: timestamp }), 'Edited repayment above principal');
  await deleteTransaction(payment.id);
  await expectTotals({ balance: 800_000, outstanding: 200_000, debtRepaid: 0 });
  assert(getDebts(await getAllTransactions())[0].status === 'unpaid', 'Deleting the only payment did not restore unpaid status');
  passed.push('Case 10: repayment correction and deletion restore cash and debt status');

  payment = await addTransaction({ type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 50_000, occurredAt: timestamp });
  await addTransaction({ type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 75_000, occurredAt: timestamp });
  await addTransaction({ type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 75_000, occurredAt: timestamp });
  await expectTotals({ balance: 1_000_000, outstanding: 0, debtRepaid: 200_000, income: 1_100_000 });
  assert(getDebts(await getAllTransactions())[0].status === 'paid', 'Multiple repayments did not mark loan paid');
  passed.push('Cases 3 and 6: several partial payments settle the loan without inflating income');

  await deleteTransaction(debt.id);
  assert((await getAllTransactions()).length === 2, 'Loan delete failed to cascade all linked repayments');
  await expectTotals({ balance: 1_000_000, outstanding: 0, debtGiven: 0, debtRepaid: 0 });
  passed.push('Case 9: loan deletion cascades payments with no orphan records');

  debt = await addTransaction({ type: 'debt_given', title: 'تزامن للاختبار', amount: 200_000, occurredAt: timestamp });
  const competing = await Promise.allSettled([100_000, 150_000].map((amount) => addTransaction({
    type: 'debt_repayment', debtId: debt.id, title: debt.title, amount, occurredAt: timestamp,
  })));
  assert(competing.filter((result) => result.status === 'fulfilled').length === 1,
    'Concurrent payments did not reject the operation that would overpay the loan');
  const afterRace = getDebts(await getAllTransactions())[0];
  assert(afterRace.remaining >= 0 && afterRace.repayments.length === 1, 'Concurrent write left an invalid loan');
  await deleteTransaction(debt.id);
  passed.push('Concurrent repayments serialize and cannot jointly exceed the remaining debt');

  debt = await addTransaction({ type: 'debt_given', title: 'علي للاختبار', amount: 200_000, occurredAt: timestamp });
  payment = await addTransaction({ type: 'debt_repayment', debtId: debt.id, title: debt.title,
    amount: 50_000, occurredAt: timestamp });
  const backup = validateBackup(JSON.parse(JSON.stringify(createBackup(await getAllTransactions()))));
  await replaceTransactions(legacy);
  assert((await getAllTransactions()).length === 2, 'Legacy backup replacement failed');
  await replaceTransactions(backup.transactions);
  await expectTotals({ balance: 850_000, outstanding: 150_000 });
  passed.push('V1-compatible replacement and V2 backup round trip persist the complete debt graph');

  await rejectedWithoutWrites(() => replaceTransactions([payment]), 'Replace with orphan repayment');
  await rejectedWithoutWrites(() => mergeTransactions([{ ...debt, amount: 40_000, updatedAt: newerTimestamp }]), 'Merge lowers principal below local repayments');
  const extraPayment: Transaction = { ...payment, id: 'merge-overpayment', amount: 175_000 };
  await rejectedWithoutWrites(() => mergeTransactions([debt, extraPayment]), 'Individually valid import overpays after merge');
  const changedType: Transaction = { ...legacy[0], id: debt.id, updatedAt: newerTimestamp };
  await rejectedWithoutWrites(() => mergeTransactions([changedType]), 'Merge changes existing operation type');
  const anotherLoan: Transaction = { ...debt, id: 'other-loan' };
  assert(payment.type === 'debt_repayment', 'Fixture repayment has the wrong type');
  await rejectedWithoutWrites(() => mergeTransactions([anotherLoan, { ...payment, debtId: anotherLoan.id, updatedAt: newerTimestamp }]),
    'Merge moves a payment to a different loan');
  await rejectedWithoutWrites(() => putTransaction({ ...payment, debtId: 'missing-loan' }), 'Upsert cannot orphan a repayment');
  const beforeReplay = await snapshot();
  await mergeTransactions(backup.transactions);
  assert(await snapshot() === beforeReplay, 'Reimporting a backup duplicated or changed its transactions');
  await mergeTransactions([{ ...debt, title: 'علي بعد التصحيح', updatedAt: newerTimestamp }]);
  const renamed = await getAllTransactions();
  assert(getTransactionTitle(renamed.find((record) => record.id === payment.id)!, renamed) === 'علي بعد التصحيح',
    'Repayment history did not follow the renamed borrower');
  const newerLocal = await snapshot();
  await mergeTransactions(backup.transactions);
  assert(await snapshot() === newerLocal, 'An older backup overwrote a newer local correction');
  passed.push('Merge conflicts and invalid replacements roll back; idempotent merge and borrower rename work');

  const verification = await verifyDebtPersistenceAfterReopen();
  return { passed, ...verification, next: 'Reload and close/reopen this test tab, then call verifyDebtPersistenceAfterReopen() again.' };
}

export async function verifyDebtPersistenceAfterReopen() {
  assertDisposableOrigin();
  const records = await expectTotals({ balance: 850_000, income: 1_100_000, expenses: 100_000,
    debtGiven: 200_000, debtRepaid: 50_000, outstanding: 150_000 });
  assert(records.length === 4, 'Final persisted fixture has missing or extra records');
  const [debt] = getDebts(records);
  assert(debt.status === 'partial' && debt.repayments.length === 1 && debt.transaction.title === 'علي بعد التصحيح',
    'Persisted borrower, repayment, or debt status changed');
  return { origin: location.origin, records: records.length, totals: getTotals(records), debtStatus: debt.status };
}
