# Implementation Plan: Smart Submission Forms

**Branch**: `001-smart-submission-forms` | **Date**: 2026-05-14 | **Spec**: [spec.md](./spec.md)

---

## Summary

Transform the static idea submission form into a dynamic, category-aware form. When a submitter selects a category, the form renders category-specific fields, shows a contextual guidance banner, and enforces tailored validation rules. Category-specific answers are persisted in a new `idea_metadata` table and displayed on both the submitter and admin idea detail pages. All dynamic behaviour is driven by a single `CATEGORY_CONFIG` object in `lib/config/categories.ts`.

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, no `any` (unchanged from Phase 01)

**Primary Dependencies**:
- `next` (App Router) — unchanged
- `react`, `react-dom` — unchanged; dynamic fields rendered via `useState` / `useReducer`
- `tailwindcss` v4 + `shadcn/ui` — unchanged; all new UI built with existing primitives
- `better-sqlite3` — unchanged; new `idea_metadata` DAO added
- `uuid` — unchanged; used for `idea_metadata.id` generation

**No new runtime dependencies introduced** (constitution Principle III satisfied).

**Storage**: SQLite — one new table `idea_metadata` added via non-breaking migration

**Testing**: Jest + React Testing Library — **mandatory from Phase 02** (constitution Principle IV)
- Unit tests: `validateCategoryFields`, `CATEGORY_CONFIG` structure
- Integration tests: `POST /api/ideas` with metadata; `GET /api/ideas/[id]` metadata response
- Component tests: `CategoryFieldsRenderer` field switching; `IdeaSubmitForm` validation error display

**Target Platform**: Same as Phase 01 — modern browsers, desktop + mobile responsive

**Project Type**: Full-stack Next.js monolith — unchanged

**Performance Goals**: Category field switch renders in < 300 ms (SC-001) — trivially met by in-memory React state

**Constraints**:
- `better-sqlite3` is synchronous; metadata insert must run in the same transaction as the `ideas` insert
- No new columns on `ideas` table — extend via `idea_metadata` only
- Phase 01 Auth/Roles must not be modified — all new API extensions reuse the existing `getSessionUser` guard

---

## Constitution Check

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Clean Code | Each new function/component has one responsibility | ✅ | `CategoryFieldsRenderer` renders only; `GuidanceBanner` renders only; `validateCategoryFields` validates only |
| II. Simple & Responsive UI/UX | All new components fully responsive; shadcn/ui primitives only; no custom CSS | ✅ | Dynamic fields use existing `Input`, `Textarea`, `Select` primitives; Tailwind utilities only |
| III. Minimal Dependencies | No new runtime packages | ✅ | All behaviour built on existing stack |
| IV. TDD | Red → Green → Refactor enforced from Phase 02 | ✅ | Test tasks listed before implementation tasks in each story group |
| V. SQLite Persistence | `idea_metadata` uses parameterised statements; SQL only in DAO modules | ✅ | `createMetadataEntries` in `lib/db/dao/metadata.ts` |
| VI. Data-Driven Configuration | All dynamic field, validation, and guidance behaviour driven by `CATEGORY_CONFIG` | ✅ | Zero component changes needed to add a new category |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-smart-submission-forms/
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
│   └── categories.ts            ← NEW: CATEGORY_CONFIG + TypeScript interfaces
├── utils/
│   └── validation.ts            ← NEW: validateCategoryFields() shared utility
└── db/
    ├── schema.ts                 ← MODIFIED: add idea_metadata CREATE TABLE IF NOT EXISTS
    └── dao/
        └── metadata.ts           ← NEW: createMetadataEntries, findMetadataByIdeaId

app/
└── api/
    └── ideas/
        ├── route.ts              ← MODIFIED: parse + validate + persist metadata
        └── [id]/
            └── route.ts          ← MODIFIED: include metadata[] in GET response

components/
└── ideas/
    ├── IdeaSubmitForm.tsx        ← MODIFIED: dynamic fields, guidance banner, category-switch warning
    ├── IdeaDetail.tsx            ← MODIFIED: render CategoryDetails section
    ├── CategoryFieldsRenderer.tsx ← NEW: routes to correct fields component
    ├── GuidanceBanner.tsx         ← NEW: dismissible guidance banner
    ├── CategoryDetails.tsx        ← NEW: read-only category details display
    └── fields/
        ├── TechnologyFields.tsx          ← NEW
        ├── ProcessImprovementFields.tsx  ← NEW
        ├── CustomerExperienceFields.tsx  ← NEW
        └── OtherFields.tsx               ← NEW
```

---

## Phases

### Phase 0 — Foundation (Shared Infrastructure)

**Goal**: Config, validation utility, DAO, and DB migration in place before any UI work begins.

**Steps**:

1. **`lib/config/categories.ts`** — Define `CategoryFieldDef`, `CategoryConfig` interfaces, and the `CATEGORY_CONFIG` constant with all four categories and their fields, validation rules, and guidance text.
2. **`lib/utils/validation.ts`** — Implement `validateCategoryFields(category, fields)` that reads `CATEGORY_CONFIG` and returns `Record<string, string>` of field-level errors.
3. **`lib/db/dao/metadata.ts`** — Implement `createMetadataEntries(ideaId, entries, db)` and `findMetadataByIdeaId(ideaId)`.
4. **`lib/db/schema.ts`** — Append `CREATE TABLE IF NOT EXISTS idea_metadata (...)` to `runMigrations()`.
5. **Tests**:
   - Unit test `validateCategoryFields` — required fields missing, optional fields, invalid category, all fields valid.
   - Unit test `CATEGORY_CONFIG` structure — all four categories present; each has `guidance` and at least one field.
   - Integration test `createMetadataEntries` — inserts, unique constraint prevents duplicates.

**Checkpoint**: DB table created on `npm run dev`; validation utility passing tests; DAO unctions working.

---

### Phase 1 — API Extensions

**Goal**: `POST /api/ideas` and `GET /api/ideas/[id]` support metadata.

**Steps**:

1. **`app/api/ideas/route.ts`** (POST) — Parse optional `metadata` JSON string from form data; call `validateCategoryFields`; strip unknown keys; insert `ideas` row and `idea_metadata` rows in one transaction; return `201` with `metadata[]` in response body.
2. **`app/api/ideas/[id]/route.ts`** (GET) — Call `findMetadataByIdeaId(id)` and include result as `metadata: MetadataEntry[]` in the response (empty array for legacy ideas).
3. **Tests**:
   - Integration test `POST /api/ideas` — submit with valid metadata, assert rows in `idea_metadata`; submit with missing required field, assert `400` error; submit without metadata, assert `201` with `metadata: []`.
   - Integration test `GET /api/ideas/[id]` — idea with metadata returns `metadata[]`; legacy idea returns `metadata: []`.

**Checkpoint**: Postman / curl can submit an idea with metadata and retrieve it with `metadata[]` in response.

---

### Phase 2 — Dynamic Form UI

**Goal**: The submission form renders category-specific fields, guidance, and handles state correctly.

**Steps**:

1. **`components/ideas/GuidanceBanner.tsx`** — Accepts `guidance: string` and `onDismiss: () => void` props. Renders a dismissible info banner. No state of its own.
2. **`components/ideas/fields/TechnologyFields.tsx`** — Renders Tech Stack (text), Estimated Effort (select), Feasibility Notes (textarea) from `CATEGORY_CONFIG['Technology'].fields`.
3. **`components/ideas/fields/ProcessImprovementFields.tsx`** — Same pattern for Process Improvement fields.
4. **`components/ideas/fields/CustomerExperienceFields.tsx`** — Same pattern for Customer Experience fields.
5. **`components/ideas/fields/OtherFields.tsx`** — Same pattern for Other fields.
6. **`components/ideas/CategoryFieldsRenderer.tsx`** — Accepts `category`, `values`, `errors`, `onChange` props; conditionally renders the correct fields component; returns `null` if category is empty.
7. **`components/ideas/IdeaSubmitForm.tsx`** — Refactor:
   - Add `metadataFields: Record<string, string>` state; reset to `{}` on category change.
   - Add `dismissedCategories: Set<string>` state for banner dismissal tracking.
   - Add `pendingCategory: string | null` state for the switch-warning flow.
   - Render `GuidanceBanner` when category is set and not dismissed.
   - Render `CategoryFieldsRenderer` between description and attachment fields.
   - Inline switch-warning notice with "Continue" / "Cancel" when `pendingCategory` is set.
   - Append `metadata: JSON.stringify(metadataFields)` to `FormData` on submit.
   - Pass server errors for category-specific fields to `CategoryFieldsRenderer`.
   - Auto-scroll to first error field on server validation failure.
8. **Tests**:
   - Component test `CategoryFieldsRenderer` — renders Technology fields when category = 'Technology'; renders null when no category; switches correctly.
   - Component test `IdeaSubmitForm` — guidance banner appears on category selection; dismisses correctly; switch warning appears after filling a field; Cancel reverts category; Continue clears metadata state; validation errors appear on submit.

**Checkpoint**: Full submission flow works end-to-end in the browser.

---

### Phase 3 — Detail Page Views

**Goal**: Category Details visible on submitter and admin idea detail pages.

**Steps**:

1. **`components/ideas/CategoryDetails.tsx`** — Accepts `metadata: MetadataEntry[]` and `category: string` prop; looks up human-readable labels from `CATEGORY_CONFIG`; renders a labelled list; returns `null` if metadata is empty.
2. **`components/ideas/IdeaDetail.tsx`** — Fetch `metadata` from the API response (already returned by updated `GET /api/ideas/[id]`); render `<CategoryDetails>` between description and the comment/status sections.
3. **`components/admin/EvaluatePanel.tsx`** (or admin idea detail page) — Render `<CategoryDetails>` between description and the evaluation panel.
4. **Tests**:
   - Component test `CategoryDetails` — renders labelled values; omits empty optional fields; returns null for empty metadata array.
   - Component test `IdeaDetail` — renders Category Details section when metadata is non-empty; does not render section for empty metadata.

**Checkpoint**: Submitting a Technology idea and opening the detail page shows Category Details for both submitter and admin.
