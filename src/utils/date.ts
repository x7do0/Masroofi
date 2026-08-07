const arabicDate = new Intl.DateTimeFormat('ar-IQ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const arabicDateTime = new Intl.DateTimeFormat('ar-IQ', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

export function nowLocalInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function formatDate(value: string): string {
  return arabicDate.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return arabicDateTime.format(new Date(value));
}

export function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
