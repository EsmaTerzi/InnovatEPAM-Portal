# Tasks: InnovatEPAM Portal — Phase 1 MVP

**Input**: `.specify/memory/phase1-mvp.plan.md`, `.specify/memory/phase1-mvp.spec.md`

**No tests** — Phase 1 TDD exemption ratified in constitution v1.2.0

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US1/US2/US3]**: User story this task belongs to

---

## Phase 0: Project Bootstrap

**Purpose**: Runnable Next.js app with all tooling, SQLite connected, and Admin seed in place. Nothing else can start until this phase is complete.

**⚠️ BLOCKS ALL USER STORIES**

- [x] T001 Initialise Next.js project with TypeScript, App Router, Tailwind CSS v4 in `InnovatEPAM_Portal/` (`npx create-next-app`)
- [x] T002 Configure `tailwind.config.ts` with `@theme` block — define brand, neutral, and status color tokens (`submitted`, `under_review`, `accepted`, `rejected`)
- [x] T003 Install and configure `shadcn/ui` — run init, set `components.json`, install base components: Button, Input, Form, Select, Textarea, Badge, Card, Table, Dialog, Sheet, Skeleton
- [x] T004 [P] Install `better-sqlite3` + `@types/better-sqlite3`
- [x] T005 [P] Install `bcryptjs` + `@types/bcryptjs`
- [x] T006 [P] Install `uuid` + `@types/uuid`
- [x] T007 Create `lib/db/client.ts` — singleton `better-sqlite3` connection; enable WAL mode; export typed `db` instance
- [x] T008 Create `lib/db/schema.ts` — `CREATE TABLE IF NOT EXISTS` for all four tables (`users`, `ideas`, `evaluation_comments`, `sessions`) per the data model in plan.md; export `runMigrations()`
- [x] T009 Wire `runMigrations()` into Next.js startup via `instrumentation.ts` (Next.js instrumentation hook)
- [x] T010 Create `lib/db/seed.ts` — check for existing Admin row; if absent, read `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` from env; hash password; insert Admin user; throw with clear message if env vars are missing
- [x] T011 Create `.env.example` with all required env var keys documented: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`; add `.env.local` and `data/` and `uploads/` to `.gitignore`
- [x] T012 Create `lib/utils/format-date.ts` — `formatDate(isoString: string): string` using `Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`

**Checkpoint**: `npm run dev` starts without errors, `data/portal.db` is created, Admin seed row is present, Tailwind `@theme` tokens resolve in browser.

---

## Phase 1: User Story 1 — Employee Registration & Login (Priority: P1) 🎯 MVP

**Goal**: Any visitor can register, log in, and log out. All routes are protected. Role enforcement is in place.

**Independent Test**: Register → login → see dashboard → logout → redirected to login.

### Data Access Layer

- [ ] T013 [P] [US1] Create `lib/db/dao/users.ts` — `createUser(email, passwordHash, role)`, `findUserByEmail(email)`, `findUserById(id)`; parameterised statements only
- [ ] T014 [P] [US1] Create `lib/db/dao/sessions.ts` — `createSession(userId, expiresAt)`, `findSession(token)`, `deleteSession(token)`, `deleteExpiredSessions()`; parameterised statements only

### Auth Utilities

- [ ] T015 [P] [US1] Create `lib/auth/password.ts` — `hashPassword(plain: string): Promise<string>` and `verifyPassword(plain: string, hash: string): Promise<boolean>` using `bcryptjs` (cost factor 12)
- [ ] T016 [P] [US1] Create `lib/auth/session.ts` — `createSessionCookie(token)`, `clearSessionCookie()`, `getSessionUser(request): Promise<User | null>`; HTTP-only cookie, `Secure` in production, `maxAge` 86400 (24 h)

### API Routes

- [ ] T017 [US1] Create `app/api/auth/register/route.ts` — validate email format + password ≥8 chars; call `findUserByEmail` and return 409 if taken; `hashPassword`; `createUser` with role `submitter`; `createSession`; set cookie; return 201
- [ ] T018 [US1] Create `app/api/auth/login/route.ts` — `findUserByEmail`; `verifyPassword`; create session; set cookie; return 200; return generic 401 on any failure (no field hints)
- [ ] T019 [US1] Create `app/api/auth/logout/route.ts` — `deleteSession` from cookie token; `clearSessionCookie`; return 200
- [ ] T020 [US1] Create `app/api/me/route.ts` — `getSessionUser`; return `{ id, email, role }` or 401

### Route Protection

- [ ] T021 [US1] Create `middleware.ts` — protect all `/(protected)/*` paths: redirect unauthenticated to `/login`; block Submitter role on `/admin/*` paths with 403 response

### UI Components

- [ ] T022 [P] [US1] Create `components/auth/RegisterForm.tsx` — shadcn Form + Input (email, password) + Button; client-side: required + email format + password ≥8 chars; POST `/api/auth/register`; show server errors inline; redirect to `/dashboard` on success
- [ ] T023 [P] [US1] Create `components/auth/LoginForm.tsx` — same pattern; POST `/api/auth/login`; show generic error on 401; redirect to `/dashboard` on success

### Pages & Layouts

- [ ] T024 [P] [US1] Create `app/(auth)/register/page.tsx` — render RegisterForm; redirect authenticated users to `/dashboard`
- [ ] T025 [P] [US1] Create `app/(auth)/login/page.tsx` — render LoginForm; redirect authenticated users to `/dashboard`
- [ ] T026 [US1] Create `app/(protected)/layout.tsx` — server component; call `getSessionUser`; pass user via React context or props to children; render shared nav

**Checkpoint**: Register → login → `/dashboard` (empty) → logout → `/login`. Accessing `/dashboard` unauthenticated redirects. Accessing `/admin/*` as Submitter returns 403.

---

## Phase 2: User Story 2 — Idea Submission (Priority: P2)

**Goal**: Authenticated Submitters can submit ideas with optional file attachments and view their own ideas.

**Independent Test**: Login → submit idea with file → see idea in "My Ideas" with status `Submitted`.

### File Upload

- [ ] T027 [US2] Create `lib/uploads/handler.ts` — `validateAndSaveFile(file: File): Promise<string>`: check MIME type against allowlist (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `image/png`, `image/jpeg`); enforce 10 MB limit; write to `/uploads/<uuid>-<sanitised-originalname>`; return relative path; throw descriptive error on validation failure

### Data Access Layer

- [ ] T028 [US2] Create `lib/db/dao/ideas.ts` — `createIdea(data)`, `findIdeasByUser(userId)`, `findIdeaById(id)`; parameterised statements only

### API Routes

- [ ] T029 [US2] Create `app/api/ideas/route.ts` (POST) — authenticate via `getSessionUser`; parse `multipart/form-data`; validate title + description + category (must be in the four allowed values); call `validateAndSaveFile` if file present; `createIdea` with status `submitted`; return 201 with `{ id }`
- [ ] T030 [US2] Create `app/api/ideas/[id]/route.ts` (GET) — authenticate; `findIdeaById`; if user role is `submitter`, enforce `idea.submitted_by === user.id` (return 403 otherwise); also fetch comment via `findCommentByIdeaId`; return idea + comment

### UI Components

- [ ] T031 [P] [US2] Create `components/ideas/StatusBadge.tsx` — shadcn Badge; map status string to `@theme` color variant: `submitted`→brand-blue, `under_review`→amber, `accepted`→green, `rejected`→red; display human-readable label
- [ ] T032 [P] [US2] Create `components/ideas/IdeaCard.tsx` — title, category, StatusBadge, `formatDate(created_at)`; wrapped in a link to `/ideas/[id]`
- [ ] T033 [P] [US2] Create `components/ideas/IdeaList.tsx` — renders array of IdeaCards; empty state: "No ideas submitted yet. Submit your first idea."
- [ ] T034 [US2] Create `components/ideas/IdeaSubmitForm.tsx` — shadcn Form; fields: title (Input, required), description (Textarea, required), category (Select with options: Process Improvement / Technology / Customer Experience / Other, required), attachment (file Input, optional, accept + size hint displayed); POST to `/api/ideas` as `multipart/form-data`; show inline validation errors; on success redirect to `/dashboard`
- [ ] T035 [US2] Create `components/ideas/IdeaDetail.tsx` — read-only view: title, category, StatusBadge, description, formatted dates, attachment download link (if present), evaluation comment block (if present)

### Pages

- [ ] T036 [US2] Create `app/(protected)/dashboard/page.tsx` — server component; fetch current user via `getSessionUser`; fetch `/api/ideas?user=me` (or direct DAO call); render IdeaList + "Submit New Idea" Button linking to `/ideas/new`
- [ ] T037 [US2] Create `app/(protected)/ideas/new/page.tsx` — render IdeaSubmitForm
- [ ] T038 [US2] Create `app/(protected)/ideas/[id]/page.tsx` — server component; fetch idea + comment; enforce ownership (redirect 403 if Submitter accessing another's idea); render IdeaDetail

**Checkpoint**: Login → submit idea (with and without file) → "My Ideas" shows correct list with StatusBadge → idea detail page renders. Accessing another user's idea URL returns 403.

---

## Phase 3: User Story 3 — Admin Evaluation Workflow (Priority: P3)

**Goal**: Admin can view all ideas, advance status through the pipeline, and leave one-shot comments on Accept/Reject.

**Independent Test**: Login as Admin → view all ideas → move one to Under Review → Accept with comment → Submitter sees comment on idea detail.

### Data Access Layer

- [ ] T039 [P] [US3] Extend `lib/db/dao/ideas.ts` — add `findAllIdeas()` (all users, ordered by `created_at` desc) and `updateIdeaStatus(id, status)` (also updates `updated_at`)
- [ ] T040 [P] [US3] Create `lib/db/dao/comments.ts` — `createComment(ideaId, adminId, commentText)`, `findCommentByIdeaId(ideaId)`

### Status Transition Validation

- [ ] T041 [US3] Create `lib/db/dao/transitions.ts` — `isLegalTransition(from: Status, to: Status): boolean` implementing the state machine: `submitted→under_review` ✅, `under_review→accepted` ✅, `under_review→rejected` ✅, all others ❌

### API Route

- [ ] T042 [US3] Create `app/api/ideas/[id]/evaluate/route.ts` (PATCH) — authenticate + assert `user.role === 'admin'` (return 403 otherwise); parse `{ status, comment? }`; `isLegalTransition(current, new)` — return 400 with message if illegal; `updateIdeaStatus`; if status is `accepted` or `rejected` and comment provided, `createComment` (DB UNIQUE constraint on `idea_id` enforces one-shot); return 200

### Admin Route Guard

- [ ] T043 [US3] Create `app/(protected)/admin/layout.tsx` — server component; assert `user.role === 'admin'`; render custom 403 component for Submitters

### UI Components

- [ ] T044 [US3] Create `components/admin/AdminIdeaTable.tsx` — shadcn Table; columns: Title (link to admin idea detail), Submitter email, Category, Status (StatusBadge), Submitted date (`formatDate`); sortable by status
- [ ] T045 [US3] Create `components/admin/EvaluatePanel.tsx` — shows current StatusBadge; renders only legal transition buttons based on current status: `submitted` → "Move to Under Review" button; `under_review` → "Accept" + "Reject" buttons each with optional Textarea for comment; terminal statuses (`accepted`/`rejected`) show locked state with no controls; on action → PATCH `/api/ideas/[id]/evaluate`; show success confirmation

### Pages

- [ ] T046 [US3] Create `app/(protected)/admin/dashboard/page.tsx` — server component; fetch all ideas via `findAllIdeas`; render AdminIdeaTable
- [ ] T047 [US3] Create `app/(protected)/admin/ideas/[id]/page.tsx` — server component; fetch idea + comment; render IdeaDetail (read-only) + EvaluatePanel side-by-side

**Checkpoint**: Admin can progress any idea through all legal transitions. Submitter's idea detail page shows evaluation comment. Illegal transitions (e.g. Submitted → Accepted directly) are rejected with 400. Submitter cannot reach `/admin/*`.

---

## Phase 4: Polish & Hardening

**Purpose**: Production-ready shell, error/loading states, env validation, documentation.

- [ ] T048 Create global responsive nav bar — logo, logged-in user email, Logout button; mobile: shadcn Sheet for hamburger menu; added to `app/(protected)/layout.tsx`
- [ ] T049 [P] Create `app/not-found.tsx` — branded 404 page with "Go to Dashboard" link
- [ ] T050 [P] Create shared 403 component `components/errors/Forbidden.tsx` — used in admin layout and API responses
- [ ] T051 [P] Add loading skeletons (shadcn Skeleton) to `dashboard/page.tsx` and `admin/dashboard/page.tsx` for async data states
- [ ] T052 Add error boundary handling to idea submission and evaluation API calls — display inline error toasts/messages, no full-page crashes
- [ ] T053 Add startup env validation to `instrumentation.ts` — assert `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are non-empty strings; throw with actionable message if missing
- [ ] T054 Add `uploads/`, `data/portal.db`, `.env.local` to `.gitignore` (verify not already tracked)
- [ ] T055 Write `README.md` — quickstart: prerequisites, `npm install`, copy `.env.example` to `.env.local`, `npm run dev`, open browser, seed Admin credentials

---

## Dependencies & Execution Order

```
Phase 0 (Bootstrap)
    └─► Phase 1 (US1 — Auth)          ← BLOCKS all below
            └─► Phase 2 (US2 — Submission)   ← depends on Phase 1
            └─► Phase 3 (US3 — Evaluation)   ← depends on Phase 1 + Phase 2 (needs idea data)
                    └─► Phase 4 (Polish)
```

### Parallel Opportunities Within Phases

- **Phase 0**: T004–T006 can run in parallel (dependency installs)
- **Phase 1**: T013–T016 (DAO + auth utils) can run in parallel; T022–T023 (form components) can run in parallel with T013–T016; T024–T025 (pages) can run in parallel
- **Phase 2**: T031–T033 (display components) can run in parallel with T027–T028 (upload + DAO); T034–T035 depend on T031
- **Phase 3**: T039–T040 (DAO extensions) can run in parallel; T044–T045 (UI components) can run in parallel after T041
- **Phase 4**: T049–T051 can run in parallel

---

**Total tasks**: 55 | **Version**: 1.0.0 | **Created**: 2026-05-13 | **Plan**: `phase1-mvp.plan.md`
