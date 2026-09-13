import { useEffect, useId, useRef, useState } from 'react';
import { Banknote, FileText, HandCoins, PencilLine, Plus, ReceiptText, Save, UserRound } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction';
import { formatGroupedInteger, formatIQD, parseGroupedInteger } from '../utils/currency';
import { nowLocalInputValue } from '../utils/date';
import { EmojiPicker } from './EmojiPicker';
import { ModernDatePicker } from './ModernDatePicker';

interface TransactionFormProps {
  type: TransactionType;
  editing?: Transaction | null;
  debt?: Transaction;
  maxAmount?: number;
  minAmount?: number;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancelEdit?: () => void;
}

interface FormFields {
  title: string;
  amount: number;
  occurredAt: string;
  note: string;
  emoji: string | null;
}

function initialState(editing?: Transaction | null, debt?: Transaction): FormFields {
  return {
    title: debt?.title ?? editing?.title ?? '',
    amount: editing?.amount ?? 0,
    occurredAt: editing?.occurredAt ?? nowLocalInputValue(),
    note: editing?.note ?? '',
    emoji: editing?.emoji ?? null,
  };
}

const labels = {
  income: { noun: 'الدخل', add: 'إضافة رصيد جديد', action: 'إضافة رصيد', saved: 'تمت إضافة الرصيد.', placeholder: 'مثال: راتب شهري' },
  expense: { noun: 'المصروف', add: 'إضافة مصروف جديد', action: 'إضافة مصروف', saved: 'تمت إضافة المصروف.', placeholder: 'مثال: مواد غذائية' },
  debt_given: { noun: 'الدين', add: 'إضافة دين جديد', action: 'إضافة دين', saved: 'تمت إضافة الدين.', placeholder: 'مثال: علي' },
  debt_repayment: { noun: 'التسديد', add: 'تسديد دين', action: 'تسجيل التسديد', saved: 'تم تسجيل التسديد.', placeholder: '' },
};

export function TransactionForm({ type, editing, debt, maxAmount, minAmount, onSubmit, onCancelEdit }: TransactionFormProps) {
  const [form, setForm] = useState<FormFields>(() => initialState(editing, debt));
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});
  const [invalidAmountInput, setInvalidAmountInput] = useState(false);
  const uniqueId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(initialState(editing, debt));
    setMessage(null);
    setErrors({});
    setInvalidAmountInput(false);
  }, [type, editing?.id, debt?.id]);

  const isIncome = type === 'income';
  const isDebt = type === 'debt_given' || type === 'debt_repayment';
  const isRepayment = type === 'debt_repayment';
  const formId = isDebt ? uniqueId : type;
  const copy = labels[type];

  const submit = async () => {
    if (submittingRef.current) return;
    setMessage(null);
    const nextErrors: typeof errors = {};
    const title = isRepayment ? debt?.title ?? form.title : form.title;
    if (!title.trim()) nextErrors.title = isDebt ? 'اكتب اسم الشخص.' : `اكتب اسم ${copy.noun}.`;
    if (invalidAmountInput || !Number.isSafeInteger(form.amount) || form.amount <= 0) {
      nextErrors.amount = 'اكتب مبلغاً صحيحاً أكبر من صفر بالدينار العراقي.';
    } else if (maxAmount !== undefined && form.amount > maxAmount) {
      nextErrors.amount = `مبلغ التسديد لا يمكن أن يتجاوز ${formatIQD(maxAmount)}.`;
    } else if (minAmount !== undefined && form.amount < minAmount) {
      nextErrors.amount = `مبلغ الدين لا يمكن أن يقل عن المسدد: ${formatIQD(minAmount)}.`;
    }
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.amount) {
      (nextErrors.title ? titleRef : amountRef).current?.focus();
      return;
    }
    if (!Number.isFinite(new Date(form.occurredAt).getTime())) {
      setMessage({ text: 'اختر تاريخاً ووقتاً صحيحين.', error: true });
      return;
    }
    if (isRepayment && (!debt || debt.type !== 'debt_given')) {
      setMessage({ text: 'تعذر العثور على الدين المرتبط بهذا التسديد.', error: true });
      return;
    }

    const fields = { ...form, title: title.trim() };
    const input: TransactionInput = type === 'debt_repayment'
      ? { ...fields, type, debtId: debt!.id }
      : { ...fields, type };
    try {
      submittingRef.current = true;
      setSubmitting(true);
      await onSubmit(input);
      if (!editing) setForm(initialState(undefined, debt));
      setMessage({ text: editing ? 'تم حفظ التعديل.' : copy.saved, error: false });
    } catch (cause) {
      setMessage({ text: cause instanceof Error ? cause.message : 'تعذر حفظ العملية.', error: true });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form className={`form-card form-card-polished${isDebt ? ' debt-form' : ''}`} noValidate onSubmit={(event) => {
      event.preventDefault();
      void submit();
    }} aria-busy={submitting}>
      <div className="section-heading">
        <div className={`section-icon ${isDebt ? 'debt' : isIncome ? 'income' : 'expense'}`}>
          {isDebt ? <HandCoins size={20} /> : isIncome ? <Banknote size={20} /> : <ReceiptText size={20} />}
        </div>
        <div>
          <h2>{editing ? `تعديل ${copy.noun}` : copy.add}</h2>
          <p>{isRepayment ? 'سجل المبلغ الذي رجع لك من هذا الدين.' : editing ? 'عدّل ما تحتاج، وكل شيء يتحدث مباشرة.' : 'الاسم والمبلغ فقط مطلوبان، والباقي اختياري.'}</p>
        </div>
      </div>

      <fieldset className="transaction-form-fields" disabled={submitting}>
        <div className="form-grid">
          <div className="field-group">
            <label htmlFor={`${formId}-title`}>{isDebt ? 'اسم الشخص' : 'الاسم'}</label>
            <div className="input-shell">
              <span className="field-icon">{isDebt ? <UserRound size={18} /> : <PencilLine size={18} />}</span>
              <input
                id={`${formId}-title`}
                ref={titleRef}
                value={isRepayment ? debt?.title ?? form.title : form.title}
                readOnly={isRepayment}
                required
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? `${formId}-title-error` : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, title: event.target.value }));
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder={copy.placeholder}
                autoComplete="off"
              />
            </div>
            {errors.title && <span id={`${formId}-title-error`} className="field-error" role="alert">{errors.title}</span>}
          </div>

          <div className="field-group">
            <label htmlFor={`${formId}-amount`}>{isRepayment ? 'مبلغ التسديد' : 'المبلغ'}</label>
            <div className="input-shell amount-shell">
              <span className="field-icon"><Banknote size={18} /></span>
              <input
                id={`${formId}-amount`}
                ref={amountRef}
                type="text"
                inputMode="numeric"
                value={formatGroupedInteger(form.amount)}
                required
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? `${formId}-amount-error` : undefined}
                onChange={(event) => {
                  if (!/^[0-9٠-٩۰-۹,٬\s]*$/.test(event.target.value)) {
                    setInvalidAmountInput(true);
                    setErrors((current) => ({ ...current, amount: 'اكتب أرقاماً صحيحة فقط، بدون كسور أو إشارة سالبة.' }));
                    return;
                  }
                  setInvalidAmountInput(false);
                  setForm((current) => ({ ...current, amount: parseGroupedInteger(event.target.value) }));
                  setErrors((current) => ({ ...current, amount: undefined }));
                }}
                placeholder="مثال: 250,000"
                autoComplete="off"
              />
              <span className="currency-suffix">د.ع</span>
            </div>
            {errors.amount && <span id={`${formId}-amount-error`} className="field-error" role="alert">{errors.amount}</span>}
          </div>
        </div>

        {isRepayment && maxAmount !== undefined && (
          <div className="repayment-limit">
            <span>{editing ? 'المتاح لهذه الدفعة' : 'المتبقي من الدين'}<strong>{formatIQD(maxAmount)}</strong></span>
            <button type="button" className="button secondary" disabled={maxAmount <= 0} onClick={() => {
              setForm((current) => ({ ...current, amount: maxAmount }));
              setInvalidAmountInput(false);
              setErrors((current) => ({ ...current, amount: undefined }));
              amountRef.current?.focus();
            }}>تسديد كامل المتبقي</button>
          </div>
        )}
        {!isRepayment && minAmount !== undefined && minAmount > 0 && (
          <p className="debt-form-hint">تم تسديد {formatIQD(minAmount)} من هذا الدين. يجب ألا يقل المبلغ الجديد عنه.</p>
        )}

        <ModernDatePicker value={form.occurredAt} onChange={(occurredAt) => setForm((current) => ({ ...current, occurredAt }))} />
        <EmojiPicker value={form.emoji} onChange={(emoji) => setForm((current) => ({ ...current, emoji }))} />
        <div className="field-group">
          <label htmlFor={`${formId}-note`}>ملاحظة <span className="optional">اختياري</span></label>
          <div className="input-shell textarea-shell">
            <span className="field-icon"><FileText size={18} /></span>
            <textarea id={`${formId}-note`} rows={3} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="أي تفاصيل تحب تتذكرها لاحقاً..." />
          </div>
        </div>
      </fieldset>

      {message && <div className={`form-message${message.error ? ' form-error' : ''}`} role={message.error ? 'alert' : 'status'}>{message.text}</div>}
      <div className="form-actions">
        {(editing || isDebt) && onCancelEdit && <button type="button" className="button ghost" disabled={submitting} onClick={onCancelEdit}>إلغاء</button>}
        <button type="submit" className="button primary grow" disabled={submitting}>
          {editing ? <Save size={18} /> : <Plus size={18} />}
          <span>{submitting ? 'جاري الحفظ...' : editing ? 'حفظ التعديل' : copy.action}</span>
        </button>
      </div>
    </form>
  );
}
