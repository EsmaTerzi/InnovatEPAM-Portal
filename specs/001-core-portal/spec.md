# Feature Specification: InnovatEPAM Portal — Phase 1 MVP

**Feature Branch**: `001-phase1-mvp`

**Created**: 2026-05-13

**Status**: Clarified

**Input**: User description: "InnovatEPAM Portal is a comprehensive digital platform designed to streamline the innovation process within EPAM, enabling employees to submit creative ideas, facilitating expert evaluation, and managing the implementation of top-tier innovations with dedicated budget allocation. Phase 1 MVP: User Management, Idea Submission, Evaluation Workflow."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Employee Registration & Login (Priority: P1)

An EPAM employee visits the portal for the first time, creates an account using their email and a password, then logs in to access their personal dashboard.

**Why this priority**: Authentication is the foundation gate — all other features require an authenticated session. Without this, nothing else is accessible.

**Independent Test**: Can be fully tested by registering a new account, logging in, viewing the dashboard, and logging out — delivering a working auth flow with no other features needed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the registration page, **When** they submit a valid email and password, **Then** a new Submitter account is created and they are redirected to their dashboard.
2. **Given** an existing account, **When** the user submits correct credentials on the login page, **Then** they are authenticated and redirected to their dashboard.
3. **Given** a logged-in user, **When** they click Logout, **Then** their session is terminated and they are redirected to the login page.
4. **Given** an unauthenticated user attempting to access `/dashboard`, **When** the page loads, **Then** they are redirected to the login page.
5. **Given** registration form, **When** submitted with an already-registered email, **Then** an error message "Email already in use" is shown and no new account is created.
6. **Given** login form, **When** submitted with incorrect credentials, **Then** a generic error "Invalid email or password" is shown (no hint about which field is wrong).

---

### User Story 2 — Idea Submission (Priority: P2)

An authenticated Submitter fills in the idea submission form (title, description, category, optional file attachment) and submits their innovation idea.

**Why this priority**: Core value proposition of the platform. Depends only on Story 1 (auth).

**Independent Test**: Can be fully tested by a logged-in Submitter submitting an idea with all fields and confirming it appears in their "My Ideas" list with status `Submitted`.

**Acceptance Scenarios**:

1. **Given** a logged-in Submitter on the submission form, **When** they fill in title, description, category and submit, **Then** the idea is saved with status `Submitted` and the user sees a success confirmation.
2. **Given** the submission form, **When** submitted with a missing required field (title or description), **Then** inline validation errors are shown and the idea is not saved.
3. **Given** the submission form, **When** a file is attached (any allowed type, under size limit), **Then** the file is saved to the local filesystem and its path is recorded in the database.
4. **Given** a logged-in Submitter, **When** they visit "My Ideas", **Then** they see a list of all ideas they have submitted with their current statuses.
5. **Given** a logged-in Submitter, **When** they attempt to access another user's idea detail page, **Then** they receive a 403 Forbidden response.

---

### User Story 3 — Admin Evaluation Workflow (Priority: P3)

An Admin reviews submitted ideas, moves them through the status pipeline (`Submitted → Under Review → Accepted / Rejected`), and adds evaluation comments.

**Why this priority**: Completes the end-to-end loop, but requires Stories 1 and 2 to be meaningful. Lowest priority because it depends on data from Story 2.

**Independent Test**: Can be fully tested by seeding an idea in `Submitted` status, logging in as the seed Admin, changing the status, adding a comment, and verifying the change persists.

**Acceptance Scenarios**:

1. **Given** a logged-in Admin on the Admin dashboard, **When** they view the idea list, **Then** they see all submitted ideas from all users with their current statuses.
2. **Given** a logged-in Admin viewing an idea in `Submitted` status, **When** they click "Move to Under Review", **Then** the idea status changes to `Under Review`.
3. **Given** a logged-in Admin viewing an idea in `Under Review` status, **When** they click "Accept" and optionally add a comment, **Then** the idea status changes to `Accepted` and the comment is persisted.
4. **Given** a logged-in Admin viewing an idea in `Under Review` status, **When** they click "Reject" and optionally add a comment, **Then** the idea status changes to `Rejected` and the comment is persisted.
5. **Given** a logged-in Submitter viewing their own accepted/rejected idea, **When** the Admin has added a comment, **Then** the Submitter can see the comment on the idea detail page.
6. **Given** a logged-in Submitter on any page, **When** they attempt to access the Admin dashboard URL, **Then** they receive a 403 Forbidden response.

---

### Edge Cases

- What happens when a file attachment exceeds the allowed size limit? → Inline validation error, upload rejected, idea not saved.
- What happens when an uploaded file has a disallowed MIME type? → Validation error shown, file rejected.
- What happens when the SQLite database file is locked during a concurrent write? → `better-sqlite3` is synchronous; Next.js API routes must ensure serial DB access.
- What happens when the Admin seed account credentials are missing from the environment? → Application startup must fail with a clear error message.
- What happens when a user's session expires mid-navigation? → Redirect to login page with a "Session expired" message.
- What happens when an idea is in `Accepted` or `Rejected` status and the Admin tries to change it again? → Terminal statuses are locked; the status change controls are hidden/disabled.
- What happens when a Submitter tries to edit or delete a submitted idea? → Ideas are immutable once submitted; no edit or delete controls are exposed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any visitor to register a new account with a unique email address and a password.
- **FR-002**: System MUST hash passwords using a secure one-way algorithm (bcrypt) before storing them in SQLite.
- **FR-003**: System MUST authenticate users via email and password and establish a server-side session.
- **FR-004**: System MUST enforce role-based access: `Submitter` role for regular employees, `Admin` role for evaluators.
- **FR-005**: System MUST seed one Admin account via a database seed script; the seed credentials must be configurable via environment variables.
- **FR-006**: System MUST allow authenticated Submitters to submit ideas with: title (required), description (required), category (required, one of: Process Improvement | Technology | Customer Experience | Other), and one optional file attachment.
- **FR-006a**: Ideas are immutable once submitted — no edit or delete operations are permitted for Submitters.
- **FR-007**: System MUST save file attachments to the local filesystem and store only the file path in SQLite.
- **FR-008**: System MUST validate file attachments for allowed MIME types and a maximum file size limit.
- **FR-009**: System MUST assign all newly submitted ideas the status `Submitted`.
- **FR-010**: System MUST allow Submitters to view only their own submitted ideas.
- **FR-011**: System MUST allow Admins to view all ideas from all users.
- **FR-012**: System MUST allow Admins to transition idea status: `Submitted → Under Review`, `Under Review → Accepted`, `Under Review → Rejected`.
- **FR-013**: System MUST treat `Accepted` and `Rejected` as terminal statuses — no further transitions are permitted.
- **FR-014**: System MUST allow Admins to add an optional text comment when accepting or rejecting an idea. Comments are NOT permitted when transitioning to `Under Review`.
- **FR-014a**: Exactly one comment is permitted per evaluation action (Accept or Reject) — comments cannot be added retroactively or appended after the action is taken.
- **FR-015**: System MUST display Admin evaluation comments to the idea's original Submitter on the idea detail page.
- **FR-016**: System MUST NOT send any notifications (email or in-app) in Phase 1.
- **FR-017**: System MUST protect all authenticated routes; unauthenticated requests must be redirected to login.
- **FR-018**: System MUST protect Admin-only routes; Submitter access must return 403.

### Key Entities

- **User**: Represents an EPAM employee. Attributes: `id`, `email` (unique), `password_hash`, `role` (`submitter` | `admin`), `created_at`.
- **Idea**: Represents a submitted innovation idea. Attributes: `id`, `title`, `description`, `category`, `status` (`submitted` | `under_review` | `accepted` | `rejected`), `attachment_path` (nullable), `submitted_by` (FK → User), `created_at`, `updated_at`.
- **EvaluationComment**: Represents an Admin's optional comment on an Accept or Reject action. At most one record per idea (one-shot). Attributes: `id`, `idea_id` (FK → Idea, unique), `admin_id` (FK → User), `comment_text`, `created_at`.
- **Session**: Server-side session record. TTL is 24 hours from creation. Attributes: `id` (token), `user_id` (FK → User), `expires_at`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new employee can register, log in, submit an idea with a file attachment, and view it in their idea list — all within a single uninterrupted flow.
- **SC-002**: An Admin can log in, view all submitted ideas, evaluate one from `Submitted` to `Accepted` with a comment, and the change is immediately visible to the Submitter.
- **SC-003**: All Functional Requirements (FR-001 through FR-018) have corresponding passing tests before implementation is considered complete.
- **SC-004**: No unauthenticated or unauthorised request can access protected data — verified by dedicated security tests.
- **SC-005**: The entire Phase 1 MVP runs on a single Next.js application with SQLite — no external services required to run locally.

---

## Assumptions

- Users access the portal via a modern web browser on desktop or mobile; no native app is in scope.
- A single Next.js application serves both frontend and backend (API routes) — no separate backend service.
- File attachments are stored in a local `uploads/` directory at the project root; this directory is excluded from version control.
- Allowed file attachment types are: `.pdf`, `.docx`, `.pptx`, `.png`, `.jpg`, `.jpeg` with a maximum size of **10 MB** — if these defaults need changing, they should be revisited before implementation.
- Session management uses HTTP-only cookies with server-side session records in SQLite; JWT is out of scope. Sessions expire after **24 hours**.
- The seed Admin account credentials (email + password) are defined in environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- Idea categories are a fixed, confirmed list: **Process Improvement**, **Technology**, **Customer Experience**, **Other** — a dynamic category management UI is out of scope for Phase 1.
- Ideas are immutable once submitted — no edit or delete is available to Submitters or Admins.
- An Admin may leave at most one optional comment per idea, and only at the point of Accept or Reject. No comments on `Under Review` transitions.
- Password minimum requirements: at least 8 characters — stricter rules are a post-Phase-1 concern.
- There is no email verification step on registration in Phase 1.
