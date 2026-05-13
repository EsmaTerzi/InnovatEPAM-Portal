# InnovatEPAM Portal Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Every function, module, and component must have a single, clear responsibility; Names (variables, functions, components, files) must be explicit and intention-revealing; No dead code, commented-out blocks, or speculative abstractions; Functions must be small, doing one thing only; Avoid deep nesting — prefer early returns and guard clauses; All code must be readable without inline comments explaining *what* it does; Duplication is a design smell — extract only when three or more usages exist.

### II. Simple and Responsive UI/UX (NON-NEGOTIABLE)
Every UI must be fully responsive across mobile, tablet, and desktop breakpoints; Layouts use Tailwind CSS utility classes exclusively — no custom CSS unless Tailwind cannot achieve the result; Colors are defined exclusively via Tailwind `@theme` — no hardcoded hex/rgb values in components; Components are built for clarity first: minimal visual noise, obvious affordances, accessible markup (semantic HTML, ARIA where needed); No animations or transitions unless they serve user comprehension; `shadcn/ui` is the approved component primitive library — use it for standard UI patterns (buttons, dialogs, forms, etc.) to maintain development velocity; shadcn components must be customised via Tailwind and `@theme` tokens only — no overriding with custom CSS or inline styles; Heavier UI libraries (MUI, Chakra, Ant Design, etc.) remain prohibited; Clean code and responsive design principles apply to all shadcn-based components without exception.

### III. Minimal Dependencies
Every new dependency must be justified: if it can be reasonably implemented in under 50 lines, implement it; Prefer built-in Next.js, React, and Node.js capabilities over external packages; Zero runtime dependencies for utilities that are trivially implementable; No transitive dependency bloat — audit `package.json` before adding anything; Approved core runtime dependencies: `next`, `react`, `react-dom`, `tailwindcss`, `better-sqlite3`; All other dependencies require explicit justification in the PR description.

### IV. Test-Driven Development
TDD is the target practice for this project and will be enforced from Phase 2 onward; Phase 1 MVP is exempt from mandatory test coverage to meet timeline constraints — this is a time-boxed exception, not a permanent waiver; From Phase 2, the Red → Green → Refactor cycle is enforced; Unit tests cover all pure functions, hooks, and utilities; Integration tests cover all API routes and database interactions; Component tests cover rendering and user interaction; Test files live alongside the source files they test (`*.test.ts` / `*.test.tsx`).

### V. Data Persistence with SQLite
SQLite is the sole data persistence layer — no external databases, ORMs, or cloud storage for structured data; Database access is encapsulated in dedicated data-access modules — no raw SQL in components or API handlers; Schema migrations are versioned and applied programmatically on startup; `better-sqlite3` is the approved SQLite driver (synchronous, server-side only); All queries must use parameterised statements — no string interpolation in SQL.

## Technology Stack

| Layer | Technology | Constraints |
|---|---|---|
| Framework | Next.js (App Router) | Latest stable version |
| UI Library | React | Server and Client Components as appropriate |
| Component Primitives | shadcn/ui | Customised via Tailwind + `@theme` only |
| Styling | Tailwind CSS | `@theme` for all color tokens; no inline styles |
| Database | SQLite via `better-sqlite3` | Server-side only |
| Testing | Jest + React Testing Library | Mandatory from Phase 2; exempt in Phase 1 MVP |
| Language | TypeScript | Strict mode enabled; no `any` |

## Development Workflow

- Every feature branch starts with a failing test from Phase 2 onward; Phase 1 MVP is exempt from this gate
- Code reviews must verify compliance with all five Core Principles before approval
- `next/font`, `next/image`, and `next/link` are used wherever applicable — never raw `<img>`, `<a>`, or font imports
- Environment variables are validated at startup — no silent failures from missing config
- SQLite database file is excluded from version control; schema and seed scripts are committed

## Governance

This constitution supersedes all other practices, conventions, and personal preferences; Amendments require explicit ratification and must be reflected in this document; All contributors are bound by this constitution from day one; Complexity must be justified against these principles — if it cannot be, simplify.

**Version**: 1.2.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
