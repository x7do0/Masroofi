import { HandCoins, MoreVertical, Pencil, Trash2, TrendingDown, TrendingUp, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { formatSignedIQD } from '../utils/currency';
import { formatDateTime } from '../utils/date';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  compact?: boolean;
  displayTitle?: string;
}

const typeLabels = { income: 'دخل', expense: 'مصروف', debt_given: 'إعطاء دين', debt_repayment: 'تسديد دين' };

export function TransactionRow({ transaction, onEdit, onDelete, compact = false, displayTitle }: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === 'income';
  const isDebt = transaction.type === 'debt_given' || transaction.type === 'debt_repayment';
  const tone = isDebt ? 'debt' : isIncome ? 'income' : 'expense';
  const Icon = transaction.type === 'debt_given' ? HandCoins : transaction.type === 'debt_repayment' ? Undo2 : isIncome ? TrendingUp : TrendingDown;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <article
      className={`transaction-row${compact ? ' compact' : ''}${menuOpen ? ' menu-open' : ''}`}
      style={menuOpen ? { zIndex: 30 } : undefined}
    >
      <div className={`transaction-avatar ${tone}${transaction.emoji ? ' has-emoji' : ''}`}>
        {transaction.emoji ?? <Icon size={19} />}
      </div>
      <div className="transaction-copy">
        <div className="transaction-title-line">
          <strong>{displayTitle ?? transaction.title}</strong>
          {(!compact || isDebt) && <span className={`type-label ${tone}`}>{typeLabels[transaction.type]}</span>}
        </div>
        <span className="transaction-date date-ltr" dir="ltr">{formatDateTime(transaction.occurredAt)}</span>
        {!compact && transaction.note && <p>{transaction.note}</p>}
      </div>
      <div className="transaction-side">
        <strong className={`${tone}-text`} dir="ltr">{formatSignedIQD(transaction.amount, transaction.type)}</strong>
        {(onEdit || onDelete) && (
          <div className="row-menu" ref={menuRef}>
            <button type="button" className="icon-button subtle" aria-label="خيارات العملية" aria-expanded={menuOpen} onKeyDown={(event) => { if (event.key === 'Escape') setMenuOpen(false); }} onClick={() => setMenuOpen((value) => !value)}>
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="row-menu-popover">
                {onEdit && <button type="button" onClick={() => { setMenuOpen(false); onEdit(transaction); }}><Pencil size={16} /> تعديل</button>}
                {onDelete && <button type="button" className="danger" onClick={() => { setMenuOpen(false); onDelete(transaction); }}><Trash2 size={16} /> حذف</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
