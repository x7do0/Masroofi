const longEnglishMonth = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  month: 'long',
});

const shortEnglishMonth = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  month: 'short',
});

const latinTime = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', {
  hour: 'numeric',
  minute: '2-digit',
});

const arabicWeekdays = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function nowLocalInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getDate()} ${longEnglishMonth.format(date)} ${date.getFullYear()}`;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${date.getDate()} ${shortEnglishMonth.format(date)}، ${latinTime.format(date)}`;
}

export function formatHistoryDate(value: string): string {
  const date = new Date(value);
  return `${arabicWeekdays[date.getDay()]}، ${formatDate(value)}`;
}

export function formatMonthYear(date: Date): string {
  return `${longEnglishMonth.format(date)} ${date.getFullYear()}`;
}

export function formatTime(value: string): string {
  return latinTime.format(new Date(value));
}

export function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
