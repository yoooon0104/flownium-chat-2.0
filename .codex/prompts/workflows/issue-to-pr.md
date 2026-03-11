# Workflow: Issue -> PR

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when directly required by the implemented issue.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed unless the user explicitly asks for it.
- Validation is required after implementation.

This workflow is for taking a concrete issue from implementation through validation and PR-ready reporting.

## Step 1: Issue Intake

Input:

- issue body
- acceptance criteria
- referenced files or failing behavior

Tasks:

1. Restate the target behavior.
2. Identify non-goals and guardrails.
3. Identify likely code, docs, and validation scope.

Output:

- clarified issue scope
- acceptance criteria
- likely touched areas

---

## Step 2: Minimal Implementation Plan

Tasks:

1. Identify the related files.
2. Propose the smallest implementation path.
3. Identify required documentation updates if any.

Output:

- affected files
- affected docs
- minimal plan

---

## Step 3: Implementation

Rules:

1. Make minimal changes.
2. Avoid unrelated refactors.
3. Keep implementation and documentation synchronized when behavior contracts change.

Output:

- changed files
- implementation summary

---

## Step 4: Validation

Run the narrowest useful validation.

Typical checks:

- `npm run build`
- `node --check server/index.cjs`
- narrower checks for touched backend files
- realtime verification planning if the change affects unread, notifications, or presence

Output:

- validation results
- remaining risks

---

## Step 5: Delivery

Prepare:

- changed files
- summary
- impact
- validation
- branch / commit status
- PR or compare link status

Only if the user explicitly asks:

1. update worklog
2. commit
3. push
4. create PR

## Follow-up

- Required:
  - use `validate.md`
  - use `worklog-update.md` when implementation, docs, validation state, or handoff readiness changed
- Conditional:
  - use `docs-sync.md` if the issue implementation changed contracts, screens, architecture, or object meaning
  - use `realtime-verify.md` if the issue implementation affects realtime behavior
- Optional:
  - use `deliver.md`
