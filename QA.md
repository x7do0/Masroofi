# Masroofi — QA Evidence

هذا الملف يوثق الفحوصات التي تم تنفيذها فعلياً، ويفصل بين ما تم التحقق منه وما زال يحتاج بيئة Production حقيقية.

## CI / Build

آخر نسخة مفحوصة في هذه الجولة:
- Branch: `feat/core-app`
- Commit: `81622abd8cd8dcde276279b8e564d731bf297033`
- GitHub Actions run: `31174401874`

النتائج:
- [x] Install dependencies
- [x] TypeScript typecheck
- [x] ESLint
- [x] Vite production build
- [x] Production artifact upload

## Browser Visual QA

تم فحص Production artifact المبني بواسطة GitHub Actions في Chromium عبر Playwright.

### Mobile — 390 × 844
- [x] RTL سليم.
- [x] لا يوجد horizontal overflow.
- [x] Home layout سليم.
- [x] Summary cards لا تقص مبالغ مثل `430,000 د.ع` و`75,000 د.ع`.
- [x] Bottom navigation قابل للاستخدام.
- [x] Modern date picker يظهر كـ Bottom Sheet.
- [x] التاريخ الحالي مميز.
- [x] التاريخ المختار مميز.
- [x] تغيير اليوم يعمل.
- [x] زر `اليوم` موجود.
- [x] تعديل الوقت موجود.

### Desktop — 1280 × 900
- [x] لا يوجد horizontal overflow.
- [x] Home layout سليم.
- [x] Balance/Summary/History متوازنة بصرياً.
- [x] Date picker يظهر كـ Dialog مركزي.
- [x] Calendar لا يخرج من الشاشة.

## CRUD / Synchronization QA

تم تشغيل Flow فعلي للواجهة باستخدام IndexedDB-compatible QA harness محلي لأن بيئة Chromium الحالية تمنع Navigation إلى أي Origin محلي أو وهمي.

السيناريو:
1. بداية الرصيد: `0 د.ع`.
2. إضافة دخل `430,000 د.ع` مع Emoji وملاحظة وتعديل التاريخ اختيارياً.
3. الرصيد أصبح `430,000 د.ع`.
4. إضافة مصروف `75,000 د.ع` مع Emoji وملاحظة.
5. الرصيد أصبح `355,000 د.ع`.
6. تعديل المصروف إلى `80,000 د.ع`.
7. الرصيد أصبح `350,000 د.ع`.
8. السجل العام أظهر عمليتين من النوعين الصحيحين.
9. حذف المصروف من السجل العام مع Confirmation.
10. الرصيد عاد إلى `430,000 د.ع` والسجل بقي يحتوي الدخل فقط.

النتائج:
- [x] Add income sync.
- [x] Add expense sync.
- [x] Edit sync.
- [x] Delete sync.
- [x] Unified history sync.
- [x] Delete confirmation.
- [x] Optional note.
- [x] Optional Emoji.
- [x] Optional date edit.
- [x] No runtime/page errors during the harness flow.

## Backup / Restore QA

السيناريو:
1. إنشاء دخل ومصروف، رصيد صافي `350,000 د.ع`.
2. تصدير Backup JSON فعلي.
3. الملف كان `masroofi-backup`, version `1`, ويحتوي عمليتين.
4. إضافة عملية ثالثة خفّضت الرصيد إلى `300,000 د.ع`.
5. استيراد النسخة السابقة.
6. Validation قبل الاسترجاع نجح وأظهر عدد العمليات.
7. Confirmation قبل Replace ظهر.
8. بعد الاسترجاع رجع الرصيد إلى `350,000 د.ع` والسجل إلى عمليتين.

النتائج:
- [x] Export JSON.
- [x] Versioned backup format.
- [x] Import validation.
- [x] Safe replace confirmation.
- [x] Restore updates app state correctly.
- [x] Invalid/duplicate/incorrect transaction fields محمية بمنطق validation في الكود.

## Basic Accessibility QA

- [x] لم يظهر أي Button بدون accessible name في صفحة الدخل أثناء الفحص.
- [x] حقول الاسم والمبلغ والتاريخ/الوقت والأيقونة والملاحظة لها Labels ظاهرة.
- [x] Calendar dialog يحمل `aria-label="اختيار التاريخ والوقت"`.
- [x] Reduced-motion CSS موجود.
- [x] دخل/مصروف لا يتم تمييزهما باللون فقط؛ توجد Type labels وأيقونات/نصوص.

## ما زال يحتاج Verification حقيقي قبل Production Gate

- [ ] IndexedDB persistence بعد Reload/إغلاق وفتح الصفحة على Origin حقيقي.
- [ ] GitHub Pages deployment من `main` بعد اعتماد النسخة.
- [ ] Smoke test على رابط GitHub Pages المنشور.

سبب بقاء اختبار Persistence غير معلّم: بيئة Chromium المستخدمة هنا تمنع Navigation إلى localhost/file/host وهمي (`ERR_BLOCKED_BY_ADMINISTRATOR`)، وIndexedDB محظور على `about:blank`. لذلك استخدم QA harness فقط لاختبار CRUD/UI ولم ندّع أن Reload persistence تم اختباره على Origin حقيقي.
