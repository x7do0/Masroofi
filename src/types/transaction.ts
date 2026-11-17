export type TreasuryType = 'treasury_deposit' | 'treasury_withdrawal' | 'treasury_expense';
export type TransactionType = 'income' | 'expense' | 'debt_given' | 'debt_repayment' | TreasuryType;

interface TransactionFields {
  id: string;
  title: string;
  amount: number;
  occurredAt: string;
  note: string | null;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
}

type TransactionKind =
  | { type: 'income' | 'expense' | 'debt_given' | TreasuryType; debtId?: never }
  | { type: 'debt_repayment'; debtId: string };

export type Transaction = TransactionFields & TransactionKind;

export type TransactionInput = {
  title: string;
  amount: number;
  occurredAt: string;
  note?: string | null;
  emoji?: string | null;
} & TransactionKind;
