---
description: "Task list for Smart Submission Forms (Phase 02)"
---

# Tasks: Smart Submission Forms

**Feature**: `001-smart-submission-forms`  
**Branch**: `001-smart-submission-forms`  
**Date**: 2026-05-14  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅  
**Testing**: Jest + React Testing Library — **mandatory** (constitution Principle IV, Phase 02)  
**Organization**: Tasks ordered Red → Green → Refactor within each story phase.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5, maps to spec.md)

---

## Phase 1: Setup

**Purpose**: Confirm Phase 01 baseline is stable before any new code is written.

- [x] T001 Verify `npm run dev` starts cleanly and `data/portal.db` contains all Phase 01 tables (`users`, `ideas`, `evaluation_comments`, `sessions`)

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Config, shared validation utility, metadata DAO, and DB migration. ALL user story work is blocked until this phase is complete.

**⚠️ CRITICAL**: No user story implementation can begin until T002–T009 are done and tests pass.

- [x] T002 [P] Create `lib/config/categories.ts` — define `CategoryFieldDef` and `CategoryConfig` TypeScript interfaces, and export `CATEGORY_CONFIG` constant with all four categories (`Technology`, `Process Improvement`, `Customer Experience`, `Other`), their fields (key, label, type, options, required, helper), and guidance text
- [x] T003 [P] Create `lib/utils/validation.ts` — implement and export `validateCategoryFields(category: string, fields: Record<string, string>): Record<string, string>` that reads `CATEGORY_CONFIG` and returns a map of `fieldKey → errorMessage` for all failing required fields
- [x] T004 Write unit tests for `validateCategoryFields` in `lib/utils/validation.test.ts` — cover: all required fields missing, only optional fields missing (no errors), invalid category string, all fields valid (empty return)
- [x] T005 [P] Write unit tests for `CATEGORY_CONFIG` structure in `lib/config/categories.test.ts` — assert all four category keys exist, each has a non-empty `guidance` string, each has at least one `fields` entry, every `required` field has a non-empty `key` and `label`
- [x] T006 Append `CREATE TABLE IF NOT EXISTS idea_metadata` migration block to `runMigrations()` in `lib/db/schema.ts` — columns: `id TEXT PK`, `idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE`, `field_key TEXT NOT NULL`, `field_val TEXT NOT NULL`, `UNIQUE (idea_id, field_key)`
- [x] T007 [P] Create `lib/db/dao/metadata.ts` — implement `createMetadataEntries(ideaId: string, entries: Record<string, string>, db: Database): void` (bulk insert, strips empty values) and `findMetadataByIdeaId(ideaId: string): MetadataEntry[]` (returns `{ field_key, field_val }[]`, empty array if none)
- [x] T008 Write integration tests for metadata DAO in `lib/db/dao/metadata.test.ts` — cover: insert and retrieve entries, `UNIQUE` constraint rejects duplicate `(idea_id, field_key)`, `findMetadataByIdeaId` returns `[]` for unknown idea
- [x] T009 Run all foundation tests and confirm green before proceeding: `npx jest lib/`

**Checkpoint**: `idea_metadata` table created on server start; `validateCategoryFields` and DAO functions pass all tests.

---

## Phase 3: User Story 1 — Category-Aware Form Fields (P1) 🎯 MVP

**Goal**: Selecting a category renders that category's specific fields immediately; switching removes previous fields from the DOM.

**Independent Test**: Select each of the four categories in the browser, verify the correct fields appear and that switching categories removes the previous ones completely.

### Tests for User Story 1 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T010 [P] [US1] Write component test for `CategoryFieldsRenderer` in `components/ideas/CategoryFieldsRenderer.test.tsx` — assert: renders Technology fields when `category='Technology'`; renders Process Improvement fields when `category='Process Improvement'`; renders `null` / no fields when `category=''`; switching from Technology to Other removes Technology fields from the DOM

### Implementation for User Story 1

- [x] T011 [P] [US1] Create `components/ideas/fields/TechnologyFields.tsx` — renders Tech Stack (`Input`), Estimated Effort (`Select` with options `< 1 week` / `1–4 weeks` / `1–3 months` / `> 3 months`), and Feasibility Notes (`Textarea`); accepts `values: Record<string,string>`, `errors: Record<string,string>`, `onChange: (key: string, val: string) => void` props; reads field metadata from `CATEGORY_CONFIG['Technology'].fields`
- [x] T012 [P] [US1] Create `components/ideas/fields/ProcessImprovementFields.tsx` — same prop contract as T011; renders Current Pain Point (`Textarea`), Proposed Change (`Textarea`), Affected Teams (`Input`); reads from `CATEGORY_CONFIG['Process Improvement'].fields`
- [x] T013 [P] [US1] Create `components/ideas/fields/CustomerExperienceFields.tsx` — renders Target Audience (`Input`), Expected Impact (`Select` with `Low`/`Medium`/`High`), Success Metric (`Input`); reads from `CATEGORY_CONFIG['Customer Experience'].fields`
- [x] T014 [P] [US1] Create `components/ideas/fields/OtherFields.tsx` — renders Additional Context (`Textarea`); reads from `CATEGORY_CONFIG['Other'].fields`
- [x] T015 [US1] Create `components/ideas/CategoryFieldsRenderer.tsx` — accepts `category: string`, `values: Record<string,string>`, `errors: Record<string,string>`, `onChange` props; uses a `switch` (or config map) to render the correct fields component; returns `null` when category is empty or unrecognised
- [x] T016 [US1] Refactor `components/ideas/IdeaSubmitForm.tsx` — add `metadataFields: Record<string, string>` state (init `{}`); reset to `{}` on category change; render `<CategoryFieldsRenderer>` between description and attachment fields; append `metadata: JSON.stringify(metadataFields)` to `FormData` on submit
- [x] T017 [US1] Extend `app/api/ideas/route.ts` (POST) — parse `metadata` JSON string from form data; call `validateCategoryFields`; strip unknown keys; insert `ideas` row and `idea_metadata` rows in a single transaction using `createMetadataEntries`; return `201` with `metadata[]` in response body

**Checkpoint**: US1 independently testable — submit a Technology idea and confirm metadata rows in `idea_metadata` table.

---

## Phase 4: User Story 2 — Contextual Guidance per Category (P2)

**Goal**: A dismissible guidance banner and per-field helper text appear when a category is selected.

**Independent Test**: Select each category and confirm a non-empty guidance banner appears below the selector; dismiss it and confirm it does not reappear for the same category; switch to a different category and confirm the new banner is shown.

### Tests for User Story 2 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T018 [P] [US2] Write component test for `GuidanceBanner` in `components/ideas/GuidanceBanner.test.tsx` — assert: renders `guidance` text; calls `onDismiss` when dismiss button is clicked; renders nothing after dismiss (controlled by parent)
- [x] T019 [P] [US2] Write component test for `IdeaSubmitForm` guidance integration in `components/ideas/IdeaSubmitForm.test.tsx` — assert: banner appears after selecting a category; banner disappears after dismiss; selecting the same category again does not show dismissed banner; selecting a different category shows new banner

### Implementation for User Story 2

- [x] T020 [US2] Create `components/ideas/GuidanceBanner.tsx` — accepts `guidance: string` and `onDismiss: () => void` props; renders an info banner with guidance text and a dismiss button using `shadcn/ui` and Tailwind utility classes; stateless (dismissal controlled by parent)
- [x] T021 [US2] Integrate `GuidanceBanner` into `IdeaSubmitForm.tsx` — add `dismissedCategories: Set<string>` state; render `<GuidanceBanner>` directly below the category selector when `category` is set and not in `dismissedCategories`; on dismiss, add current category to `dismissedCategories`

**Checkpoint**: US2 independently testable — guidance banner appears, dismisses, and re-shows on category change.

---

## Phase 5: User Story 3 — Category-Specific Required Field Validation (P2)

**Goal**: Submitting with a missing required category-specific field produces a field-level error without clearing valid fields; server enforces the same rules independently.

**Independent Test**: Select Technology, leave "Tech Stack" blank, click Submit — a red error appears only on that field; other fields retain their values; filling it in and resubmitting succeeds.

### Tests for User Story 3 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T022 [P] [US3] Write component test for validation errors in `IdeaSubmitForm.test.tsx` — assert: error message appears on required category field when left empty; valid field values are not cleared on error; error clears after the field is filled and form is resubmitted successfully
- [x] T023 [P] [US3] Write integration test for `POST /api/ideas` validation in `app/api/ideas/route.test.ts` — assert: missing required category-specific field returns `400` with `{ errors: { [fieldKey]: "..." } }`; unknown metadata keys are stripped (no error); missing `metadata` body field returns `201` with `metadata: []`

### Implementation for User Story 3

- [x] T024 [US3] Add server-side `validateCategoryFields` call to `app/api/ideas/route.ts` (POST) — call immediately after parsing and before any DB writes; merge category-field errors into the existing `errors` object; return `400` if any errors exist
- [x] T025 [US3] Add client-side `validateCategoryFields` call to `handleSubmit` in `components/ideas/IdeaSubmitForm.tsx` — merge returned errors into the existing `errors` state before calling `fetch`; display errors on the corresponding fields via `CategoryFieldsRenderer`'s `errors` prop
- [x] T026 [US3] Implement auto-scroll to first error field in `IdeaSubmitForm.tsx` — after setting errors (client or server), use `document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth' })` on the first errored field; add `data-error="true"` prop to field wrappers in each field component when their key has an error

**Checkpoint**: US3 independently testable — submit Technology idea without Tech Stack, confirm `400` from API and inline error in UI.

---

## Phase 6: User Story 4 — Safe Category Switching (P3)

**Goal**: Switching categories after filling a category-specific field triggers an inline warning; Cancel reverts; Continue clears only category-specific fields; base fields are always preserved.

**Independent Test**: Fill in "Tech Stack", switch to "Process Improvement" — warning appears; Cancel reverts to Technology with "Tech Stack" intact; Continue shows Process Improvement fields with "Tech Stack" cleared; "Title" unchanged throughout.

### Tests for User Story 4 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T027 [P] [US4] Write component test for category-switch warning in `IdeaSubmitForm.test.tsx` — assert: no warning when switching with no category-specific values entered; warning appears when at least one category-specific field has a value; Cancel reverts category selector to previous value; Continue clears `metadataFields` state and shows new category's fields; title and description are preserved after Continue

### Implementation for User Story 4

- [x] T028 [US4] Add `pendingCategory: string | null` state to `IdeaSubmitForm.tsx` — intercept the `onValueChange` handler of the category `<Select>`; if `metadataFields` has any non-empty values, set `pendingCategory` instead of updating `category` directly; otherwise update `category` directly (no warning needed)
- [x] T029 [US4] Add inline switch-warning notice to `IdeaSubmitForm.tsx` — render a notice between the category selector and the guidance banner when `pendingCategory !== null`; notice includes the text "Switching categories will clear your category-specific answers" and two buttons: "Continue" (sets `category` to `pendingCategory`, resets `metadataFields` to `{}`, clears `pendingCategory`) and "Cancel" (clears `pendingCategory`, leaves `category` and `metadataFields` unchanged)

**Checkpoint**: US4 independently testable — fill a category field, attempt category switch, verify warning and both action paths.

---

## Phase 7: User Story 5 — Admin & Submitter Read-Only View (P3)

**Goal**: Submitted category-specific answers are visible in a "Category Details" section on both the submitter's and admin's idea detail pages.

**Independent Test**: Submit a Technology idea, open it as the submitter at `/ideas/[id]` — "Category Details" section shows "Tech Stack" and "Estimated Effort" with submitted values; open as admin at `/admin/ideas/[id]` — same section appears between description and evaluation panel.

### Tests for User Story 5 ⚠️ Write FIRST — ensure they FAIL before implementing

- [x] T030 [P] [US5] Write component test for `CategoryDetails` in `components/ideas/CategoryDetails.test.tsx` — assert: renders human-readable labels and values from `metadata[]`; omits entries for fields that are empty; returns `null` when `metadata` prop is empty array; labels come from `CATEGORY_CONFIG` (not raw `field_key`)
- [x] T031 [P] [US5] Write integration test for `GET /api/ideas/[id]` in `app/api/ideas/[id]/route.test.ts` — assert: response includes `metadata: [{ field_key, field_val }]` for ideas with metadata; returns `metadata: []` for legacy ideas (no rows in `idea_metadata`)

### Implementation for User Story 5

- [x] T032 [US5] Extend `GET /api/ideas/[id]` in `app/api/ideas/[id]/route.ts` — call `findMetadataByIdeaId(id)` and include result as `metadata: MetadataEntry[]` in the JSON response; legacy ideas (no rows) return `metadata: []`
- [x] T033 [US5] Create `components/ideas/CategoryDetails.tsx` — accepts `metadata: MetadataEntry[]` and `category: string` props; looks up each `field_key` label from `CATEGORY_CONFIG[category].fields`; renders a labelled read-only list using Tailwind utilities; omits entries where `field_val` is empty; returns `null` if `metadata` is empty
- [x] T034 [US5] Update `components/ideas/IdeaDetail.tsx` — type the API response to include `metadata: MetadataEntry[]`; render `<CategoryDetails metadata={...} category={...} />` between the description block and the comment/status section; component is not rendered when metadata is empty
- [x] T035 [US5] Update admin idea detail page (`app/(protected)/admin/ideas/[id]/page.tsx`) — pass `metadata` from the API response to `<CategoryDetails>`; render it between the idea description and `<EvaluatePanel>`

**Checkpoint**: US5 independently testable — open any idea with metadata as submitter and admin, confirm Category Details section.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T036 [P] Verify backwards compatibility — open a legacy idea (submitted before Phase 02) as both submitter and admin; confirm Category Details section is absent (not an empty section)
- [x] T037 [P] Accessibility audit of all new form fields — each new `Input`, `Textarea`, `Select` has an associated `<label>` with matching `htmlFor`; helper text elements use `aria-describedby`; error messages use `role="alert"`
- [x] T038 [P] Responsive check — open the submission form on a mobile viewport (375 px); confirm category-specific fields, guidance banner, and switch-warning notice are fully readable and tappable
- [x] T039 Run full test suite and confirm all tests pass: `npx jest --coverage`
- [x] T040 Manual end-to-end smoke test — submit one idea for each of the four categories with all required fields; verify metadata saved; verify Category Details visible on detail pages for submitter and admin

---

## Dependencies

```
T001
  └── T002, T003 (can run in parallel)
        └── T004, T005 (tests — can run in parallel with T006, T007)
              └── T006, T007 (can run in parallel)
                    └── T008, T009 (confirm foundation green)
                          └── Phase 3 (US1) ← T010 (test first) → T011–T017
                                └── Phase 4 (US2) ← T018, T019 (test first) → T020, T021
                                      └── Phase 5 (US3) ← T022, T023 (test first) → T024–T026
                                            └── Phase 6 (US4) ← T027 (test first) → T028, T029
                                                  └── Phase 7 (US5) ← T030, T031 (test first) → T032–T035
                                                        └── Final Phase: T036–T040
```

## Parallel Execution Opportunities

| Phase | Tasks that can run in parallel |
|-------|-------------------------------|
| Foundation | T002 + T003 + T006 + T007 (all touch different files) |
| Foundation tests | T004 + T005 + T008 (all touch different test files) |
| US1 fields | T011 + T012 + T013 + T014 (four independent field components) |
| US1 tests | T010 can be written in parallel with T011–T014 |
| US2 tests | T018 + T019 (different test files) |
| US3 tests | T022 + T023 (different test files) |
| US5 tests | T030 + T031 (different test files) |
| Polish | T036 + T037 + T038 (independent checks) |

## Implementation Strategy

**MVP** (minimum to demonstrate value): Complete through Phase 3 (US1 only) — dynamic fields render and metadata is saved. This alone transforms the form and delivers the spec's P1 story.

**Increment 2**: Phase 4 + Phase 5 — guidance text and validation. Raises submission quality.

**Increment 3**: Phase 6 + Phase 7 — safe switching and read-only detail views. Completes the full Phase 02 scope.
