import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ReceiptText, Vault, ChevronLeft } from 'lucide-react';
import type { Transaction, TransactionInput, TreasuryType } from '../types/transaction';
import { getTotals, isTreasuryType } from '../services/ledger';
import { formatIQD } from '../utils/currency';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionRow } from '../components/TransactionRow';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface TreasuryPageProps {
  transactions: Transaction[];
  onAdd: (input: TransactionInput) => Promise<Transaction>;
  onUpdate: (id: string, input: TransactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const actions = [
  { type: 'treasury_deposit', title: 'تحويل للخزينة', hint: 'من رصيدك إلى فلوسك المحفوظة', icon: ArrowDownToLine },
  { type: 'treasury_withdrawal', title: 'إرجاع للرصيد', hint: 'من الخزينة إلى رصيدك المتاح', icon: ArrowUpFromLine },
  { type: 'treasury_expense', title: 'صرف من الخزينة', hint: 'مصروف مباشر بدون المرور بالرصيد', icon: ReceiptText },
] as const;

export function TreasuryPage({ transactions, onAdd, onUpdate, onDelete }: TreasuryPageProps) {
  const [action, setAction] = useState<TreasuryType | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const entries = useMemo(() => transactions.filter((item) => isTreasuryType(item.type)), [transactions]);
  const formType = editing?.type ?? action;
  const available = formType === 'treasury_deposit'
    ? Math.max(editing?.amount ?? 0, totals.balance + (editing?.amount ?? 0))
    : totals.treasury + (editing?.amount ?? 0);
  const close = () => { setAction(null); setEditing(null); };

  return (
    <div className="page-stack treasury-page">
      <section className="treasury-balance" aria-label="رصيد الخزينة">
        <div className="treasury-mark"><Vault size={32} /></div>
        <div><span>رصيد الخزينة</span><strong>{formatIQD(totals.treasury)}</strong><p>الرصيد المتاح: {formatIQD(totals.balance)}</p></div>
      </section>
      <div className="treasury-actions" aria-label="عمليات الخزينة">
        {actions.map(({ type, title, hint, icon: Icon }) => (
          <button key={type} type="button" className={`treasury-action ${type}`} onClick={() => setAction(type)}>
            <span className="treasury-action-icon"><Icon size={23} /></span>
            <span className="treasury-action-copy"><strong>{title}</strong><small>{hint}</small></span>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="treasury-form-hint">التحويل بين الرصيد والخزينة لا يُحسب دخلاً أو مصروفاً. الصرف المباشر من الخزينة يُضاف للمصروفات.</p>
      <section className="list-section">
        <div className="list-section-head"><div><h2>حركة الخزينة</h2><p>كل التحويلات والمصاريف من الخزينة.</p></div></div>
        <div className="transactions-panel">
          {entries.length ? entries.map((item) => (
            <TransactionRow key={item.id} transaction={item} onEdit={setEditing} onDelete={setPendingDelete} />
          )) : (
            <div className="empty-state compact-empty"><div className="empty-icon"><Vault size={26} /></div>
              <h3>ابدأ تحفظ فلوسك بالخزينة</h3><p>حوّل مبلغاً من رصيدك، وتابع كل حركة عليه هنا.</p>
            </div>
          )}
        </div>
      </section>
      {formType && isTreasuryType(formType) && (
        <Modal title={editing ? 'تعديل عملية الخزينة' : actions.find((item) => item.type === formType)!.title} onClose={close}>
          <TransactionForm key={editing?.id ?? formType} type={formType} editing={editing} maxAmount={available}
            onCancelEdit={close} onSubmit={async (input) => {
              if (editing) await onUpdate(editing.id, input);
              else await onAdd(input);
              close();
            }} />
        </Modal>
      )}
      <ConfirmDialog open={Boolean(pendingDelete)} title="حذف عملية الخزينة؟"
        description="راح ينحذف أثر العملية من الخزينة والرصيد أو المصروفات. ما نكدر نرجعها إلا من نسخة احتياطية."
        onClose={() => setPendingDelete(null)} onConfirm={async () => {
          if (!pendingDelete) return;
          await onDelete(pendingDelete.id);
          setPendingDelete(null);
        }} />
    </div>
  );
}
