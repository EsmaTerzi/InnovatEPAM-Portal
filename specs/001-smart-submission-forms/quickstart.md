# Quickstart: Smart Submission Forms

**Feature**: 001-smart-submission-forms  
**Date**: 2026-05-14  
**Prerequisite**: Phase 01 (Auth, Roles, Basic Submission) is fully working.

---

## What This Feature Adds

The submission form becomes category-aware. Selecting a category now reveals additional fields specific to that category, shows contextual guidance text, validates those fields, and persists the answers alongside the idea.

---

## Step 1 — Run the DB Migration

The migration runs automatically on server startup via the existing `runMigrations()` call in `lib/db/schema.ts`. The new `idea_metadata` table is created with `CREATE TABLE IF NOT EXISTS` — safe to run against an existing database.

Start the dev server to apply the migration:

```bash
npm run dev
```

Verify the table was created:

```bash
sqlite3 data/portal.db ".tables"
# Expected output includes: idea_metadata
```

---

## Step 2 — Verify the Config File

Check that `lib/config/categories.ts` exports `CATEGORY_CONFIG` with all four categories:

```bash
grep -n "CATEGORY_CONFIG" lib/config/categories.ts
```

Each entry should have `guidance`, and a `fields` array with at least one entry. The `Technology` category should have `tech_stack` and `estimated_effort` as required fields.

---

## Step 3 — Submit a Technology Idea

1. Log in as any submitter account.
2. Navigate to **Submit New Idea** (`/ideas/new`).
3. Select **Technology** from the category dropdown.
4. Confirm that:
   - A guidance banner appears below the dropdown.
   - "Tech Stack" and "Estimated Effort" fields appear below the description.
   - "Feasibility Notes" (optional) also appears.
5. Fill in the required fields and submit.
6. You should be redirected to `/dashboard`.

---

## Step 4 — Verify Metadata Was Saved

```bash
sqlite3 data/portal.db \
  "SELECT field_key, field_val FROM idea_metadata ORDER BY idea_id, field_key;"
```

You should see rows for `tech_stack` and `estimated_effort` (and optionally `feasibility_notes`).

---

## Step 5 — View Category Details on the Idea Page

1. From the dashboard, click the idea you just submitted.
2. On the idea detail page (`/ideas/[id]`), look for the **Category Details** section.
3. Confirm that "Tech Stack" and "Estimated Effort" are displayed with their submitted values.
4. Empty optional fields (e.g., "Feasibility Notes" if left blank) should NOT appear.

---

## Step 6 — Test Validation

1. Select **Technology**, leave "Tech Stack" blank, and attempt to submit.
2. Confirm a red error message appears on the "Tech Stack" field.
3. Confirm no other field values are cleared.
4. Fill in "Tech Stack" and submit again — should succeed.

---

## Step 7 — Test Category Switching

1. Select **Technology** and fill in "Tech Stack".
2. Change the category to **Process Improvement**.
3. Confirm an inline warning notice appears ("Switching categories will clear your category-specific answers").
4. Click **Cancel** — the category selector should revert to "Technology" with "Tech Stack" still populated.
5. Change category again and click **Continue** — "Tech Stack" should be cleared and Process Improvement fields should appear.
6. Confirm that "Title" and "Description" values are preserved throughout.

---

## Step 8 — Admin View

1. Log in as the admin account.
2. Navigate to `/admin/dashboard` and click the Technology idea.
3. Confirm the **Category Details** section appears between the description and the evaluation panel, showing the submitted values with human-readable labels.

---

## Key Files Added / Modified

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `idea_metadata` table migration |
| `lib/db/dao/metadata.ts` | New DAO — `createMetadataEntries`, `findMetadataByIdeaId` |
| `lib/config/categories.ts` | New — `CATEGORY_CONFIG` with all four categories |
| `lib/utils/validation.ts` | New — `validateCategoryFields` shared utility |
| `app/api/ideas/route.ts` | Extended to parse `metadata`, validate, and persist |
| `app/api/ideas/[id]/route.ts` | Extended to return `metadata` array in response |
| `components/ideas/IdeaSubmitForm.tsx` | Refactored to support dynamic fields and guidance |
| `components/ideas/fields/` | New directory — one component per category |
| `components/ideas/CategoryFieldsRenderer.tsx` | New — renders the correct fields component |
| `components/ideas/GuidanceBanner.tsx` | New — dismissible guidance banner |
| `components/ideas/CategoryDetails.tsx` | New — read-only category details section |
| `components/ideas/IdeaDetail.tsx` | Updated to render `CategoryDetails` |
| `components/admin/EvaluatePanel.tsx` | Layout updated: `CategoryDetails` inserted above panel |
