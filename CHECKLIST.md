# Masroofi — Production Checklist

## Foundation
- [x] Repository موجود.
- [x] Project memory موثقة.
- [x] Design/Data/Decisions/Plan موجودة.

## Project Setup
- [x] React + TypeScript + Vite files جاهزة.
- [x] RTL و`lang="ar"`.
- [x] ESLint config.
- [x] GitHub Pages base path.
- [ ] npm install مجرب في بيئة المشروع.
- [ ] TypeScript check مجرب.
- [ ] ESLint مجرب.
- [ ] Production build مجرب.

## Data Layer
- [x] Transaction model موحد.
- [x] IndexedDB service.
- [x] Create transaction.
- [x] Read transactions.
- [x] Update transaction.
- [x] Delete transaction.
- [x] UI state يتحدث فور CRUD.
- [ ] Persistence smoke test فعلي.

## Financial Logic
- [x] إجمالي الدخل مشتق من السجل.
- [x] إجمالي المصروفات مشتق من السجل.
- [x] الرصيد = الدخل - المصروفات.
- [x] لا يوجد balance مخزن منفصل.
- [x] IQD فقط.

## Home
- [x] الرصيد الحالي.
- [x] إضافة رصيد = الانتقال لإضافة دخل.
- [x] لا يوجد زر إضافة عملية زائد.
- [x] آخر العمليات.
- [x] Empty state.

## Income / Expenses
- [x] إضافة.
- [x] الاسم والمبلغ مطلوبان.
- [x] التاريخ والوقت الحاليان افتراضياً.
- [x] Calendar حديث لتعديل التاريخ.
- [x] الملاحظة اختيارية.
- [x] Emoji اختياري وبدون اختيار تلقائي.
- [x] سجل لكل نوع.
- [x] تعديل.
- [x] حذف مع Confirmation مخصص.

## Unified History
- [x] سجل موحد.
- [x] فلترة الكل/الدخل/المصروفات.
- [x] ترتيب زمني.
- [x] تعديل وحذف من السجل.

## Remaining Production Work
- [ ] Backup JSON.
- [ ] Restore JSON + validation.
- [ ] Browser QA mobile/desktop.
- [ ] Build/Lint/Typecheck فعلي.
- [ ] Accessibility pass.
- [ ] GitHub Pages workflow/deploy.
- [ ] Smoke test للنسخة المنشورة.
