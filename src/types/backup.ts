import type { Transaction } from './transaction';

interface BackupFields {
  format: 'masroofi-backup';
  exportedAt: string;
  transactions: Transaction[];
}

export interface BackupPayloadV1 extends BackupFields { version: 1 }
export interface BackupPayloadV2 extends BackupFields { version: 2 }
export interface BackupPayloadV3 extends BackupFields { version: 3 }
export type BackupPayload = BackupPayloadV1 | BackupPayloadV2 | BackupPayloadV3;
