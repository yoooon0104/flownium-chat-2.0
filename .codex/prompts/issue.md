## Permission Scope

- Code changes are not allowed.
- Documentation changes are not allowed.
- Commits are not allowed.
- Pushes are not allowed.
- PR creation is not allowed.
- GitHub Issue creation is allowed only when the user explicitly asks for it.
- By default, issue drafting and issue analysis only.

Analyze the repository and generate potential issues.

Process:

1. Scan repository structure.
2. Identify code smells, bugs, or missing tests.
3. Check API and socket spec consistency.
4. Check documentation synchronization.
5. Prefer issues that are concrete, reproducible, and actionable.

For each issue produce a GitHub-issue-ready draft with this format:

Title

Summary

Severity

Problem

Why it matters

Reproduction or trigger condition

Expected behavior

Affected files

Scope / impact

Recommendation

Acceptance criteria

Suggested labels

Suggested priority

Priorities:

P0 security or data loss
P1 production bugs
P2 test or DX issues
P3 refactoring

Issue drafting rules:

1. Prefer one issue per root cause.
2. Consolidate duplicates when multiple findings describe the same problem.
3. Do not create vague backlog items without a concrete failure mode or gap.
4. Include enough detail that the issue can be implemented without re-running the full review.
5. If the user explicitly asks to create GitHub Issues, use the same structure as the issue body.
