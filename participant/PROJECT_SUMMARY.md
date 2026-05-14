# InnovatEPAM Portal - Project Summary

## Overview
I built a full-stack innovation management portal where employees can submit ideas and admins evaluate them through a controlled status workflow. The project includes secure authentication, role-based authorization, dynamic category-aware forms, and attachment handling with preview support. The implementation follows a specification-driven process using phased requirements and documented acceptance criteria.

## Phases Completed

### Phase 1: Core Portal
- [x] User registration with email/password
- [x] User login/logout
- [x] Role-based access (submitter/admin)
- [x] Idea submission form
- [x] Single file attachment
- [x] Idea listing page
- [x] Status tracking
- [x] Admin evaluation workflow

### Phase 2: Smart Submission Forms
- [x] Dynamic form fields by category
- [x] Category-specific guidance

### Phase 3: Multi-Media Support
- [x] Multiple file attachments
- [x] File preview capabilities

### Phase 4: Draft Management
- [ ] Save ideas as drafts
- [ ] Edit drafts before submission

### Phase 5: Multi-Stage Review
- [ ] Configurable evaluation stages
- [ ] Stage-specific actions

### Phase 6: Blind Review
- [ ] Anonymous evaluation mode
- [ ] Identity reveal after decision

### Phase 7: Scoring System
- [ ] Multi-dimension scoring
- [ ] Score aggregation and ranking

## Technical Decisions

### Technology Stack
- Framework: Next.js 16 (App Router) + React 19 + TypeScript
- UI: Tailwind CSS v4 + shadcn/ui
- Storage: SQLite (better-sqlite3)
- Key Libraries: bcryptjs, uuid, lucide-react, jest + Testing Library

### Key Architecture Decisions
I kept all auth, validation, and authorization checks enforced server-side in API routes and protected layouts to avoid client-side trust issues. I also centralized configuration in dedicated files (for example category and attachment rules) so UI rendering and validation logic remain consistent and easy to extend.

## Challenges & Solutions

### Challenge 1: Keeping category forms dynamic but predictable
**Solution:** I used a config-driven category model and rendered fields from that source, then reused the same rules for both client-side and server-side validation to prevent mismatch bugs.

### Challenge 2: Handling attachments safely and consistently
**Solution:** I implemented a shared attachment configuration for allowed types and limits, applied validation in both UI and backend, and used dedicated preview/upload components to keep behavior modular and testable.

## AI Collaboration

### Tools Used
- GitHub Copilot

### What Worked Well
Using Copilot for repetitive implementation tasks (form wiring, API handler scaffolds, and test boilerplate) significantly reduced delivery time. Iterating from clear requirements made prompts more precise and outputs more reliable.

### What Could Be Improved
For complex changes, I needed to split prompts into smaller, acceptance-criteria-sized tasks and verify each result immediately. Larger one-shot prompts occasionally produced partial or over-general solutions.

## Time Breakdown

| Phase | Actual |
|-------|--------|
| Setup & SpecKit | ~1h |
| Phase 1: Core Portal | ~6h |
| Phase 2: Smart Submission Forms | ~1h |
| Phase 3: Multi-Media Support | ~2h |
| Phase 4: Draft Management | Not started |
| Phase 5: Multi-Stage Review | Not started |
| Phase 6: Blind Review | Not started |
| Phase 7: Scoring System | Not started |
| Documentation | ~0.5h |

## Reflection

### Key Learning
The most important learning was that requirement quality directly affects implementation speed and code quality. Clear user stories and acceptance criteria reduced ambiguity and made both coding and testing more systematic.

### What I'd Do Differently
If I started over, I would define lightweight test checklists earlier for each phase and run them after every major feature. That would reduce late-stage integration fixes.

### SDD vs Vibe Coding
Spec-driven development made the work measurable and goal-oriented. Instead of implementing features from intuition, I implemented against explicit acceptance criteria, which improved scope control and reduced rework.

### AI Collaboration Insight
The most surprising part was how much better AI output became when prompts referenced exact requirements, data shapes, and expected error behavior. AI was most effective as a fast implementation partner, but only when guided by precise constraints.

---

*Submitted by: Esma*
*Date: 2026-05-15*
*A201 Cohort: A201*