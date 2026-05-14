# Research: Multi-Media Attachments

**Feature**: 002-multimedia-attachments  
**Date**: 2026-05-14  
**Phase**: 0 — Unknowns resolved before design

---

## Decision 1: Multi-File FormData Submission Strategy

**Decision**: Append each file to `FormData` under the same field key (`attachments`) using multiple `formData.append('attachments', file)` calls, then read them on the server with `formData.getAll('attachments')`.

**Rationale**: This is the standard browser/server pattern for multi-file uploads over `multipart/form-data`. Next.js `request.formData()` returns a `FormData` object that natively supports `getAll(key)`. No streaming, chunked upload, or pre-signed URL approach is needed given the file size caps (max 100 MB video) and the submit-as-one-form requirement (FR-008).

**Alternatives considered**:
- *Pre-upload endpoint (upload files first, then submit idea with returned IDs)*: Rejected — splits the atomic submission guarantee across two requests; violates FR-008 and complicates error recovery (AC-20.6).
- *Base64-encoding files inside JSON body*: Rejected — inflates payload by ~33 % and defeats `multipart/form-data`'s native streaming.

---

## Decision 2: Client-Side Preview — `URL.createObjectURL` vs `FileReader`

**Decision**: Use `URL.createObjectURL(file)` to generate blob URLs for image thumbnails and video previews.

**Rationale**: `createObjectURL` is synchronous, returns immediately, and delegates decoding to the browser. `FileReader.readAsDataURL` is asynchronous and produces a base64 string that must be stored in component state, increasing memory pressure for large video files.

**Alternatives considered**:
- *`FileReader` with `readAsDataURL`*: Rejected — asynchronous complexity with no benefit; data URIs for 100 MB videos would be prohibitively large.
- *Server-side thumbnail generation*: Rejected — requires a round-trip before the user sees a preview, violating the zero-latency preview goal.

**Memory safety**: `URL.revokeObjectURL(url)` is called in the `useEffect` cleanup and in each `onRemove` handler (AC-22.6).

---

## Decision 3: Video Preview — Native `<video>` vs Third-Party Player

**Decision**: Use the native HTML5 `<video>` element with `controls`, `muted`, and `preload="metadata"`.

**Rationale**: Principle III (Minimal Dependencies) prohibits introducing a media player library when the native element covers the requirement. `preload="metadata"` instructs the browser to load only the first frame and track duration without buffering the full file, keeping memory usage low for 100 MB clips.

**Alternatives considered**:
- *Video.js / Plyr*: Rejected — no capability gap justifies the dependency weight.
- *Poster image generation*: Rejected — requires server-side FFmpeg or a canvas extraction step; out of scope.

---

## Decision 4: SQLite Column Removal Strategy

**Decision**: Use the SQLite table-rebuild pattern to drop `attachment_path` from `ideas`: create `ideas_new` without the column, copy all rows, drop `ideas`, rename `ideas_new` to `ideas`.

**Rationale**: SQLite prior to version 3.35.0 does not support `ALTER TABLE … DROP COLUMN`. The table-rebuild pattern is the standard, universally-supported approach. The migration is wrapped in a single transaction so either all rows migrate or none do.

**Migration idempotency guard**: The migration checks `pragma_table_info('ideas')` for the presence of `attachment_path` before executing the rebuild, so re-running migrations on an already-migrated database is a no-op.

**Alternatives considered**:
- *Keep `attachment_path` as deprecated nullable column*: Rejected — user explicitly requested migration + column removal; leaving a dead column violates Principle I (Clean Code / no dead code).
- *Require SQLite ≥ 3.35.0 for `DROP COLUMN`*: Rejected — cannot guarantee the runtime version across all developer machines.

---

## Decision 5: ATTACHMENT_CONFIG Shape

**Decision**: Model `ATTACHMENT_CONFIG` as an `AttachmentTypeConfig[]` array where each entry groups a logical type (document, image, video) with its MIME list, extensions, and size cap.

**Rationale**: An array allows a single loop to derive the `accept` string and a single lookup to resolve a file's size limit by iterating entries and checking `mimeTypes.includes(file.type)`. This is consistent with the flat-loop pattern used in `CATEGORY_CONFIG` (Phase 02) and satisfies Principle VI.

**`MAX_ATTACHMENTS` constant**: Exported from the same file so the "max 3" rule has a single source of truth used by both the React component and the API route.

**Alternatives considered**:
- *Record keyed by MIME type*: Rejected — flattens the logical grouping needed to render user-facing error messages like "exceeds the 10 MB limit for document files".
- *Separate constants per type*: Rejected — splits what belongs together and makes adding a new type a multi-file change.

---

## Decision 6: Legacy Data Migration for `attachment_path`

**Decision**: For each `ideas` row where `attachment_path IS NOT NULL`, insert one row in `attachments` with:
- `original_name` = basename of the path (e.g. `abc-report.pdf`)
- `stored_path` = the existing value of `attachment_path`
- `mime_type` = inferred from file extension via a static lookup map
- `size_bytes` = `0` (exact byte size is unavailable for legacy files; documented in API contract)

**Rationale**: Preserves all existing uploaded files and makes them accessible through the new `attachments` API without any filesystem changes. `size_bytes = 0` is an honest sentinel value; the API contract documents it so consumers know not to render "0 B" as a real size.

**Alternatives considered**:
- *Stat the file to get real size*: Rejected — the migration runs on server startup and `fs.statSync` inside a DB transaction would be fragile; legacy file presence on disk is not guaranteed.
- *Leave legacy rows with null attachments*: Rejected — breaks backwards compatibility (SC-004).

---

## Decision 7: File-Type Icon Strategy

**Decision**: Render SVG icons inline for PDF, DOCX, and PPTX document types. Icons are defined as small React components, one per type, placed in `components/ideas/icons/`.

**Rationale**: No icon library dependency (Principle III). Three document types require three distinct icons; each is ~10 lines of SVG — well within the "trivially implementable in under 50 lines" rule. Using inline SVGs avoids an extra network request for icon assets.

**Alternatives considered**:
- *`lucide-react` icons*: Considered — it is already present in the project as a shadcn/ui peer dependency. Using `lucide-react`'s `File`, `FileText`, and `Presentation` icons is acceptable as it adds zero new dependencies. **Revised decision: use `lucide-react` icons** to stay consistent with the icon strategy already used in the existing UI.
- *Generic single `File` icon for all doc types*: Rejected — does not distinguish formats at a glance.
