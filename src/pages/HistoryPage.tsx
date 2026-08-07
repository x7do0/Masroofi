import { useMemo, useState } from 'react';
import { ListFilter, WalletCards, X } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction';
import { formatIQD } from '../utils/currency';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionForm } from '../components/TransactionForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

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

  const visible = useMemo(
    () => filter === 'all' ? transactions : transactions.filter((item) => item.type === filter),
    [filter, transactions],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const item of visible) {
      const key = new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'full' }).format(new Date(item.occurredAt));
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
      </div>

      <section className="history-list">
        {grouped.length > 0 ? grouped.map(([dateLabel, items]) => (
          <div className="history-group" key={dateLabel}>
            <div className="history-date-label"><span>{dateLabel}</span><i /></div>
            <div className="transactions-panel">
              {items.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={setEditing}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </div>
        )) : (
          <div className="transactions-panel">
            <div className="empty-state">
              <span className="empty-icon"><WalletCards size={24} /></span>
              <h3>السجل فارغ</h3>
              <p>العمليات راح تظهر هنا مرتبة حسب التاريخ.</p>
            </div>
          </div>
        )}
      </section>

      {editing && (
        <div className="dialog-backdrop edit-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditing(null);
        }}>
          <div className="edit-dialog" role="dialog" aria-modal="true" aria-label="تعديل العملية">
            <button type="button" className="icon-button edit-close" aria-label="إغلاق" onClick={() => setEditing(null)}><X size={18} /></button>
            <TransactionForm
              type={editing.type}
              editing={editing}
              onSubmit={async (input) => {
                await onUpdate(editing.id, input);
                setEditing(null);
              }}
              onCancelEdit={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="حذف العملية؟"
        description="راح تنحذف من كل السجلات ويتحدث الرصيد مباشرة."
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
