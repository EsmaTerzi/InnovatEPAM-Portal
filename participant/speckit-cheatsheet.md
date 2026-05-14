# SpecKit Cheatsheet

Quick reference — which command to use and in what order when starting a new feature.

---

## Standard Workflow

```
specify → clarify (optional) → plan → tasks → implement
```

---

## Commands

### `/speckit.specify <feature description>`
Generates `spec.md` from a natural language description.  
Automatically creates `specs/NNN-feature-name/` and updates `feature.json`.

```
/speckit.specify Allow users to save idea drafts before submitting
```

---

### `/speckit.clarify`
Identifies underspecified areas in `spec.md`, asks up to 5 targeted questions, and writes the answers back into the spec.  
Optional — skip if the spec is already clear.

---

### `/speckit.plan`
Generates a technical implementation plan (`plan.md`) from `spec.md`.  
Architectural decisions, technical dependencies, and design artifacts are produced here.

---

### `/speckit.tasks`
Generates a dependency-ordered task list (`tasks.md`) from `plan.md`.  
Each task is trackable in `[x]` / `[ ]` format.

---

### `/speckit.implement`
Executes tasks in `tasks.md` sequentially.  
Marks each task as complete when done.

---

### `/speckit.analyze`
Reports inconsistencies and quality issues across `spec.md`, `plan.md`, and `tasks.md`.  
Non-destructive — analysis only, no changes made.

---

### `/speckit.checklist <topic>`
Generates a custom checklist (e.g. security, test coverage, UI/UX).

---

## Git Commands

| Command | What it does |
|---------|--------------|
| `/speckit.git.feature` | Creates a feature branch (`NNN-feature-name`) |
| `/speckit.git.commit` | Auto-commits Spec Kit changes |
| `/speckit.git.validate` | Checks whether the current branch name follows conventions |
| `/speckit.git.initialize` | Initializes the repo with an initial commit |
| `/speckit.git.remote` | Detects the GitHub remote URL |

---

## `/speckit.taskstoissues`
Converts tasks from `tasks.md` into GitHub Issues.

---

## Generated Directory Structure

```
specs/
  NNN-feature-name/
    spec.md              ← /speckit.specify
    plan.md              ← /speckit.plan
    tasks.md             ← /speckit.tasks
    data-model.md        ← /speckit.plan (if applicable)
    research.md          ← /speckit.plan (if applicable)
    quickstart.md        ← /speckit.plan (if applicable)
    checklists/
      requirements.md    ← /speckit.specify (auto-generated)
    contracts/
      api.md             ← /speckit.plan (if applicable)
```

---

## Feature Directories

| Directory | Phase | Status |
|-----------|-------|--------|
| `specs/001-core-portal/` | Phase 1 — Core Portal | ✅ Complete |
| `specs/002-smart-submission-forms/` | Phase 2 — Smart Forms | ✅ Complete |
| `specs/003-multimedia-attachments/` | Phase 3 — Multimedia | ✅ Complete |
