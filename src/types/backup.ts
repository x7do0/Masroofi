export interface BackupPayloadV1 {
  format: 'masroofi-backup';
  version: 1;
  exportedAt: string;
  transactions: import('./transaction').Transaction[];
}
