import { HandCoins, MoreVertical, Pencil, Trash2, TrendingDown, TrendingUp, Undo2 } from 'lucide-react';
import { memo, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Transaction } from '../types/transaction';
import { formatSignedIQD } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { placeFloatingMenu } from '../utils/floatingMenu';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  compact?: boolean;
  displayTitle?: string;
}
interface MenuPlacement { left: number; top: number; maxHeight: number; maxWidth: number }
const typeLabels = { income: 'دخل', expense: 'مصروف', debt_given: 'إعطاء دين', debt_repayment: 'تسديد دين' };

export const TransactionRow = memo(function TransactionRow({ transaction, onEdit, onDelete, compact = false, displayTitle }: TransactionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isIncome = transaction.type === 'income';
  const isDebt = transaction.type === 'debt_given' || transaction.type === 'debt_repayment';
  const tone = isDebt ? 'debt' : isIncome ? 'income' : 'expense';
  const Icon = transaction.type === 'debt_given' ? HandCoins : transaction.type === 'debt_repayment' ? Undo2 : isIncome ? TrendingUp : TrendingDown;

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const viewport = window.visualViewport;
    const position = () => {
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? document.documentElement.clientWidth;
      const height = viewport?.height ?? window.innerHeight;
      const blockers = [...document.querySelectorAll<HTMLElement>('.bottom-nav, .quick-add')]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => element.getBoundingClientRect());
      const next = {
        ...placeFloatingMenu(trigger.getBoundingClientRect(),
          { width: Math.min(144, width - 16), height: menu.scrollHeight + 2 },
          { left, top, right: left + width, bottom: top + height }, blockers),
        maxWidth: Math.max(0, width - 16),
      };
      setPlacement((current) => current && current.left === next.left && current.top === next.top
        && current.maxHeight === next.maxHeight && current.maxWidth === next.maxWidth ? current : next);
    };
    const contains = (target: EventTarget | null) => target instanceof Node && (trigger.contains(target) || menu.contains(target));
    const outside = (event: Event) => { if (!contains(event.target)) setMenuOpen(false); };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') event.preventDefault();
        setMenuOpen(false);
        trigger.focus({ preventScroll: true });
        return;
      }
      const buttons = [...menu.querySelectorAll<HTMLButtonElement>('button')];
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      let next: number;
      if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next]?.focus();
    };
    position();
    const frame = requestAnimationFrame(() => {
      position();
      menu.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    viewport?.addEventListener('resize', position);
    viewport?.addEventListener('scroll', position);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', keyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      viewport?.removeEventListener('resize', position);
      viewport?.removeEventListener('scroll', position);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', keyDown);
    };
  }, [menuOpen]);

  const act = (callback: (item: Transaction) => void) => {
    triggerRef.current?.focus({ preventScroll: true });
    setMenuOpen(false);
    callback(transaction);
  };

  return (
    <article className={`transaction-row${compact ? ' compact' : ''}`}>
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
          <div className="row-menu">
            <button ref={triggerRef} type="button" className="icon-button subtle transaction-menu-trigger"
              aria-label="خيارات العملية" aria-haspopup="menu" aria-controls={menuOpen ? menuId : undefined} aria-expanded={menuOpen}
              onKeyDown={(event) => { if (!menuOpen && event.key === 'ArrowDown') { event.preventDefault(); setMenuOpen(true); } }}
              onClick={() => setMenuOpen((value) => !value)}>
              <MoreVertical size={18} />
            </button>
            {menuOpen && createPortal(
              <div ref={menuRef} id={menuId} className="row-menu-popover transaction-actions-popover" role="menu" aria-label="إجراءات العملية" dir="rtl"
                style={placement ?? { visibility: 'hidden' }}>
                {onEdit && <button type="button" role="menuitem" tabIndex={-1} onClick={() => act(onEdit)}><Pencil size={16} /> تعديل</button>}
                {onDelete && <button type="button" role="menuitem" tabIndex={-1} className="danger" onClick={() => act(onDelete)}><Trash2 size={16} /> حذف</button>}
              </div>, document.body,
            )}
          </div>
        )}
      </div>
    </article>
  );
});
