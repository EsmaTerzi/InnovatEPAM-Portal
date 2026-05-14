# API Contracts: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-05-14  
**Base URL**: `/api`  
**Auth**: All endpoints require a valid `session_token` HttpOnly cookie.

---

## Modified: `POST /api/ideas`

Extends the Phase 01 endpoint to accept an optional `metadata` field alongside the existing form fields.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Idea title. |
| `description` | string | ✅ | Idea description. |
| `category` | string | ✅ | One of the four allowed categories. |
| `attachment` | File | ❌ | Supporting document (Phase 01 rules unchanged). |
| `metadata` | string (JSON) | ❌ | `JSON.stringify` of `Record<string, string>` — category-specific field answers. |

**`metadata` encoding example**:
```json
{
  "tech_stack": "Next.js, SQLite",
  "estimated_effort": "1–4 weeks",
  "feasibility_notes": "No external dependencies needed."
}
```

### Validation

1. `category` must be in the approved list → `400` with `{ errors: { category: "..." } }`.
2. `metadata`, if present, is parsed as JSON → `400` with `{ errors: { metadata: "Invalid metadata format." } }` if malformed.
3. Required fields for the selected category are checked using `validateCategoryFields(category, parsedMetadata)`.
4. Unknown keys in `metadata` (not in `CATEGORY_CONFIG[category].fields`) are stripped silently before persistence.
5. Each `field_val` is trimmed and capped at 1 000 characters server-side.

### Success Response

**Status**: `201 Created`

```json
{
  "id": "uuid",
  "title": "...",
  "description": "...",
  "category": "Technology",
  "status": "submitted",
  "attachment_path": null,
  "submitted_by": "user-uuid",
  "created_at": "2026-05-14T10:00:00.000Z",
  "updated_at": "2026-05-14T10:00:00.000Z",
  "metadata": [
    { "field_key": "tech_stack", "field_val": "Next.js, SQLite" },
    { "field_key": "estimated_effort", "field_val": "1–4 weeks" }
  ]
}
```

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session cookie |
| `400` | `{ "errors": { [fieldName]: "message" } }` | Validation failure (base fields or category fields) |

---

## Modified: `GET /api/ideas/[id]`

Extends the Phase 01 response to include a `metadata` array.

### Request

No body. Session cookie required.

### Success Response

**Status**: `200 OK`

```json
{
  "id": "uuid",
  "title": "...",
  "description": "...",
  "category": "Technology",
  "status": "under_review",
  "attachment_path": "/uploads/abc-myfile.pdf",
  "submitted_by": "user-uuid",
  "created_at": "2026-05-14T10:00:00.000Z",
  "updated_at": "2026-05-14T11:00:00.000Z",
  "comment": null,
  "metadata": [
    { "field_key": "tech_stack", "field_val": "Next.js, SQLite" },
    { "field_key": "estimated_effort", "field_val": "1–4 weeks" }
  ]
}
```

**Backwards compatibility**: Legacy ideas (no metadata rows) return `"metadata": []`.

### Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session cookie |
| `403` | `{ "error": "Forbidden" }` | Submitter requesting another user's idea |
| `404` | `{ "error": "Not found" }` | Idea does not exist |

---

## Unchanged Endpoints

The following Phase 01 endpoints are not modified by this feature:

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/register` | Auth unchanged |
| `POST /api/auth/login` | Auth unchanged |
| `POST /api/auth/logout` | Auth unchanged |
| `GET /api/me` | User profile unchanged |
| `GET /api/ideas` (if present) | Listing unchanged |
| `PATCH /api/ideas/[id]/evaluate` | Admin evaluation unchanged |
| `GET /api/uploads/[...path]` | File serving unchanged |
