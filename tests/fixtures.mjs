import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
if (!process.env.MASROOFI_TEST_BUILD) throw new Error('Run these tests with npm test.');
export const ledger = require(join(process.env.MASROOFI_TEST_BUILD, 'src', 'services', 'ledger.js'));
export const backup = require(join(process.env.MASROOFI_TEST_BUILD, 'src', 'utils', 'backup.js'));

export const date = '2026-09-13T09:30:00.000Z';

export function transaction(overrides = {}) {
  return {
    id: 'income-1',
    type: 'income',
    title: 'رصيد أول المدة',
    amount: 1_000_000,
    occurredAt: date,
    note: null,
    emoji: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

export function loan(overrides = {}) {
  return transaction({ id: 'loan-1', type: 'debt_given', title: 'علي', amount: 200_000, ...overrides });
}

export function repayment(overrides = {}) {
  return transaction({
    id: 'repayment-1', type: 'debt_repayment', debtId: 'loan-1',
    title: 'علي', amount: 50_000, ...overrides,
  });
}

export function payload(transactions, overrides = {}) {
  return { format: 'masroofi-backup', version: 2, exportedAt: date, transactions, ...overrides };
}
