# Research & Design Decisions — InnovatEPAM Portal

This document records the key technology choices, trade-offs evaluated, and decisions made during Phase 1 MVP design.

---

## 1. Framework: Next.js App Router

**Decision:** Next.js 16 with App Router.

**Rationale:**
- Unified full-stack solution — API routes, server components, and client components in a single project
- Server Components allow direct DB access without an extra API hop for read-heavy pages (dashboard, admin list)
- Built-in routing, layout nesting, and `loading.tsx` / `error.tsx` conventions reduce boilerplate
- `instrumentation.ts` hook provides a clean startup lifecycle for DB migration + seed

**Alternatives considered:**
- Express + React SPA — rejected: unnecessary complexity for a single-tenant MVP
- Remix — rejected: smaller ecosystem, team familiarity lower

---

## 2. Database: SQLite via `better-sqlite3`

**Decision:** SQLite with `better-sqlite3` (synchronous driver).

**Rationale:**
- Zero infrastructure — no separate DB process, no connection string, no Docker required for local dev
- Single-tenant MVP at pilot scale (handful of concurrent users) — SQLite WAL mode handles concurrent reads well
- Synchronous API is simpler in a Next.js API route context; avoids async complexity for straightforward CRUD
- `better-sqlite3` is the most performant Node.js SQLite driver

**Alternatives considered:**
- PostgreSQL + Prisma — rejected: over-engineered for MVP; requires a running Postgres instance
- Turso (libSQL) — rejected: adds remote dependency; overkill for Phase 1
- `sqlite3` (async driver) — rejected: `better-sqlite3` is faster and simpler for synchronous use

**Trade-offs accepted:**
- Cannot scale horizontally (single process, single file) — acceptable for Phase 1 pilot
- No migrations library (Prisma/Drizzle) — raw `CREATE TABLE IF NOT EXISTS` is sufficient for MVP; can migrate to Drizzle in Phase 2+

---

## 3. Authentication: HTTP-only Cookies + Custom Sessions

**Decision:** Custom session table in SQLite + HTTP-only `session_token` cookie.

**Rationale:**
- No third-party auth dependency (NextAuth, Clerk, Auth0) — keeps the dependency count low (constitution Principle III)
- HTTP-only cookies prevent XSS-based token theft
- `Secure` flag enabled in production; `SameSite=Lax` protects against CSRF for state-changing requests
- 24-hour TTL is standard for internal tools

**Alternatives considered:**
- NextAuth.js — rejected: adds ~10 dependencies, overkill for a two-role internal app
- JWT in localStorage — rejected: XSS vulnerability; constitution Principle I (clean/secure code)
- JWT in HTTP-only cookie — considered; rejected in favour of server-side sessions for instant revocation capability

---

## 4. Password Hashing: `bcryptjs`

**Decision:** `bcryptjs` with cost factor 12.

**Rationale:**
- Pure JavaScript implementation — no native build step required
- `bcrypt` (native) caused build failures on Apple Silicon (macOS arm64) during setup
- Cost factor 12 is the current industry standard for interactive login (~250ms on modern hardware)

**Alternatives considered:**
- `bcrypt` (native) — rejected: macOS arm64 native build issues encountered
- `argon2` — considered; rejected: also requires native bindings, same macOS issue
- `crypto.scrypt` (Node built-in) — considered; `bcryptjs` preferred for simplicity and established ecosystem

---

## 5. UI: shadcn/ui + Tailwind CSS v4

**Decision:** shadcn/ui component library with Tailwind CSS v4 `@theme` design tokens.

**Rationale:**
- shadcn/ui copies component source into the project — no runtime dependency, full control
- Tailwind v4 `@theme` block replaces `tailwind.config.ts` — CSS-native design tokens, better IDE support
- Radix UI primitives (used by shadcn) provide accessible, unstyled building blocks
- Nova preset used for a clean neutral aesthetic suitable for an internal tool

**Alternatives considered:**
- MUI / Chakra UI — rejected: heavy runtime, opinionated styling hard to customise
- Headless UI — considered; shadcn/ui preferred for richer component set
- Plain Tailwind (no component library) — rejected: would slow Phase 1 delivery

**Key token decisions:**
- `brand-*`: blue scale — primary actions, links, logo
- `status-submitted/review/accepted/rejected`: semantic bg + text + border tokens mapped to StatusBadge
- `surface` / `surface-raised`: page background and card backgrounds

---

## 6. Date Formatting: Native `Intl.DateTimeFormat`

**Decision:** `Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })` — no external library.

**Rationale:**
- Constitution Principle III (Minimal Dependencies): date-fns was explicitly evaluated and rejected
- The portal only needs one date format: `13 May 2026`
- `Intl.DateTimeFormat` is built into all modern browsers and Node.js — zero bundle cost

**Alternatives considered:**
- `date-fns` — rejected by constitution (adds ~13 KB per import, unnecessary for one format)
- `dayjs` — rejected for the same reason
- `luxon` — rejected: heavier than date-fns

---

## 7. File Uploads: Local Filesystem

**Decision:** Files stored at `uploads/<uuid>-<sanitised-name>.<ext>` on the local filesystem.

**Rationale:**
- Simplest possible approach for MVP — no S3, no CDN, no presigned URLs
- UUID prefix prevents filename collisions and path traversal attacks
- MIME type allowlist + 10 MB size limit enforced server-side before writing to disk

**Security measures:**
- Filename sanitised: non-alphanumeric characters replaced, length capped at 100 chars
- MIME type checked against explicit allowlist (not file extension alone)
- Files served via Next.js public path — no execution risk

**Alternatives considered:**
- AWS S3 / Cloudflare R2 — rejected: external dependency, requires credentials, overkill for internal MVP
- Storing files as BLOBs in SQLite — rejected: degrades DB performance for large files

**Known limitation:** `/uploads/` is node-local; not suitable for multi-instance deployment. Acceptable for Phase 1 single-process pilot.

---

## 8. State Management: React Server Components + `useUser` Context

**Decision:** No global state library. Server Components fetch data directly; `UserContext` passes session user to client components.

**Rationale:**
- App Router Server Components eliminate the need for client-side data fetching for most reads
- `UserContext` is a thin wrapper — only stores `{ id, email, role }` from the server session
- No Redux, Zustand, or Jotai needed at this scale

---

## 9. Route Protection: `proxy.ts` (formerly `middleware.ts`)

**Decision:** Edge-compatible proxy checks cookie presence only; admin role check delegated to `app/(protected)/admin/layout.tsx`.

**Rationale:**
- `better-sqlite3` cannot run in the Edge runtime — DB access in middleware would throw
- Cookie presence check (unauthenticated redirect) is sufficient at the Edge layer
- Admin role enforcement happens in the Node.js runtime (server layout), where DB access is available

---

## 10. No Test Suite in Phase 1

**Decision:** TDD exempted for Phase 1 (constitution v1.2.0 amendment).

**Rationale:**
- Time-boxed MVP delivery — test infrastructure setup would consume ~20% of Phase 1 budget
- All validation happens at system boundaries (API routes, DAOs, upload handler)
- Phase 2+ spec includes adding Vitest + Playwright coverage

**Risk mitigation:**
- TypeScript strict mode catches type errors at compile time
- `npx tsc --noEmit` run after every implementation phase
- Manual checkpoint testing after each phase
