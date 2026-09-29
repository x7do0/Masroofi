import { Banknote, Plus, ReceiptText, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { AppPage } from './BottomNav';

interface QuickAddProps { onNavigate: (page: AppPage) => void }

export function QuickAdd({ onNavigate }: QuickAddProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', keyDown);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', keyDown);
    };
  }, [open]);

  const go = (page: AppPage) => {
    setOpen(false);
    onNavigate(page);
  };

  return (
    <div ref={rootRef} className={`quick-add${open ? ' open' : ''}`}>
      {open && (
        <div id={menuId} className="quick-add-menu" aria-label="إضافة سريعة">
          <button type="button" className="quick-add-option income" onClick={() => go('income')}>
            <Banknote size={18} /> إضافة رصيد
          </button>
          <button type="button" className="quick-add-option expense" onClick={() => go('expenses')}>
            <ReceiptText size={18} /> إضافة مصروف
          </button>
        </div>
      )}
      <button ref={triggerRef} type="button" className="quick-add-fab" aria-controls={open ? menuId : undefined}
        aria-expanded={open} aria-label={open ? 'إغلاق الإضافة السريعة' : 'إضافة سريعة'} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} /> : <Plus size={23} />}
      </button>
    </div>
  );
}
