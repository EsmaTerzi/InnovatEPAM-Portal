# Tasks: Multi-Media Attachments

**Branch**: `002-multimedia-attachments`  
**Input**: Design documents from `specs/002-multimedia-attachments/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**TDD Note**: The project constitution (Principle IV) mandates Red → Green → Refactor from Phase 02 onward. Test tasks appear **before** their implementation tasks within each story phase.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent file, no blocking dependency)
- **[US1/2/3]**: User story this task belongs to
- File paths are workspace-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the single configuration object that all other phases depend on.

- [X] T001 Create `ATTACHMENT_CONFIG` array and `MAX_ATTACHMENTS` constant with `AttachmentTypeConfig` interface in `lib/config/attachments.ts` — three entries: document (PDF/DOCX/PPTX, 10 MB), image (PNG/JPEG, 10 MB), video (MP4/WebM/MOV, 100 MB)

**Checkpoint**: Config is importable. All downstream tasks reference this file as the single source of truth.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema migration, DAO layer, and updated upload handler must all be in place before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Update `lib/db/schema.ts` — add `CREATE TABLE IF NOT EXISTS attachments` block; add idempotent legacy migration (copy `attachment_path` rows into `attachments` via `INSERT OR IGNORE`); add TypeScript-driven table-rebuild to drop `attachment_path` column from `ideas` (guard with `PRAGMA table_info` check)
- [X] T003 [P] Create `lib/db/dao/attachments.ts` — implement `createAttachments(ideaId, files[])` and `findAttachmentsByIdeaId(ideaId)` using parameterised `better-sqlite3` statements; export `Attachment`, `AttachmentResponse`, and `AttachmentInsert` interfaces
- [X] T004 Update `lib/db/dao/ideas.ts` — remove `attachment_path` field from `Idea` interface and `CreateIdeaData`; update `createIdea` INSERT statement; update `findIdeaById` / `findIdeasByUser` SELECT statements
- [X] T005 Update `lib/uploads/handler.ts` — rename `validateAndSaveFile` to `validateAndSaveAttachment`; replace hard-coded MIME/size constants with lookups from `ATTACHMENT_CONFIG`; add `validateAndSaveAttachments(files[])` wrapper that returns `AttachmentInsert[]` and throws on the first violation

**Checkpoint**: `npm run dev` starts, DB migration runs without error, `PRAGMA table_info(ideas)` shows no `attachment_path` column, `attachments` table exists.

---

## Phase 3: User Story 1 — Upload Multiple Files on Submission (Priority: P1) 🎯 MVP

**Goal**: Submitters can attach 0–3 files to an idea and submit the whole form atomically.

**Independent Test**: Fill the submission form, attach two files, submit, verify both appear in `SELECT * FROM attachments WHERE idea_id = '<id>'`.

### Tests — User Story 1 ⚠️ Write first; confirm RED before implementing

- [X] T006 [US1] Add integration tests for multi-file `POST /api/ideas` in `app/api/ideas/route.test.ts` — cases: zero attachments (succeeds), two valid files (returns `attachments[]` in response), four files (returns 400)
- [X] T007 [P] [US1] Create `components/ideas/AttachmentUploadZone.test.tsx` — test: renders file input with correct `accept` string derived from `ATTACHMENT_CONFIG`; clicking Remove removes only that file; staging a 4th file shows inline error and disables input

### Implementation — User Story 1

- [X] T008 [P] [US1] Create `components/ideas/AttachmentUploadZone.tsx` — click-to-browse file input zone; `accept` attribute derived from `ATTACHMENT_CONFIG`; maintains `File[]` state; calls `onFilesChange` prop; shows inline error and disables input when `files.length >= MAX_ATTACHMENTS`
- [X] T009 [US1] Create `components/ideas/AttachmentPreview.tsx` — accepts `files: File[]` (edit mode) or `attachments: AttachmentResponse[]` (readonly mode) and `mode: 'edit' | 'readonly'` prop; renders Remove buttons in edit mode only; placeholder icon for all types in this story (full preview types added in US3)
- [X] T010 [US1] Update `components/ideas/IdeaSubmitForm.tsx` — replace single `<input type="file" name="attachment">` with `<AttachmentUploadZone>` and `<AttachmentPreview>`; add `useState<File[]>([])` for staged files; append each file as `formData.append('attachments', file)` on submit; retain staged files in state on server-side error
- [X] T011 [US1] Update `app/api/ideas/route.ts` — replace `formData.get('attachment')` with `formData.getAll('attachments')` as `File[]`; reject if `files.length > MAX_ATTACHMENTS`; call `validateAndSaveAttachments(files)` from handler; insert `attachments` rows inside the same `better-sqlite3` transaction as the `ideas` row; include `attachments` array in the `201` response body

**Checkpoint**: Submit an idea with two files → both rows appear in `attachments` table → `GET /api/ideas/[id]` response includes `attachments: [{…}, {…}]`.

---

## Phase 4: User Story 2 — File Type and Size Validation (Priority: P2)

**Goal**: Unsupported or oversized files are rejected immediately on selection (client-side) and blocked at the API (server-side).

**Independent Test**: Attempt to select a `.txt` file → inline error appears, file is not staged, no network request is made.

### Tests — User Story 2 ⚠️ Write first; confirm RED before implementing

- [X] T012 [P] [US2] Add unit tests for `validateAttachments` in `lib/utils/validation.test.ts` — cases: valid set passes; unsupported MIME returns error message naming the file; video exceeding 100 MB returns error; document exceeding 10 MB returns error; more than 3 files returns count error
- [X] T013 [P] [US2] Extend `components/ideas/AttachmentUploadZone.test.tsx` — test: selecting unsupported type shows error and does not add file to list; selecting oversized video shows correct limit in error message; selecting oversized document shows 10 MB limit

### Implementation — User Story 2

- [X] T014 [P] [US2] Add `validateAttachments(files: File[])` to `lib/utils/validation.ts` — returns `{ errors: string[] }`; checks count ≤ `MAX_ATTACHMENTS`, MIME type in `ATTACHMENT_CONFIG`, size ≤ type-specific `maxSizeBytes`; error messages follow the format defined in `contracts/api.md`
- [X] T015 [US2] Update `components/ideas/AttachmentUploadZone.tsx` — on file selection call `validateAttachments` for each new file; display per-file inline error and skip adding invalid files; clear per-file error when file is removed
- [X] T016 [US2] Update `app/api/ideas/route.ts` server-side validation — import `validateAttachments` and call it before `validateAndSaveAttachments`; return `400` with `{ errors: { attachments: "…" } }` on first violation (mirrors client-side messages)

**Checkpoint**: Select a `.exe` file → error appears immediately, no file staged, form remains submittable with other valid files.

---

## Phase 5: User Story 3 — Preview Attachments After Submission (Priority: P3)

**Goal**: Saved attachments render correctly on the idea detail page for both submitters and admins in read-only mode.

**Independent Test**: Navigate to `/ideas/[id]` for an idea with a PNG and an MP4 → thumbnail links to full image; video renders as inline player; no Remove buttons visible.

### Tests — User Story 3 ⚠️ Write first; confirm RED before implementing

- [X] T017 [P] [US3] Create `components/ideas/AttachmentPreview.test.tsx` — test readonly mode: image renders `<img>` wrapped in `<a target="_blank">`; video renders `<video controls>`; PDF renders download `<a>` with filename; no Remove buttons rendered; empty `attachments` array renders nothing
- [X] T018 [P] [US3] Add integration test for `GET /api/ideas/[id]` in `app/api/ideas/[id]/route.test.ts` — verify `attachments[]` array is present; legacy idea with migrated row returns one attachment with `size_bytes: 0`; idea with no attachments returns `attachments: []`

### Implementation — User Story 3

- [X] T019 [P] [US3] Update `components/ideas/AttachmentPreview.tsx` — implement full preview types for readonly mode: PNG/JPEG as `<img>` thumbnail (80×80, `object-fit: cover`) wrapped in `<a href={stored_path} target="_blank">`; MP4/WebM/MOV as `<video controls muted preload="metadata" src={stored_path}>`; PDF/DOCX/PPTX as `<a href={stored_path} download>` with `lucide-react` file icon; edit-mode `URL.createObjectURL` previews use same layout
- [X] T020 [P] [US3] Update `app/api/ideas/[id]/route.ts` — call `findAttachmentsByIdeaId(id)` and include result as `attachments` in the JSON response; remove `attachment_path` from the spread
- [X] T021 [US3] Update `components/ideas/IdeaDetail.tsx` — render `<AttachmentPreview mode="readonly" attachments={idea.attachments} />` in the attachments section; omit section entirely when `attachments.length === 0`
- [X] T022 [US3] Update admin idea detail page (`app/(protected)/admin/ideas/[id]/page.tsx` or equivalent) — render the same `<AttachmentPreview mode="readonly">` component between the description and the evaluation panel

**Checkpoint**: `/ideas/[id]` shows inline video player; image thumbnail links to full-size in new tab; document is a download link; no Remove buttons.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Memory safety, accessibility, and final integration checks.

- [X] T023 Update `components/ideas/AttachmentPreview.tsx` — add `useEffect` cleanup that calls `URL.revokeObjectURL` for all object URLs when component unmounts; call `revokeObjectURL` immediately in the `onRemove` handler for the removed file
- [X] T024 [P] Update `components/ideas/AttachmentUploadZone.tsx` — add `role="button"`, `tabIndex={0}`, and `onKeyDown` (Enter/Space triggers file picker) for keyboard accessibility; add `aria-label="Upload attachments"` to the zone; add `aria-label="Remove <filename>"` to each Remove button in `AttachmentPreview.tsx`
- [X] T025 [P] Add DB migration idempotency test — run `runMigrations()` twice against an existing database with a migrated idea; assert `attachments` row count is unchanged and `PRAGMA table_info(ideas)` still shows no `attachment_path` column

---

## Dependencies

```
T001 (config)
  └── T002 (schema migration)
  └── T003 (attachments DAO)         — parallel with T002
  └── T004 (ideas DAO update)        — parallel with T002, T003
  └── T005 (upload handler)          — parallel with T002, T003, T004

T002 + T003 + T004 + T005 (Phase 2 complete)
  └── T006 (US1 API test)
  └── T007 (US1 zone component test) — parallel with T006
  └── T008 (AttachmentUploadZone)    — parallel with T006, T007
  └── T009 (AttachmentPreview)       — parallel with T008
  └── T010 (IdeaSubmitForm update)   — depends on T008, T009
  └── T011 (POST route update)       — depends on T006 RED, T003, T005

T010 + T011 (US1 complete)
  └── T012 (validateAttachments test)
  └── T013 (zone validation test)    — parallel with T012
  └── T014 (validateAttachments fn)  — parallel with T012, T013
  └── T015 (client validation)       — depends on T014
  └── T016 (server validation)       — depends on T014

T015 + T016 (US2 complete)
  └── T017 (preview readonly test)
  └── T018 (GET route test)          — parallel with T017
  └── T019 (AttachmentPreview update)
  └── T020 (GET route update)        — parallel with T019
  └── T021 (IdeaDetail integration)  — depends on T019, T020
  └── T022 (admin detail page)       — parallel with T021

T021 + T022 (US3 complete)
  └── T023 (revokeObjectURL cleanup)
  └── T024 (accessibility)           — parallel with T023
  └── T025 (migration idempotency)   — parallel with T023, T024
```

---

## Parallel Execution Opportunities

| Phase | Parallelisable tasks |
|-------|----------------------|
| Phase 2 | T003, T004, T005 can all start once T001 is done |
| Phase 3 | T007, T008 can start in parallel; T006 unblocks T011 |
| Phase 4 | T012, T013, T014 can all run in parallel |
| Phase 5 | T017, T018, T019, T020 can all run in parallel; T021 and T022 parallel with each other |
| Phase 6 | T023, T024, T025 all parallel |

---

## Implementation Strategy

**MVP scope (Phase 1 → Phase 3 only)**: Delivers the full upload + submission flow with basic previews. Ideas can be submitted with up to 3 files. Attachments appear in `GET /api/ideas/[id]`. This is independently shippable.

**Increment 2 (+ Phase 4)**: Adds robust client-side and server-side validation. Zero new components; extends existing ones.

**Increment 3 (+ Phase 5)**: Completes the read-only post-submission experience for submitters and admins.

**Increment 4 (+ Phase 6)**: Memory safety, accessibility, and migration robustness.
