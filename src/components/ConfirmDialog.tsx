import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'حذف', onConfirm, onClose }: ConfirmDialogProps) {
  if (!open) return null;
  return <Confirmation title={title} description={description} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} />;
}

function Confirmation({ title, description, confirmLabel, onConfirm, onClose }: Omit<ConfirmDialogProps, 'open'>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الحذف. حاول مرة ثانية.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal title={title} role="alertdialog" onClose={onClose} closeDisabled={pending} className="confirm-dialog">
        <div className="confirm-icon"><AlertTriangle size={23} /></div>
        <h2>{title}</h2>
        <p>{description}</p>
        {error && <div className="form-message" role="alert">{error}</div>}
        <div className="confirm-actions">
          <button type="button" className="button ghost" onClick={onClose} disabled={pending}>إلغاء</button>
          <button type="button" className="button danger" onClick={() => void confirm()} disabled={pending}><Trash2 size={17} /> {pending ? 'جاري الحذف...' : confirmLabel}</button>
        </div>
    </Modal>
  );
}
