import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Transaction, TransactionInput } from '../types/transaction';
import {
  deleteTransaction,
  getAllTransactions,
  putTransaction,
  replaceTransactions,
  type StoredTransaction,
} from '../services/db';

function toStored(transaction: Transaction): StoredTransaction {
  return transaction;
}

export interface MergeResult {
  added: number;
  updated: number;
  total: number;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const items = await getAllTransactions();
      setTransactions(items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(async (input: TransactionInput) => {
    const now = new Date().toISOString();
    const item: Transaction = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title.trim(),
      amount: Math.round(input.amount),
      occurredAt: input.occurredAt,
      note: input.note?.trim() || null,
      emoji: input.emoji || null,
      createdAt: now,
      updatedAt: now,
    };
    await putTransaction(toStored(item));
    setTransactions((current) => [item, ...current].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
    return item;
  }, []);

  const update = useCallback(async (id: string, input: TransactionInput) => {
    const current = transactions.find((item) => item.id === id);
    if (!current) throw new Error('العملية غير موجودة.');

    const item: Transaction = {
      ...current,
      ...input,
      title: input.title.trim(),
      amount: Math.round(input.amount),
      note: input.note?.trim() || null,
      emoji: input.emoji || null,
      updatedAt: new Date().toISOString(),
    };
    await putTransaction(toStored(item));
    setTransactions((items) => items.map((candidate) => (candidate.id === id ? item : candidate)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  }, [transactions]);

  const remove = useCallback(async (id: string) => {
    await deleteTransaction(id);
    setTransactions((items) => items.filter((item) => item.id !== id));
  }, []);

  const restore = useCallback(async (items: Transaction[]) => {
    await replaceTransactions(items.map(toStored));
    setTransactions([...items].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  }, []);

  const merge = useCallback(async (items: Transaction[]): Promise<MergeResult> => {
    const byId = new Map(transactions.map((item) => [item.id, item]));
    let added = 0;
    let updated = 0;

    for (const incoming of items) {
      const existing = byId.get(incoming.id);
      if (!existing) {
        byId.set(incoming.id, incoming);
        added += 1;
        continue;
      }

      if (new Date(incoming.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        byId.set(incoming.id, incoming);
        updated += 1;
      }
    }

    const merged = [...byId.values()].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    await replaceTransactions(merged.map(toStored));
    setTransactions(merged);
    return { added, updated, total: merged.length };
  }, [transactions]);

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const item of transactions) {
      if (item.type === 'income') income += item.amount;
      else expenses += item.amount;
    }
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  return { transactions, loading, error, totals, add, update, remove, restore, merge, refresh };
}
