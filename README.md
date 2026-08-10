# Masroofi — مصروفي

تطبيق ويب شخصي لإدارة الدخل والمصروفات بالدينار العراقي، بواجهة عربية RTL وتخزين محلي على الجهاز.

## الموقع الحي

https://x7do0.github.io/Masroofi/

## الحالة

**Production-ready ✅**

المشروع منشور ويعمل كـ PWA، وتم التحقق من التخزين المحلي والاسترجاع بعد Reload وإغلاق وفتح الصفحة على نسخة GitHub Pages الفعلية.

## أبرز المزايا

- تسجيل الدخل والمصروفات وتحديث الرصيد مباشرة.
- سجل موحد مع التعديل والحذف والفلترة.
- تخزين محلي باستخدام IndexedDB بدون حسابات أو Backend.
- Backup / Restore مع التحقق من صحة البيانات قبل الاسترجاع.
- واجهة عربية RTL ومتجاوبة للموبايل والديسكتوب.
- Date & Time picker مخصص بدل عناصر المتصفح القديمة.
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

## التوثيق

- [`PROJECT.md`](PROJECT.md) — نطاق المشروع وسلوكه الأساسي.
- [`DESIGN.md`](DESIGN.md) — قرارات وتجربة الواجهة.
- [`DATA.md`](DATA.md) — نموذج البيانات وطريقة التخزين.
- [`DECISIONS.md`](DECISIONS.md) — أهم القرارات التقنية.
- [`FEATURES.md`](FEATURES.md) — الأفكار والتحديثات القادمة.
- [`QA.md`](QA.md) — الفحوصات التي تم تنفيذها فعلياً.
