# Masroofi — Agent Instructions

Before changing code, read these files in order:
1. `PROJECT.md`
2. `PLAN.md`
3. `DESIGN.md`
4. `DATA.md`
5. `DECISIONS.md`
6. `CHECKLIST.md`

Rules:
- Do not work directly on `main`.
- Keep the app personal, simple, and local-first.
- No backend/auth/cloud database unless the user changes scope explicitly.
- Balance is derived from transactions; never store it separately.
- Income and expenses use one unified Transaction model.
- IQD only.
- Notes and Emoji are optional.
- Never auto-select Emoji from a title.
- New transactions default to current local date/time.
- Date editing must use the modern custom calendar experience defined in `DESIGN.md`.
- Any CRUD change must remain synchronized across balance, type lists, and unified history.
- Update docs/checklist when behavior or decisions change.
- Do not mark verification items complete without actually running/verifying them.
