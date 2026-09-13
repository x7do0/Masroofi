import type { Transaction } from '../types/transaction';

export interface LedgerTotals {
  income: number;
  expenses: number;
  balance: number;
  debtGiven: number;
  debtRepaid: number;
  outstanding: number;
}

export interface DebtSummary {
  transaction: Transaction;
  total: number;
  repaid: number;
  remaining: number;
  status: 'unpaid' | 'partial' | 'paid';
  repayments: Transaction[];
}

function safeMoney(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error('إجمالي المبالغ أكبر من الحد الذي يمكن حسابه بدقة.');
  }
  return Number(value);
}

/** Cash balance includes debt movements; income and consumption never do. */
export function getTotals(transactions: readonly Transaction[]): LedgerTotals {
  let income = 0n;
  let expenses = 0n;
  let debtGiven = 0n;
  let debtRepaid = 0n;
  for (const item of transactions) {
    const amount = BigInt(item.amount);
    switch (item.type) {
      case 'income': income += amount; break;
      case 'expense': expenses += amount; break;
      case 'debt_given': debtGiven += amount; break;
      case 'debt_repayment': debtRepaid += amount; break;
    }
  }
  return {
    income: safeMoney(income),
    expenses: safeMoney(expenses),
    balance: safeMoney(income - expenses - debtGiven + debtRepaid),
    debtGiven: safeMoney(debtGiven),
    debtRepaid: safeMoney(debtRepaid),
    outstanding: safeMoney(debtGiven - debtRepaid),
  };
}

/** Legacy local date strings and ISO dates are compared as instants, not text. */
export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) =>
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    || a.id.localeCompare(b.id));
}

export function getDebts(transactions: readonly Transaction[]): DebtSummary[] {
  const repaymentsByDebt = new Map<string, Transaction[]>();
  for (const item of transactions) {
    if (item.type !== 'debt_repayment') continue;
    const repayments = repaymentsByDebt.get(item.debtId) ?? [];
    repayments.push(item);
    repaymentsByDebt.set(item.debtId, repayments);
  }
  return sortTransactions(transactions).filter((item) => item.type === 'debt_given').map((transaction) => {
    const repayments = sortTransactions(repaymentsByDebt.get(transaction.id) ?? []);
    const repaid = safeMoney(repayments.reduce((sum, item) => sum + BigInt(item.amount), 0n));
    const remaining = transaction.amount - repaid;
    return {
      transaction,
      total: transaction.amount,
      repaid,
      remaining,
      status: remaining === 0 ? 'paid' : repaid === 0 ? 'unpaid' : 'partial',
      repayments,
    };
  });
}

export function getTransactionTitle(transaction: Transaction, transactions: readonly Transaction[]): string {
  if (transaction.type !== 'debt_repayment') return transaction.title;
  return transactions.find((item) => item.id === transaction.debtId && item.type === 'debt_given')?.title
    ?? transaction.title;
}

export function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(new Date(value).getTime());
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function validateTransaction(value: unknown, index: number): asserts value is Transaction {
  if (!value || typeof value !== 'object') {
    throw new Error(`العملية رقم ${index + 1} غير صالحة.`);
  }
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' || !item.id.trim()
    || typeof item.type !== 'string' || !['income', 'expense', 'debt_given', 'debt_repayment'].includes(item.type)
    || typeof item.title !== 'string' || !item.title.trim()
    || typeof item.amount !== 'number' || !Number.isSafeInteger(item.amount) || item.amount <= 0
    || !isValidDate(item.occurredAt) || !isValidDate(item.createdAt) || !isValidDate(item.updatedAt)
    || !isNullableString(item.note) || !isNullableString(item.emoji)
  ) {
    throw new Error(`بيانات العملية رقم ${index + 1} غير صالحة. المبلغ يجب أن يكون عدداً صحيحاً موجباً ضمن الحد الآمن.`);
  }
  if (item.type === 'debt_repayment') {
    if (typeof item.debtId !== 'string' || !item.debtId.trim()) {
      throw new Error('يجب ربط كل تسديد بدين موجود.');
    }
  } else if (item.debtId !== undefined) {
    throw new Error('ربط الدين مسموح لعملية التسديد فقط.');
  }
}

/** Validate the whole ledger before any persistent mutation or import. */
export function validateTransactions(value: unknown): asserts value is Transaction[] {
  if (!Array.isArray(value)) throw new Error('قائمة العمليات غير صالحة.');
  const byId = new Map<string, Transaction>();
  for (const [index, item] of value.entries()) {
    validateTransaction(item, index);
    if (byId.has(item.id)) throw new Error(`توجد عملية مكررة عند الرقم ${index + 1}.`);
    byId.set(item.id, item);
  }
  const repaidByDebt = new Map<string, bigint>();
  for (const item of byId.values()) {
    if (item.type !== 'debt_repayment') continue;
    const debt = byId.get(item.debtId);
    if (!debt || debt.type !== 'debt_given') throw new Error('يوجد تسديد مرتبط بدين غير موجود أو بعملية ليست ديناً.');
    const repaid = (repaidByDebt.get(item.debtId) ?? 0n) + BigInt(item.amount);
    if (repaid > BigInt(debt.amount)) {
      throw new Error(`إجمالي تسديدات ${debt.title} يتجاوز مبلغ الدين. لا يمكن تسديد أكثر من المتبقي أو تقليل الدين عن المسدد.`);
    }
    repaidByDebt.set(item.debtId, repaid);
  }
  getTotals([...byId.values()]);
}

export function assertSameTransactionIdentity(existing: Transaction, incoming: Transaction): void {
  if (existing.type !== incoming.type) throw new Error('لا يمكن تغيير نوع العملية عند التعديل أو الدمج.');
  if (existing.debtId !== incoming.debtId) throw new Error('لا يمكن نقل دفعة تسديد إلى دين آخر.');
}
