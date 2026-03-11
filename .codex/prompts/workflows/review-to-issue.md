# Workflow: Review -> Issue

## Permission Scope

- Code changes are not allowed.
- Documentation changes are not allowed.
- Commits are not allowed.
- Pushes are not allowed.
- PR creation is not allowed.
- GitHub Issue creation is allowed only when the user explicitly asks for it.
- Merge is never allowed.
- Review findings and issue drafts only.

This workflow is for converting code review findings into issue candidates or issue drafts.

## Step 1: Review Intake

Input:

- review findings
- diff, branch, PR, or changed files

Tasks:

1. Read the review findings carefully.
2. Ignore stylistic feedback and non-actionable comments.
3. Keep only findings with concrete risk, defect, regression, or missing validation.

Output:

- filtered findings
- issue-worthy findings

---

## Step 2: Candidate Selection

Selection rules:

1. `P0` and `P1` are default issue candidates.
2. `P2` becomes a candidate only when the user asks to track it.
3. `P3` should normally stay out of the issue tracker unless explicitly requested.
4. If multiple findings share one root cause, prefer one consolidated issue.

Output:

- issue candidates
- duplicates or overlaps

---

## Step 3: Issue Drafting

For each approved candidate produce:

Title

Problem

Why it matters

Reproduction or trigger condition

Affected files

Acceptance criteria

Suggested fix direction

Suggested validation

Priority

---

## Step 4: Optional GitHub Issue Creation

Only if the user explicitly asks:

1. Convert the approved drafts into GitHub Issues.
2. Report created issue links only after creation succeeds.

If the user did not explicitly ask:

- stop at issue drafts

## Follow-up

- Required:
  - none
- Conditional:
  - use `workflows/issue-to-pr.md` if an approved issue should move into implementation
- Optional:
  - use `deliver.md`
  - use `worklog-update.md`
