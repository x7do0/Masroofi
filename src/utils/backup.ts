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

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(new Date(value).getTime());
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function validateTransaction(value: unknown, index: number): asserts value is Transaction {
  if (!value || typeof value !== 'object') {
    throw new Error(`العملية رقم ${index + 1} داخل النسخة غير صالحة.`);
  }

  const transaction = value as Partial<Transaction>;
  const validAmount = typeof transaction.amount === 'number'
    && Number.isFinite(transaction.amount)
    && Number.isInteger(transaction.amount)
    && transaction.amount > 0;

  if (
    typeof transaction.id !== 'string'
    || transaction.id.trim().length === 0
    || (transaction.type !== 'income' && transaction.type !== 'expense')
    || typeof transaction.title !== 'string'
    || transaction.title.trim().length === 0
    || !validAmount
    || !isValidDate(transaction.occurredAt)
    || !isNullableString(transaction.note)
    || !isNullableString(transaction.emoji)
    || !isValidDate(transaction.createdAt)
    || !isValidDate(transaction.updatedAt)
  ) {
    throw new Error(`بيانات العملية رقم ${index + 1} داخل النسخة غير مكتملة أو غير صالحة.`);
  }
}

export function validateBackup(value: unknown): BackupPayloadV1 {
  if (!value || typeof value !== 'object') {
    throw new Error('ملف النسخة الاحتياطية غير صالح.');
  }

  const payload = value as Partial<BackupPayloadV1>;
  if (
    payload.format !== 'masroofi-backup'
    || payload.version !== 1
    || !isValidDate(payload.exportedAt)
    || !Array.isArray(payload.transactions)
  ) {
    throw new Error('صيغة النسخة الاحتياطية غير مدعومة أو ناقصة.');
  }

  const ids = new Set<string>();
  payload.transactions.forEach((transaction, index) => {
    validateTransaction(transaction, index);
    if (ids.has(transaction.id)) {
      throw new Error(`توجد عملية مكررة داخل النسخة عند الرقم ${index + 1}.`);
    }
    ids.add(transaction.id);
  });

  return payload as BackupPayloadV1;
}
