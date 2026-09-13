import type { BackupPayload, BackupPayloadV2 } from '../types/backup';
import type { Transaction } from '../types/transaction';
import { isValidDate, validateTransactions } from '../services/ledger';

export function createBackup(transactions: Transaction[]): BackupPayloadV2 {
  validateTransactions(transactions);
  return {
    format: 'masroofi-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    transactions,
  };
}

export function validateBackup(value: unknown): BackupPayload {
  if (!value || typeof value !== 'object') throw new Error('ملف النسخة الاحتياطية غير صالح.');
  const payload = value as Record<string, unknown>;
  if (
    payload.format !== 'masroofi-backup'
    || (payload.version !== 1 && payload.version !== 2)
    || !isValidDate(payload.exportedAt)
  ) {
    throw new Error('صيغة النسخة الاحتياطية غير مدعومة أو ناقصة.');
  }
  validateTransactions(payload.transactions);
  if (payload.version === 1 && payload.transactions.some((item) => item.type !== 'income' && item.type !== 'expense')) {
    throw new Error('الإصدار الأول من النسخة الاحتياطية يدعم الدخل والمصاريف فقط.');
  }
  return {
    format: 'masroofi-backup',
    version: payload.version,
    exportedAt: payload.exportedAt,
    transactions: payload.transactions,
  };
}
