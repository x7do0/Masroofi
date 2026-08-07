# Masroofi — Production Checklist

## Foundation
- [x] Repository موجود.
- [x] Project memory موثقة.
- [x] Design/Data/Decisions/Plan موجودة.
- [x] QA evidence موثق في `QA.md`.

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
- [x] CRUD flow مجرب داخل Chromium عبر QA harness.
- [ ] Persistence بعد Reload مجرب على Origin حقيقي.

## Financial Logic
- [x] إجمالي الدخل مشتق من السجل.
- [x] إجمالي المصروفات مشتق من السجل.
- [x] الرصيد = الدخل - المصروفات.
- [x] لا يوجد balance مخزن منفصل.
- [x] IQD فقط.
- [x] المبالغ تعرض بأرقام اعتيادية مثل `430,000 د.ع`.

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
- [x] Calendar Mobile Bottom Sheet مجرب بصرياً.
- [x] Calendar Desktop Dialog مجرب بصرياً.
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
- [x] تزامن الرصيد والسجل بعد Add/Edit/Delete مجرب.

## Backup / Restore
- [x] Export JSON versioned.
- [x] Import validation.
- [x] Validation للحقول والتواريخ والمبالغ والـ IDs المكررة.
- [x] Confirmation قبل استبدال السجل الحالي.
- [x] Export/Restore flow مجرب end-to-end عبر QA harness.

## CI / Build Evidence
- [x] GitHub Actions CI يعمل على `feat/**` و`fix/**` و`main`.
- [x] Install ناجح.
- [x] Typecheck ناجح.
- [x] Lint ناجح.
- [x] Production build ناجح.
- [x] Production artifact يتم حفظه مؤقتاً للفحص.

## UX / Browser QA
- [x] Mobile 390×844 بدون horizontal overflow.
- [x] Desktop 1280×900 بدون horizontal overflow.
- [x] Basic accessibility check: لا Buttons بدون accessible name في Flow المفحوص.
- [x] Form labels موجودة.
- [x] Calendar dialog له accessible label.
- [x] Reduced-motion support موجود.

## Remaining Production Work
- [ ] IndexedDB persistence بعد Reload/إغلاق وفتح الصفحة على Origin حقيقي.
- [ ] GitHub Pages deploy من `main` بعد اعتماد النسخة.
- [ ] Smoke test على رابط GitHub Pages المنشور.
