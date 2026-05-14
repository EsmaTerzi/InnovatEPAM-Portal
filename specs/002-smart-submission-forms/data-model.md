# Data Model: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-05-14  
**Depends on**: Phase 01 schema (`users`, `ideas`, `evaluation_comments`, `sessions`)

---

## New Table: `idea_metadata`

Stores category-specific key-value answer pairs for each submitted idea.

```sql
CREATE TABLE IF NOT EXISTS idea_metadata (
  id        TEXT PRIMARY KEY,                          -- UUID v4
  idea_id   TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,                             -- snake_case, e.g. 'tech_stack'
  field_val TEXT NOT NULL,                             -- trimmed string, max 1000 chars
  UNIQUE (idea_id, field_key)
);
```

### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | UUID v4, generated at insert time |
| `idea_id` | TEXT | NOT NULL, FK → `ideas.id` | Parent idea. Cascades delete. |
| `field_key` | TEXT | NOT NULL | Snake-case identifier matching a key in `CATEGORY_CONFIG`. |
| `field_val` | TEXT | NOT NULL | Submitted value, server-trimmed, max 1 000 chars. |
| — | — | UNIQUE (idea_id, field_key) | One value per field per idea. |

### Notes

- Rows are inserted in the **same DB transaction** as the parent `ideas` row so a partial write is impossible.
- Legacy ideas (created before this migration) will have zero rows in this table; `GET /api/ideas/[id]` returns `metadata: []` for them.
- The table is appended to the existing `runMigrations()` call in `lib/db/schema.ts` via a new `CREATE TABLE IF NOT EXISTS` block — no changes to existing tables.

---

## No Changes to Existing Tables

| Table | Change |
|-------|--------|
| `users` | None |
| `ideas` | None — `idea_metadata` extends it via FK |
| `evaluation_comments` | None |
| `sessions` | None |

---

## TypeScript Types (new additions in `lib/db/dao/`)

### `IdeaMetadata` (new file: `lib/db/dao/metadata.ts`)

```ts
export interface IdeaMetadata {
  id: string;
  idea_id: string;
  field_key: string;
  field_val: string;
}

// Convenience shape returned by GET /api/ideas/[id]
export type MetadataEntry = Pick<IdeaMetadata, 'field_key' | 'field_val'>;
```

### DAO functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `createMetadataEntries` | `(ideaId: string, entries: Record<string, string>, trx?: Database) => void` | Bulk-inserts metadata rows inside the caller's transaction. |
| `findMetadataByIdeaId` | `(ideaId: string) => MetadataEntry[]` | Returns all metadata rows for an idea, ordered by `field_key`. |

---

## Config Type (new file: `lib/config/categories.ts`)

Not persisted in the DB — defined at module level.

```ts
export interface CategoryFieldDef {
  key: string;            // matches field_key in idea_metadata
  label: string;          // human-readable label for UI and admin view
  type: 'text' | 'textarea' | 'select';
  options?: string[];     // populated only when type === 'select'
  required: boolean;
  helper: string;         // inline hint text shown in the form
}

export interface CategoryConfig {
  guidance: string;       // banner text shown when category is selected
  fields: CategoryFieldDef[];
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Technology': { ... },
  'Process Improvement': { ... },
  'Customer Experience': { ... },
  'Other': { ... },
};
```

---

## State Transition — No Change

The `ideas.status` state machine (`submitted → under_review → accepted | rejected`) is unchanged by this feature.

---

## Entity Relationship (updated)

```
users
  │
  └──< ideas (submitted_by → users.id)
         │
         ├──< idea_metadata (idea_id → ideas.id)   ← NEW
         │
         └──< evaluation_comments (idea_id → ideas.id)
```
