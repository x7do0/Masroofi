export type EmptyStateKey = 'home' | 'income' | 'expenses' | 'history';

export interface EmptyStateContent {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export const emptyStates: Record<EmptyStateKey, EmptyStateContent> = {
  home: {
    emoji: '🪙',
    title: 'بعد ما عندك عمليات',
    description: 'أضف أول رصيد، وبعدها كل حركة راح تظهر هنا.',
    actionLabel: 'إضافة أول رصيد',
  },
  income: {
    emoji: '💰',
    title: 'سجل الدخل فارغ',
    description: 'أول مبلغ تضيفه راح يبقى محفوظ هنا.',
  },
  expenses: {
    emoji: '🧾',
    title: 'ماكو مصروفات بعد',
    description: 'أول شيء تصرف عليه راح يظهر هنا.',
  },
  history: {
    emoji: '📒',
    title: 'السجل فارغ',
    description: 'الدخل والمصروفات راح تظهر هنا مرتبة حسب التاريخ.',
  },
};
