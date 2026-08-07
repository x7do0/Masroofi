import { useMemo, useState } from 'react';
import { WalletCards } from 'lucide-react';
import { BottomNav, type AppPage } from './components/BottomNav';
import { DataTools } from './components/DataTools';
import { useTransactions } from './hooks/useTransactions';
import { HomePage } from './pages/HomePage';
import { LedgerPage } from './pages/LedgerPage';
import { HistoryPage } from './pages/HistoryPage';

const pageMeta: Record<AppPage, { title: string; subtitle: string }> = {
  home: { title: 'مصروفي', subtitle: 'رصيدك وحركتك المالية بمكان واحد' },
  expenses: { title: 'المصروفات', subtitle: 'أضف وتتبع كل مصروفاتك' },
  income: { title: 'الدخل', subtitle: 'سجل كل المبالغ اللي تدخل لرصيدك' },
  history: { title: 'السجل', subtitle: 'كل العمليات مرتبة بمكان واحد' },
};

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const { transactions, totals, loading, error, add, update, remove, restore } = useTransactions();
  const meta = pageMeta[page];

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="loading-state" aria-live="polite">
          <span className="loading-mark"><WalletCards size={26} /></span>
          <strong>جاري فتح مصروفي...</strong>
        </div>
      );
    }

    switch (page) {
      case 'home':
        return <HomePage transactions={transactions} {...totals} onNavigate={setPage} />;
      case 'income':
        return <LedgerPage type="income" transactions={transactions} onAdd={add} onUpdate={update} onDelete={remove} />;
      case 'expenses':
        return <LedgerPage type="expense" transactions={transactions} onAdd={add} onUpdate={update} onDelete={remove} />;
      case 'history':
        return <HistoryPage transactions={transactions} balance={totals.balance} onUpdate={update} onDelete={remove} />;
      default:
        return null;
    }
  }, [add, loading, page, remove, totals, transactions, update]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark"><WalletCards size={22} /></div>
        <div className="header-copy">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
        <div className="header-actions">
          <DataTools transactions={transactions} onRestore={restore} />
        </div>
      </header>

      {error && <div className="global-error" role="alert">{error}</div>}

      <main className="app-main">{content}</main>

      <BottomNav page={page} onChange={(next) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }} />
    </div>
  );
}
