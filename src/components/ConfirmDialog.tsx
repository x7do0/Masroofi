import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'حذف', onConfirm, onClose }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <button type="button" className="icon-button confirm-close" aria-label="إغلاق" onClick={onClose}><X size={18} /></button>
        <div className="confirm-icon"><AlertTriangle size={23} /></div>
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-actions">
          <button type="button" className="button ghost" onClick={onClose}>إلغاء</button>
          <button type="button" className="button danger" onClick={onConfirm}><Trash2 size={17} /> {confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
