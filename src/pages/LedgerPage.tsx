import { useMemo, useState } from 'react';
import { Banknote, ReceiptText } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction';
import { formatIQD } from '../utils/currency';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionRow } from '../components/TransactionRow';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface LedgerPageProps {
  type: TransactionType;
  transactions: Transaction[];
  onAdd: (input: TransactionInput) => Promise<Transaction>;
  onUpdate: (id: string, input: TransactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LedgerPage({ type, transactions, onAdd, onUpdate, onDelete }: LedgerPageProps) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const isIncome = type === 'income';
  const filtered = useMemo(() => transactions.filter((item) => item.type === type), [transactions, type]);
  const total = useMemo(() => filtered.reduce((sum, item) => sum + item.amount, 0), [filtered]);

  const submit = async (input: TransactionInput) => {
    if (editing) {
      await onUpdate(editing.id, input);
      setEditing(null);
    } else {
      await onAdd(input);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await onDelete(pendingDelete.id);
    if (editing?.id === pendingDelete.id) setEditing(null);
    setPendingDelete(null);
  };

  return (
    <div className="page-stack ledger-page">
      <section className={`ledger-hero ${isIncome ? 'income' : 'expense'}`}>
        <div className="ledger-hero-icon">{isIncome ? <Banknote size={25} /> : <ReceiptText size={25} />}</div>
        <div>
          <span>{isIncome ? 'إجمالي الدخل' : 'إجمالي المصروفات'}</span>
          <strong>{formatIQD(total)}</strong>
          <p>{filtered.length ? `${filtered.length} عملية محفوظة` : 'ماكو عمليات بعد'}</p>
        </div>
      </section>

      <TransactionForm
        type={type}
        editing={editing}
        onSubmit={submit}
        onCancelEdit={() => setEditing(null)}
      />

      <section className="list-section">
        <div className="list-section-head">
          <div>
            <h2>{isIncome ? 'سجل الدخل' : 'سجل المصروفات'}</h2>
            <p>{isIncome ? 'كل المبالغ اللي دخلت لرصيدك.' : 'كل الأشياء اللي صرفت عليها.'}</p>
          </div>
        </div>
        <div className="transactions-panel">
          {filtered.length > 0 ? filtered.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={(item) => {
                setEditing(item);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={setPendingDelete}
            />
          )) : (
            <div className="empty-state compact-empty">
              <span className={`empty-icon ${isIncome ? 'income' : 'expense'}`}>{isIncome ? <Banknote size={23} /> : <ReceiptText size={23} />}</span>
              <h3>{isIncome ? 'سجل الدخل فارغ' : 'سجل المصروفات فارغ'}</h3>
              <p>أول عملية تضيفها راح تبقى محفوظة هنا.</p>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`حذف ${isIncome ? 'الدخل' : 'المصروف'}؟`}
        description="راح ينحذف من السجل ويتحدث الرصيد مباشرة. ما نكدر نرجعه إلا من نسخة احتياطية."
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
