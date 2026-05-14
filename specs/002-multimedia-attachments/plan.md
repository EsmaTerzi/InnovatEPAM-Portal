# Implementation Plan: Multi-Media Attachments

**Branch**: `002-multimedia-attachments` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

---

## Summary

Replace the single `attachment_path` field on the `ideas` table with a proper one-to-many `attachments` table, supporting up to 3 files per submission across document, image, and video formats. A centralised `ATTACHMENT_CONFIG` object (Principle VI) drives all allowed MIME types, size limits, and the file input's `accept` attribute. A new `AttachmentPreview` component renders inline video players, image thumbnails, and file-type icons both before submission (edit mode) and on the idea detail page (read-only mode). Legacy single-attachment records are migrated atomically.

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, no `any` (unchanged from Phase 01/02)

**Primary Dependencies**:
- `next` (App Router) — unchanged
- `react`, `react-dom` — unchanged; attachment state managed via `useState<File[]>`
- `tailwindcss` v4 + `shadcn/ui` — unchanged; all new UI uses existing primitives
- `better-sqlite3` — unchanged; new `attachments` DAO added
- `uuid` — unchanged; used for `attachments.id` generation
- Node.js built-ins: `fs`, `path` — unchanged; used in upload handler

**No new runtime dependencies introduced** (Principle III satisfied).

**Storage**: SQLite — one new `attachments` table; legacy `attachment_path` column migrated and dropped

**Testing**: Jest + React Testing Library — mandatory (Principle IV)
- Unit tests: `ATTACHMENT_CONFIG` shape invariants; `validateAttachments` utility
- Integration tests: `POST /api/ideas` multi-file; `GET /api/ideas/[id]` attachments response; DB migration idempotency
- Component tests: `AttachmentUploadZone` (file selection, limit enforcement, error display); `AttachmentPreview` (edit & read-only modes)

**Target Platform**: Modern browsers, desktop + mobile responsive (unchanged from prior phases)

**Project Type**: Full-stack Next.js monolith (unchanged)

**Performance Goals**:
- File type/size rejection within 100 ms of selection (SC-002) — trivially met by synchronous in-memory validation
- Attachments included in the existing `GET /api/ideas/[id]` response — zero additional network requests (SC-003)

**Constraints**:
- Max 3 files enforced both client-side and server-side
- `better-sqlite3` is synchronous; `attachments` rows inserted in the same transaction as `ideas`
- SQLite does not support `DROP COLUMN` natively — table-rebuild pattern used for migration
- Object URLs must be revoked to prevent memory leaks (AC-22.6)
- Phase 01/02 auth guard pattern (`getSessionUser`) must not be modified (Development Workflow rule)

---

## Constitution Check

*GATE: Must pass before Phase 0 research.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Clean Code | Each new function/component has one responsibility | ✅ | `AttachmentUploadZone` handles input only; `AttachmentPreview` renders only; `validateAttachments` validates only; DAO functions do DB only |
| II. Simple & Responsive UI/UX | All new components fully responsive; shadcn/ui primitives; no custom CSS | ✅ | Upload zone and preview list use Tailwind utilities; no new CSS files |
| III. Minimal Dependencies | No new runtime packages | ✅ | File preview uses native browser `URL.createObjectURL` and `<video>`; no third-party media libraries |
| IV. TDD | Red → Green → Refactor from Phase 02 onward | ✅ | Test tasks precede implementation tasks in each story group |
| V. SQLite Persistence | Parameterised statements; SQL in DAO only; migration idempotent | ✅ | `createAttachments` and `findAttachmentsByIdeaId` in `lib/db/dao/attachments.ts`; migration guarded by `IF NOT EXISTS` |
| VI. Data-Driven Config | All MIME types, extensions, size limits in single `ATTACHMENT_CONFIG` | ✅ | `lib/config/attachments.ts` is the sole source of truth; `accept` attr derived programmatically |

All six gates pass. ✅ Proceeding to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-multimedia-attachments/
├── plan.md              ← this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── checklists/
    └── requirements.md
```

### Source Code Changes

```text
lib/
├── config/
│   └── attachments.ts               ← NEW: ATTACHMENT_CONFIG + TypeScript interfaces
├── db/
│   ├── schema.ts                    ← MODIFIED: add attachments table migration; drop attachment_path
│   └── dao/
│       ├── attachments.ts           ← NEW: createAttachments, findAttachmentsByIdeaId
│       └── ideas.ts                 ← MODIFIED: remove attachment_path field; update CreateIdeaData
└── uploads/
    └── handler.ts                   ← MODIFIED: rename fn; multi-file wrapper; read limits from ATTACHMENT_CONFIG

components/
└── ideas/
    ├── AttachmentUploadZone.tsx      ← NEW: drag-and-drop + click input zone
    ├── AttachmentUploadZone.test.tsx ← NEW
    ├── AttachmentPreview.tsx         ← NEW: edit + read-only preview panel
    ├── AttachmentPreview.test.tsx    ← NEW
    └── IdeaSubmitForm.tsx            ← MODIFIED: replace single attachment input

app/
└── api/
    └── ideas/
        ├── route.ts                  ← MODIFIED: multi-file upload; attachments transaction
        └── [id]/
            └── route.ts              ← MODIFIED: include attachments[] in response
```
