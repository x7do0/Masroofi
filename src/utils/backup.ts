import type { BackupPayloadV1 } from '../types/backup';
import type { Transaction } from '../types/transaction';

export function createBackup(transactions: Transaction[]): BackupPayloadV1 {
  return {
    format: 'masroofi-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
  };
}

export function validateBackup(value: unknown): BackupPayloadV1 {
  if (!value || typeof value !== 'object') throw new Error('ملف النسخة الاحتياطية غير صالح.');
  const payload = value as Partial<BackupPayloadV1>;
  if (payload.format !== 'masroofi-backup' || payload.version !== 1 || !Array.isArray(payload.transactions)) {
    throw new Error('صيغة النسخة الاحتياطية غير مدعومة.');
  }

  for (const item of payload.transactions) {
    if (!item || typeof item !== 'object') throw new Error('توجد عملية غير صالحة داخل النسخة.');
    const transaction = item as Partial<Transaction>;
    if (
      typeof transaction.id !== 'string' ||
      (transaction.type !== 'income' && transaction.type !== 'expense') ||
      typeof transaction.title !== 'string' ||
      typeof transaction.amount !== 'number' ||
      transaction.amount <= 0 ||
      typeof transaction.occurredAt !== 'string' ||
      typeof transaction.createdAt !== 'string' ||
      typeof transaction.updatedAt !== 'string'
    ) {
      throw new Error('توجد بيانات عملية غير مكتملة داخل النسخة.');
    }
  }

  return payload as BackupPayloadV1;
}
