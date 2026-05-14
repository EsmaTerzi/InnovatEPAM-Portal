# Phase 03 — Multi-Media Attachments: Requirements

**Project:** InnovatEPAM Portal  
**Phase:** 03 — Multi-Media Attachments  
**Status:** 🚧 In Progress  
**Last Updated:** 2026-05-14  
**Depends On:** Phase 02 — Smart Submission Forms (completed)

---

## Overview

Phase 03 evolves the single-file attachment introduced in Phase 01 into a full multi-media upload experience. Submitters can attach up to **3 files** per idea, spanning documents, images, mockups, videos, and presentations. A rich preview panel renders inline video players, image thumbnails, and file-type icons before and after submission. All allowed formats, size limits, and MIME types are centralised in a single config object, following the Data-Driven Configuration principle established in Phase 02.

---

## Table of Contents

1. [US-20 — Multiple File Attachments](#us-20--multiple-file-attachments)
2. [US-21 — Broad Format Support](#us-21--broad-format-support)
3. [US-22 — File Preview Panel](#us-22--file-preview-panel)
4. [US-23 — Admin & Submitter View of Attachments](#us-23--admin--submitter-view-of-attachments)
5. [Data Model Changes](#data-model-changes)
6. [Attachment Config Object](#attachment-config-object)
7. [Technical Implementation Notes](#technical-implementation-notes)
8. [Non-Functional Requirements](#non-functional-requirements)

---

## US-20 — Multiple File Attachments

**As a** submitter,  
**I want** to attach more than one file to my idea submission,  
**so that** I can provide supporting evidence across different formats without being forced to combine them into a single document.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-20.1 | The submission form allows attaching up to **3 files** per idea. |
| AC-20.2 | Attempting to add a fourth file displays an inline error: `"You can attach a maximum of 3 files."` and the file input is disabled until a file is removed. |
| AC-20.3 | Each file in the list has an individual **Remove** button that removes only that file from the staged list without affecting the others. |
| AC-20.4 | The existing single `attachment` field in `IdeaSubmitForm.tsx` is replaced with a multi-file attachment zone. |
| AC-20.5 | File uploads are submitted together with the form (not in a separate pre-upload step); the entire submission — idea fields and all files — is committed atomically server-side. |
| AC-20.6 | If the form is submitted and a server-side error occurs, previously staged files remain in the preview list so the user can resubmit without re-selecting files. |

---

## US-21 — Broad Format Support

**As a** submitter,  
**I want** to upload documents, images, mockups, videos, and presentations,  
**so that** I can present my idea in the format most suited to its content.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-21.1 | The allowed MIME types and per-file size limits are defined in a single `ATTACHMENT_CONFIG` object in `lib/config/attachments.ts` (see [Attachment Config Object](#attachment-config-object)). No hard-coded MIME strings appear outside this file. |
| AC-21.2 | Document and image files (`PDF`, `DOCX`, `PPTX`, `PNG`, `JPEG`) have a maximum size of **10 MB** per file. |
| AC-21.3 | Video files (`MP4`, `WebM`, `MOV`) have a maximum size of **100 MB** per file. |
| AC-21.4 | A file that exceeds its type-specific size limit is rejected immediately on selection (client-side) with the message: `"<filename> exceeds the <limit> limit for <type> files."` |
| AC-21.5 | A file with a MIME type not in the allowed list is rejected on selection with the message: `"<filename> has an unsupported file type."` |
| AC-21.6 | Both client-side and server-side validation enforce the same `ATTACHMENT_CONFIG` rules. The server returns `400 Bad Request` with `{ errors: { attachments: string } }` for any violation. |
| AC-21.7 | The file input's `accept` attribute is derived programmatically from `ATTACHMENT_CONFIG` to stay in sync with the allowed type list automatically. |

---

## US-22 — File Preview Panel

**As a** submitter,  
**I want** to see a preview of each attached file before I submit,  
**so that** I can confirm I have selected the correct files without opening them externally.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-22.1 | The preview panel appears beneath the file input zone as soon as at least one file is staged. |
| AC-22.2 | **Image files** (`PNG`, `JPEG`) are displayed as a thumbnail (max 80 × 80 px, `object-fit: cover`) generated via `URL.createObjectURL`. |
| AC-22.3 | **Video files** (`MP4`, `WebM`, `MOV`) are displayed as an inline HTML5 `<video>` element with `controls`, `muted`, and `preload="metadata"` so only the first frame loads. A play button overlay is not required — the native browser controls are sufficient. |
| AC-22.4 | **Document and presentation files** (`PDF`, `DOCX`, `PPTX`) are displayed as a file-type icon (SVG or equivalent) alongside the filename and human-readable file size (e.g., `2.4 MB`). |
| AC-22.5 | Each preview item renders the filename, file size, and a **Remove** button regardless of file type. |
| AC-22.6 | Object URLs created for image and video previews are revoked via `URL.revokeObjectURL` when the file is removed or the component unmounts, to prevent memory leaks. |
| AC-22.7 | The preview panel is implemented as a standalone `AttachmentPreview` component in `components/ideas/AttachmentPreview.tsx`, accepting a `files: File[]` prop and an `onRemove: (index: number) => void` callback. |

---

## US-23 — Admin & Submitter View of Attachments

**As an** admin or submitter,  
**I want** to see all attachments associated with an idea after it has been submitted,  
**so that** I can review supporting material without needing to re-upload or navigate away.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-23.1 | The idea detail page (`/ideas/[id]` for submitters; `/admin/ideas/[id]` for admins) renders all saved attachments using the same `AttachmentPreview` component as the submission form, but in **read-only mode** (no Remove buttons). |
| AC-23.2 | In read-only mode, image thumbnails link to the full-size image (`<a href="…" target="_blank">`). |
| AC-23.3 | In read-only mode, video files are rendered as inline `<video>` players pointing to the stored URL. |
| AC-23.4 | In read-only mode, document and presentation files are rendered as a download link with the original filename. |
| AC-23.5 | If an idea has no attachments, the attachments section is not rendered (no empty state placeholder). |
| AC-23.6 | The `GET /api/ideas/[id]` response includes an `attachments: Attachment[]` array. Each element has the shape `{ id, original_name, stored_path, mime_type, size_bytes }`. |

---

## Data Model Changes

### Deprecation of `attachment_path` on `ideas`

The single `attachment_path TEXT` column on the `ideas` table introduced in Phase 01 is **migrated** to the new `attachments` table and then **dropped**.

Migration steps (executed inside `runMigrations()` in `lib/db/schema.ts`):

1. Create the `attachments` table (see below).
2. Copy any non-null `attachment_path` rows from `ideas` into `attachments`, inferring `mime_type` from the file extension and setting `size_bytes = 0` (exact size is unknown for legacy records).
3. Drop the `attachment_path` column from `ideas` using a table-rebuild pattern (SQLite does not support `DROP COLUMN` in older versions; use `CREATE TABLE … AS SELECT` without the column, then rename).

> All migration steps are idempotent and guarded by `IF NOT EXISTS` / existence checks so they are safe to re-run.

### New Table: `attachments`

Stores one row per uploaded file, linked to its parent idea.

```
attachments
  id            TEXT PRIMARY KEY          -- UUID
  idea_id       TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE
  original_name TEXT NOT NULL             -- sanitised original filename shown in UI
  stored_path   TEXT NOT NULL             -- server-relative path, e.g. /uploads/<uuid>-<name>
  mime_type     TEXT NOT NULL             -- e.g. 'video/mp4'
  size_bytes    INTEGER NOT NULL          -- raw byte count
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
```

**Rationale:** A dedicated table cleanly models the one-to-many relationship, avoids JSON blobs, and keeps the `ideas` row lean. The `mime_type` column allows the API to return the type without re-reading the filesystem, enabling correct preview rendering on the client.

---

## Attachment Config Object

A single `ATTACHMENT_CONFIG` constant in `lib/config/attachments.ts` centralises all allowed MIME types and their constraints. Both the upload handler and the client-side validation function import from this file.

```ts
// lib/config/attachments.ts (illustrative shape)
export interface AttachmentTypeConfig {
  mimeTypes: string[];       // exact MIME strings
  extensions: string[];      // for the <input accept> attribute
  maxSizeBytes: number;
  label: string;             // human-readable group name, e.g. "video"
}

export const ATTACHMENT_CONFIG: AttachmentTypeConfig[] = [
  {
    label: 'document',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    extensions: ['.pdf', '.docx', '.pptx'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  },
  {
    label: 'image',
    mimeTypes: ['image/png', 'image/jpeg'],
    extensions: ['.png', '.jpg', '.jpeg'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  },
  {
    label: 'video',
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: ['.mp4', '.webm', '.mov'],
    maxSizeBytes: 100 * 1024 * 1024, // 100 MB
  },
];

export const MAX_ATTACHMENTS = 3;
```

> **Principle VI alignment:** Adding a new supported format requires only a new entry (or addition to an existing entry) in `ATTACHMENT_CONFIG`. No component or handler code changes are needed.

---

## Technical Implementation Notes

### Component Architecture

- `components/ideas/AttachmentUploadZone.tsx` — drag-and-drop + click-to-browse input zone. Reads `ATTACHMENT_CONFIG` to derive the `accept` attribute and enforce per-file validation on selection.
- `components/ideas/AttachmentPreview.tsx` — renders the staged/saved file list. Accepts a `mode: 'edit' | 'readonly'` prop; Remove buttons are rendered only in `'edit'` mode.
- `IdeaSubmitForm.tsx` — replaces the single `attachment` `<input>` with `<AttachmentUploadZone>` and `<AttachmentPreview>`. Attachment state is `File[]` managed via `useState`.

### Upload Handler Changes

`lib/uploads/handler.ts` is updated:

- The existing `validateAndSaveFile(file: File)` function is renamed to `validateAndSaveAttachment(file: File)` and updated to look up size limits from `ATTACHMENT_CONFIG` instead of a local constant.
- A new `validateAndSaveAttachments(files: File[])` wrapper validates all files and saves them, returning `{ stored_path, original_name, mime_type, size_bytes }[]`. It throws on the first violation.

### API Changes

**`POST /api/ideas`**

- The `formData` body now accepts multiple `attachments` entries (appended as `formData.append('attachments', file)` for each file) instead of a single `attachment` field.
- After the `ideas` row is inserted, `attachments` rows are inserted in the same SQLite transaction.
- The response body includes the new `attachments` array.

**`GET /api/ideas/[id]`**

- The response is extended with `attachments: Attachment[]`. Legacy ideas (migrated from `attachment_path`) return one entry if a path was present, with `size_bytes: 0`.
- The existing `comment` and `metadata` fields are preserved; the shape is a superset of the Phase 02 response.

### DAO

A new `lib/db/dao/attachments.ts` module exposes:

- `createAttachments(ideaId: string, files: AttachmentRow[]): void`
- `findAttachmentsByIdeaId(ideaId: string): AttachmentRow[]`

### State Management

- Staged files are held in `useState<File[]>([])` in `IdeaSubmitForm.tsx`.
- On successful submission the list is cleared.
- On server-side error the list is retained (AC-20.6).

---

## Non-Functional Requirements

| Requirement | Implementation |
|-------------|----------------|
| Max 3 files enforced everywhere | `MAX_ATTACHMENTS` from `ATTACHMENT_CONFIG` is checked client-side on file selection and server-side before persistence. |
| Config-driven types and limits | All MIME types and size caps live in `ATTACHMENT_CONFIG`; no duplication in components or handlers. |
| Memory safety | `URL.createObjectURL` URLs are revoked on remove/unmount (AC-22.6). |
| Atomic submission | `ideas` row and all `attachments` rows are written inside a single SQLite transaction; a failure rolls back everything. |
| Backwards compatibility | Legacy `attachment_path` data is migrated into `attachments`; `GET /api/ideas/[id]` returns `attachments: []` for ideas with no rows, not `null`. |
| Accessibility | The upload zone is keyboard-accessible (`role="button"`, `tabIndex={0}`, `onKeyDown` handler). Preview items include `aria-label` describing file name and type. Remove buttons have `aria-label="Remove <filename>"`. |
| Input sanitisation | `original_name` is sanitised (same `sanitiseFilename` logic as Phase 01) before persistence. `size_bytes` is taken from `file.size`, not from user input. |
| No layout shift | The preview panel has a minimum height of `96px` when files are present to prevent reflow as items are added or removed. |
