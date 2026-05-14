# Phase 01 — Core Portal: Requirements

**Project:** InnovatEPAM Portal  
**Phase:** 01 — Core Portal  
**Status:** ✅ Completed  
**Last Updated:** 2026-05-14

---

## Overview

Phase 01 delivers the foundational capabilities of the InnovatEPAM Portal: secure authentication, role-based access control, idea submission with optional file attachments, idea listing with status tracking, and an admin evaluation workflow. All features are implemented as a full-stack Next.js 16 application backed by a SQLite database.

---

## Table of Contents

1. [US-01 — User Registration](#us-01--user-registration)
2. [US-02 — User Login](#us-02--user-login)
3. [US-03 — User Logout](#us-03--user-logout)
4. [US-04 — Role-Based Access Control](#us-04--role-based-access-control)
5. [US-05 — Idea Submission](#us-05--idea-submission)
6. [US-06 — File Attachment](#us-06--file-attachment)
7. [US-07 — Idea Listing](#us-07--idea-listing)
8. [US-08 — Status Tracking](#us-08--status-tracking)
9. [US-09 — Admin Evaluation Workflow](#us-09--admin-evaluation-workflow)

---

## US-01 — User Registration

**As a** new employee,  
**I want to** create an account using my email address and a password,  
**so that** I can access the InnovatEPAM Portal and submit my ideas.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-01.1 | The registration form collects `email` and `password` fields. |
| AC-01.2 | Email must be a valid format (RFC 5321). Duplicate emails are rejected with a `409 Conflict` response. |
| AC-01.3 | Password is hashed using `bcryptjs` before storage; plaintext passwords are never persisted. |
| AC-01.4 | On success the user record is inserted into the `users` table with `role = 'submitter'` and a UUID primary key. |
| AC-01.5 | On success the user is automatically logged in (session cookie created) and redirected to `/dashboard`. |
| AC-01.6 | Validation errors are returned as field-level messages; the form remains populated so the user can correct only the failing fields. |
| AC-01.7 | An already-authenticated user who visits `/register` is redirected to `/dashboard`. |

---

## US-02 — User Login

**As a** registered user,  
**I want to** sign in with my email and password,  
**so that** I can access my personalised dashboard and ideas.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-02.1 | The login form accepts `email` and `password`. |
| AC-02.2 | Credentials are validated server-side; a generic `401 Unauthorized` message is returned on failure (email and password errors are not distinguished to prevent user enumeration). |
| AC-02.3 | On success, a cryptographically random session token (UUID v4) is stored in the `sessions` table with a 24-hour expiry. |
| AC-02.4 | The session token is set as an `HttpOnly`, `SameSite=Lax` cookie; `Secure` flag is enabled in production. |
| AC-02.5 | An already-authenticated user who visits `/login` is redirected to `/dashboard`. |
| AC-02.6 | Expired sessions are treated as unauthenticated — the user is redirected to `/login`. |

---

## US-03 — User Logout

**As an** authenticated user,  
**I want to** log out of my session,  
**so that** my account is protected when I leave the device.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-03.1 | A logout action is accessible from the navigation bar. |
| AC-03.2 | On logout, the session record is deleted from the `sessions` table and the `session_token` cookie is cleared. |
| AC-03.3 | After logout the user is redirected to `/login`. |
| AC-03.4 | Attempting to access any protected route after logout redirects the user to `/login`. |

---

## US-04 — Role-Based Access Control

**As a** portal administrator,  
**I want** only users with the `admin` role to access admin pages,  
**so that** sensitive evaluation workflows are protected from regular submitters.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-04.1 | Two roles exist: `submitter` (default for self-registration) and `admin` (seeded at startup). |
| AC-04.2 | The protected layout (`/(protected)/layout.tsx`) redirects unauthenticated requests to `/login`. |
| AC-04.3 | The admin layout (`/admin/layout.tsx`) returns a `403 Forbidden` page for authenticated non-admin users. |
| AC-04.4 | API routes under `/api/ideas/[id]/evaluate` enforce `role === 'admin'` server-side and return `403` otherwise. |
| AC-04.5 | Role is stored as a `CHECK` constraint in the database (`submitter` \| `admin`); no other values are accepted. |

---

## US-05 — Idea Submission

**As a** submitter,  
**I want to** fill in and submit an innovation idea through a form,  
**so that** my idea is recorded and can be reviewed by admins.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-05.1 | The submission form includes: `title` (text), `description` (textarea), and `category` (select). |
| AC-05.2 | Allowed categories: `Process Improvement`, `Technology`, `Customer Experience`, `Other`. |
| AC-05.3 | All three fields are required; missing fields return field-level validation errors with `400 Bad Request`. |
| AC-05.4 | On success, a new record is created in the `ideas` table with `status = 'submitted'` and the `submitted_by` field set to the authenticated user's ID. |
| AC-05.5 | The user is redirected to their dashboard after a successful submission. |
| AC-05.6 | Unauthenticated requests to `POST /api/ideas` return `401 Unauthorized`. |

---

## US-06 — File Attachment

**As a** submitter,  
**I want to** optionally attach a supporting document to my idea,  
**so that** I can provide additional context such as a presentation or specification.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-06.1 | The submission form includes an optional file input field (`attachment`). |
| AC-06.2 | Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `application/vnd.openxmlformats-officedocument.presentationml.presentation` (PPTX), `image/png`, `image/jpeg`. |
| AC-06.3 | Maximum file size is **10 MB**; files exceeding this limit are rejected with a descriptive error. |
| AC-06.4 | Files are saved to the server-side `/uploads/` directory with a UUID-prefixed, sanitised filename to prevent path traversal attacks. |
| AC-06.5 | The saved file path is stored in `ideas.attachment_path`; ideas without an attachment store `NULL`. |
| AC-06.6 | Uploaded files are served via `GET /api/uploads/[...path]`; only authenticated users can access them. |

---

## US-07 — Idea Listing

**As a** submitter,  
**I want to** see a list of the ideas I have submitted,  
**so that** I can track their progress at a glance.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-07.1 | The `/dashboard` page displays only ideas belonging to the authenticated user (`submitted_by = user.id`). |
| AC-07.2 | Ideas are sorted by `created_at DESC` (newest first). |
| AC-07.3 | Each idea card displays: title, category, current status badge, and submission date. |
| AC-07.4 | Clicking an idea navigates to `/ideas/[id]` where full details are shown. |
| AC-07.5 | The admin dashboard at `/admin/dashboard` lists **all** ideas across all users, including submitter email. |
| AC-07.6 | An empty state is shown when no ideas exist. |

---

## US-08 — Status Tracking

**As a** submitter,  
**I want to** see the current status of each of my ideas,  
**so that** I know whether my idea is pending, under review, accepted, or rejected.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-08.1 | Each idea has one of four statuses: `submitted`, `under_review`, `accepted`, `rejected`. |
| AC-08.2 | Status is displayed as a colour-coded badge on both the listing and detail pages. |
| AC-08.3 | Status transitions are strictly enforced: `submitted → under_review → accepted` or `submitted → under_review → rejected`. No other transitions are permitted. |
| AC-08.4 | Illegal transition attempts return `400 Bad Request` with a descriptive error message. |
| AC-08.5 | `updated_at` is updated in the database on every status change. |

---

## US-09 — Admin Evaluation Workflow

**As an** admin,  
**I want to** review submitted ideas and change their status with an optional comment,  
**so that** submitters receive structured feedback on their proposals.

### Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-09.1 | The admin idea detail page (`/admin/ideas/[id]`) includes an evaluation panel with a status selector and optional comment textarea. |
| AC-09.2 | The status selector only presents valid next statuses based on the current state (enforced by the legal transitions table). |
| AC-09.3 | Submitting the evaluation panel calls `PATCH /api/ideas/[id]/evaluate` with `{ status, comment }`. |
| AC-09.4 | A comment is stored in `evaluation_comments` only when the new status is `accepted` or `rejected`. |
| AC-09.5 | Each idea can have at most one evaluation comment (enforced by `UNIQUE` constraint on `evaluation_comments.idea_id`). |
| AC-09.6 | The endpoint enforces authentication (`401`) and admin role (`403`) before processing any changes. |
| AC-09.7 | On success the UI reflects the new status immediately without a full page reload. |

---

## Data Model Summary

```
users
  id            TEXT PK (UUID)
  email         TEXT UNIQUE NOT NULL
  password_hash TEXT NOT NULL
  role          TEXT CHECK('submitter'|'admin')
  created_at    TEXT

ideas
  id              TEXT PK (UUID)
  title           TEXT NOT NULL
  description     TEXT NOT NULL
  category        TEXT CHECK(allowed categories)
  status          TEXT CHECK('submitted'|'under_review'|'accepted'|'rejected')
  attachment_path TEXT NULL
  submitted_by    TEXT FK → users.id
  created_at      TEXT
  updated_at      TEXT

evaluation_comments
  id           TEXT PK (UUID)
  idea_id      TEXT UNIQUE FK → ideas.id
  admin_id     TEXT FK → users.id
  comment_text TEXT NOT NULL
  created_at   TEXT

sessions
  id         TEXT PK (UUID v4 — session token)
  user_id    TEXT FK → users.id
  expires_at TEXT (24 h TTL)
```

---

## Status Transition Diagram

```
submitted ──→ under_review ──→ accepted
                          └──→ rejected
```

All other transitions are rejected at both the API layer and the database DAO layer.

---

## Non-Functional Requirements

| Requirement | Implementation |
|-------------|---------------|
| Password security | `bcryptjs` hashing; never stored or logged in plaintext |
| Session security | `HttpOnly` + `SameSite=Lax` cookie; `Secure` in production |
| File upload security | MIME-type allowlist, 10 MB cap, UUID-prefixed sanitised filenames |
| Access control | Server-side enforcement on every API route and page layout |
| Input validation | Server-side validation on all API routes; field-level error responses |
