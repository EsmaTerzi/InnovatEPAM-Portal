# Data Model: Multi-Media Attachments

**Feature**: 002-multimedia-attachments  
**Date**: 2026-05-14  
**Depends on**: Phase 01 schema (`users`, `ideas`, `evaluation_comments`, `sessions`) + Phase 02 schema (`idea_metadata`)

---

## Schema Changes Overview

| Change | Table | Type |
|--------|-------|------|
| Add `attachments` table | `attachments` | New |
| Migrate `attachment_path` rows | `ideas` → `attachments` | Data migration |
| Drop `attachment_path` column | `ideas` | Breaking (managed migration) |

---

## New Table: `attachments`

Stores one row per uploaded file, linked to its parent idea.

```sql
CREATE TABLE IF NOT EXISTS attachments (
  id            TEXT    PRIMARY KEY,                          -- UUID v4
  idea_id       TEXT    NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  original_name TEXT    NOT NULL,                             -- sanitised original filename
  stored_path   TEXT    NOT NULL,                             -- server-relative, e.g. /uploads/<uuid>-<name>
  mime_type     TEXT    NOT NULL,                             -- e.g. 'video/mp4'
  size_bytes    INTEGER NOT NULL,                             -- 0 for legacy-migrated rows
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | UUID v4, generated at insert time |
| `idea_id` | TEXT | NOT NULL, FK → `ideas.id` ON DELETE CASCADE | Parent idea. Cascading delete removes all attachments when an idea is deleted. |
| `original_name` | TEXT | NOT NULL | Sanitised filename shown to users in the UI (e.g. `demo-video.mp4`). |
| `stored_path` | TEXT | NOT NULL | Server-relative URL path to the file on disk (e.g. `/uploads/a1b2c3-demo-video.mp4`). |
| `mime_type` | TEXT | NOT NULL | MIME type recorded at upload time; used by the API to return correct preview type to client. |
| `size_bytes` | INTEGER | NOT NULL | Raw byte count. `0` is the sentinel for legacy-migrated rows where size is unknown. |
| `created_at` | TEXT | NOT NULL DEFAULT | ISO-8601 timestamp set by SQLite at insert time. |

### Notes

- At most **3 rows** per `idea_id` — enforced by the application layer (API + client), not by a DB constraint, to keep the migration simple.
- Rows are inserted inside the **same DB transaction** as the parent `ideas` row; a partial write is impossible.
- `ON DELETE CASCADE` ensures attachments are cleaned up automatically if an idea is deleted.

---

## Modified Table: `ideas`

The `attachment_path TEXT` column is **removed** via a table-rebuild migration.

### Migration Steps (inside `runMigrations()`, `lib/db/schema.ts`)

Executed once, guarded by a presence check on `attachment_path` in `pragma_table_info`:

```sql
-- Step 1: Create the attachments table (idempotent)
CREATE TABLE IF NOT EXISTS attachments ( … );

-- Step 2: Migrate legacy attachment_path values (idempotent — skip rows already migrated)
INSERT OR IGNORE INTO attachments (id, idea_id, original_name, stored_path, mime_type, size_bytes)
SELECT
  lower(hex(randomblob(16))),   -- generate a UUID-like id
  id,
  COALESCE(
    SUBSTR(attachment_path, INSTR(attachment_path, '/') + 1),
    attachment_path
  ),                            -- basename of the path
  attachment_path,
  CASE
    WHEN attachment_path LIKE '%.pdf'  THEN 'application/pdf'
    WHEN attachment_path LIKE '%.docx' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    WHEN attachment_path LIKE '%.pptx' THEN 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    WHEN attachment_path LIKE '%.png'  THEN 'image/png'
    WHEN attachment_path LIKE '%.jpg'  THEN 'image/jpeg'
    WHEN attachment_path LIKE '%.jpeg' THEN 'image/jpeg'
    ELSE 'application/octet-stream'
  END,
  0                             -- size unknown for legacy rows
FROM ideas
WHERE attachment_path IS NOT NULL;

-- Step 3: Rebuild ideas table without attachment_path (only runs if column still present)
-- (Performed in TypeScript via pragma_table_info check + CREATE/INSERT/DROP/RENAME)
```

> The table-rebuild is implemented in TypeScript (not raw SQL) to query `PRAGMA table_info('ideas')` and skip the rebuild if `attachment_path` is already absent.

### `ideas` Table After Migration

```sql
CREATE TABLE ideas (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Process Improvement','Technology','Customer Experience','Other')),
  status          TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','under_review','accepted','rejected')),
  submitted_by    TEXT NOT NULL REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Unchanged Tables

| Table | Change |
|-------|--------|
| `users` | None |
| `idea_metadata` | None |
| `evaluation_comments` | None |
| `sessions` | None |

---

## TypeScript Types

### `Attachment` (`lib/db/dao/attachments.ts`)

```ts
export interface Attachment {
  id: string;
  idea_id: string;
  original_name: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

// Shape returned in API responses
export type AttachmentResponse = Omit<Attachment, 'idea_id'>;
```

### DAO Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `createAttachments` | `(ideaId: string, files: AttachmentInsert[]) => void` | Bulk-inserts attachment rows. Called inside the idea-creation transaction. |
| `findAttachmentsByIdeaId` | `(ideaId: string) => AttachmentResponse[]` | Returns all attachments for an idea ordered by `created_at ASC`. |

```ts
export interface AttachmentInsert {
  original_name: string;
  stored_path: string;
  mime_type: string;
  size_bytes: number;
}
```

### Updated `Idea` Type (`lib/db/dao/ideas.ts`)

The `attachment_path` field is **removed** from the `Idea` interface:

```ts
export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  submitted_by: string;
  created_at: string;
  updated_at: string;
  // attachment_path: string | null  ← REMOVED
}
```

### Config Types (`lib/config/attachments.ts`)

```ts
export interface AttachmentTypeConfig {
  label: string;          // 'document' | 'image' | 'video'
  mimeTypes: string[];    // exact MIME strings
  extensions: string[];   // for <input accept>
  maxSizeBytes: number;
}

export const ATTACHMENT_CONFIG: AttachmentTypeConfig[] = [ … ];

export const MAX_ATTACHMENTS = 3;
```
