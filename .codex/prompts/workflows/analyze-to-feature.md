# Workflow: Analyze -> Feature

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when they are required by the implemented change.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
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

Output:

- clarified scope
- assumptions
- acceptance criteria
- implementation risks

---

## Step 2: Implementation Plan

Tasks:

1. Identify the related files.
2. Propose the smallest implementation path.
3. Call out required documentation updates if any.

Output:

- affected files
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

Output:

- validation results
- risks or side effects

---

## Step 5: Optional Delivery

Only if the user explicitly asks:

1. commit
2. push
3. create PR summary or PR
