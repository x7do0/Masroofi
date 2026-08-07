# Masroofi

تطبيق ويب شخصي بسيط لإدارة الدخل والمصروفات بالدينار العراقي، بواجهة عربية RTL وتخزين محلي عبر IndexedDB.

## الموقع الحي

https://x7do0.github.io/Masroofi/

## الحالة

Production-ready ✅

تم التحقق من:
- TypeScript / ESLint / Production build.
- CRUD والتزامن الفوري للرصيد والسجلات.
- Backup / Restore.
- Responsive + RTL على الموبايل والديسكتوب.
- Calendar مخصص وحديث.
- GitHub Pages deployment.
- IndexedDB persistence بعد Reload وإغلاق/فتح الصفحة على رابط Production الحقيقي.

تفاصيل الفحوصات موجودة في `QA.md`.

## التشغيل محلياً

```bash
npm install
npm run dev
```

## الفحص

```bash
npm run typecheck
npm run lint
npm run build
```

المواصفات والقرارات وخطة المشروع موجودة في `PROJECT.md` و`PLAN.md` وبقية ملفات التوثيق.
