import { useEffect, useState } from 'react';
import { Banknote, FileText, PencilLine, Plus, ReceiptText, Save } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction';
import { nowLocalInputValue } from '../utils/date';
import { EmojiPicker } from './EmojiPicker';
import { ModernDatePicker } from './ModernDatePicker';

interface TransactionFormProps {
  type: TransactionType;
  editing?: Transaction | null;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancelEdit?: () => void;
}

function initialState(type: TransactionType, editing?: Transaction | null): TransactionInput {
  return {
    type,
    title: editing?.title ?? '',
    amount: editing?.amount ?? 0,
    occurredAt: editing?.occurredAt ?? nowLocalInputValue(),
    note: editing?.note ?? '',
    emoji: editing?.emoji ?? null,
  };
}

export function TransactionForm({ type, editing, onSubmit, onCancelEdit }: TransactionFormProps) {
  const [form, setForm] = useState<TransactionInput>(() => initialState(type, editing));
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialState(type, editing));
    setMessage(null);
  }, [type, editing]);

  const isIncome = type === 'income';

  const submit = async () => {
    setMessage(null);
    if (!form.title.trim()) {
      setMessage(`اكتب اسم ${isIncome ? 'الدخل' : 'المصروف'}.`);
      return;
    }
    if (!Number.isFinite(form.amount) || form.amount <= 0) {
      setMessage('اكتب مبلغاً أكبر من صفر.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ ...form, amount: Math.round(form.amount), title: form.title.trim() });
      if (!editing) setForm(initialState(type));
      setMessage(editing ? 'تم حفظ التعديل.' : isIncome ? 'تمت إضافة الرصيد.' : 'تمت إضافة المصروف.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'تعذر حفظ العملية.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-card">
      <div className="section-heading">
        <div className={`section-icon ${isIncome ? 'income' : 'expense'}`}>
          {isIncome ? <Banknote size={20} /> : <ReceiptText size={20} />}
        </div>
        <div>
          <h2>{editing ? `تعديل ${isIncome ? 'الدخل' : 'المصروف'}` : isIncome ? 'إضافة دخل جديد' : 'إضافة مصروف جديد'}</h2>
          <p>{editing ? 'عدّل ما تحتاج، وكل شيء يتحدث مباشرة.' : 'الاسم والمبلغ فقط مطلوبان، والباقي اختياري.'}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label htmlFor={`${type}-title`}>الاسم</label>
          <div className="input-shell">
            <span className="field-icon"><PencilLine size={18} /></span>
            <input
              id={`${type}-title`}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={isIncome ? 'مثال: راتب شهري' : 'مثال: مواد غذائية'}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor={`${type}-amount`}>المبلغ</label>
          <div className="input-shell amount-shell">
            <span className="field-icon"><Banknote size={18} /></span>
            <input
              id={`${type}-amount`}
              type="number"
              inputMode="numeric"
              min="1"
              step="1000"
              value={form.amount || ''}
              onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              placeholder="مثال: 250000"
            />
            <span className="currency-suffix">د.ع</span>
          </div>
        </div>
      </div>

      <ModernDatePicker
        value={form.occurredAt}
        onChange={(occurredAt) => setForm((current) => ({ ...current, occurredAt }))}
      />

      <EmojiPicker
        value={form.emoji ?? null}
        onChange={(emoji) => setForm((current) => ({ ...current, emoji }))}
      />

      <div className="field-group">
        <label htmlFor={`${type}-note`}>ملاحظة <span className="optional">اختياري</span></label>
        <div className="input-shell textarea-shell">
          <span className="field-icon"><FileText size={18} /></span>
          <textarea
            id={`${type}-note`}
            rows={3}
            value={form.note ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder="أي تفاصيل تحب تتذكرها لاحقاً..."
          />
        </div>
      </div>

      {message && <div className="form-message" role="status">{message}</div>}

      <div className="form-actions">
        {editing && onCancelEdit && (
          <button type="button" className="button ghost" onClick={onCancelEdit}>إلغاء</button>
        )}
        <button type="button" className="button primary grow" onClick={() => void submit()} disabled={submitting}>
          {editing ? <Save size={18} /> : <Plus size={18} />}
          <span>{submitting ? 'جاري الحفظ...' : editing ? 'حفظ التعديل' : isIncome ? 'إضافة دخل' : 'إضافة مصروف'}</span>
        </button>
      </div>
    </section>
  );
}
