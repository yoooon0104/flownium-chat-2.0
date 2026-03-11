# Workflow: Analyze -> Feature

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when they are required by the implemented change.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed unless the user explicitly asks for it.
- Validation is required after implementation.

This workflow is for ambiguous feature requests that need clarification before implementation starts.

## Step 1: Analysis

Input:

- feature request
- product note
- rough implementation direction

Tasks:

1. Identify missing questions.
2. Identify undefined guardrails.
3. Identify scope risks and assumptions.
4. Define acceptance criteria from the current repository context.
5. Identify likely documentation and validation impact.

Output:

- clarified scope
- assumptions
- acceptance criteria
- implementation risks
- likely docs to review
- likely validation depth

---

## Step 2: Implementation Plan

Tasks:

1. Identify the related files.
2. Propose the smallest implementation path.
3. Call out required documentation updates if any.
4. Call out whether realtime verification is likely needed.

Output:

- affected files
- affected docs
- minimal plan

---

## Step 3: Feature Implementation

Rules:

1. Make minimal changes.
2. Avoid unrelated refactors.
3. Keep contracts and docs synchronized if behavior changes.

Output:

- changed files
- implementation summary

---

## Step 4: Validation

Run the narrowest useful validation.

Typical checks:

- `npm run build`
- `node --check server/index.cjs` when backend entrypoints or socket wiring change
- realtime verification planning when unread, notification, or presence flow changes

Output:

- validation results
- risks or side effects

---

## Step 5: Optional Delivery

Only if the user explicitly asks:

1. update worklog
2. commit
3. push
4. create PR summary or PR

## Follow-up

- Required:
  - use `validate.md`
- Conditional:
  - use `docs-sync.md` if the implemented feature changed contracts, screens, architecture, or object meaning
  - use `realtime-verify.md` if the implemented feature affects realtime behavior
- Optional:
  - use `deliver.md`
  - use `worklog-update.md`
