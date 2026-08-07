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
- [x] npm install مجرب في GitHub Actions.
- [x] TypeScript check مجرب وناجح.
- [x] ESLint مجرب وناجح.
- [x] Production build مجرب وناجح.

## Data Layer
- [x] Transaction model موحد.
- [x] IndexedDB service.
- [x] Create transaction.
- [x] Read transactions.
- [x] Update transaction.
- [x] Delete transaction.
- [x] UI state يتحدث فور CRUD.
- [ ] Persistence smoke test فعلي داخل المتصفح.

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

## Backup / Restore
- [x] Export JSON versioned.
- [x] Import validation أساسي.
- [x] Confirmation قبل استبدال السجل الحالي.
- [ ] Hardening إضافي للتحقق من كل الحقول والتواريخ.
- [ ] Smoke test فعلي للتصدير والاسترجاع.

## CI / Build Evidence
- [x] GitHub Actions CI يعمل على `feat/**` و`fix/**` و`main`.
- [x] Install ناجح.
- [x] Typecheck ناجح.
- [x] Lint ناجح.
- [x] Production build ناجح.

## Remaining Production Work
- [ ] Browser QA mobile/desktop.
- [ ] CRUD + IndexedDB persistence smoke test.
- [ ] Backup/Restore smoke test.
- [ ] Accessibility pass.
- [ ] GitHub Pages deploy من `main` بعد اعتماد النسخة.
- [ ] Smoke test للنسخة المنشورة.
