# Workflow: Issue -> Implementation -> PR

## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when they are required to keep the repository synchronized with the implementation.
- Commits are allowed when the workflow reaches a completed implementation state.
- Pushes are allowed only when the user explicitly asks for them.
- PR creation is allowed only when the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Validation is required before completion.

This workflow describes how an AI agent should convert a GitHub Issue into an implementation pull request.

## Step 1: Issue Analysis

Input:
- GitHub Issue

Tasks:

1. Read the issue description.
2. Identify related components.
3. Identify affected files.
4. Identify risks.
5. Generate an implementation plan.

Output:

- problem summary
- implementation plan
- affected files

---

## Step 2: Implementation

Follow rules in:

- `AGENTS.md`
- `docs/development-rules.md`

Implementation rules:

- make minimal changes
- avoid unrelated refactors
- maintain API compatibility unless the issue explicitly requires a contract change

After coding run:

- `npm run build`

Server validation when needed:

- `node --check server/index.cjs`

---

## Step 3: Code Review

Run an internal review using:

- `.codex/prompts/review.md`

Check for:

- regressions
- logic errors
- API compatibility issues
- missing documentation updates

---

## Step 4: PR Creation

Create a PR summary using this format:

Title
<feature or fix title>

Summary
<problem description>

Changed Files
- <file path>

What’s Included
- <implementation details>

Impact
- <affected components>

Validation
- <lint/build/test results>

Branch / Commit
- Branch: <branch-name>
- Commit: <commit-sha>
- Push: <remote status>

PR
- <pull request url or compare url>
