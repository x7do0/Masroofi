import { DatabaseBackup, Download, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { createBackup, validateBackup } from '../utils/backup';

interface DataToolsProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => Promise<void>;
}

export function DataTools({ transactions, onRestore }: DataToolsProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<Transaction[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const payload = createBackup(transactions);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `masroofi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage('تم تجهيز النسخة الاحتياطية.');
  };

  const readBackup = async (file: File) => {
    try {
      const text = await file.text();
      const payload = validateBackup(JSON.parse(text) as unknown);
      setPendingRestore(payload.transactions);
      setMessage(`النسخة صالحة وتحتوي ${payload.transactions.length} عملية. راجع التأكيد أدناه.`);
    } catch (cause) {
      setPendingRestore(null);
      setMessage(cause instanceof Error ? cause.message : 'تعذر قراءة النسخة الاحتياطية.');
    }
  };

  const restore = async () => {
    if (!pendingRestore) return;
    try {
      await onRestore(pendingRestore);
      setPendingRestore(null);
      setMessage('تم استرجاع البيانات بنجاح.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'تعذر استرجاع البيانات.');
    }
  };

  return (
    <>
      <button type="button" className="header-tool" onClick={() => setOpen(true)} aria-label="النسخ الاحتياطي والاسترجاع" title="النسخ الاحتياطي">
        <DatabaseBackup size={19} />
      </button>

      {open && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="data-dialog" role="dialog" aria-modal="true" aria-label="النسخ الاحتياطي والاسترجاع">
            <button type="button" className="icon-button data-close" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={18} /></button>
            <div className="data-dialog-icon"><DatabaseBackup size={24} /></div>
            <h2>بيانات مصروفي</h2>
            <p>خذ نسخة من سجلك أو رجع نسخة سابقة. كل شيء يبقى محلي عندك.</p>

            <div className="data-actions">
              <button type="button" className="data-action" onClick={exportBackup}>
                <span className="data-action-icon"><Download size={20} /></span>
                <span><strong>تصدير نسخة</strong><small>ملف JSON يحتوي كل العمليات</small></span>
              </button>
              <button type="button" className="data-action" onClick={() => inputRef.current?.click()}>
                <span className="data-action-icon"><Upload size={20} /></span>
                <span><strong>استرجاع نسخة</strong><small>اختر ملف Masroofi سابق</small></span>
              </button>
            </div>

            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readBackup(file);
                event.target.value = '';
              }}
            />

            {message && <div className="data-message" role="status">{message}</div>}
            {pendingRestore && (
              <div className="restore-warning">
                <strong>استبدال البيانات الحالية؟</strong>
                <p>هذا الاسترجاع يستبدل السجل الحالي بالكامل بالنسخة المختارة.</p>
                <div>
                  <button type="button" className="button ghost" onClick={() => setPendingRestore(null)}>إلغاء</button>
                  <button type="button" className="button danger" onClick={() => void restore()}>استرجاع واستبدال</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
