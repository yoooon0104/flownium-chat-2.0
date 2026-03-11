## Permission Scope

- Code changes are not allowed.
- Documentation changes are not allowed.
- Commits are not allowed.
- Pushes are not allowed.
- PR creation is not allowed.
- GitHub Issue creation is not allowed unless the user explicitly asks for it after the review.
- Merge is never allowed.
- Review findings output only.

You are performing a code review.

Rules:

Do not modify code.

Report only meaningful issues.

Ignore stylistic preferences.

Prefer findings with concrete defect risk, regression risk, or missing validation.

Severity levels:

P0
Security issue
Data loss
Broken production path

P1
Crash
Logic error
Major regression risk

P2
Edge case bug
Test gap
Validation gap

P3
Maintainability issue

Output format:

Severity

File

Line

Issue

Why it matters

Suggested fix

Suggested validation

If no problems exist output:

No actionable issues found

Follow-up:

- Required:
  - none
- Conditional:
  - use `workflows/review-to-validate.md` if findings should be checked before fixing or tracking
  - use `workflows/review-to-fix.md` if a confirmed finding should be fixed immediately
  - use `workflows/review-to-issue.md` if confirmed findings should become tracked issues
- Optional:
  - use `deliver.md` if the review result should be reported in a stable summary
