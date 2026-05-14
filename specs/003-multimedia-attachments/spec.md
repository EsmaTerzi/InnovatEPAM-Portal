# Feature Specification: Multi-Media Attachments

**Feature Branch**: `002-multimedia-attachments`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "Phase 03 — Multi-Media Attachments: enable users to attach up to 3 files per submission spanning documents, images, videos, and presentations; render a rich file preview panel with inline video players, image thumbnails, and file-type icons; migrate the legacy single-attachment column to a proper one-to-many attachments table."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Upload Multiple Files on Submission (Priority: P1)

A submitter opens the idea submission form and attaches supporting files — a PDF brief, a PNG mockup, and an MP4 demo video — before submitting. They need to confirm each file is the right one before hitting Submit.

**Why this priority**: Multi-file upload is the core capability of this phase. Without it, the entire feature has no value.

**Independent Test**: Can be fully tested by filling the submission form, attaching three files of different types, submitting, and verifying all three appear in the submitted idea's detail view.

**Acceptance Scenarios**:

1. **Given** the submission form is open, **When** the user selects three files (PDF, PNG, MP4), **Then** all three appear in the preview panel with appropriate previews and Remove buttons.
2. **Given** three files are already staged, **When** the user tries to add a fourth file, **Then** an inline error "You can attach a maximum of 3 files." appears and the file input is disabled.
3. **Given** three files are staged, **When** the user removes the second file, **Then** only that file is removed; the other two remain staged.
4. **Given** all files staged are valid, **When** the user submits the form, **Then** the idea and all attachments are saved atomically and the user is redirected to the idea detail page showing all three attachments.

---

### User Story 2 — File Type and Size Validation (Priority: P2)

A submitter accidentally selects a `.exe` installer and a 200 MB video clip. They need clear, immediate feedback telling them exactly which file is invalid and why — without losing their form data.

**Why this priority**: Validation is a hard requirement for both UX and security. Unsupported or oversized files must never reach the server.

**Independent Test**: Can be fully tested by attempting to select invalid files in the upload zone and verifying client-side error messages without form submission.

**Acceptance Scenarios**:

1. **Given** the user selects a file with an unsupported type (e.g., `.exe`), **Then** an inline error "unsupported file type" appears immediately; the file is not added to the staged list.
2. **Given** the user selects a video file larger than 100 MB, **Then** an inline error naming the file and the 100 MB limit appears; the file is not added.
3. **Given** the user selects a PDF larger than 10 MB, **Then** an inline error naming the file and the 10 MB limit appears.
4. **Given** a file is rejected, **When** the user selects a valid replacement, **Then** the error clears and the valid file is staged.

---

### User Story 3 — Preview Attachments After Submission (Priority: P3)

A submitter returns to view their submitted idea, or an admin opens the idea for evaluation. They need to review the attached files — playing the video, inspecting the mockup image, downloading the PDF — without leaving the page.

**Why this priority**: Read-only preview closes the loop on the upload experience and is critical for admin evaluation.

**Independent Test**: Can be fully tested by navigating to `/ideas/[id]` or `/admin/ideas/[id]` for an idea with existing attachments and verifying all preview modes render correctly.

**Acceptance Scenarios**:

1. **Given** the idea detail page is open and the idea has an attached MP4, **Then** an inline `<video>` player is rendered showing the video.
2. **Given** the idea has an attached PNG, **Then** a thumbnail is displayed that links to the full-size image in a new tab.
3. **Given** the idea has an attached PDF, **Then** a download link with the original filename is rendered.
4. **Given** the idea has no attachments, **Then** no attachments section is rendered.

---

### Edge Cases

- What happens when a file's MIME type reported by the browser disagrees with its extension? (Server validates the stored MIME type from browser metadata; magic-byte sniffing is out of scope for v1.)
- How does the system handle a mid-upload network failure? (The entire form submission fails; all files are rejected and the user retries with the same staged list.)
- What happens if two files in the same submission have identical names? (Both are stored with UUID-prefixed paths; both appear in the preview by their original names.)
- What happens to ideas created in Phase 01 that have a legacy `attachment_path`? (The migration copies each non-null path into a row in `attachments`; the legacy column is then dropped. These ideas display one attachment in read-only mode.)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow submitters to attach up to 3 files per idea submission.
- **FR-002**: The system MUST reject any file whose MIME type is not in the allowed list, with an immediate inline error naming the file and the reason.
- **FR-003**: The system MUST enforce per-type file size limits: 10 MB for documents and images; 100 MB for video files.
- **FR-004**: Allowed file types MUST include: PDF, DOCX, PPTX (documents); PNG, JPEG (images); MP4, WebM, MOV (video).
- **FR-005**: All allowed MIME types, file extensions, and size limits MUST be defined in a single configuration object; no hard-coded values elsewhere.
- **FR-006**: The submission form MUST display a live preview of staged files before submission: thumbnail for images, inline player for video, file-type icon for documents.
- **FR-007**: Each staged file in the preview MUST have an individual Remove button that removes only that file without affecting the others.
- **FR-008**: The entire submission (idea fields + all file bytes) MUST be committed atomically; a failure in any part rolls back the whole operation.
- **FR-009**: If the form submission fails server-side, staged files MUST remain in the preview list so the user can resubmit without re-selecting.
- **FR-010**: The idea detail page (submitter and admin views) MUST display all saved attachments in read-only mode using the same preview component as the submission form.
- **FR-011**: In read-only mode, image files MUST link to the full-size stored file; video files MUST render as inline players; document files MUST render as download links.
- **FR-012**: The system MUST migrate the legacy single `attachment_path` column from the `ideas` table into the new `attachments` table and drop the column. Migration MUST be idempotent.
- **FR-013**: The file input's `accept` attribute MUST be derived programmatically from the configuration object.
- **FR-014**: Object URLs created for client-side previews MUST be revoked when a file is removed or the component unmounts.

### Key Entities *(feature involves data)*

- **Attachment**: Represents one uploaded file. Has an identity, a reference to its parent idea, the original filename shown in the UI, the server-side storage path, the MIME type, the byte size, and a creation timestamp.
- **Idea** (updated): The one-to-many relationship with Attachment replaces the former single-path field. An idea may have zero to three attachments.
- **AttachmentTypeConfig**: A configuration record grouping one or more MIME types by category (document, image, video) together with their allowed extensions and maximum size.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A submitter can attach up to 3 files of any supported type and complete submission in a single form interaction — no separate upload step.
- **SC-002**: Files with unsupported types or sizes are rejected within 100 ms of selection (client-side, no network round-trip).
- **SC-003**: All attachments for a given idea are visible on the idea detail page within the normal page-load time (no extra network requests beyond the existing `GET /api/ideas/[id]` call).
- **SC-004**: 100% of ideas created in Phase 01 with a non-null `attachment_path` are accessible through the new attachment mechanism after migration, with no data loss.
- **SC-005**: Adding a new supported file format requires a change to exactly one file (`lib/config/attachments.ts`) with zero component or handler code changes.
- **SC-006**: Memory usage in the browser does not increase over a session as files are added and removed (object URL cleanup verified via browser devtools).

---

## Assumptions

- Authenticated submitters are the only users who can upload files; unauthenticated requests to `POST /api/ideas` are rejected as in Phase 01.
- File content is stored on the local filesystem under `uploads/` (same strategy as Phase 01); cloud storage migration is out of scope.
- Browser-reported MIME type is trusted for client-side validation; magic-byte validation server-side is out of scope for this phase.
- Mobile layout and drag-and-drop are supported on desktop browsers; touch-based drag-and-drop on mobile is not a hard requirement for this phase.
- The SQLite version in use supports the table-rebuild pattern for column removal (no `DROP COLUMN` is used).
- Inline video playback relies on native browser `<video>` support for MP4, WebM, and MOV; no custom media player library is introduced.
