import type { Transaction } from '../types/transaction';

/** Build once per immutable ledger snapshot; repayment titles then need no scans. */
export function createTransactionTitleLookup(transactions: readonly Transaction[]): (item: Transaction) => string {
  const debtTitles = new Map<string, string>();
  for (const item of transactions) {
    if (item.type === 'debt_given') debtTitles.set(item.id, item.title);
  }
  return (item) => item.type === 'debt_repayment' ? debtTitles.get(item.debtId) ?? item.title : item.title;
}
