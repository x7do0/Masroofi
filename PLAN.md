# Masroofi — Implementation Plan

## 0. Foundation
- [x] Repository + memory docs.
- [x] QA evidence موثق.

## 1. Technical Setup
- [x] React + TypeScript + Vite structure.
- [x] RTL + Arabic document metadata.
- [x] ESLint/TypeScript configuration.
- [x] GitHub Pages base path.
- [x] Install/build/lint/typecheck verification عبر GitHub Actions.

## 2. Data Model & Local Storage
- [x] Unified Transaction model.
- [x] IndexedDB service.
- [x] CRUD operations.
- [x] CRUD synchronization مجرب في Chromium عبر QA harness.
- [ ] Persistence بعد Reload مجرب على Origin حقيقي.

## 3. Core Finance Logic
- [x] Balance derived from transactions.
- [x] Income/expense totals.
- [x] Chronological ordering.
- [x] IQD formatting بأرقام اعتيادية مثل `430,000 د.ع`.

## 4. App Shell & Navigation
- [x] RTL shell.
- [x] Bottom navigation.
- [x] Home / Expenses / Income / History views.

## 5. Home
- [x] Current balance.
- [x] Add balance -> Income.
- [x] Summary cards.
- [x] Recent transactions.
- [x] Empty state.

## 6. Income
- [x] Add/edit/delete.
- [x] Optional note and Emoji.
- [x] Automatic current date/time.
- [x] Modern custom calendar editing.

## 7. Expenses
- [x] Add/edit/delete.
- [x] Optional note and Emoji.
- [x] Automatic current date/time.
- [x] Modern custom calendar editing.

## 8. Unified History
- [x] Unified chronological history.
- [x] Filters.
- [x] Edit/delete.
- [x] Add/Edit/Delete synchronization verified.

## 9. Backup & Restore
- [x] Export versioned JSON.
- [x] Validate import + transaction fields/dates/duplicate IDs.
- [x] Safe replace confirmation.
- [x] Export/Restore browser flow verified عبر QA harness.

## 10. UX & Reliability Polish
- [x] Responsive foundation.
- [x] Custom delete confirmations.
- [x] Reduced-motion support.
- [x] Mobile 390×844 visual QA.
- [x] Desktop 1280×900 visual QA.
- [x] Modern calendar QA on mobile + desktop.
- [x] Basic accessibility pass for labels/button names/dialog labeling.
- [x] No horizontal overflow in tested viewports.

## 11. Verification
- [x] npm install.
- [x] Typecheck.
- [x] Lint.
- [x] Production build.
- [x] CRUD smoke test عبر browser harness.
- [x] Backup/Restore smoke test عبر browser harness.
- [x] Mobile/desktop visual test.
- [ ] Real-origin IndexedDB persistence test after Reload/close/open.

## 12. GitHub Pages Production
- [x] Vite base prepared for `/Masroofi/`.
- [x] Deployment workflow prepared.
- [ ] Production deploy from `main` after approval.
- [ ] Published smoke test including real IndexedDB persistence.

## Current gate

المشروع حالياً Release Candidate على `feat/core-app`. لا ندمج إلى `main` ولا نعلن Production قبل نشره على GitHub Pages وفحص persistence على Origin فعلي.

## Completion rule
No phase is considered production-ready until its real browser/build checks pass. Keep `PROJECT.md`, `DESIGN.md`, `DATA.md`, `DECISIONS.md`, `CHECKLIST.md`, `QA.md`, and this plan aligned with actual behavior.
