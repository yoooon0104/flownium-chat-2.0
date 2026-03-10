# Workflow: Review -> Validate

## Permission Scope

- Code changes are not allowed unless the user explicitly asks for them after validation.
- Documentation changes are not allowed unless directly required by the validation outcome.
- Commits are not allowed.
- Pushes are not allowed.
- PR creation is not allowed.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed.
- Review finding analysis and validation are allowed.

This workflow is for taking review findings, validating whether they reproduce or remain risky, and deciding whether they should become fixes, issues, or follow-up checks.

## Step 1: Review Intake

Input:

- one or more review findings
- diff, branch, PR, or changed files

Tasks:

1. Restate each finding in concrete terms.
2. Remove stylistic-only comments.
3. Keep findings with concrete defect risk, regression risk, or missing validation.

Output:

- filtered findings
- validation targets

---

## Step 2: Validation Strategy

Tasks:

1. Define the minimum scenario that could confirm or reject each finding.
2. Prefer code inspection plus the narrowest executable validation.
3. Identify which findings require:
   - build validation
   - backend syntax validation
   - targeted runtime verification
   - realtime multi-tab or multi-account verification

Output:

- validation plan per finding
- blocked findings
- high-risk findings

---

## Step 3: Execute Validation

Tasks:

1. Run the narrowest useful checks.
2. Record what was actually executed.
3. Separate confirmed findings from unconfirmed suspicions.

Output:

- confirmed findings
- not reproduced findings
- not yet verified findings

---

## Step 4: Recommendation

For each finding decide one path:

1. fix now
2. track as issue
3. leave as unconfirmed risk pending stronger validation
4. close as not reproduced

Output:

- recommended action per finding
- rationale
- validation evidence

---

## Step 5: Optional Next Step

Only if the user explicitly asks:

1. hand confirmed findings to `review-to-fix.md`
2. convert confirmed findings into issue drafts with `review-to-issue.md`

## Follow-up

- Required:
  - none
- Conditional:
  - use `workflows/review-to-fix.md` for confirmed findings that should be fixed now
  - use `workflows/review-to-issue.md` for confirmed findings that should be tracked instead
- Optional:
  - use `deliver.md`
  - use `worklog-update.md`
