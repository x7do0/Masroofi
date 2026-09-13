import test from 'node:test';
import assert from 'node:assert/strict';
import { ledger, transaction, loan, repayment } from './fixtures.mjs';

const { getTotals, getDebts, getTransactionTitle, validateTransactions, assertSameTransactionIdentity } = ledger;

function totals(transactions) {
  validateTransactions(transactions);
  return getTotals(transactions);
}

test('case 1: giving 200,000 from 1,000,000 changes cash and receivables only', () => {
  const records = [transaction(), loan()];
  assert.deepEqual(totals(records), {
    income: 1_000_000, expenses: 0, balance: 800_000,
    debtGiven: 200_000, debtRepaid: 0, outstanding: 200_000,
  });
  assert.equal(getDebts(records)[0].status, 'unpaid');
});

test('case 2: partial repayment adds cash without new income', () => {
  const records = [transaction(), loan(), repayment()];
  assert.deepEqual(totals(records), {
    income: 1_000_000, expenses: 0, balance: 850_000,
    debtGiven: 200_000, debtRepaid: 50_000, outstanding: 150_000,
  });
  const [debt] = getDebts(records);
  assert.equal(debt.total, 200_000);
  assert.equal(debt.repaid, 50_000);
  assert.equal(debt.remaining, 150_000);
  assert.equal(debt.status, 'partial');
  assert.equal(debt.repayments[0].id, 'repayment-1');
});

test('case 3: final repayment restores original cash and marks the debt paid', () => {
  const records = [transaction(), loan(), repayment(), repayment({ id: 'repayment-2', amount: 150_000 })];
  assert.deepEqual(totals(records), {
    income: 1_000_000, expenses: 0, balance: 1_000_000,
    debtGiven: 200_000, debtRepaid: 200_000, outstanding: 0,
  });
  assert.equal(getDebts(records)[0].status, 'paid');
});

test('cases 4 and 5: normal income and expense retain their own totals with settled debts', () => {
  const records = [
    transaction(), loan(), repayment({ amount: 200_000 }),
    transaction({ id: 'expense-1', type: 'expense', amount: 100_000 }),
    transaction({ id: 'income-2', amount: 500_000 }),
  ];
  assert.deepEqual(totals(records), {
    income: 1_500_000, expenses: 100_000, balance: 1_400_000,
    debtGiven: 200_000, debtRepaid: 200_000, outstanding: 0,
  });
});

test('case 6: multiple partial payments and two loans with the same name stay separate', () => {
  const records = [
    transaction(), loan({ amount: 300_000 }), loan({ id: 'loan-2', amount: 400_000 }),
    repayment({ amount: 100_000 }), repayment({ id: 'repayment-2', amount: 50_000 }),
    repayment({ id: 'repayment-3', debtId: 'loan-2', amount: 400_000 }),
  ];
  assert.equal(totals(records).balance, 850_000);
  const debts = getDebts(records);
  assert.equal(debts.find((debt) => debt.transaction.id === 'loan-1').remaining, 150_000);
  assert.equal(debts.find((debt) => debt.transaction.id === 'loan-1').status, 'partial');
  assert.equal(debts.find((debt) => debt.transaction.id === 'loan-2').status, 'paid');
});

test('case 7: individual or cumulative overpayment is rejected', () => {
  assert.throws(() => validateTransactions([loan(), repayment({ amount: 200_001 })]));
  assert.throws(() => validateTransactions([
    loan(), repayment({ amount: 100_000 }), repayment({ id: 'repayment-2', amount: 100_001 }),
  ]));
});

test('case 8: editing principal recalculates cash and outstanding but cannot go below paid', () => {
  const records = [transaction(), loan({ amount: 250_000 }), repayment({ amount: 100_000 })];
  assert.equal(totals(records).balance, 850_000);
  assert.equal(getDebts(records)[0].remaining, 150_000);
  assert.throws(() => validateTransactions([loan({ amount: 50_000 }), repayment({ amount: 100_000 })]));
  assert.equal(getDebts([loan({ amount: 100_000 }), repayment({ amount: 100_000 })])[0].status, 'paid');
});

test('case 9: removing a loan and its payments restores its net cash effect', () => {
  const opening = transaction();
  const records = [opening, loan(), repayment()];
  assert.equal(totals(records).balance, 850_000);
  assert.deepEqual(totals([opening]), {
    income: 1_000_000, expenses: 0, balance: 1_000_000,
    debtGiven: 0, debtRepaid: 0, outstanding: 0,
  });
  // A partial deletion must never leave a valid ledger with orphaned payments.
  assert.throws(() => validateTransactions([opening, repayment()]));
});

test('case 10: corrected and deleted repayments recalculate from the remaining ledger', () => {
  const records = [transaction(), loan(), repayment({ amount: 100_000 })];
  assert.equal(totals(records).balance, 900_000);
  records[2] = repayment({ amount: 50_000 });
  assert.equal(totals(records).balance, 850_000);
  assert.equal(getDebts(records)[0].remaining, 150_000);
  records.pop();
  assert.equal(totals(records).balance, 800_000);
  assert.equal(getDebts(records)[0].status, 'unpaid');
});

test('empty and legacy ledgers preserve income/expense behavior, including negative cash', () => {
  assert.deepEqual(totals([]), { income: 0, expenses: 0, balance: 0, debtGiven: 0, debtRepaid: 0, outstanding: 0 });
  assert.equal(totals([transaction({ type: 'expense', amount: 100_000 })]).balance, -100_000);
  assert.deepEqual(getDebts([transaction()]), []);
});

test('repayment display follows a renamed borrower through its loan reference', () => {
  const renamed = loan({ title: 'علي حسن' });
  const payment = repayment({ title: 'الاسم السابق' });
  assert.equal(getTransactionTitle(payment, [renamed, payment]), 'علي حسن');
  assert.equal(getTransactionTitle(renamed, [renamed, payment]), 'علي حسن');
});

test('loan linkage is validated independently of transaction input order', () => {
  const records = [repayment(), loan(), transaction()];
  assert.equal(totals(records).outstanding, 150_000);
});

test('invalid references, unexpected debt links, duplicate IDs, and unknown types are rejected', () => {
  const invalidLedgers = [
    [repayment()],
    [transaction(), repayment({ debtId: 'income-1' })],
    [loan(), repayment({ debtId: 'repayment-1' })],
    [loan(), repayment({ debtId: '' })],
    [loan(), repayment({ debtId: undefined })],
    [transaction({ debtId: 'loan-1' })],
    [loan({ debtId: 'loan-2' })],
    [transaction(), transaction()],
    [transaction({ type: 'transfer' })],
  ];
  for (const records of invalidLedgers) assert.throws(() => validateTransactions(records), JSON.stringify(records));
});

test('money amounts reject zeros, negatives, fractions, nonnumbers, and unsafe integers', () => {
  for (const amount of [0, -1, 0.5, NaN, Infinity, -Infinity, '100', null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateTransactions([loan({ amount })]), `Should reject amount ${String(amount)}`);
  }
  assert.doesNotThrow(() => validateTransactions([loan({ amount: Number.MAX_SAFE_INTEGER })]));
});

test('individually safe amounts cannot overflow aggregate totals', () => {
  assert.throws(() => validateTransactions([
    transaction({ amount: Number.MAX_SAFE_INTEGER }), transaction({ id: 'income-2', amount: 1 }),
  ]));
  assert.throws(() => validateTransactions([
    loan({ amount: Number.MAX_SAFE_INTEGER }), loan({ id: 'loan-2', amount: 1 }),
  ]));
  assert.throws(() => validateTransactions([
    loan({ amount: Number.MAX_SAFE_INTEGER }), transaction({ type: 'expense', amount: 1 }),
  ]));
});

test('history ordering compares instants across timezone offsets and preserves the source array', () => {
  const older = loan({ occurredAt: '2026-09-13T12:00:00+03:00' });
  const newer = repayment({ occurredAt: '2026-09-13T10:00:00Z' });
  const records = [older, newer];
  const sorted = ledger.sortTransactions(records);
  assert.deepEqual(sorted.map((record) => record.id), [newer.id, older.id]);
  assert.deepEqual(records.map((record) => record.id), [older.id, newer.id]);
  assert.equal(getDebts(records)[0].repayments[0].id, newer.id);
});

test('malformed records and invalid required fields are rejected', () => {
  for (const records of [null, {}, 'invalid', [null], [42], Array(2)]) assert.throws(() => validateTransactions(records));
  for (const fields of [
    { id: '' }, { id: '  ' }, { title: '' }, { title: '  ' }, { title: null },
    { occurredAt: 'not-a-date' }, { createdAt: '' }, { updatedAt: null },
    { note: 1 }, { emoji: {} },
  ]) assert.throws(() => validateTransactions([transaction(fields)]), JSON.stringify(fields));
});

test('merge/update identity permits corrections but prevents type changes and payment reparenting', () => {
  const original = repayment();
  assert.doesNotThrow(() => assertSameTransactionIdentity(original, repayment({ amount: 25_000, title: 'اسم مصحح' })));
  assert.doesNotThrow(() => assertSameTransactionIdentity(loan(), loan({ amount: 250_000 })));
  assert.throws(() => assertSameTransactionIdentity(transaction(), loan({ id: 'income-1' })));
  assert.throws(() => assertSameTransactionIdentity(original, repayment({ debtId: 'loan-2' })));
});
