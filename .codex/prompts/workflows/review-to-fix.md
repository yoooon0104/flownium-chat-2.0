# Workflow: Review -> Fix

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed only when directly required by the fix.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Validation is required after the fix.

This workflow is for taking a review finding and turning it into a minimal verified fix.

## Step 1: Review Finding Intake

Input:
- one or more review findings

Tasks:

1. Restate the selected finding.
2. Identify the likely reproduction path.
3. Define actual result and expected result.

Output:

- target finding
- reproduction summary
- expected behavior

---

## Step 2: Root Cause Check

Tasks:

1. List the top likely causes.
2. Verify the most likely cause first using logs, tests, or code inspection.
3. Avoid broad refactors during diagnosis.

Output:

- confirmed root cause
- rejected alternatives

---

## Step 3: Minimal Fix

Rules:

1. Change the smallest possible surface area.
2. Keep unrelated cleanup out of the patch.
3. Update docs only if the behavior contract changes or the new rule must be documented.

Output:

- fix summary
- changed files

---

## Step 4: Validation

Run the narrowest useful validation.

Typical checks:
- `npm run build`
- `node --check server/index.cjs`
- narrower route or model checks if that is the touched surface

Output:

- validation results
- regression risk
- performance impact
- security impact

---

## Step 5: Optional Delivery

Only if the user explicitly asks:

1. commit
2. push
3. create PR summary or PR
