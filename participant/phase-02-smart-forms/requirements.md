# Phase 02 — Smart Submission Forms: Requirements

**Project:** InnovatEPAM Portal  
**Phase:** 02 — Smart Submission Forms  
**Status:** ✅ Complete  
**Last Updated:** 2026-05-14  
**Depends On:** Phase 01 — Core Portal (completed)

---

## Overview

Phase 02 enhances the idea submission experience by transforming the static form introduced in Phase 01 into a context-aware, dynamic form. When a submitter selects a category, the form adapts in real time to present category-specific fields, inline guidance text, and tailored validation rules. This reduces cognitive load, improves data quality, and ensures admins receive structured, comparable submissions within each category.

---

## Table of Contents

1. [US-10 — Dynamic Category-Specific Fields](#us-10--dynamic-category-specific-fields)
2. [US-11 — Category Guidance & Helper Text](#us-11--category-guidance--helper-text)
3. [US-12 — Category-Specific Validation](#us-12--category-specific-validation)
4. [US-13 — Field State Persistence on Category Change](#us-13--field-state-persistence-on-category-change)
5. [US-14 — Admin View of Extended Fields](#us-14--admin-view-of-extended-fields)
6. [Data Model Changes](#data-model-changes)
7. [Category Field Definitions](#category-field-definitions)
8. [Technical Implementation Notes](#technical-implementation-notes)
9. [Non-Functional Requirements](#non-functional-requirements)

---

## US-10 — Dynamic Category-Specific Fields

**As a** submitter,  
**I want** the submission form to show fields that are relevant to the category I selected,  
**so that** I can provide structured, meaningful information without being overwhelmed by irrelevant inputs.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-10.1 | When the user selects a category, the form renders additional fields specific to that category without a full page reload. |
| AC-10.2 | Fields for unselected categories are not rendered in the DOM (not merely hidden via CSS) to avoid accidental data submission. |
| AC-10.3 | The base fields (`title`, `description`, `category`, `attachment`) remain visible and unchanged across all categories. |
| AC-10.4 | Category-specific fields appear immediately below the `description` field and above the `attachment` field. |
| AC-10.5 | The correct fields are rendered for each of the four supported categories: `Technology`, `Process Improvement`, `Customer Experience`, and `Other`. See [Category Field Definitions](#category-field-definitions). |
| AC-10.6 | If no category is selected, only the base fields are shown and a placeholder prompt instructs the user to select a category. |

---

## US-11 — Category Guidance & Helper Text

**As a** submitter,  
**I want** to see contextual guidance when I select a category,  
**so that** I understand what information is expected and can write a stronger proposal.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-11.1 | A guidance banner appears directly below the `category` selector when a category is chosen. |
| AC-11.2 | The banner includes a short description (1–3 sentences) explaining what a strong submission in that category looks like. |
| AC-11.3 | Each individual category-specific field displays an inline helper text (placeholder or `<p>` beneath the input) describing the expected format or content. |
| AC-11.4 | Guidance text is defined in a static configuration object (not fetched from an API), enabling zero-latency rendering. |
| AC-11.5 | The guidance banner is dismissible per session; re-selecting the same category does not re-show a dismissed banner. |
| AC-11.6 | Changing to a different category always shows the new category's banner, regardless of whether a previous banner was dismissed. |

---

## US-12 — Category-Specific Validation

**As a** submitter,  
**I want** clear, field-level error messages when I miss a required category-specific field,  
**so that** I know exactly what to fix before I can submit.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-12.1 | Each category defines a set of required fields (see [Category Field Definitions](#category-field-definitions)). Missing required fields are highlighted with a red border and an inline error message on form submission attempt. |
| AC-12.2 | Validation is performed client-side on submit to provide instant feedback, **and** server-side in `POST /api/ideas` to prevent API abuse. |
| AC-12.3 | Server-side validation returns `400 Bad Request` with a structured JSON body: `{ errors: { [fieldName]: string } }`. |
| AC-12.4 | Submitting with a category value not in the allowed list returns `400 Bad Request` with the message `"Invalid category."`. |
| AC-12.5 | Fields that are optional for a category do not produce errors when left blank. |
| AC-12.6 | Validation errors do not clear previously entered valid field values; only the invalid fields are flagged. |
| AC-12.7 | After a server-side validation error, the form scrolls to the first error field automatically. |

---

## US-13 — Field State Persistence on Category Change

**As a** submitter,  
**I want** the values I entered in base fields to be preserved when I switch categories,  
**so that** I do not have to retype my title and description after exploring different categories.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-13.1 | `title`, `description`, and `attachment` values are retained in form state when the user changes the `category` selector. |
| AC-13.2 | Category-specific field values are **cleared** when the user switches to a different category, to avoid stale data being submitted. |
| AC-13.3 | A visible confirmation prompt (inline notice, not a modal) warns the user that switching categories will clear category-specific fields. This notice appears only after the user has already filled in at least one category-specific field. |
| AC-13.4 | The confirmation notice offers "Continue" and "Cancel" inline actions. "Cancel" reverts the category selector to its previous value without clearing any fields. |

---

## US-14 — Admin View of Extended Fields

**As an** admin,  
**I want** to see the category-specific fields submitted with each idea,  
**so that** I can evaluate proposals with full context.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-14.1 | The `/admin/ideas/[id]` detail page displays all category-specific field values in a labelled, read-only section titled **"Category Details"**. |
| AC-14.2 | Fields are rendered with their human-readable labels (e.g., "Tech Stack" not `tech_stack`). |
| AC-14.3 | Empty optional fields are not shown in the admin view to keep the UI clean. |
| AC-14.4 | The Category Details section is positioned between the main idea description and the evaluation panel. |
| AC-14.5 | The submitter-facing idea detail page (`/ideas/[id]`) also renders Category Details in read-only mode using the same component. |

---

## Data Model Changes

The following additions to the schema introduced in Phase 01 are required.

### New Table: `idea_metadata`

Stores category-specific key-value pairs per idea. A flexible schema is used so that new category fields can be added without altering the core `ideas` table.

```
idea_metadata
  id        TEXT PK (UUID)
  idea_id   TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE
  field_key TEXT NOT NULL        -- snake_case field identifier, e.g. 'tech_stack'
  field_val TEXT NOT NULL        -- serialised string value
  UNIQUE (idea_id, field_key)
```

> **Rationale:** A key-value store avoids wide nullable columns on `ideas` and supports future category additions without schema migrations.

### Migration Strategy

- The `idea_metadata` table is created by a new conditional `CREATE TABLE IF NOT EXISTS` block appended to the existing `runMigrations()` function in `lib/db/schema.ts`.
- No changes are required to existing tables; Phase 01 data remains valid.

---

## Category Field Definitions

The table below defines all category-specific fields, their `field_key` identifiers, input type, whether they are required, and their helper text.

### Technology

| field_key | Label | Input Type | Required | Helper Text |
|-----------|-------|------------|----------|-------------|
| `tech_stack` | Tech Stack | `text` | ✅ | List the technologies, languages, or platforms involved (e.g., "Next.js, PostgreSQL, Docker"). |
| `estimated_effort` | Estimated Effort | `select` (`< 1 week` / `1–4 weeks` / `1–3 months` / `> 3 months`) | ✅ | Rough implementation effort assuming a small team. |
| `feasibility_notes` | Feasibility Notes | `textarea` | ❌ | Any known technical risks, dependencies, or prerequisites. |

### Process Improvement

| field_key | Label | Input Type | Required | Helper Text |
|-----------|-------|------------|----------|-------------|
| `current_pain_point` | Current Pain Point | `textarea` | ✅ | Describe the existing problem or inefficiency this idea addresses. |
| `proposed_change` | Proposed Change | `textarea` | ✅ | Explain the new process or workflow you are proposing. |
| `affected_teams` | Affected Teams | `text` | ❌ | Comma-separated list of teams or departments that would be impacted. |

### Customer Experience

| field_key | Label | Input Type | Required | Helper Text |
|-----------|-------|------------|----------|-------------|
| `target_audience` | Target Audience | `text` | ✅ | Which customer segment or persona benefits from this idea? |
| `expected_impact` | Expected Impact | `select` (`Low` / `Medium` / `High`) | ✅ | Estimated effect on customer satisfaction or retention. |
| `success_metric` | Success Metric | `text` | ❌ | How would success be measured? (e.g., "NPS increase of 5 points"). |

### Other

| field_key | Label | Input Type | Required | Helper Text |
|-----------|-------|------------|----------|-------------|
| `context` | Additional Context | `textarea` | ❌ | Any background information that does not fit the other categories. |

---

## Technical Implementation Notes

### Form Architecture

- The submission form lives in `components/ideas/IdeaSubmitForm.tsx` (Phase 01). In Phase 02, category-specific field blocks are extracted into separate components under `components/ideas/fields/`:
  - `TechnologyFields.tsx`
  - `ProcessImprovementFields.tsx`
  - `CustomerExperienceFields.tsx`
  - `OtherFields.tsx`
- A `CategoryFieldsRenderer` component in the same directory accepts the current `category` value as a prop and conditionally renders the appropriate fields component.

### State Management

- All form state is managed via `React.useState` (or `useReducer` for complex state) within `IdeaSubmitForm.tsx`. No external state library is introduced.
- Category-specific field values are stored in a `Record<string, string>` keyed by `field_key`. On category change, this record is reset to `{}`.

### Validation Layer

- Client-side: A `validateCategoryFields(category, fields)` utility function in `lib/utils/validation.ts` returns `{ errors: Record<string, string> }`. This function is shared between the client component and the API route.
- Server-side: `POST /api/ideas` imports the same `validateCategoryFields` function and runs it before inserting records. The `idea_metadata` rows are inserted in a single transaction with the parent `ideas` row.

### API Changes

- `POST /api/ideas` request body is extended to accept an optional `metadata: Record<string, string>` field alongside the existing fields. The server strips unknown keys before persistence.
- `GET /api/ideas/[id]` response is extended to include a `metadata: { field_key: string; field_val: string }[]` array. The existing response shape is a superset of the Phase 01 shape, maintaining backwards compatibility.

### Category Config Object

A single `CATEGORY_CONFIG` constant in `lib/config/categories.ts` centralises all field definitions, validation rules, and guidance text, making the feature fully data-driven:

```ts
// lib/config/categories.ts (illustrative shape)
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Technology: {
    guidance: "...",
    fields: [
      { key: "tech_stack", label: "Tech Stack", type: "text", required: true, helper: "..." },
      // ...
    ],
  },
  // ...
};
```

---

## Non-Functional Requirements

| Requirement | Implementation |
|-------------|----------------|
| Zero full-page reloads | Dynamic fields rendered via React state; no router navigation on category change. |
| Backwards compatibility | `idea_metadata` table addition does not break existing Phase 01 ideas; `metadata` is returned as `[]` for legacy records. |
| Accessibility | All dynamic fields include associated `<label>` elements and `aria-describedby` pointing to helper text. Error messages use `role="alert"`. |
| No layout shift | Category-specific fields section has a fixed minimum height to prevent jarring reflow when fields appear or disappear. |
| Input sanitisation | `field_val` strings are trimmed and length-capped at 1 000 characters server-side before persistence. |
| Config-driven | Adding a new category requires only a new entry in `CATEGORY_CONFIG`; no component code changes are needed. |
