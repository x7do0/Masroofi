const formatter = new Intl.NumberFormat('en-US-u-nu-latn', {
  maximumFractionDigits: 0,
});

const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';
const easternArabicDigits = '۰۱۲۳۴۵۶۷۸۹';

export function formatGroupedInteger(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return formatter.format(Math.round(value));
}

export function parseGroupedInteger(value: string): number {
  const latinDigits = value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)));
  const digitsOnly = latinDigits.replace(/[^0-9]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

export function formatIQD(value: number): string {
  return `${formatter.format(Math.round(value))} د.ع`;
}

export function formatSignedIQD(value: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatter.format(Math.round(Math.abs(value)))} د.ع`;
}
