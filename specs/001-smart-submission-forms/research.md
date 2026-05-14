# Research: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-05-14  
**Status**: Complete — all unknowns resolved

---

## 1. Dynamic Form Field Rendering in Next.js (App Router)

**Decision**: Render category-specific field blocks as distinct React Client Components, conditionally mounted based on `category` state in the parent form component. Unmount (not hide) non-active blocks.

**Rationale**:
- Unmounting ensures non-active fields never appear in `FormData` on submit.
- Keeps each category block isolated and independently testable.
- No external form library needed — React `useState` is sufficient.
- Aligns with constitution Principle III (minimal dependencies) and Principle VI (data-driven config drives which component to render).

**Alternatives considered**:
- **Single form with conditional `display: none`** — Rejected: hidden inputs still submit values, violating FR-002.
- **React Hook Form / Formik** — Rejected: adds a runtime dependency that is not justified for a straightforward multi-field form (constitution Principle III).
- **Server Components with URL-param-driven renders** — Rejected: causes full page navigation on each category change, violating SC-001 (< 300 ms, no reload).

---

## 2. Configuration Object Shape for Category Fields

**Decision**: A single `CATEGORY_CONFIG` exported constant in `lib/config/categories.ts` typed with explicit interfaces. Each entry describes fields (key, label, input type, required flag, helper text) and guidance copy.

```ts
interface CategoryFieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];   // only for type === 'select'
  required: boolean;
  helper: string;
}

interface CategoryConfig {
  guidance: string;
  fields: CategoryFieldDef[];
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = { ... };
```

**Rationale**:
- Single source of truth for field definitions, validation, guidance, and rendering — satisfies constitution Principle VI.
- Shared between client components and the server-side API route via a pure module import.
- Adding a new category = one new object in the Record; zero component changes.
- TypeScript union type `type` ensures the renderer never encounters an unknown input kind.

**Alternatives considered**:
- **Separate config files per category** — Rejected: splits truth across files; changes require touching multiple files.
- **Database-backed field definitions** — Rejected: over-engineered for a fixed-category portal; adds DB round-trips on every form render.

---

## 3. Persisting Category-Specific Answers

**Decision**: New `idea_metadata` table with columns `(id, idea_id, field_key, field_val)` and a `UNIQUE(idea_id, field_key)` constraint. Inserted in the same DB transaction as the `ideas` row.

**Rationale**:
- Avoids wide nullable columns on the `ideas` table (which would require an `ALTER TABLE` migration and break the clean schema from Phase 01).
- Key-value design supports new categories without any schema migration.
- `UNIQUE(idea_id, field_key)` enforces data integrity at the DB level.
- `ON DELETE CASCADE` ensures metadata is cleaned up if an idea is ever deleted.

**Alternatives considered**:
- **JSON column on `ideas` table** — Rejected: SQLite JSON querying is available but opaque; loses column-level type safety and indexability.
- **Separate typed columns per category on `ideas`** — Rejected: wide nullable table, requires schema migration per new category, violates Principle VI.

---

## 4. Sharing Validation Logic Between Client and Server

**Decision**: A pure TypeScript function `validateCategoryFields(category: string, fields: Record<string, string>): Record<string, string>` exported from `lib/utils/validation.ts`. Imported directly by both `IdeaSubmitForm.tsx` (client component) and `app/api/ideas/route.ts` (server route handler).

**Rationale**:
- DRY — validation rules defined once in the config-driven utility, not duplicated.
- The function has no I/O dependencies (reads only `CATEGORY_CONFIG`) — safe to import on both client and server.
- Returns `Record<string, string>` (fieldKey → errorMessage), matching the server's existing `{ errors }` response shape.

**Alternatives considered**:
- **Zod schemas per category** — Considered but rejected: adds a runtime dependency for logic easily expressed in <50 lines (constitution Principle III).
- **Client-only validation** — Rejected: violates FR-007 (server must enforce independently).

---

## 5. API Contract: Extending `POST /api/ideas`

**Decision**: Accept an additional optional `metadata` field in the `multipart/form-data` body as a JSON-encoded string (`JSON.stringify(Record<string, string>)`), parsed and validated server-side before insertion.

**Rationale**:
- `multipart/form-data` does not natively support nested objects; encoding metadata as a JSON string in a single named field is the idiomatic approach for extending existing multipart endpoints.
- The existing `POST /api/ideas` handler is extended, not replaced — maintains backwards compatibility (if `metadata` is absent, the idea is saved with no metadata rows).
- The server strips any keys not defined in `CATEGORY_CONFIG` before persistence, preventing injection of arbitrary data.

**Alternatives considered**:
- **Separate `POST /api/ideas/[id]/metadata` endpoint** — Rejected: requires two network round-trips for a single user action; risks partial failure.
- **JSON body instead of multipart** — Rejected: file attachment upload requires multipart; switching would break the existing attachment flow.

---

## 6. Guidance Banner Dismissal (Session-Scoped)

**Decision**: Track dismissed category keys in a `Set<string>` stored in React component state (not `sessionStorage` or `localStorage`).

**Rationale**:
- Session-scoped per the spec assumption: "dismissal state resets on page reload."
- Zero storage API calls; no privacy or hydration concerns.
- Keeps the dismissal purely in React state — consistent with the form's other state management.

**Alternatives considered**:
- **`sessionStorage`** — Considered; rejected because the spec assumption states that a page reload resets dismissal. `sessionStorage` persists across reloads within the tab, which is slightly broader than required.
- **`localStorage`** — Rejected: persists across sessions; not what the spec requires.
