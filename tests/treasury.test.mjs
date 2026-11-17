import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ledger, backup, transaction, loan, repayment, payload } from './fixtures.mjs';

const { resolveTheme } = createRequire(import.meta.url)(join(process.env.MASROOFI_TEST_BUILD, 'src/utils/theme.js'));
const deposit = (extra = {}) => transaction({ id: 'deposit', type: 'treasury_deposit', amount: 400_000, ...extra });
const withdrawal = (extra = {}) => transaction({ id: 'withdrawal', type: 'treasury_withdrawal', amount: 100_000, ...extra });
const expense = (extra = {}) => transaction({ id: 'treasury-expense', type: 'treasury_expense', amount: 50_000, ...extra });

test('treasury transfer conserves total cash without inflating income or expenses', () => {
  const records = [transaction(), deposit(), withdrawal()];
  ledger.validateTransactions(records);
  assert.deepEqual(ledger.getTotals(records), {
    income: 1_000_000, expenses: 0, balance: 700_000, treasury: 300_000,
    debtGiven: 0, debtRepaid: 0, outstanding: 0,
  });
});

test('direct treasury spending is an expense once and never reduces available cash twice', () => {
  const records = [transaction(), deposit(), withdrawal(), expense(), loan(), repayment()];
  ledger.validateTransactions(records);
  assert.deepEqual(ledger.getTotals(records), {
    income: 1_000_000, expenses: 50_000, balance: 550_000, treasury: 250_000,
    debtGiven: 200_000, debtRepaid: 50_000, outstanding: 150_000,
  });
  assert.equal(ledger.isExpense('treasury_expense'), true);
  assert.equal(ledger.isExpense('treasury_deposit'), false);
});

test('withdrawal, direct expense and deposit deletion cannot overdraw treasury', () => {
  for (const records of [[withdrawal()], [expense()], [deposit(), withdrawal({ amount: 400_001 })],
    [deposit(), expense({ amount: 400_001 })], [deposit({ amount: 100_000 }), withdrawal(), expense()]]) {
    assert.throws(() => ledger.validateTransactions(records), /الخزينة/);
  }
  assert.doesNotThrow(() => ledger.validateTransactions([deposit(), expense({ amount: 400_000 })]));
});

test('deposits use available cash, and editing checks only the increase', () => {
  const current = [transaction(), deposit(), loan(), repayment()];
  assert.throws(() => ledger.assertDepositAvailable(current, deposit({ id: 'new', amount: 450_001 })), /الرصيد/);
  assert.doesNotThrow(() => ledger.assertDepositAvailable(current, deposit({ amount: 850_000 }), deposit()));
  assert.throws(() => ledger.assertDepositAvailable(current, deposit({ amount: 850_001 }), deposit()), /الرصيد/);
  const negativeCash = [transaction({ type: 'expense' }), deposit()];
  assert.doesNotThrow(() => ledger.assertDepositAvailable(negativeCash, deposit({ amount: 200_000 }), deposit()));
  assert.throws(() => ledger.assertDepositAvailable(negativeCash, deposit({ id: 'new', amount: 1 })), /الرصيد/);
});

test('treasury corrections and removals reverse both sides of a transfer', () => {
  const records = [transaction(), deposit(), withdrawal(), expense()];
  const corrected = records.map((item) => item.id === 'deposit' ? { ...item, amount: 200_000 } : item);
  assert.equal(ledger.getTotals(corrected).balance, 900_000);
  assert.equal(ledger.getTotals(corrected).treasury, 50_000);
  assert.equal(ledger.getTotals(records.filter((item) => item.id !== 'withdrawal')).balance, 600_000);
  assert.equal(ledger.getTotals(records.filter((item) => item.id !== 'withdrawal')).treasury, 350_000);
  assert.throws(() => ledger.assertSameTransactionIdentity(deposit(), withdrawal({ id: 'deposit' })));
});

test('V3 round trip preserves complete ledger and V1/V2 imports retain old records exactly', () => {
  const records = [transaction(), deposit(), withdrawal(), expense(), loan(), repayment()];
  const exported = backup.createBackup(records);
  assert.equal(exported.version, 3);
  assert.deepEqual(backup.validateBackup(JSON.parse(JSON.stringify(exported))).transactions, records);
  for (const version of [1, 2]) {
    const legacy = version === 1 ? [transaction()] : [transaction(), loan(), repayment()];
    assert.deepEqual(backup.validateBackup(payload(legacy, { version })).transactions, legacy);
    assert.throws(() => backup.validateBackup(payload(records, { version })));
  }
});

test('invalid treasury fields, fractional amounts, precision loss and negative imports reject', () => {
  for (const amount of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => ledger.validateTransactions([deposit({ amount })]));
  }
  assert.throws(() => ledger.validateTransactions([deposit({ debtId: 'unexpected' })]));
  assert.throws(() => ledger.validateTransactions([deposit({ amount: Number.MAX_SAFE_INTEGER }), deposit({ id: 'other', amount: 1 })]));
  assert.throws(() => backup.validateBackup(payload([expense()], { version: 3 })));
});

test('theme honors explicit choice and resolves fresh, legacy system or invalid preferences', () => {
  for (const dark of [true, false]) {
    assert.equal(resolveTheme('light', dark), 'light');
    assert.equal(resolveTheme('dark', dark), 'dark');
    for (const saved of [null, 'system', 'invalid']) assert.equal(resolveTheme(saved, dark), dark ? 'dark' : 'light');
  }
});
