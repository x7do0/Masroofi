import { CheckCircle2, Info, XCircle } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastStackProps {
  items: ToastItem[];
}

export function ToastStack({ items }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {items.map((item) => {
        const Icon = item.kind === 'success' ? CheckCircle2 : item.kind === 'error' ? XCircle : Info;
        return (
          <div className={`toast ${item.kind}`} key={item.id}>
            <Icon size={19} />
            <span>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
