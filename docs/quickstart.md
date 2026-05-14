# Quickstart Guide — InnovatEPAM Portal

## Prerequisites

| Tool    | Minimum Version |
|---------|-----------------|
| Node.js | 22.x            |
| npm     | 9.x             |
| macOS / Linux / Windows (WSL2) | — |

---

## 1. Clone the Repository

```bash
git clone https://github.com/EsmaTerzi/InnovatEPAM-Portal.git
cd InnovatEPAM-Portal
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if you want custom Admin credentials:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme123
```

> **Important:** Change these values before deploying to any shared environment.

---

## 4. Start the Development Server

```bash
npm run dev
```

On first run the server will:
1. Create `data/portal.db` (SQLite database)
2. Run all table migrations
3. Seed the Admin account from your `.env.local` values

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

---

## 5. Log In

### As Admin
| Field    | Default value       |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `changeme123`       |

Admin can access `/admin/dashboard` to view and evaluate all submitted ideas.

### As a New Submitter
Go to `/register`, create an account, and start submitting ideas from the dashboard.

---

## 6. Submit an Idea

1. Log in as a Submitter
2. Click **Submit New Idea** on the dashboard
3. Fill in title, description, category (required)
4. Optionally attach a file (PDF, DOCX, PPTX, PNG, JPEG — max 10 MB)
5. Submit — the idea appears on your dashboard with status **Submitted**

---

## 7. Evaluate an Idea (Admin)

1. Log in as Admin → navigate to **Admin** in the nav bar
2. Click any idea title to open its detail page
3. Use the **Evaluation** panel on the right:
   - **Submitted** → click "Move to Under Review"
   - **Under Review** → click "Accept" or "Reject" (optional comment)
4. The Submitter will see the updated status and any comment on their idea detail page

---

## Useful Scripts

| Command            | Description                         |
|--------------------|-------------------------------------|
| `npm run dev`      | Start development server (Turbopack)|
| `npm run build`    | Production build                    |
| `npm run start`    | Start production server             |
| `npm run lint`     | Run ESLint                          |
| `npx tsc --noEmit` | TypeScript type check               |

---

## Directory Structure (key paths)

```
app/(auth)/          → /login, /register
app/(protected)/     → /dashboard, /ideas/new, /ideas/[id]
app/(protected)/admin/ → /admin/dashboard, /admin/ideas/[id]
app/api/             → REST API routes
lib/db/              → SQLite client, schema, DAOs
lib/auth/            → Password hashing, session management
lib/uploads/         → File upload validation
components/          → React UI components
data/                → SQLite database (git-ignored)
uploads/             → Uploaded files (git-ignored)
docs/                → Project documentation
```
