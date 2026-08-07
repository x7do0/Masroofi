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

## قواعد البيانات

- IndexedDB database: `masroofi-db`.
- Version: 1.
- Store: `transactions`.
- Key: `id`.
- Indexes: `occurredAt`, `type`.
- الرصيد لا يخزن.
- القيم الإجمالية لا تخزن.
- كل Summary يعاد اشتقاقه من transactions.

## المبلغ

`amount` يخزن كعدد صحيح موجب دائماً. النوع هو الذي يحدد هل العملية دخل أو مصروف.

## التاريخ

`occurredAt` يمثل التاريخ والوقت المحلي المختار للعملية. القيمة الافتراضية هي الوقت الحالي المحلي، ويمكن تعديلها من Calendar المخصص.

## التزامن

بعد نجاح IndexedDB write، يتم تحديث State المحلي فوراً. كل Views تقرأ من نفس قائمة Transactions داخل App، لذلك لا توجد نسخ مستقلة من الرصيد أو السجل.

## Backup لاحقاً

Backup يجب أن يحتوي version + transactions كاملة، ويجب التحقق منه قبل استبدال البيانات المحلية.
