import { useCallback, useMemo, useRef, useState } from 'react';
import { BottomNav, type AppPage } from './components/BottomNav';
import { DataTools } from './components/DataTools';
import { QuickAdd } from './components/QuickAdd';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastStack, type ToastItem, type ToastKind } from './components/ToastStack';
import { useTransactions } from './hooks/useTransactions';
import { HomePage } from './pages/HomePage';
import { LedgerPage } from './pages/LedgerPage';
import { HistoryPage } from './pages/HistoryPage';
import type { Transaction, TransactionInput } from './types/transaction';
import { appExperience } from './config/experience';

const pageMeta: Record<AppPage, { title: string; subtitle: string }> = {
  home: { title: 'مصروفي', subtitle: 'رصيدك وحركتك المالية بمكان واحد' },
  expenses: { title: 'المصروفات', subtitle: 'أضف وتتبع كل مصروفاتك' },
  income: { title: 'الدخل', subtitle: 'سجل كل المبالغ اللي تدخل لرصيدك' },
  history: { title: 'السجل', subtitle: 'كل العمليات مرتبة بمكان واحد' },
};

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);
  const { transactions, totals, loading, error, add, update, remove, restore } = useTransactions();
  const meta = pageMeta[page];

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, appExperience.toastDurationMs);
  }, []);

  const addWithFeedback = useCallback(async (input: TransactionInput): Promise<Transaction> => {
    try {
      const item = await add(input);
      notify('success', input.type === 'income' ? '💰 تمت إضافة الرصيد' : '🧾 تمت إضافة المصروف');
      return item;
    } catch (cause) {
      notify('error', 'تعذر حفظ العملية');
      throw cause;
    }
  }, [add, notify]);

  const updateWithFeedback = useCallback(async (id: string, input: TransactionInput) => {
    try {
      await update(id, input);
      notify('success', '✨ تم حفظ التعديل');
    } catch (cause) {
      notify('error', 'تعذر حفظ التعديل');
      throw cause;
    }
  }, [notify, update]);

  const removeWithFeedback = useCallback(async (id: string) => {
    try {
      await remove(id);
      notify('info', 'تم حذف العملية');
    } catch (cause) {
      notify('error', 'تعذر حذف العملية');
      throw cause;
    }
  }, [notify, remove]);

  const restoreWithFeedback = useCallback(async (items: Transaction[]) => {
    try {
      await restore(items);
      notify('success', '✅ رجعت النسخة الاحتياطية بنجاح');
    } catch (cause) {
      notify('error', 'تعذر استرجاع النسخة الاحتياطية');
      throw cause;
    }
  }, [notify, restore]);

  const navigate = useCallback((next: AppPage) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="loading-state" aria-live="polite">
          <span className="loading-mark" aria-hidden="true">💸</span>
          <strong>جاري فتح مصروفي...</strong>
        </div>
      );
    }

    switch (page) {
      case 'home':
        return <HomePage transactions={transactions} {...totals} onNavigate={navigate} />;
      case 'income':
        return <LedgerPage type="income" transactions={transactions} onAdd={addWithFeedback} onUpdate={updateWithFeedback} onDelete={removeWithFeedback} />;
      case 'expenses':
        return <LedgerPage type="expense" transactions={transactions} onAdd={addWithFeedback} onUpdate={updateWithFeedback} onDelete={removeWithFeedback} />;
      case 'history':
        return <HistoryPage transactions={transactions} balance={totals.balance} onUpdate={updateWithFeedback} onDelete={removeWithFeedback} />;
      default:
        return null;
    }
  }, [addWithFeedback, loading, navigate, page, removeWithFeedback, totals, transactions, updateWithFeedback]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark app-emoji-mark" aria-hidden="true">💸</div>
        <div className="header-copy">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
        <div className="header-actions polish-actions">
          <ThemeToggle />
          <DataTools transactions={transactions} onRestore={restoreWithFeedback} disabled={loading} />
        </div>
      </header>

      {error && <div className="global-error" role="alert">{error}</div>}

      <main className="app-main">{content}</main>

      <QuickAdd onNavigate={navigate} />
      <BottomNav page={page} onChange={navigate} />
      <ToastStack items={toasts} />
    </div>
  );
}
