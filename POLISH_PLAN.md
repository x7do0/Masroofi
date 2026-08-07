# Masroofi — Polish Phase

الهدف: نقل تجربة مصروفي من تطبيق عملي إلى تجربة شخصية مصقولة، بدون تغيير فلسفة المشروع أو إضافة Backend.

## النطاق

- [x] App identity: Favicon + App icon + Manifest metadata.
- [x] PWA installability + Service Worker بسيط.
- [x] Light / Dark / System theme مع حفظ الاختيار.
- [x] Toasts لطيفة لنجاح/فشل العمليات.
- [x] Micro-interactions للحفظ، الرصيد، البطاقات والتنقل.
- [x] Animated balance / money values مع احترام reduced motion.
- [x] Empty states مركزية وسهلة التعديل من `src/content/emptyStates.ts`.
- [x] Balance status visual state: normal / low / negative، مع عدم اعتبار السجل الفارغ تحذيراً منخفضاً.
- [x] ملخص هذا الشهر للدخل والمصروفات.
- [x] Quick Add على الموبايل لإضافة رصيد أو مصروف بسرعة.
- [x] تحسين عرض Emoji المختار داخل العمليات.
- [x] PNG PWA icons بمقاسات 192x192 و512x512 وApple touch icon 180x180.
- [ ] Responsive + accessibility + PWA QA على النسخة النهائية.
- [ ] CI + Production build + Pages smoke قبل الدمج.

## خارج النطاق

- Greeting حسب الوقت.
- Backend أو Authentication أو Cloud sync.
- Charts معقدة.

## قواعد التنفيذ

1. لا تعديل مباشر على `main`.
2. كل شيء قابل للتغيير من config حين يكون ذلك منطقياً.
3. Empty states لا تحتوي نصوصاً hard-coded داخل الصفحات.
4. الحركات تكون خفيفة وتحترم `prefers-reduced-motion`.
5. أي تغيير Production يمر Typecheck + Lint + Build + browser QA.
