# Masroofi — Polish Phase

الهدف: نقل تجربة مصروفي من تطبيق عملي إلى تجربة شخصية مصقولة، بدون تغيير فلسفة المشروع أو إضافة Backend.

## النطاق

- [ ] App identity: Favicon + App icon + Manifest metadata.
- [ ] PWA installability + Service Worker بسيط.
- [ ] Light / Dark / System theme مع حفظ الاختيار.
- [ ] Toasts لطيفة لنجاح/فشل العمليات.
- [ ] Micro-interactions للحفظ، الرصيد، البطاقات والتنقل.
- [ ] Animated balance / money values مع احترام reduced motion.
- [ ] Empty states مركزية وسهلة التعديل من `src/content/emptyStates.ts`.
- [ ] Balance status visual state: normal / low / negative.
- [ ] ملخص هذا الشهر للدخل والمصروفات.
- [ ] Quick Add على الموبايل لإضافة رصيد أو مصروف بسرعة.
- [ ] تحسين عرض Emoji المختار داخل العمليات.
- [ ] Responsive + accessibility + PWA QA.
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
