# Masroofi — Implementation Plan

## 0. Foundation
- [x] Repository + memory docs.

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
- [ ] Persistence browser smoke test.

## 3. Core Finance Logic
- [x] Balance derived from transactions.
- [x] Income/expense totals.
- [x] Chronological ordering.
- [x] IQD formatting.

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

## 9. Backup & Restore
- [x] Export versioned JSON.
- [x] Validate import أساسياً.
- [x] Safe replace confirmation.
- [ ] Harden validation + browser smoke test.

## 10. UX & Reliability Polish
- [x] Responsive foundation.
- [x] Custom delete confirmations.
- [x] Reduced-motion support.
- [ ] Browser visual QA.
- [ ] Accessibility audit.
- [ ] Edge-case pass.

## 11. Verification
- [x] npm install.
- [x] Typecheck.
- [x] Lint.
- [x] Production build.
- [ ] CRUD smoke test.
- [ ] IndexedDB persistence test.
- [ ] Backup/Restore smoke test.
- [ ] Mobile/desktop visual test.

## 12. GitHub Pages Production
- [x] Vite base prepared for `/Masroofi/`.
- [x] Deployment workflow prepared.
- [ ] Production deploy from `main` after approval.
- [ ] Published smoke test.

## Completion rule
No phase is considered production-ready until its real browser/build checks pass. Keep `PROJECT.md`, `DESIGN.md`, `DATA.md`, `DECISIONS.md`, and this plan aligned with actual behavior.
