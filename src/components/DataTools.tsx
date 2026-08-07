import { DatabaseBackup, Download, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { createBackup, validateBackup } from '../utils/backup';

interface DataToolsProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => Promise<void>;
  disabled?: boolean;
}

export function DataTools({ transactions, onRestore, disabled = false }: DataToolsProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<Transaction[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const payload = createBackup(transactions);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `masroofi-backup-${new Date().toISOString().slice(0, 10)}.masroofi`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage('تم حفظ نسخة احتياطية من كل عملياتك.');
  };

  const readBackup = async (file: File) => {
    try {
      const text = await file.text();
      const payload = validateBackup(JSON.parse(text) as unknown);
      setPendingRestore(payload.transactions);
      setMessage(`النسخة جاهزة وتحتوي ${payload.transactions.length} عملية. راجع التأكيد أدناه.`);
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
      setMessage('تم استرجاع النسخة الاحتياطية بنجاح.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'تعذر استرجاع النسخة الاحتياطية.');
    }
  };

  return (
    <>
      <button
        type="button"
        className="header-tool"
        onClick={() => setOpen(true)}
        aria-label={disabled ? 'جاري تحميل البيانات' : 'النسخ الاحتياطي والاسترجاع'}
        title={disabled ? 'جاري تحميل البيانات' : 'النسخ الاحتياطي'}
        disabled={disabled}
      >
        <DatabaseBackup size={19} />
      </button>

      {open && !disabled && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="data-dialog" role="dialog" aria-modal="true" aria-label="النسخ الاحتياطي والاسترجاع">
            <button type="button" className="icon-button data-close" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={18} /></button>
            <div className="data-dialog-icon"><DatabaseBackup size={24} /></div>
            <h2>حماية بيانات مصروفي</h2>
            <p>احفظ نسخة احتياطية من سجلك حتى تقدر ترجعه إذا غيرت الجهاز أو المتصفح.</p>

            <div className="data-actions">
              <button type="button" className="data-action" onClick={exportBackup}>
                <span className="data-action-icon"><Download size={20} /></span>
                <span><strong>حفظ نسخة احتياطية</strong><small>يحفظ كل عملياتك في ملف واحد</small></span>
              </button>
              <button type="button" className="data-action" onClick={() => inputRef.current?.click()}>
                <span className="data-action-icon"><Upload size={20} /></span>
                <span><strong>استرجاع نسخة احتياطية</strong><small>اختر نسخة كنت حافظها سابقاً</small></span>
              </button>
            </div>

            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".masroofi,.json,application/json"
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
                <p>النسخة المختارة راح تحل محل السجل الموجود حالياً.</p>
                <div>
                  <button type="button" className="button ghost" onClick={() => setPendingRestore(null)}>إلغاء</button>
                  <button type="button" className="button danger" onClick={() => void restore()}>استرجاع النسخة</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
