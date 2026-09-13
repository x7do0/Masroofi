import test from 'node:test';
import assert from 'node:assert/strict';
import { backup, ledger, transaction, loan, repayment, payload, date } from './fixtures.mjs';

const { createBackup, validateBackup } = backup;

test('legacy V1 backups load unchanged with all income/expense metadata', () => {
  const legacyRecords = [
    transaction({ note: 'بيانات قديمة', emoji: '💰' }),
    transaction({ id: 'expense-1', type: 'expense', amount: 100_000 }),
  ];
  const restored = validateBackup(JSON.parse(JSON.stringify(payload(legacyRecords, { version: 1 }))));
  assert.deepEqual(restored.transactions, legacyRecords);
  assert.equal(ledger.getTotals(restored.transactions).balance, 900_000);
});

test('V2 backup JSON round trip preserves debt references, partial repayment state, and totals', () => {
  const records = [transaction(), loan({ note: 'أقساط', emoji: '🤝' }), repayment()];
  const exported = createBackup(records);
  assert.equal(exported.format, 'masroofi-backup');
  assert.equal(exported.version, 2);
  assert.ok(Number.isFinite(Date.parse(exported.exportedAt)));
  const restored = validateBackup(JSON.parse(JSON.stringify(exported)));
  assert.deepEqual(restored.transactions, records);
  assert.deepEqual(ledger.getTotals(restored.transactions), ledger.getTotals(records));
  assert.equal(ledger.getDebts(restored.transactions)[0].status, 'partial');
});

test('V1 imports reject newer debt records masquerading as legacy data', () => {
  assert.throws(() => validateBackup(payload([loan()], { version: 1 })));
  assert.throws(() => validateBackup(payload([loan(), repayment()], { version: 1 })));
});

test('backup restore rejects orphaned, overpaid, and duplicate transaction graphs', () => {
  for (const records of [
    [repayment()],
    [loan(), repayment({ amount: 200_001 })],
    [loan(), repayment(), repayment()],
    [transaction(), repayment({ debtId: 'income-1' })],
  ]) assert.throws(() => validateBackup(payload(records)));
});

test('backup restore rejects unsupported formats, malformed containers, and invalid timestamps', () => {
  for (const value of [
    null, [], 'invalid', {},
    payload([], { format: 'another-app' }),
    payload([], { version: 0 }), payload([], { version: 3 }),
    payload([], { version: '2' }),
    payload([], { exportedAt: '' }), payload([], { exportedAt: 'invalid' }),
    payload(null), payload({}),
  ]) assert.throws(() => validateBackup(value));
});

test('empty backups are supported by both known versions', () => {
  assert.deepEqual(validateBackup(payload([], { version: 1 })).transactions, []);
  assert.deepEqual(validateBackup({ format: 'masroofi-backup', version: 2, exportedAt: date, transactions: [] }).transactions, []);
});

test('restore cannot bypass safe integer validation or hide cumulative precision loss', () => {
  assert.throws(() => validateBackup(payload([loan({ amount: Number.MAX_SAFE_INTEGER + 1 })])));
  assert.throws(() => validateBackup(payload([
    transaction({ amount: Number.MAX_SAFE_INTEGER }), transaction({ id: 'income-2', amount: 1 }),
  ])));
});

test('export refuses an inconsistent in-memory ledger instead of producing a broken backup', () => {
  assert.throws(() => createBackup([repayment()]));
  assert.throws(() => createBackup([loan(), repayment({ amount: 200_001 })]));
});
