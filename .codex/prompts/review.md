## Permission Scope

- Code changes are not allowed.
- Documentation changes are not allowed.
- Commits are not allowed.
- Pushes are not allowed.
- PR creation is not allowed.
- GitHub Issue creation is not allowed unless the user explicitly asks for it after the review.
- Review findings output only.

You are performing a code review.

Rules:

Do not modify code.

Report only meaningful issues.

Ignore stylistic preferences.

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

P3
Maintainability issue

Output format:

Severity

File

Line

Issue

Why it matters

Suggested fix

If no problems exist output:

No actionable issues found
