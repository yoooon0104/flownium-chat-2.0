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

For each issue produce:

Title

Description

Severity

Affected files

Recommendation

Acceptance criteria

Priorities:

P0 security or data loss
P1 production bugs
P2 test or DX issues
P3 refactoring
