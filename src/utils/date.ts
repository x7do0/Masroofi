const dateFormatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const historyDateFormatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const monthYearFormatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  month: 'long',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function nowLocalInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${dateFormatter.format(date)} • ${timeFormatter.format(date)}`;
}

export function formatHistoryDate(value: string): string {
  return historyDateFormatter.format(new Date(value));
}

export function formatMonthYear(date: Date): string {
  return monthYearFormatter.format(date);
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
