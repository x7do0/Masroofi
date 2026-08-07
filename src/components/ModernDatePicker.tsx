import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';
import { formatDate, formatMonthYear, formatTime, nowLocalInputValue, toLocalDateTimeValue } from '../utils/date';

interface ModernDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const weekdayLabels = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthDays(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function ModernDatePicker({ value, onChange, label = 'التاريخ والوقت' }: ModernDatePickerProps) {
  const selected = useMemo(() => (value ? new Date(value) : new Date()), [value]);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [draft, setDraft] = useState(selected);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(selected);
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [open, selected]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);

  const apply = () => {
    onChange(toLocalDateTimeValue(draft));
    setOpen(false);
  };

  const chooseDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
    setDraft(next);
  };

  const chooseToday = () => {
    const now = new Date();
    setDraft(now);
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const changeTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(draft);
    next.setHours(hours || 0, minutes || 0, 0, 0);
    setDraft(next);
  };

  return (
    <div className="field-group date-field">
      <label>{label}</label>
      <button type="button" className="date-trigger" onClick={() => setOpen(true)}>
        <span className="field-icon"><CalendarDays size={18} /></span>
        <span className="date-trigger-copy">
          <strong dir="ltr">{formatDate(value || nowLocalInputValue())}</strong>
          <small dir="ltr">{formatTime(value || nowLocalInputValue())}</small>
        </span>
        <span className="date-edit-hint">تعديل</span>
      </button>

      {open && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div className="date-dialog" role="dialog" aria-modal="true" aria-label="اختيار التاريخ والوقت" ref={dialogRef}>
            <div className="dialog-handle" aria-hidden="true" />
            <div className="date-dialog-head">
              <div>
                <span>اختيار التاريخ</span>
                <strong dir="ltr">{formatDate(toLocalDateTimeValue(draft))}</strong>
              </div>
              <button type="button" className="icon-button" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={19} /></button>
            </div>

            <div className="calendar-toolbar">
              <button type="button" className="icon-button" aria-label="الشهر التالي" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={19} /></button>
              <strong dir="ltr">{formatMonthYear(visibleMonth)}</strong>
              <button type="button" className="icon-button" aria-label="الشهر السابق" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={19} /></button>
            </div>

            <div className="calendar-grid weekday-grid">
              {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid day-grid">
              {days.map((day) => {
                const outside = day.getMonth() !== visibleMonth.getMonth();
                const active = sameDay(day, draft);
                const today = sameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={`calendar-day${outside ? ' is-outside' : ''}${active ? ' is-selected' : ''}${today ? ' is-today' : ''}`}
                    onClick={() => chooseDay(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="time-row">
              <span className="field-icon"><Clock3 size={18} /></span>
              <div>
                <span>الوقت</span>
                <small>اختياري تعدله إذا تحتاج</small>
              </div>
              <input
                type="time"
                lang="en-US"
                dir="ltr"
                aria-label="الوقت"
                value={`${String(draft.getHours()).padStart(2, '0')}:${String(draft.getMinutes()).padStart(2, '0')}`}
                onChange={(event) => changeTime(event.target.value)}
              />
            </div>

            <div className="date-dialog-actions">
              <button type="button" className="button ghost" onClick={chooseToday}>اليوم</button>
              <button type="button" className="button primary" onClick={apply}>اعتماد التاريخ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
