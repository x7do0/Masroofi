import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  role?: 'dialog' | 'alertdialog';
  className?: string;
  closeDisabled?: boolean;
}

const focusableSelector = 'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) =>
    !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0,
  );
}

export function Modal({ title, children, onClose, role = 'dialog', className = 'edit-dialog', closeDisabled = false }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const disabledRef = useRef(closeDisabled);
  const [formBusy, setFormBusy] = useState(false);
  closeRef.current = onClose;
  disabledRef.current = closeDisabled || formBusy;
  const dismissDisabled = () => disabledRef.current || Boolean(dialogRef.current?.querySelector('form[aria-busy="true"]'));

  useEffect(() => {
    const root = dialogRef.current;
    if (!root) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const activeDialog = () => {
      const nested = root.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]');
      return nested[nested.length - 1] ?? root;
    };
    const focusFirst = (container: HTMLElement) => {
      const input = container.querySelector<HTMLElement>(container === root ? 'input:not([readonly]):not(:disabled), textarea:not(:disabled)' : '.calendar-day.is-selected');
      (input ?? focusableElements(container)[0] ?? container).focus();
    };
    const frame = requestAnimationFrame(() => focusFirst(root));
    let nestedDialog: HTMLElement | null = null;
    let nestedReturnFocus: HTMLElement | null = null;
    const observer = new MutationObserver(() => {
      setFormBusy(Boolean(root.querySelector('form[aria-busy="true"]')));
      const active = activeDialog();
      if (active !== root && active !== nestedDialog) {
        nestedReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        nestedDialog = active;
        focusFirst(active);
      } else if (active === root && nestedDialog) {
        nestedDialog = null;
        if (nestedReturnFocus?.isConnected) nestedReturnFocus.focus();
        else focusFirst(root);
      }
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] });

    const keyDown = (event: KeyboardEvent) => {
      const active = activeDialog();
      if (event.key === 'Escape') {
        // The date picker owns Escape while its nested dialog is open.
        if (active !== root) return;
        event.preventDefault();
        event.stopPropagation();
        if (!disabledRef.current && !root.querySelector('form[aria-busy="true"]')) closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusableElements(active);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        active.focus();
      } else if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const keepFocusInside = (event: FocusEvent) => {
      const active = activeDialog();
      if (event.target instanceof Node && !active.contains(event.target)) focusFirst(active);
    };
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('keydown', keyDown, true);
      document.removeEventListener('focusin', keepFocusInside);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      else document.querySelector<HTMLElement>('.page-stack button')?.focus();
    };
  }, []);

  return createPortal(
    <div className="dialog-backdrop modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !dismissDisabled()) onClose();
    }}>
      <div className={`modal-dialog ${className}`} ref={dialogRef} role={role} aria-modal="true" aria-label={title} tabIndex={-1}>
        <button type="button" className="icon-button edit-close modal-close" aria-label="إغلاق" disabled={closeDisabled || formBusy} onClick={() => { if (!dismissDisabled()) onClose(); }}><X size={18} /></button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
