import { MoreVertical, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { formatSignedIQD } from '../utils/currency';
import { formatDateTime } from '../utils/date';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  compact?: boolean;
}

export function TransactionRow({ transaction, onEdit, onDelete, compact = false }: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isIncome = transaction.type === 'income';

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
      <div className={`transaction-avatar ${isIncome ? 'income' : 'expense'}${transaction.emoji ? ' has-emoji' : ''}`}>
        {transaction.emoji ?? (isIncome ? <TrendingUp size={19} /> : <TrendingDown size={19} />)}
      </div>
      <div className="transaction-copy">
        <div className="transaction-title-line">
          <strong>{transaction.title}</strong>
          {!compact && <span className={`type-label ${isIncome ? 'income' : 'expense'}`}>{isIncome ? 'دخل' : 'مصروف'}</span>}
        </div>
        <span>{formatDateTime(transaction.occurredAt)}</span>
        {!compact && transaction.note && <p>{transaction.note}</p>}
      </div>
      <div className="transaction-side">
        <strong className={isIncome ? 'income-text' : 'expense-text'}>{formatSignedIQD(transaction.amount, transaction.type)}</strong>
        {(onEdit || onDelete) && (
          <div className="row-menu" ref={menuRef}>
            <button type="button" className="icon-button subtle" aria-label="خيارات العملية" onClick={() => setMenuOpen((value) => !value)}>
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
