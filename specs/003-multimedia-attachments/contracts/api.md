# API Contracts: Multi-Media Attachments

**Feature**: 002-multimedia-attachments  
**Date**: 2026-05-14  
**Base URL**: `/api`  
**Auth**: All endpoints require a valid `session_token` HttpOnly cookie.

---

## Modified: `POST /api/ideas`

Replaces the single `attachment` file field with a repeatable `attachments` field supporting up to 3 files.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Idea title. |
| `description` | string | ✅ | Idea description. |
| `category` | string | ✅ | One of the four allowed categories. |
| `attachments` | File (repeatable) | ❌ | 0–3 files. Append one entry per file: `formData.append('attachments', file)`. |
| `metadata` | string (JSON) | ❌ | Category-specific field answers (unchanged from Phase 02). |

> **Breaking change from Phase 02**: The `attachment` (singular) field is removed. Clients must use `attachments` (plural). Existing Phase 01/02 clients that sent `attachment` will no longer have it persisted — they must be updated.

### Validation Rules (server-side)

1. `formData.getAll('attachments')` must return 0–3 `File` entries. More than 3 → `400`.
2. Each file's MIME type must be in `ATTACHMENT_CONFIG`. Unknown type → `400`.
3. Each file's size must not exceed the type-specific cap from `ATTACHMENT_CONFIG`. Oversized → `400`.
4. All other validation rules from Phase 02 (`category`, `metadata`) are unchanged.

### Error Response — Attachment Violations

**Status**: `400 Bad Request`

```json
{
  "errors": {
    "attachments": "You can attach a maximum of 3 files."
  }
}
```

```json
{
  "errors": {
    "attachments": "\"demo.exe\" has an unsupported file type."
  }
}
```

```json
{
  "errors": {
    "attachments": "\"recording.mp4\" exceeds the 100 MB limit for video files."
  }
}
```

### Success Response

**Status**: `201 Created`

```json
{
  "id": "uuid",
  "title": "My Idea",
  "description": "...",
  "category": "Technology",
  "status": "submitted",
  "submitted_by": "user-uuid",
  "created_at": "2026-05-14T10:00:00.000Z",
  "updated_at": "2026-05-14T10:00:00.000Z",
  "metadata": [
    { "field_key": "tech_stack", "field_val": "Next.js, SQLite" }
  ],
  "attachments": [
    {
      "id": "attachment-uuid",
      "original_name": "brief.pdf",
      "stored_path": "/uploads/a1b2c3-brief.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 204800,
      "created_at": "2026-05-14T10:00:00.000Z"
    }
  ]
}
```

> `attachment_path` is **removed** from the response (formerly present in Phase 01/02). `attachments[]` is the replacement.

### Other Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session cookie |
| `400` | `{ "errors": { [fieldName]: "message" } }` | Category/metadata validation failure (unchanged) |

---

## Modified: `GET /api/ideas/[id]`

Extends the Phase 02 response to include an `attachments` array and removes `attachment_path`.

### Request

No body. Session cookie required. Access rules unchanged (submitter sees own ideas only; admin sees all).

### Success Response

**Status**: `200 OK`

```json
{
  "id": "uuid",
  "title": "My Idea",
  "description": "...",
  "category": "Technology",
  "status": "submitted",
  "submitted_by": "user-uuid",
  "created_at": "2026-05-14T10:00:00.000Z",
  "updated_at": "2026-05-14T10:00:00.000Z",
  "comment": null,
  "metadata": [],
  "attachments": [
    {
      "id": "attachment-uuid",
      "original_name": "brief.pdf",
      "stored_path": "/uploads/a1b2c3-brief.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 204800,
      "created_at": "2026-05-14T10:00:00.000Z"
    }
  ]
}
```

**Legacy ideas** (migrated from `attachment_path`): `attachments` contains one entry with `size_bytes: 0`.  
**Ideas with no attachments**: `attachments: []` (never `null`).

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session cookie |
| `403` | `{ "error": "Forbidden" }` | Submitter accessing another user's idea |
| `404` | `{ "error": "Not found" }` | Idea does not exist |

---

## Unchanged Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/auth/login` | None |
| `POST /api/auth/logout` | None |
| `POST /api/auth/register` | None |
| `GET /api/me` | None |
| `GET /api/ideas` | None — list view does not include attachment detail |
| `PATCH /api/ideas/[id]` (admin status change) | None |
| `POST /api/ideas/[id]/evaluate` | None |
