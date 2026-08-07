# Masroofi — QA Evidence

هذا الملف يوثق الفحوصات التي تم تنفيذها فعلياً من Build إلى Production.

## CI / Build

النسخة الأساسية اجتازت عبر GitHub Actions:
- Install dependencies ✅
- TypeScript typecheck ✅
- ESLint ✅
- Vite production build ✅
- Production artifact upload ✅

كما اجتاز `main` نفس فحوصات CI بعد الدمج.

## Browser Visual QA

تم فحص Production artifact في Chromium عبر Playwright.

### Mobile — 390 × 844
- [x] RTL سليم.
- [x] لا يوجد horizontal overflow.
- [x] Home layout سليم.
- [x] Summary cards لا تقص مبالغ مثل `430,000 د.ع` و`75,000 د.ع`.
- [x] Bottom navigation قابل للاستخدام.
- [x] Modern date picker يظهر كـ Bottom Sheet.
- [x] التاريخ الحالي والمختار واضحان.
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

تم تشغيل Flow كامل للواجهة:
1. بداية الرصيد: `0 د.ع`.
2. إضافة دخل `430,000 د.ع`.
3. الرصيد أصبح `430,000 د.ع`.
4. إضافة مصروف `75,000 د.ع`.
5. الرصيد أصبح `355,000 د.ع`.
6. تعديل المصروف إلى `80,000 د.ع`.
7. الرصيد أصبح `350,000 د.ع`.
8. السجل العام أظهر العمليتين بالنوع الصحيح.
9. حذف المصروف مع Confirmation.
10. الرصيد عاد إلى `430,000 د.ع`.

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
- [x] No runtime/page errors during the tested flow.

## Backup / Restore QA

السيناريو:
1. إنشاء دخل ومصروف، رصيد صافي `350,000 د.ع`.
2. تصدير Backup JSON فعلي.
3. الملف كان `masroofi-backup`, version `1`, ويحتوي عمليتين.
4. إضافة عملية ثالثة خفّضت الرصيد إلى `300,000 د.ع`.
5. استيراد النسخة السابقة.
6. Validation قبل الاسترجاع نجح.
7. Confirmation قبل Replace ظهر.
8. بعد الاسترجاع رجع الرصيد إلى `350,000 د.ع` والسجل إلى عمليتين.

النتائج:
- [x] Export JSON.
- [x] Versioned backup format.
- [x] Import validation.
- [x] Safe replace confirmation.
- [x] Restore updates app state correctly.
- [x] Invalid/duplicate/incorrect transaction fields محمية بالـ validation.

## Basic Accessibility QA

- [x] لا Buttons بدون accessible name في الـ flow المفحوص.
- [x] حقول الاسم والمبلغ والتاريخ/الوقت والأيقونة والملاحظة لها Labels.
- [x] Calendar dialog يحمل `aria-label="اختيار التاريخ والوقت"`.
- [x] Reduced-motion CSS موجود.
- [x] دخل/مصروف لا يتم تمييزهما باللون فقط.

## GitHub Pages Production

الرابط المنشور:

`https://x7do0.github.io/Masroofi/`

Deployment:
- GitHub Pages workflow run: `31175205356`
- Run attempt الناجح: `3`
- Build job: PASS.
- Setup Pages: PASS.
- Deploy to GitHub Pages: PASS.
- HTTPS enforced: نعم.

## Real-Origin IndexedDB Production Smoke

تم إنشاء Production smoke test باستخدام Playwright + Chromium ضد رابط GitHub Pages الحقيقي، وليس QA harness محلياً.

- Workflow: `Production Smoke`
- Run: `31176627936`
- Production URL load: PASS.
- إضافة دخل تجريبي إلى IndexedDB الحقيقي: PASS.
- قراءة العملية مباشرة من IndexedDB: PASS.
- Reload للصفحة وبقاء العملية: PASS.
- إغلاق الصفحة وفتحها من جديد وبقاء العملية: PASS.
- Runtime/page errors: لا يوجد.
- Screenshot artifact: تم رفعه بنجاح.
- بيانات الاختبار يتم حذفها في نهاية الـ run، ومتصفح CI منفصل تماماً عن بيانات المستخدم.

سجل الاختبار أكد صراحة:
- `PASS: production URL loaded: https://x7do0.github.io/Masroofi/`
- `PASS: real IndexedDB persisted transaction across reload and page reopen`

## Production Gate

- [x] Build/Lint/Typecheck.
- [x] CRUD synchronization.
- [x] Backup/Restore.
- [x] Responsive/RTL visual QA.
- [x] Basic accessibility QA.
- [x] GitHub Pages deployment.
- [x] Real-origin IndexedDB persistence after reload and page reopen.
- [x] Published production smoke test.

**النتيجة: Production gate مكتمل.**
