# Masroofi — QA Evidence

هذا الملف يوثق الفحوصات التي تم تنفيذها فعلياً من Build إلى Production.

## Debt management — 2026-09-13

نتائج هذه الميزة منفصلة عن أدلة الإصدارات القديمة أدناه.

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: 26/26 PASS باستخدام Node test runner، مع تجميع وحدات TypeScript الفعلية دون إضافة dependencies.
- `npm run build`: PASS؛ Vite يبني النسخة النهائية و`prepare-sw.mjs` يثبت 8 ملفات محلية في قائمة precache بإصدار مشتق من المحتوى.
- `scripts/debt-persistence-check.ts` نفذ داخل Chromium على أصل محلي معزول (`127.0.0.1:4174`): ترقية IndexedDB v1 إلى v2 مع بقاء العمليات والحقول والفهارس، إعطاء وتسديد جزئي ومتعدد وكامل، تعديل الأصل والدفعة، حذف دفعة وحذف متسلسل للدين، ورفض المبالغ الزائدة والروابط اليتيمة والأرقام غير الآمنة.
- نفس الاختبار أثبت أن عمليات التسديد المتزامنة لا تتجاوز الدين، وأن الدمج والاستبدال غير الصالحين لا يكتبان بيانات جزئية. Backup v1 وv2، وإعادة استيراد نفس النسخة، وتغيير اسم الشخص اجتازت الفحص.
- Refresh وإغلاق/فتح التبويب: بقيت 4 عمليات في fixture؛ الرصيد `850,000`، المستحق `150,000`، المسدد `50,000`، الحالة `partial`.
- نسخة Production الفعلية اختبرت محلياً عبر `vite preview` على المنفذ 4176 باستخدام واجهة المستخدم: رصيد مليون → دين 200 ألف → رصيد 800 ألف → تسديد 50 ألف → رصيد 850 ألف، دون تغيير إجمالي الدخل أو المصروفات.
- اجتازت الواجهة منع التسديد الزائد، منع الأصل تحت المسدد، تعديل الدين، تعديل وحذف الدفعة، التسديد الكامل، تصحيح الدفعة من السجل العام، وحذف الدين ودفعاته بتأكيد واضح. أعاد الحذف الرصيد إلى مليون وبقيت عملية الدخل وحدها.
- فحص RTL ومبالغ IQD والتاريخ بالأرقام الإنجليزية وAM/PM، الوضع الفاتح والداكن، وعروض 320×740 و390×844 و768×1024 و1366×900. بعد إصلاح حد العرض الأدنى لم يعد هناك خروج أفقي؛ نافذة التسديد 390×844 بقيت بين y=12 وy=832 وتسمح بتمرير المحتوى الطويل.
- Escape يغلق التقويم الداخلي أولاً ويعيد التركيز إلى حقل التاريخ، ثم يغلق النموذج ويعيد التركيز إلى الإجراء الأصلي. تم تصحيح تطابق أعمدة أيام التقويم مع أسماء الأسبوع.
- تحديث PWA بين نسخ Production محلية: ظهر تنبيه التحديث، ثم حملت النسخة الجديدة وبقيت الديون والرصيد صحيحين. التثبيت المسبق يستخدم `cache: 'reload'` حتى لا تختلط ملفات إصدارات مختلفة.
- وضع Offline في المتصفح ثم Reload وتسجيل تسديد: PASS؛ انخفض المستحق من `200,000` إلى `150,000` وحفظت الدفعة. Console errors في التبويب المفحوص: `[]`.
- `scripts/production-smoke.mjs` توسع ليشمل الدين والتسديد والسجل والحفظ على GitHub Pages. نتيجة تشغيله الخارجي تسجل عند اكتمال نشر هذا الإصدار، ولا تستنتج من الفحص المحلي.

لم يفحص تثبيت التطبيق على جهاز هاتف فعلي أو متصفح Safari. الفحوصات البصرية وتشغيل Offline المذكورة أعلاه تمت في Chromium.

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

Deployment الأساسي:
- GitHub Pages workflow run: `31175205356`
- Run attempt الناجح: `3`
- Build job: PASS.
- Setup Pages: PASS.
- Deploy to GitHub Pages: PASS.
- HTTPS enforced: نعم.

## Real-Origin IndexedDB Production Smoke

تم إنشاء Production smoke test باستخدام Playwright + Chromium ضد رابط GitHub Pages الحقيقي، وليس QA harness محلياً.

- Workflow: `Production Smoke`
- Run الأساسي: `31176627936`
- Production URL load: PASS.
- إضافة دخل تجريبي إلى IndexedDB الحقيقي: PASS.
- قراءة العملية مباشرة من IndexedDB: PASS.
- Reload للصفحة وبقاء العملية: PASS.
- إغلاق الصفحة وفتحها من جديد وبقاء العملية: PASS.
- Runtime/page errors: لا يوجد.
- Screenshot artifact: تم رفعه بنجاح.
- بيانات الاختبار يتم حذفها في نهاية الـ run، ومتصفح CI منفصل تماماً عن بيانات المستخدم.

## Polish Release — Production QA

تم دمج PR #4 إلى `main` كـ squash commit:

`042dc113b5dbd1e7f141f981e9b6f27f8198a62a`

التحقق على نفس النسخة:
- Main CI run `31183412160`: PASS.
- Typecheck: PASS.
- Lint: PASS.
- Production build: PASS.
- GitHub Pages deploy run `31183412075`: PASS.
- Extended Production Smoke run `31183470957`: PASS.
- Live URL load: PASS.
- PWA manifest: PASS.
- PNG install icons `192x192` و`512x512`: PASS.
- Service Worker أصبح Active على الـorigin الحقيقي: PASS.
- Light / Dark / System theme preference تم حفظها: PASS.
- Real IndexedDB write: PASS.
- IndexedDB persistence after Reload: PASS.
- IndexedDB persistence after page close/reopen: PASS.
- Runtime/page errors: لا يوجد.
- Screenshot artifact: تم رفعه بنجاح.

سجل الاختبار النهائي أكد صراحة:
- `PASS: production URL loaded: https://x7do0.github.io/Masroofi/`
- `PASS: PWA manifest, PNG icons, Service Worker and persisted theme verified`
- `PASS: real IndexedDB persisted transaction across reload and page reopen`

## Production Gate

- [x] Build/Lint/Typecheck.
- [x] CRUD synchronization.
- [x] Backup/Restore.
- [x] Responsive/RTL visual QA.
- [x] Basic accessibility QA.
- [x] GitHub Pages deployment.
- [x] Real-origin IndexedDB persistence after reload and page reopen.
- [x] PWA manifest + production PNG icons.
- [x] Service Worker on real production origin.
- [x] Theme persistence.
- [x] Published production smoke test.

**النتيجة: Production + Polish gate مكتمل.**
