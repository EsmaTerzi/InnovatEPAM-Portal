# Implementation Plan: InnovatEPAM Portal — Phase 1 MVP

**Branch**: `001-phase1-mvp` | **Date**: 2026-05-13 | **Spec**: `.specify/memory/phase1-mvp.spec.md`

---

## Summary

Build a full-stack Next.js (App Router) web portal that lets EPAM employees register, log in, submit innovation ideas with optional file attachments, and allows a seeded Admin to evaluate those ideas through a status pipeline (`Submitted → Under Review → Accepted / Rejected`) with optional comments. Data is persisted in SQLite via `better-sqlite3`. UI is built with shadcn/ui components customised through Tailwind CSS `@theme` tokens. No test suite in Phase 1 (constitution v1.2.0 — Phase 1 exemption).

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, no `any`

**Primary Dependencies**:
- `next` (App Router, latest stable)
- `react`, `react-dom`
- `tailwindcss` v4 with `@theme` CSS variable tokens
- `shadcn/ui` (component primitives — Button, Input, Form, Select, Dialog, Badge, Card, Table)
- `better-sqlite3` + `@types/better-sqlite3`
- `bcryptjs` + `@types/bcryptjs` (password hashing — pure JS, no native build)
- `uuid` (session token generation — trivial but collision-safety justifies it)

**Date Formatting**: Native `Intl.DateTimeFormat` — no `date-fns` (constitution Principle III)

**Storage**: SQLite (single `.db` file, server-side only) + local filesystem for file uploads (`/uploads/`)

**Testing**: None in Phase 1 (constitution v1.2.0 amendment — time-boxed Phase 1 exemption)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge), desktop + mobile responsive

**Project Type**: Full-stack web application (Next.js monolith — one repo, one deployment)

**Performance Goals**: No explicit SLA for Phase 1 MVP; synchronous SQLite is acceptable at MVP scale

**Constraints**: Single Next.js process; `better-sqlite3` is synchronous — API routes must not parallelise DB writes; SQLite file and `/uploads/` excluded from version control

**Scale/Scope**: Single-tenant MVP; expected handful of concurrent users in pilot

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Clean Code | ✅ | Single responsibility enforced per module; no `any` |
| II. Simple & Responsive UI/UX | ✅ | shadcn/ui + Tailwind `@theme`; fully responsive layouts |
| III. Minimal Dependencies | ✅ | `date-fns` rejected; `bcryptjs` and `uuid` justified |
| IV. TDD | ⚠️ Exempt | Phase 1 exemption ratified in constitution v1.2.0 |
| V. SQLite Persistence | ✅ | `better-sqlite3`, parameterised queries, data-access modules only |

---

## Project Structure

```text
InnovatEPAM_Portal/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx                # Auth guard — redirects unauthenticated users
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Submitter: My Ideas list
│   │   ├── ideas/
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Idea submission form
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Idea detail (Submitter view)
│   │   └── admin/
│   │       ├── layout.tsx            # Admin role guard — returns 403 for Submitters
│   │       ├── dashboard/
│   │       │   └── page.tsx          # Admin: all ideas list
│   │       └── ideas/
│   │           └── [id]/
│   │               └── page.tsx      # Admin: evaluate idea
│   └── api/
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.ts
│       │   ├── login/
│       │   │   └── route.ts
│       │   └── logout/
│       │       └── route.ts
│       ├── ideas/
│       │   ├── route.ts              # POST /api/ideas (submit idea + file)
│       │   └── [id]/
│       │       ├── route.ts          # GET /api/ideas/[id]
│       │       └── evaluate/
│       │           └── route.ts     # PATCH /api/ideas/[id]/evaluate (Admin only)
│       └── me/
│           └── route.ts             # GET /api/me (current session user)
│
├── components/
│   ├── ui/                          # shadcn/ui generated primitives (do not edit manually)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── ideas/
│   │   ├── IdeaCard.tsx
│   │   ├── IdeaList.tsx
│   │   ├── IdeaSubmitForm.tsx
│   │   ├── IdeaDetail.tsx
│   │   └── StatusBadge.tsx
│   └── admin/
│       ├── AdminIdeaTable.tsx
│       └── EvaluatePanel.tsx
│
├── lib/
│   ├── db/
│   │   ├── client.ts                # Singleton better-sqlite3 connection
│   │   ├── schema.ts                # CREATE TABLE statements + migration runner
│   │   ├── seed.ts                  # Admin seed script (reads env vars)
│   │   └── dao/
│   │       ├── users.ts             # Data access: User entity
│   │       ├── ideas.ts             # Data access: Idea entity
│   │       ├── comments.ts          # Data access: EvaluationComment entity
│   │       └── sessions.ts          # Data access: Session entity
│   ├── auth/
│   │   ├── session.ts               # Cookie read/write, session validation
│   │   └── password.ts              # bcryptjs hash + compare wrappers
│   ├── uploads/
│   │   └── handler.ts               # File validation (MIME + size) + save to /uploads/
│   └── utils/
│       └── format-date.ts           # Intl.DateTimeFormat wrapper (no date-fns)
│
├── middleware.ts                    # Route protection: redirects + 403 enforcement
│
├── public/
├── uploads/                         # Runtime file storage — git-ignored
├── data/
│   └── portal.db                   # SQLite database file — git-ignored
│
├── .env.local                       # SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, etc — git-ignored
├── .env.example                     # Template with all required env var keys (committed)
├── tailwind.config.ts
├── components.json                  # shadcn/ui config
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Phases

### Phase 0 — Project Bootstrap

**Goal**: Runnable Next.js app with Tailwind `@theme`, shadcn/ui installed, SQLite connected, and seed Admin created.

**Steps**:

1. Initialise Next.js project with TypeScript, App Router, Tailwind CSS v4
2. Configure `tailwind.config.ts` with `@theme` block for all color tokens (brand, neutral, status colors)
3. Install and configure `shadcn/ui` (`components.json`, base components)
4. Install `better-sqlite3`, `bcryptjs`, `uuid` and their type packages
5. Create `lib/db/client.ts` — singleton DB connection with WAL mode enabled
6. Create `lib/db/schema.ts` — define all four tables with `CREATE TABLE IF NOT EXISTS`; run on app startup via `next.config.ts` instrumentation
7. Create `lib/db/seed.ts` — check for existing Admin, create from `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env vars; fail loudly if vars are missing
8. Create `.env.example` with all required keys documented
9. Verify: `npm run dev` starts without errors, DB file created, Admin seed row present

---

### Phase 1 — Authentication (FR-001 to FR-005, FR-017)

**Goal**: Registration, login, logout, session management, and route protection working end-to-end.

**Steps**:

1. **`lib/auth/password.ts`** — `hashPassword(plain)` and `verifyPassword(plain, hash)` using `bcryptjs` (cost factor 12)
2. **`lib/db/dao/users.ts`** — `createUser`, `findUserByEmail`, `findUserById`
3. **`lib/db/dao/sessions.ts`** — `createSession`, `findSession`, `deleteSession`, `deleteExpiredSessions`
4. **`lib/auth/session.ts`** — read/write HTTP-only `session_token` cookie (24h `maxAge`); `getSessionUser(request)` helper
5. **`app/api/auth/register/route.ts`** — validate email format + password ≥8 chars; check uniqueness; hash password; create user + session; set cookie; return 201
6. **`app/api/auth/login/route.ts`** — find user by email; `verifyPassword`; create session; set cookie; return 200
7. **`app/api/auth/logout/route.ts`** — delete session from DB; clear cookie; return 200
8. **`middleware.ts`** — intercept all `/(protected)/*` routes; redirect unauthenticated to `/login`; redirect Submitters hitting `/admin/*` with 403
9. **`components/auth/RegisterForm.tsx`** — shadcn Form + Input + Button; client-side validation before submit; show server error inline
10. **`components/auth/LoginForm.tsx`** — same pattern
11. **`app/(auth)/register/page.tsx`** and **`app/(auth)/login/page.tsx`** — render forms; redirect authenticated users away
12. **`app/(protected)/layout.tsx`** — server component; calls `getSessionUser`; passes user to context
13. **Verify**: Register → login → dashboard redirect → logout → redirect to login all work

---

### Phase 2 — Idea Submission (FR-006, FR-006a, FR-007 to FR-010)

**Goal**: Submitters can submit ideas with optional file attachments and view their own ideas.

**Steps**:

1. **`lib/uploads/handler.ts`** — `validateAndSaveFile(formData)`: check MIME type against allowlist (pdf, docx, pptx, png, jpg, jpeg), enforce 10 MB limit, write to `/uploads/<uuid>-<originalname>`, return saved path
2. **`lib/db/dao/ideas.ts`** — `createIdea`, `findIdeasByUser`, `findIdeaById`
3. **`app/api/ideas/route.ts`** (POST) — authenticate request via session cookie; parse `multipart/form-data`; validate required fields; call `validateAndSaveFile` if file present; insert idea row; return 201 with idea id
4. **`app/api/ideas/[id]/route.ts`** (GET) — authenticate; enforce ownership (Submitter can only read own idea); return idea + comment if present
5. **`components/ideas/IdeaSubmitForm.tsx`** — shadcn Form with fields: title (text), description (textarea), category (Select with four options), attachment (file input); client-side required field validation; file type/size hint text; submit → POST `/api/ideas`; success → redirect to dashboard
6. **`components/ideas/StatusBadge.tsx`** — colour-coded Badge using `@theme` status tokens: `submitted`=blue, `under_review`=yellow, `accepted`=green, `rejected`=red
7. **`components/ideas/IdeaCard.tsx`** — title, category, StatusBadge, formatted `created_at` via `lib/utils/format-date.ts`
8. **`components/ideas/IdeaList.tsx`** — renders list of IdeaCards; empty state message
9. **`app/(protected)/dashboard/page.tsx`** — server component; fetch `/api/me` + user ideas; render IdeaList + "Submit New Idea" button
10. **`app/(protected)/ideas/new/page.tsx`** — render IdeaSubmitForm
11. **`app/(protected)/ideas/[id]/page.tsx`** — fetch idea; enforce ownership server-side; render IdeaDetail with status, description, attachment link, and comment if present
12. **`lib/utils/format-date.ts`** — `formatDate(isoString): string` using `Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`
13. **Verify**: Submit idea with and without attachment; "My Ideas" shows correct list; accessing another user's idea returns 403

---

### Phase 3 — Admin Evaluation Workflow (FR-011 to FR-015, FR-018)

**Goal**: Admin can view all ideas, move them through the status pipeline, and leave one-shot comments on Accept/Reject.

**Steps**:

1. **`lib/db/dao/ideas.ts`** additions — `findAllIdeas`, `updateIdeaStatus`
2. **`lib/db/dao/comments.ts`** — `createComment`, `findCommentByIdeaId`
3. **`app/api/ideas/[id]/evaluate/route.ts`** (PATCH) — authenticate + assert Admin role; validate status transition is legal (state machine); if status is `accepted` or `rejected`, optionally insert comment (enforce uniqueness — one per idea); update idea status; return 200
4. **`app/api/me/route.ts`** — return current session user (id, email, role) for client components
5. **`components/admin/AdminIdeaTable.tsx`** — shadcn Table with columns: title, submitter email, category, status (StatusBadge), submitted date; rows are links to admin idea detail
6. **`components/admin/EvaluatePanel.tsx`** — shows current status; renders only legal transition buttons; for Accept/Reject: renders optional comment textarea; on confirm → PATCH `/api/ideas/[id]/evaluate`; terminal status hides all controls
7. **`app/(protected)/admin/layout.tsx`** — server component; assert `user.role === 'admin'`; render 403 page for Submitters
8. **`app/(protected)/admin/dashboard/page.tsx`** — server component; fetch all ideas; render AdminIdeaTable
9. **`app/(protected)/admin/ideas/[id]/page.tsx`** — fetch idea + comment; render IdeaDetail (read-only) + EvaluatePanel
10. **Verify**: Admin can progress ideas through all legal transitions; Submitter sees evaluation comment; Submitter cannot access `/admin/*`

---

### Phase 4 — Polish & Hardening

**Goal**: Production-ready UI shell, error states, loading states, and env validation.

**Steps**:

1. Global layout: responsive nav bar (logo, user email, Logout button); mobile hamburger menu via shadcn Sheet
2. 404 and 403 pages (`not-found.tsx`, custom 403 component)
3. Loading skeletons for async data (shadcn Skeleton)
4. Error boundaries for API failures — inline error messages, no full-page crashes
5. `next.config.ts` startup validation — assert all required env vars (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) are present; throw on missing
6. `uploads/` and `data/portal.db` entries added to `.gitignore`
7. `README.md` — quickstart: install, set `.env.local`, `npm run dev`, seed admin, open browser

---

## Data Model

### `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- uuid
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('submitter', 'admin')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `ideas`
```sql
CREATE TABLE IF NOT EXISTS ideas (
  id              TEXT PRIMARY KEY,      -- uuid
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Process Improvement','Technology','Customer Experience','Other')),
  status          TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','under_review','accepted','rejected')),
  attachment_path TEXT,
  submitted_by    TEXT NOT NULL REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `evaluation_comments`
```sql
CREATE TABLE IF NOT EXISTS evaluation_comments (
  id           TEXT PRIMARY KEY,         -- uuid
  idea_id      TEXT UNIQUE NOT NULL REFERENCES ideas(id),  -- one per idea
  admin_id     TEXT NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `sessions`
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,           -- uuid token
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL               -- ISO-8601; checked on every request
);
```

---

## Status Transition State Machine

```
submitted ──[Admin: Move to Under Review]──► under_review
                                                  │
                              ┌───────────────────┴───────────────────┐
                              ▼                                         ▼
                          accepted (terminal)                    rejected (terminal)
```

Illegal transitions (must be rejected with 400):
- `submitted → accepted`
- `submitted → rejected`
- `under_review → submitted`
- `accepted → *` (any)
- `rejected → *` (any)

---

## Approved Dependencies (Phase 1)

| Package | Version | Justification |
|---|---|---|
| `next` | latest stable | Framework |
| `react`, `react-dom` | peer of next | UI runtime |
| `tailwindcss` | v4 | Styling |
| `shadcn/ui` | latest | Component primitives |
| `better-sqlite3` | latest stable | SQLite driver (sync, server-side) |
| `bcryptjs` | latest | Password hashing — pure JS avoids native build issues |
| `uuid` | latest | Collision-safe ID generation |

**Explicitly rejected**: `date-fns` (native `Intl.DateTimeFormat` sufficient), `prisma`/`drizzle` (direct SQL preferred per Principle V), JWT libs (cookie sessions sufficient), `zod` (Phase 1 validation is simple enough with manual checks).

---

**Version**: 1.0.0 | **Created**: 2026-05-13 | **Constitution**: v1.2.0
