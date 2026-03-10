# Workflow: Feature -> Docs -> PR

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when contracts, screens, architecture, or flows are affected.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed unless the user explicitly asks for it.
- Validation is required after implementation.

This workflow is for implementing a feature, synchronizing related documentation, validating the result, and preparing PR-ready delivery output.

## Step 1: Scope Confirmation

Input:

- feature request
- product note
- implementation direction

Tasks:

1. Identify the exact requested behavior.
2. Identify scope boundaries and non-goals.
3. Define acceptance criteria from the current repository context.

Output:

- clarified scope
- assumptions
- acceptance criteria

---

## Step 2: Minimal Implementation Plan

Tasks:

1. Identify the related files.
2. Propose the smallest implementation path.
3. Identify which documents may require synchronization.

Output:

- affected code files
- affected docs
- minimal plan

---

## Step 3: Feature Implementation

Rules:

1. Make minimal changes.
2. Avoid unrelated refactors.
3. Keep comments aligned with implemented behavior.
4. Preserve existing architecture unless the task requires otherwise.

Output:

- changed files
- implementation summary

---

## Step 4: Documentation Synchronization

Tasks:

1. Review whether the change affects API, socket, architecture, screen behavior, or object meaning.
2. Update only directly impacted documents.
3. Keep wording aligned with actual implementation.

Typical document targets:

- `docs/common/api-spec.md`
- `docs/common/socket-events.md`
- `docs/common/architecture.md`
- `docs/common/ui-plan.md`
- `docs/planning/screen-spec.md`
- `docs/planning/object-spec.md`
- `docs/common/wbs.md`

Output:

- docs reviewed
- docs updated
- remaining gaps

---

## Step 5: Validation

Run the narrowest useful validation.

Typical checks:

- `npm run build`
- `node --check server/index.cjs` when backend entrypoints or socket wiring change
- narrower checks for touched files when appropriate
- realtime verification planning if the feature changes unread, notification, or presence behavior

Output:

- validation results
- unverified risks

---

## Step 6: Optional Delivery

Only if the user explicitly asks:

1. update worklog
2. commit
3. push
4. create PR summary or PR

If PR information is requested, include:

- changed files
- summary
- impact
- validation
- branch / commit
- PR or compare link

## Follow-up

- Required:
  - use `validate.md`
- Conditional:
  - use `realtime-verify.md` if the feature changed realtime behavior and stronger confidence is still needed
  - use `release-check.md` if the next decision is release readiness
- Optional:
  - use `deliver.md`
  - use `worklog-update.md`
