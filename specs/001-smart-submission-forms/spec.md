# Feature Specification: Smart Submission Forms

**Feature Branch**: `001-smart-submission-forms`

**Created**: 2026-05-14

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Category-Aware Form Fields (Priority: P1)

A submitter wants to provide structured, relevant information about their idea. When they select a category (e.g., "Technology"), the form immediately presents fields that are specific to that category — without requiring a page reload or extra navigation steps. This guides the submitter to include exactly the details that admins need to evaluate ideas in that category.

**Why this priority**: This is the core deliverable of Phase 02. Without it, all other stories have no surface to operate on. It delivers immediate value by reducing form ambiguity and improving submission quality.

**Independent Test**: Can be fully tested by selecting each category from the dropdown and verifying that the correct set of additional fields appears. Delivers value as a standalone improvement to the submission experience.

**Acceptance Scenarios**:

1. **Given** a submitter is on the idea submission page with no category selected, **When** they view the form, **Then** only the base fields (title, description, category, attachment) are visible and a prompt instructs them to select a category to continue.
2. **Given** a submitter selects "Technology", **When** the selection is registered, **Then** the Technology-specific fields appear immediately in the form body without a page reload.
3. **Given** a submitter selects "Process Improvement", **When** the selection is registered, **Then** only the Process Improvement-specific fields are shown (Technology fields are completely absent from the page).
4. **Given** a submitter selects "Customer Experience", **When** the selection is registered, **Then** the Customer Experience-specific fields appear.
5. **Given** a submitter selects "Other", **When** the selection is registered, **Then** the single "Additional Context" field for that category appears.
6. **Given** a submitter has filled in category-specific fields and then changes the category, **When** the new category is selected, **Then** the previous category's fields are removed and the new category's fields are shown.

---

### User Story 2 — Contextual Guidance per Category (Priority: P2)

A submitter who is new to the portal — or unfamiliar with a particular category — wants to understand what a strong submission in that category looks like before they start typing. When a category is selected, a guidance banner explains what kind of information the admins are looking for, and each individual field shows a brief hint describing the expected content.

**Why this priority**: Guidance text raises submission quality without requiring extra administrative effort. It is independent of field rendering and can be shipped alongside or after the fields feature.

**Independent Test**: Can be tested by selecting each category and confirming a guidance banner appears with category-specific text, and that each new field shows descriptive placeholder or helper text.

**Acceptance Scenarios**:

1. **Given** a submitter selects any category, **When** the category-specific fields appear, **Then** a guidance banner is shown directly below the category selector explaining what a strong submission in that category includes.
2. **Given** a guidance banner is visible, **When** the submitter dismisses it, **Then** the banner disappears and does not reappear if the same category is re-selected in the same session.
3. **Given** a submitter dismissed the banner for Category A and then switches to Category B, **When** the new category is selected, **Then** Category B's banner is shown regardless of the earlier dismissal.
4. **Given** a submitter is viewing a category-specific field, **When** they inspect the field, **Then** inline helper text beneath or within the field describes the expected format or content for that specific input.

---

### User Story 3 — Category-Specific Required Field Validation (Priority: P2)

A submitter who clicks "Submit" with one or more required category-specific fields left empty wants to know exactly which fields need attention — without losing the data they already entered.

**Why this priority**: Without validation, low-quality or incomplete submissions reach admins. This story enforces data completeness and is closely tied to P1 but can be validated as a distinct behaviour.

**Independent Test**: Can be tested by attempting to submit a Technology idea without filling in the required "Tech Stack" field, and verifying an error appears on that field only, without clearing other fields.

**Acceptance Scenarios**:

1. **Given** a submitter has selected a category and left a required category-specific field empty, **When** they submit the form, **Then** the empty required field is highlighted with an error message explaining it is required, and the form is not submitted.
2. **Given** multiple required category-specific fields are empty, **When** the form is submitted, **Then** all empty required fields are highlighted simultaneously; the form scrolls to the first error field.
3. **Given** a submitter has filled in some valid fields and one invalid field, **When** the error is shown, **Then** the valid fields retain their entered values.
4. **Given** a submitter fills in a required field after seeing an error, **When** they submit again, **Then** the error on that field clears and the form proceeds normally if no other errors exist.
5. **Given** an optional category-specific field is left empty, **When** the form is submitted, **Then** no error is raised for that field.
6. **Given** a client-side validated form is submitted directly to the server bypassing the browser, **When** the server processes the request, **Then** the same required-field validation is enforced and a structured error response is returned.

---

### User Story 4 — Safe Category Switching (Priority: P3)

A submitter who started filling in fields for one category and then wants to switch to a different category needs to be warned that their category-specific answers will be lost — without losing their title, description, or attachment.

**Why this priority**: Prevents accidental data loss for submitters who explore categories. Lower priority because the risk only arises after a submitter has already begun entering category-specific data.

**Independent Test**: Can be tested by filling in at least one category-specific field, switching categories, and verifying the warning appears; confirming "Cancel" restores the previous category; confirming "Continue" clears only category-specific fields.

**Acceptance Scenarios**:

1. **Given** a submitter has entered at least one category-specific field value, **When** they change the category selector, **Then** an inline notice warns that switching will clear all category-specific answers.
2. **Given** the inline notice is shown, **When** the submitter chooses "Cancel", **Then** the category selector reverts to its previous value and all field values are preserved.
3. **Given** the inline notice is shown, **When** the submitter chooses "Continue", **Then** the new category's fields are shown and all previous category-specific values are cleared.
4. **Given** a submitter has not entered any category-specific field values, **When** they change the category selector, **Then** the switch happens immediately with no warning notice.
5. **Given** a submitter switches category via "Continue", **When** the new fields appear, **Then** the title, description, and attachment values from before the switch are unchanged.

---

### User Story 5 — Admin & Submitter Read-Only View of Category Details (Priority: P3)

An admin reviewing an idea, and a submitter revisiting their own idea, both want to see the category-specific answers that were submitted alongside the standard idea details.

**Why this priority**: A natural extension of the submission flow; without it, the category-specific data collected in P1 is invisible after submission.

**Independent Test**: Can be tested by submitting a Technology idea with all fields filled, then opening the idea detail page as both the submitter and the admin, and confirming the category details are displayed in a readable, labelled format.

**Acceptance Scenarios**:

1. **Given** an idea was submitted with category-specific field values, **When** an admin opens the idea detail page, **Then** a "Category Details" section lists all submitted category-specific fields with their human-readable labels and values.
2. **Given** the idea detail page is open, **When** the admin views the layout, **Then** the Category Details section appears between the idea description and the evaluation panel.
3. **Given** an optional category-specific field was left empty during submission, **When** the idea detail page is viewed, **Then** that field is not shown in the Category Details section.
4. **Given** a submitter opens their own idea detail page, **When** they view the page, **Then** the same Category Details section is shown in read-only mode.

---

### Edge Cases

- What happens when a submitter submits the form and then the server rejects a category-specific field? The form must display the server error without clearing valid fields.
- What happens if a user loads the form with a pre-selected category (e.g., via a deep-link)? The correct category-specific fields must render immediately on load.
- What happens when an idea submitted before Phase 02 is viewed in the admin or submitter detail page? The Category Details section should be absent (not shown as empty) for legacy ideas.
- What happens if a submitter uploads an attachment, then switches category? The attachment must be preserved.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The submission form MUST display category-specific input fields immediately when a category is selected, without a full page navigation.
- **FR-002**: Category-specific fields for a non-selected category MUST NOT be present in the submitted form data.
- **FR-003**: The form MUST display a guidance banner with category-specific copy when a category is selected.
- **FR-004**: The guidance banner MUST be dismissible within a session; dismissing it for one category MUST NOT suppress the banner for a different category.
- **FR-005**: Each category-specific field MUST display inline helper text describing the expected input.
- **FR-006**: Required category-specific fields MUST be validated on submission; missing values MUST produce field-level error messages.
- **FR-007**: Validation MUST be enforced both client-side (for user experience) and server-side (for data integrity).
- **FR-008**: Submitting the form with a category value not in the approved list MUST be rejected with a clear error message.
- **FR-009**: Base fields (title, description, category, attachment) MUST retain their values when the submitter changes the category selection.
- **FR-010**: Category-specific field values MUST be cleared when the submitter switches to a different category.
- **FR-011**: An inline warning notice MUST appear before category-specific fields are cleared, provided the submitter has already entered at least one value in them; the notice MUST offer "Continue" and "Cancel" actions.
- **FR-012**: The idea detail page MUST display a "Category Details" section showing submitted category-specific fields with human-readable labels, visible to both the submitter and the admin.
- **FR-013**: Optional category-specific fields that were left empty MUST NOT appear in the Category Details section on the detail page.
- **FR-014**: Legacy ideas (submitted before Phase 02) MUST display no Category Details section; no broken or empty section should appear.
- **FR-015**: All dynamic form behaviour (field definitions, validation rules, guidance text) MUST be driven by a single central configuration — adding a new category MUST require no component-level code changes.

### Key Entities

- **Idea**: The existing core entity (from Phase 01). Extended in Phase 02 to carry an associated set of category-specific answer pairs.
- **Category Answer**: A named value pair attached to an idea — a field identifier and its submitted content. An idea may have zero or many category answers. Each field identifier is unique per idea.
- **Category Configuration**: A system-level definition of which fields, validation rules, and guidance text belong to each category. Not persisted per-submission; defined once for the whole portal.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A submitter selecting any supported category sees the relevant additional fields within 300 ms of the category change — no page reload occurs.
- **SC-002**: A submitter attempting to submit an incomplete required category-specific field receives a field-level error message without any previously entered valid data being lost.
- **SC-003**: 100% of submitted ideas include well-formed category-specific answers that pass server-side validation; no category-specific field data is silently dropped or corrupted on save.
- **SC-004**: Adding a new category to the portal requires changes to a single configuration file only — zero changes to any UI component or API route handler.
- **SC-005**: The category details of any idea are accessible to both the submitting user and any admin via the existing idea detail page within one navigation step from the dashboard.
- **SC-006**: A submitter switching categories with filled category-specific fields is warned before any data loss occurs; choosing "Cancel" results in zero data loss.

---

## Assumptions

- Phase 01 authentication and role system (submitter / admin) is in place and will not be modified by this feature.
- The four existing idea categories (`Technology`, `Process Improvement`, `Customer Experience`, `Other`) are the complete set for Phase 02; no new categories are added within this phase.
- Ideas submitted before Phase 02 have no category-specific answer data; the system will handle their detail pages gracefully without errors or empty sections.
- The guidance banner dismissal is session-scoped (browser session), not persisted per user account; a page reload resets the dismissal state.
- The attachment field behaviour (MIME types, size limits) introduced in Phase 01 is unchanged by this feature.
- Mobile responsiveness standards defined in the project constitution apply to all new form elements without exception.
