import { useMemo, useState } from 'react';
import { ListFilter, WalletCards } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction';
import { formatIQD } from '../utils/currency';
import { formatHistoryDate } from '../utils/date';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionForm } from '../components/TransactionForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { emptyStates } from '../content/emptyStates';
import { DebtForm } from '../components/DebtForm';
import { Modal } from '../components/Modal';
import { getDebts, getTransactionTitle } from '../services/ledger';

type HistoryFilter = 'all' | TransactionType;

interface HistoryPageProps {
  transactions: Transaction[];
  balance: number;
  onUpdate: (id: string, input: TransactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function HistoryPage({ transactions, balance, onUpdate, onDelete }: HistoryPageProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const debts = useMemo(() => getDebts(transactions), [transactions]);
  const editedDebt = editing && debts.find((debt) => debt.transaction.id === (editing.type === 'debt_repayment' ? editing.debtId : editing.id));

  const visible = useMemo(
    () => filter === 'all' ? transactions : transactions.filter((item) => item.type === filter),
    [filter, transactions],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const item of visible) {
      const key = formatHistoryDate(item.occurredAt);
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    }
    return [...groups.entries()];
  }, [visible]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="page-stack history-page">
      <section className="history-balance">
        <div className="history-balance-icon"><WalletCards size={23} /></div>
        <div>
          <span>الرصيد الحالي</span>
          <strong className={balance < 0 ? 'negative-balance' : ''}>{formatIQD(balance)}</strong>
        </div>
      </section>

      <div className="filter-bar" role="group" aria-label="فلترة السجل">
        <span className="filter-icon"><ListFilter size={18} /></span>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>الكل</button>
        <button type="button" className={filter === 'income' ? 'active income' : ''} onClick={() => setFilter('income')}>الدخل</button>
        <button type="button" className={filter === 'expense' ? 'active expense' : ''} onClick={() => setFilter('expense')}>المصروفات</button>
        <button type="button" className={filter === 'debt_given' ? 'active debt' : ''} onClick={() => setFilter('debt_given')}>إعطاء دين</button>
        <button type="button" className={filter === 'debt_repayment' ? 'active debt' : ''} onClick={() => setFilter('debt_repayment')}>تسديد دين</button>
      </div>

      <section className="history-list">
        {grouped.length > 0 ? grouped.map(([dateLabel, items]) => (
          <div className="history-group" key={dateLabel}>
            <div className="history-date-label"><span className="date-ltr" dir="ltr">{dateLabel}</span><i /></div>
            <div className="transactions-panel">
              {items.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  displayTitle={getTransactionTitle(transaction, transactions)}
                  onEdit={setEditing}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </div>
        )) : (
          <div className="transactions-panel">
            <EmptyState content={emptyStates.history} />
          </div>
        )}
      </section>

      {editing && (
        <Modal title="تعديل العملية" onClose={() => setEditing(null)}>
          {editing.type === 'debt_given' || editing.type === 'debt_repayment' ? (
            <DebtForm
              type={editing.type}
              editing={editing}
              debt={editedDebt?.transaction}
              minAmount={editing.type === 'debt_given' ? editedDebt?.repaid : undefined}
              maxAmount={editing.type === 'debt_repayment' && editedDebt ? editedDebt.remaining + editing.amount : undefined}
              onSubmit={async (input) => {
                await onUpdate(editing.id, input);
                setEditing(null);
              }}
              onCancelEdit={() => setEditing(null)}
            />
          ) : (
            <TransactionForm
              type={editing.type}
              editing={editing}
              onSubmit={async (input) => {
                await onUpdate(editing.id, input);
                setEditing(null);
              }}
              onCancelEdit={() => setEditing(null)}
            />
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'debt_given' ? 'حذف الدين وكل تسديداته؟' : 'حذف العملية؟'}
        description={pendingDelete?.type === 'debt_given' ? 'راح ينحذف الدين وكل دفعاته المرتبطة من السجل، وينعكس أثرها بالكامل على الرصيد. ما نكدر نرجعها إلا من نسخة احتياطية.' : 'راح تنحذف من كل السجلات ويتحدث الرصيد والمتبقي من الدين مباشرة.'}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
