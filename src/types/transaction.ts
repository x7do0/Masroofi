export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  occurredAt: string;
  note: string | null;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  type: TransactionType;
  title: string;
  amount: number;
  occurredAt: string;
  note?: string | null;
  emoji?: string | null;
}
