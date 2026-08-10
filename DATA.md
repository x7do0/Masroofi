# Masroofi — Data Contract

## Transaction

```ts
type TransactionType = 'income' | 'expense'

interface Transaction {
  id: string
  type: TransactionType
  title: string
  amount: number
  occurredAt: string
  note: string | null
  emoji: string | null
  createdAt: string
  updatedAt: string
}
```

## التخزين المحلي

- IndexedDB database: `masroofi-db`.
- Version: 1.
- Store: `transactions`.
- Key: `id`.
- Indexes: `occurredAt`, `type`.
- الرصيد لا يُخزن كقيمة منفصلة.
- المجاميع والملخصات تُشتق من العمليات الموجودة.

## المبلغ

`amount` يُخزن كعدد صحيح موجب دائماً، والنوع `income | expense` هو الذي يحدد إذا كانت العملية دخل أو مصروف.

## التاريخ

`occurredAt` يمثل التاريخ والوقت المختار للعملية. القيمة الافتراضية هي الوقت المحلي الحالي، ويمكن تعديلها من الـDate & Time picker داخل التطبيق.

## التزامن

بعد نجاح الكتابة إلى IndexedDB يتم تحديث حالة التطبيق مباشرة. كل الواجهات تعتمد على نفس قائمة العمليات، لذلك ماكو نسخة مستقلة من الرصيد أو السجل تحتاج مزامنة منفصلة.

## النسخ الاحتياطي والاسترجاع

النسخة الاحتياطية تستخدم الصيغة الحالية:

```ts
{
  format: 'masroofi-backup'
  version: 1
  exportedAt: string
  transactions: Transaction[]
}
```

قبل الاسترجاع يتم التحقق من:

- صيغة النسخة وإصدارها.
- صحة الحقول الأساسية لكل عملية.
- أن المبلغ عدد صحيح موجب.
- صحة التواريخ.
- عدم تكرار IDs داخل النسخة.

بعد نجاح الفحص يقدر المستخدم يختار بين:

- **الدمج:** يحافظ على البيانات الحالية ويضيف أو يحدث العمليات من النسخة.
- **الاستبدال:** يستبدل السجل الحالي بالكامل بالنسخة المختارة.
