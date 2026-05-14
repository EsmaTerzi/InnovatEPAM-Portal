# Data Model — InnovatEPAM Portal

## Overview

All data is persisted in a single SQLite file at `data/portal.db`. The schema is managed by `lib/db/schema.ts` and applied automatically on startup via `instrumentation.ts`.

---

## Tables

### `users`

Stores registered employees and the seeded Admin account.

| Column          | Type | Constraints                              |
|-----------------|------|------------------------------------------|
| `id`            | TEXT | PRIMARY KEY (UUID v4)                    |
| `email`         | TEXT | UNIQUE NOT NULL                          |
| `password_hash` | TEXT | NOT NULL (bcryptjs, cost factor 12)      |
| `role`          | TEXT | NOT NULL — CHECK IN (`submitter`, `admin`) |
| `created_at`    | TEXT | NOT NULL DEFAULT `datetime('now')`       |

**Notes:**
- All new self-registered users receive `role = 'submitter'`
- The Admin user is seeded from `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env vars on startup
- Passwords are never stored in plain text

---

### `ideas`

Stores innovation ideas submitted by Submitters.

| Column            | Type | Constraints |
|-------------------|------|-------------|
| `id`              | TEXT | PRIMARY KEY (UUID v4) |
| `title`           | TEXT | NOT NULL |
| `description`     | TEXT | NOT NULL |
| `category`        | TEXT | NOT NULL — CHECK IN (`Process Improvement`, `Technology`, `Customer Experience`, `Other`) |
| `status`          | TEXT | NOT NULL DEFAULT `submitted` — CHECK IN (`submitted`, `under_review`, `accepted`, `rejected`) |
| `attachment_path` | TEXT | NULLABLE — relative path e.g. `/uploads/<uuid>-filename.pdf` |
| `submitted_by`    | TEXT | NOT NULL — REFERENCES `users(id)` |
| `created_at`      | TEXT | NOT NULL DEFAULT `datetime('now')` |
| `updated_at`      | TEXT | NOT NULL DEFAULT `datetime('now')` |

**Notes:**
- Ideas are immutable after submission (title, description, category cannot be edited)
- `updated_at` is refreshed on every status change
- Attachments are stored on the local filesystem under `/uploads/` (git-ignored)

---

### `evaluation_comments`

Stores the one-shot comment an Admin leaves when accepting or rejecting an idea.

| Column         | Type | Constraints |
|----------------|------|-------------|
| `id`           | TEXT | PRIMARY KEY (UUID v4) |
| `idea_id`      | TEXT | UNIQUE NOT NULL — REFERENCES `ideas(id)` |
| `admin_id`     | TEXT | NOT NULL — REFERENCES `users(id)` |
| `comment_text` | TEXT | NOT NULL |
| `created_at`   | TEXT | NOT NULL DEFAULT `datetime('now')` |

**Notes:**
- `UNIQUE` on `idea_id` enforces the one-comment-per-idea rule at the DB level
- Comment is optional — Admin can accept/reject without providing one

---

### `sessions`

Stores active HTTP-only session tokens.

| Column       | Type | Constraints |
|--------------|------|-------------|
| `id`         | TEXT | PRIMARY KEY — the raw session token (UUID v4) |
| `user_id`    | TEXT | NOT NULL — REFERENCES `users(id)` |
| `expires_at` | TEXT | NOT NULL — ISO 8601 datetime string |

**Notes:**
- Sessions expire after 24 hours (`MAX_AGE = 86400`)
- Expired sessions are not automatically deleted; `deleteExpiredSessions()` can be called manually
- The session token is stored in an HTTP-only cookie named `session_token`

---

## Entity Relationships

```
users ──< ideas              (one user → many ideas)
ideas ──< evaluation_comments (one idea → at most one comment — UNIQUE constraint)
users ──< evaluation_comments (one admin → many comments)
users ──< sessions           (one user → many sessions)
```

---

## Status State Machine

```
submitted
    │
    ▼
under_review
    │
    ├──► accepted  (terminal)
    │
    └──► rejected  (terminal)
```

Legal transitions (enforced in `lib/db/dao/transitions.ts` and `PATCH /api/ideas/[id]/evaluate`):

| From          | To            | Allowed |
|---------------|---------------|---------|
| `submitted`   | `under_review`| ✅      |
| `under_review`| `accepted`    | ✅      |
| `under_review`| `rejected`    | ✅      |
| Any           | Any other     | ❌ 400  |

---

## File Uploads

Attached files are stored at `uploads/<uuid>-<sanitised-filename>.<ext>`.

**Allowed MIME types:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX)
- `image/png`
- `image/jpeg`

**Limits:** 10 MB maximum file size.
