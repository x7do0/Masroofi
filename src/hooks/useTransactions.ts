import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction, TransactionInput } from '../types/transaction';
import {
  addTransaction,
  deleteTransaction,
  getAllTransactions,
  mergeTransactions,
  replaceTransactions,
  TRANSACTIONS_CHANGED_EVENT,
  TRANSACTIONS_CHANNEL,
  updateTransaction,
} from '../services/db';
import { getDebts, getTotals } from '../services/ledger';

export type { MergeResult } from '../services/db';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    try {
      const items = await getAllTransactions();
      if (sequence !== refreshSequence.current) return;
      setTransactions(items);
      setError(null);
    } catch (cause) {
      if (sequence !== refreshSequence.current) return;
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل البيانات.');
    } finally {
      if (sequence === refreshSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const reload = () => { void refresh(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') reload(); };
    let channel: BroadcastChannel | undefined;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(TRANSACTIONS_CHANNEL);
        channel.onmessage = reload;
      }
    } catch { /* Focus/visibility events still refresh browsers without an available channel. */ }
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, reload);
    window.addEventListener('focus', reload);
    document.addEventListener('visibilitychange', onVisibility);
    reload();
    return () => {
      ++refreshSequence.current;
      channel?.close();
      window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, reload);
      window.removeEventListener('focus', reload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const add = useCallback(async (input: TransactionInput) => {
    const item = await addTransaction(input);
    await refresh();
    return item;
  }, [refresh]);

  const update = useCallback(async (id: string, input: TransactionInput) => {
    await updateTransaction(id, input);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteTransaction(id);
    await refresh();
  }, [refresh]);

  const restore = useCallback(async (items: Transaction[]) => {
    await replaceTransactions(items);
    await refresh();
  }, [refresh]);

  const merge = useCallback(async (items: Transaction[]) => {
    const result = await mergeTransactions(items);
    await refresh();
    return result;
  }, [refresh]);

  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const debts = useMemo(() => getDebts(transactions), [transactions]);

  return { transactions, loading, error, totals, debts, add, update, remove, restore, merge, refresh };
}
