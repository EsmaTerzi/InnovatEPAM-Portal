# InnovatEPAM Portal

An internal innovation management portal where EPAM employees submit ideas and Admins evaluate them through a structured pipeline.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** with `@theme` design tokens
- **shadcn/ui** component library
- **SQLite** via `better-sqlite3`
- **bcryptjs** for password hashing

## Prerequisites

- Node.js ≥ 22
- npm ≥ 9

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The database is created automatically at `data/portal.db` on first run, and the Admin account is seeded from your `.env.local` values.

## Default Admin Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `changeme123`       |

> Change these in `.env.local` before deploying.

## Environment Variables

| Variable             | Description                          |
|----------------------|--------------------------------------|
| `SEED_ADMIN_EMAIL`   | Email address for the seeded Admin   |
| `SEED_ADMIN_PASSWORD`| Password for the seeded Admin        |

## Project Structure

```
app/
  (auth)/          # Public login & register pages
  (protected)/     # Auth-guarded pages
    dashboard/     # Submitter: My Ideas
    ideas/         # Idea submission & detail
    admin/         # Admin-only: All ideas + evaluation
  api/             # API route handlers
components/
  auth/            # Auth forms, NavBar, UserContext
  ideas/           # IdeaCard, IdeaList, IdeaDetail, StatusBadge, IdeaSubmitForm
  admin/           # AdminIdeaTable, EvaluatePanel
  errors/          # Forbidden, error boundaries
lib/
  db/              # SQLite client, schema, DAOs
  auth/            # Password hashing, session management
  uploads/         # File upload validation & storage
```

## Idea Status Pipeline

```
Submitted → Under Review → Accepted
                        └→ Rejected
```

## File Uploads

Attachments are stored in `/uploads/` (git-ignored). Allowed types: PDF, DOCX, PPTX, PNG, JPEG. Max size: 10 MB.
