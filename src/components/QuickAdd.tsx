import { Banknote, Plus, ReceiptText, X } from 'lucide-react';
import { useState } from 'react';
import type { AppPage } from './BottomNav';

interface QuickAddProps {
  onNavigate: (page: AppPage) => void;
}

export function QuickAdd({ onNavigate }: QuickAddProps) {
  const [open, setOpen] = useState(false);

  const go = (page: AppPage) => {
    setOpen(false);
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`quick-add${open ? ' open' : ''}`}>
      {open && (
        <div className="quick-add-menu" aria-label="إضافة سريعة">
          <button type="button" className="quick-add-option income" onClick={() => go('income')}>
            <Banknote size={18} /> إضافة رصيد
          </button>
          <button type="button" className="quick-add-option expense" onClick={() => go('expenses')}>
            <ReceiptText size={18} /> إضافة مصروف
          </button>
        </div>
      )}
      <button type="button" className="quick-add-fab" aria-expanded={open} aria-label={open ? 'إغلاق الإضافة السريعة' : 'إضافة سريعة'} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} /> : <Plus size={23} />}
      </button>
    </div>
  );
}
