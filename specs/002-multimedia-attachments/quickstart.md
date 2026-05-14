# Quickstart: Multi-Media Attachments

**Feature**: 002-multimedia-attachments  
**Date**: 2026-05-14  
**Prerequisite**: Phase 01 (Auth, Roles, Basic Submission) and Phase 02 (Smart Forms) are fully working.

---

## What This Feature Adds

The single-file attachment on the submission form is replaced with a multi-file upload zone that accepts up to 3 files (documents, images, videos, presentations). Files are previewed in real time before submission. All attachment data is stored in a new `attachments` table; the legacy `attachment_path` column on `ideas` is migrated and removed.

---

## Step 1 — Run the DB Migration

The migration runs automatically on server startup. It:
1. Creates the `attachments` table.
2. Copies any existing `attachment_path` values into `attachments`.
3. Rebuilds the `ideas` table without the `attachment_path` column.

Start the dev server to apply the migration:

```bash
npm run dev
```

Verify the migration:

```bash
sqlite3 data/portal.db ".tables"
# Expected: attachments appears; ideas table still present

sqlite3 data/portal.db "PRAGMA table_info(ideas);"
# Expected: attachment_path column is NOT listed

sqlite3 data/portal.db "SELECT * FROM attachments;"
# Expected: any ideas that had attachment_path now have a row here
```

---

## Step 2 — Verify the Config File

Confirm `lib/config/attachments.ts` exports `ATTACHMENT_CONFIG` and `MAX_ATTACHMENTS`:

```bash
grep -n "ATTACHMENT_CONFIG\|MAX_ATTACHMENTS" lib/config/attachments.ts
```

Expected output shows at least three entries (document, image, video) and `MAX_ATTACHMENTS = 3`.

---

## Step 3 — Submit an Idea with Multiple Attachments

1. Log in as any submitter account.
2. Navigate to **Submit New Idea** (`/ideas/new`).
3. In the attachment zone, select a PDF and a PNG (or drag and drop them).
4. Confirm both files appear in the preview panel:
   - PDF: shows a file icon, the filename, and the file size.
   - PNG: shows an 80 × 80 thumbnail.
5. Each file should have a **Remove** button.
6. Fill in the required idea fields and submit.
7. You should be redirected to `/dashboard`.

---

## Step 4 — Verify Attachments Were Saved

```bash
sqlite3 data/portal.db \
  "SELECT original_name, mime_type, size_bytes FROM attachments ORDER BY created_at DESC LIMIT 5;"
```

You should see your submitted files with the correct MIME types and byte counts.

---

## Step 5 — View Attachments on the Idea Detail Page

1. From the dashboard, click the idea you just submitted.
2. On the idea detail page (`/ideas/[id]`), look for the **Attachments** section.
3. Confirm:
   - The PDF is shown as a download link with its filename.
   - The PNG is shown as a thumbnail linking to the full-size image in a new tab.
4. There are no Remove buttons (read-only mode).

---

## Step 6 — Test File Count Limit

1. On the submission form, try to attach 4 files.
2. After selecting the 4th file, confirm:
   - An inline error appears: "You can attach a maximum of 3 files."
   - The file input is disabled.
3. Remove one staged file and confirm the input becomes available again.

---

## Step 7 — Test File Type Validation

1. Try to attach an unsupported file type (e.g., `.txt` or `.exe`).
2. Confirm an inline error appears immediately: "… has an unsupported file type."
3. The rejected file does not appear in the preview list.

---

## Step 8 — Test Video Preview

1. Attach an MP4 video file (under 100 MB).
2. Confirm the preview renders an inline `<video>` player with native controls.
3. Confirm the file can be played directly in the preview panel before submitting.

---

## Step 9 — Admin View

1. Log in as an admin.
2. Navigate to **Admin → Ideas** and open the idea submitted in Step 3.
3. Confirm the **Attachments** section shows the same files in read-only mode.

---

## Step 10 — Verify Legacy Ideas Are Unaffected

1. Find an idea created before this migration that had an attachment (visible in the dashboard).
2. Open its detail page.
3. Confirm the attachment is still accessible as a download link.

```bash
sqlite3 data/portal.db \
  "SELECT i.id, a.original_name FROM ideas i JOIN attachments a ON a.idea_id = i.id;"
# All previously-attached ideas should appear here
```
