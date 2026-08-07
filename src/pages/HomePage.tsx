import { ArrowLeft, Banknote, Plus, ReceiptText, WalletCards } from 'lucide-react';
import type { Transaction } from '../types/transaction';
import { formatIQD } from '../utils/currency';
import { TransactionRow } from '../components/TransactionRow';
import type { AppPage } from '../components/BottomNav';

interface HomePageProps {
  transactions: Transaction[];
  balance: number;
  income: number;
  expenses: number;
  onNavigate: (page: AppPage) => void;
}

export function HomePage({ transactions, balance, income, expenses, onNavigate }: HomePageProps) {
  const recent = transactions.slice(0, 4);

  return (
    <div className="page-stack home-page">
      <section className="balance-card">
        <div className="balance-content">
          <div className="balance-label"><WalletCards size={18} /> الرصيد الحالي</div>
          <strong className={balance < 0 ? 'negative-balance' : ''}>{formatIQD(balance)}</strong>
          <p>محسوب تلقائياً من كل الدخل والمصروفات.</p>
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
            <div className="empty-state">
              <span className="empty-icon"><WalletCards size={24} /></span>
              <h3>بعد ما عندك عمليات</h3>
              <p>أضف أول رصيد، وبعدها كل حركة راح تظهر هنا.</p>
              <button type="button" className="button secondary" onClick={() => onNavigate('income')}><Plus size={17} /> إضافة أول رصيد</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
