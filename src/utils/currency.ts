const formatter = new Intl.NumberFormat('ar-IQ', {
  maximumFractionDigits: 0,
});

export function formatIQD(value: number): string {
  return `${formatter.format(Math.round(value))} د.ع`;
}

export function formatSignedIQD(value: number, type: 'income' | 'expense'): string {
  return `${type === 'income' ? '+' : '-'}${formatIQD(Math.abs(value))}`;
}
