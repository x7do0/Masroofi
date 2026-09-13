import { useMemo, useState } from 'react';
import { CheckCheck, ChevronDown, HandCoins, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import type { Transaction, TransactionInput } from '../types/transaction';
import { getDebts, getTotals } from '../services/ledger';
import { formatIQD } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { DebtForm } from '../components/DebtForm';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TransactionRow } from '../components/TransactionRow';
import { EmptyState } from '../components/EmptyState';

interface DebtsPageProps {
  transactions: Transaction[];
  onAdd: (input: TransactionInput) => Promise<Transaction>;
  onUpdate: (id: string, input: TransactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type DebtDialog = { mode: 'add' } | { mode: 'repay'; debtId: string } | { mode: 'edit'; transactionId: string };
const statusLabels = { unpaid: 'غير مسدد', partial: 'مسدد جزئياً', paid: 'مسدد بالكامل' };

export function DebtsPage({ transactions, onAdd, onUpdate, onDelete }: DebtsPageProps) {
  const debts = useMemo(() => getDebts(transactions), [transactions]);
  const outstanding = useMemo(() => getTotals(transactions).outstanding, [transactions]);
  const [dialog, setDialog] = useState<DebtDialog | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const editing = dialog?.mode === 'edit' ? transactions.find((item) => item.id === dialog.transactionId) : undefined;
  const activeDebtId = dialog?.mode === 'repay' ? dialog.debtId : editing?.type === 'debt_repayment' ? editing.debtId : editing?.id;
  const activeDebt = debts.find((item) => item.transaction.id === activeDebtId);
  const isRepayment = dialog?.mode === 'repay' || editing?.type === 'debt_repayment';
  const deletedDebt = pendingDelete?.type === 'debt_given' ? debts.find((item) => item.transaction.id === pendingDelete.id) : undefined;

  const closeDialog = () => {
    if (!saving) setDialog(null);
  };
  const submit = async (input: TransactionInput) => {
    if (dialog?.mode === 'edit' && !editing) throw new Error('هذه العملية لم تعد موجودة. أغلق النافذة وحدّث السجل.');
    setSaving(true);
    try {
      if (editing) await onUpdate(editing.id, input);
      else await onAdd(input);
      setDialog(null);
    } finally {
      setSaving(false);
    }
  };
  const toggleRepayments = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <div className="page-stack debts-page">
      <section className="history-balance debt-summary" aria-label="إجمالي الديون">
        <div className="history-balance-icon"><HandCoins size={24} /></div>
        <div className="debt-summary-copy">
          <span>إجمالي الديون المستحقة لك</span>
          <strong>{formatIQD(outstanding)}</strong>
          <p>أموالك الموجودة عند الناس، خارج رصيدك الحالي.</p>
        </div>
      </section>

      <section className="list-section" aria-labelledby="debts-heading">
        <div className="list-section-head debt-list-head">
          <div><h2 id="debts-heading">الديون</h2><p>أعطيت شخص فلوس؟ أضف دين وسجل ما يرجع لك.</p></div>
          <button type="button" className="button primary" onClick={() => setDialog({ mode: 'add' })}><Plus size={18} />إضافة دين</button>
        </div>
        {debts.length === 0 ? (
          <div className="transactions-panel">
            <EmptyState content={{ emoji: '🤝', title: 'ما عندك ديون مسجلة', description: 'أضف المبلغ الذي أعطيته لشخص، وتابع تسديده هنا. الديون لا تحسب ضمن المصروفات.' }} />
          </div>
        ) : (
          <div className="debt-list">
            {debts.map((debt) => {
              const loan = debt.transaction;
              const isExpanded = expanded.has(loan.id);
              return (
                <article className="debt-card" key={loan.id} aria-label={`دين ${loan.title}`}>
                  <div className="debt-card-head">
                    <div className="transaction-avatar debt-avatar">{loan.emoji ?? <UserRound size={21} />}</div>
                    <div className="debt-person"><h3>{loan.title}</h3><span className="date-ltr" dir="ltr">{formatDateTime(loan.occurredAt)}</span></div>
                    <span className={`debt-status ${debt.status}`}>{debt.status === 'paid' && <CheckCheck size={14} />}{statusLabels[debt.status]}</span>
                  </div>
                  <dl className="debt-amounts">
                    <div><dt>إجمالي الدين</dt><dd>{formatIQD(debt.total)}</dd></div>
                    <div><dt>المسدد</dt><dd>{formatIQD(debt.repaid)}</dd></div>
                    <div className="debt-remaining"><dt>المتبقي</dt><dd>{formatIQD(debt.remaining)}</dd></div>
                  </dl>
                  {loan.note && <p className="debt-note">{loan.note}</p>}
                  <div className="debt-actions">
                    {debt.remaining > 0 && <button type="button" className="button secondary debt-repay" onClick={() => setDialog({ mode: 'repay', debtId: loan.id })}><HandCoins size={17} />تسديد</button>}
                    <button type="button" className="icon-button" aria-label={`تعديل دين ${loan.title}`} title="تعديل الدين" onClick={() => setDialog({ mode: 'edit', transactionId: loan.id })}><Pencil size={17} /></button>
                    <button type="button" className="icon-button debt-delete" aria-label={`حذف دين ${loan.title}`} title="حذف الدين" onClick={() => setPendingDelete(loan)}><Trash2 size={17} /></button>
                    {debt.repayments.length > 0 && <button type="button" className="text-button debt-repayments-toggle" aria-expanded={isExpanded} aria-controls={`repayments-${loan.id}`} onClick={() => toggleRepayments(loan.id)}><span>دفعات التسديد ({debt.repayments.length})</span><ChevronDown size={17} className={isExpanded ? 'expanded' : ''} /></button>}
                  </div>
                  {isExpanded && debt.repayments.length > 0 && (
                    <div className="debt-repayments" id={`repayments-${loan.id}`} aria-label={`دفعات ${loan.title}`}>
                      {debt.repayments.map((payment) => <TransactionRow key={payment.id} transaction={payment} displayTitle={loan.title} onEdit={(item) => setDialog({ mode: 'edit', transactionId: item.id })} onDelete={setPendingDelete} />)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {dialog && (
        <Modal title={dialog.mode === 'edit' ? 'تعديل العملية' : isRepayment ? 'تسديد دين' : 'إضافة دين'} onClose={closeDialog} closeDisabled={saving}>
          {(dialog.mode === 'edit' && !editing) || (dialog.mode === 'repay' && !activeDebt) ? (
            <section className="form-card"><h2>العملية لم تعد موجودة</h2><p role="alert">تم حذف هذه العملية. أغلق النافذة للعودة إلى السجل الحالي.</p><button type="button" className="button ghost" onClick={closeDialog}>إغلاق النافذة</button></section>
          ) : <DebtForm
            type={isRepayment ? 'debt_repayment' : 'debt_given'}
            editing={editing}
            debt={isRepayment ? activeDebt?.transaction : undefined}
            maxAmount={isRepayment && activeDebt ? activeDebt.remaining + (editing?.amount ?? 0) : undefined}
            minAmount={!isRepayment ? activeDebt?.repaid : undefined}
            onSubmit={submit}
            onCancelEdit={closeDialog}
          />}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'debt_given' ? 'حذف الدين؟' : 'حذف دفعة التسديد؟'}
        description={pendingDelete?.type === 'debt_given'
          ? deletedDebt && deletedDebt.repayments.length > 0
            ? `راح ينحذف دين ${pendingDelete.title} وكل دفعاته (${deletedDebt.repayments.length}) من السجل، ويتحدث الرصيد والديون المتبقية. لا يمكن التراجع عن الحذف.`
            : `راح ينحذف دين ${pendingDelete.title} من السجل ويرجع أثره إلى الرصيد. لا يمكن التراجع عن الحذف.`
          : 'راح تنحذف هذه الدفعة من السجل وينقص الرصيد بالمبلغ، ويزيد المتبقي من الدين.'}
        confirmLabel={deletedDebt && deletedDebt.repayments.length > 0 ? 'حذف الدين ودفعاته' : 'حذف'}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
