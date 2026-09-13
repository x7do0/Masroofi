import type { Transaction, TransactionInput } from '../types/transaction';
import { TransactionForm } from './TransactionForm';

export interface DebtFormProps {
  type: 'debt_given' | 'debt_repayment';
  editing?: Transaction | null;
  /** Parent loan; required when recording or editing a repayment. */
  debt?: Transaction;
  /** Remaining balance, plus this installment's amount when editing it. */
  maxAmount?: number;
  /** Sum of existing repayments; the loan amount cannot be lower. */
  minAmount?: number;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancelEdit?: () => void;
}

/** Shares amount, date/time, emoji, note and submission controls with ordinary transactions. */
export function DebtForm(props: DebtFormProps) {
  return <TransactionForm {...props} />;
}
