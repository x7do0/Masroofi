const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export function formatIQD(value: number): string {
  return `${formatter.format(Math.round(value))} د.ع`;
}

export function formatSignedIQD(value: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatter.format(Math.round(Math.abs(value)))} د.ع`;
}
