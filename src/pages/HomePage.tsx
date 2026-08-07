import { ArrowLeft, Banknote, CalendarDays, Plus, ReceiptText, WalletCards } from 'lucide-react';
import type { Transaction } from '../types/transaction';
import { formatIQD } from '../utils/currency';
import { TransactionRow } from '../components/TransactionRow';
import type { AppPage } from '../components/BottomNav';
import { EmptyState } from '../components/EmptyState';
import { AnimatedMoney } from '../components/AnimatedMoney';
import { emptyStates } from '../content/emptyStates';
import { LOW_BALANCE_THRESHOLD_IQD } from '../config/experience';

interface HomePageProps {
  transactions: Transaction[];
  balance: number;
  income: number;
  expenses: number;
  onNavigate: (page: AppPage) => void;
}

type BalanceStatus = 'empty' | 'healthy' | 'low' | 'negative';

export function HomePage({ transactions, balance, income, expenses, onNavigate }: HomePageProps) {
  const recent = transactions.slice(0, 4);
  const now = new Date();
  const monthTransactions = transactions.filter((item) => {
    const date = new Date(item.occurredAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthIncome = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const monthExpenses = monthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balanceStatus: BalanceStatus = transactions.length === 0
    ? 'empty'
    : balance < 0
      ? 'negative'
      : balance <= LOW_BALANCE_THRESHOLD_IQD
        ? 'low'
        : 'healthy';
  const balanceMessage = balanceStatus === 'empty'
    ? 'أضف أول رصيد حتى تبدأ المتابعة.'
    : balanceStatus === 'negative'
      ? 'رصيدك حالياً بالسالب.'
      : balanceStatus === 'low'
        ? 'رصيدك قريب من الحد المنخفض المحدد.'
        : 'محسوب تلقائياً من كل الدخل والمصروفات.';

  return (
    <div className="page-stack home-page">
      <section className={`balance-card balance-${balanceStatus}`}>
        <div className="balance-content">
          <div className="balance-label"><WalletCards size={18} /> الرصيد الحالي</div>
          <AnimatedMoney value={balance} className={balanceStatus === 'negative' ? 'negative-balance' : balanceStatus === 'low' ? 'low-balance' : ''} />
          <p>{balanceMessage}</p>
          <button type="button" className="button primary balance-action" onClick={() => onNavigate('income')}>
            <Plus size={18} /> إضافة رصيد
          </button>
        </div>
        <div className="balance-orbit" aria-hidden="true">
          <div className="wallet-visual"><WalletCards size={36} /></div>
          <span className="coin coin-one" />
          <span className="coin coin-two" />
          <span className="coin coin-three" />
        </div>
      </section>

      <section className="summary-grid" aria-label="ملخص مالي">
        <article className="summary-card income-card">
          <span className="summary-icon"><Banknote size={20} /></span>
          <div>
            <span>إجمالي الدخل</span>
            <strong>{formatIQD(income)}</strong>
          </div>
        </article>
        <article className="summary-card expense-card">
          <span className="summary-icon"><ReceiptText size={20} /></span>
          <div>
            <span>إجمالي المصروفات</span>
            <strong>{formatIQD(expenses)}</strong>
          </div>
        </article>
      </section>

      <section className="month-snapshot" aria-label="ملخص هذا الشهر">
        <div className="month-snapshot-head">
          <span className="month-icon"><CalendarDays size={19} /></span>
          <div>
            <h2>هذا الشهر</h2>
            <p>لقطة سريعة بدون تعقيد.</p>
          </div>
        </div>
        <div className="month-metrics">
          <div className="month-metric income">
            <span>دخل الشهر</span>
            <strong>{formatIQD(monthIncome)}</strong>
          </div>
          <div className="month-metric expense">
            <span>صرف الشهر</span>
            <strong>{formatIQD(monthExpenses)}</strong>
          </div>
        </div>
      </section>

      <section className="list-section">
        <div className="list-section-head">
          <div>
            <h2>آخر العمليات</h2>
            <p>أحدث حركة على رصيدك.</p>
          </div>
          {transactions.length > 0 && (
            <button type="button" className="text-button" onClick={() => onNavigate('history')}>عرض الكل <ArrowLeft size={16} /></button>
          )}
        </div>

        <div className="transactions-panel">
          {recent.length > 0 ? recent.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} compact />
          )) : (
            <EmptyState content={emptyStates.home} onAction={() => onNavigate('income')} />
          )}
        </div>
      </section>
    </div>
  );
}
