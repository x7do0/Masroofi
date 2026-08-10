# Masroofi — مصروفي

تطبيق ويب عربي لإدارة الدخل والمصروفات بالدينار العراقي، بواجهة RTL وتخزين محلي على الجهاز.

## الموقع الحي

https://x7do0.github.io/Masroofi/

## الحالة

**Production-ready ✅**

المشروع منشور كـPWA، وتم التحقق من التخزين المحلي وبقاء البيانات بعد إعادة تحميل الصفحة وإغلاقها وفتحها من جديد على نسخة GitHub Pages الفعلية.

## أبرز المزايا

- تسجيل الدخل والمصروفات وتحديث الرصيد مباشرة.
- سجل موحد مع التعديل والحذف والفلترة.
- تخزين محلي باستخدام IndexedDB بدون حسابات أو Backend.
- Backup / Restore مع التحقق من صحة البيانات قبل الاسترجاع.
- واجهة عربية RTL ومتجاوبة للموبايل والديسكتوب.
- Date & Time picker مخصص.
- Light / Dark / System theme.
- قابل للتثبيت كتطبيق PWA.

## التقنيات

- React
- TypeScript
- Vite
- IndexedDB
- Playwright
- GitHub Actions
- GitHub Pages

## الجودة والفحص

تم التحقق من:

- TypeScript typecheck.
- ESLint.
- Production build.
- CRUD وتزامن الرصيد والسجلات.
- Backup / Restore.
- Responsive + RTL.
- PWA manifest وService Worker.
- IndexedDB persistence على رابط Production الحقيقي.

تفاصيل الفحوصات موجودة في [`QA.md`](QA.md).

## التشغيل محلياً

```bash
npm install
npm run dev
```

ولفحص المشروع:

```bash
npm run typecheck
npm run lint
npm run build
```

## التوثيق التقني

- [`PROJECT.md`](PROJECT.md) — نظرة عامة على نطاق المشروع وسلوكه.
- [`DESIGN.md`](DESIGN.md) — ملاحظات وقرارات تجربة الواجهة.
- [`DATA.md`](DATA.md) — نموذج البيانات وطريقة التخزين والنسخ الاحتياطي.
- [`DECISIONS.md`](DECISIONS.md) — أهم القرارات التقنية.
- [`QA.md`](QA.md) — أدلة الفحص والتحقق التي نُفذت فعلياً.
