# Contributing

This document defines the collaboration workflow for the Flownium Chat project.

## 1. Branch Rules

1. Do not work directly on `main`.
2. Use focused branches.
3. Use the following prefixes:
   - `feat/*` for features
   - `fix/*` for bug fixes
   - `docs/*` for documentation work
4. Keep one primary purpose per branch.

## 2. Standard Workflow

1. Create a working branch.
2. Implement the change.
3. Run relevant validation.
4. Commit the change.
5. Push the branch.
6. Share PR information after push is complete.
7. Merge only after review or explicit confirmation.

## 3. Pre-PR Checklist

1. `npm run build` passes when frontend code changes.
2. Relevant documentation is updated in the same task.
3. Korean comments and documents are saved in UTF-8.
4. No unrelated files are mixed into the branch.
5. Validation results are recorded in the PR summary.
6. A task-specific worklog under `.codex/worklogs/` is added or updated when the task changed code, docs, validation status, or release readiness.
7. If the PR resolves a GitHub Issue, include a closing keyword such as `Closes #123` in the PR body.

## 4. PR Summary Format

Title  
<commit or PR title>

Summary  
<purpose and overview>

Changed Files  
- <file path>

What’s Included  
- <implemented changes>

Impact  
- <affected areas>

Validation  
- <tests or verification results>

Branch / Commit  
- Branch: <branch-name>  
- Commit: <commit-sha>  
- Push: <remote status>

PR  
- <pull request url or compare url>

Issue Closure  
- <`Closes #123` or `None`>

## 5. Merge and Incident Rules

1. Do not merge before the PR stage is complete.
2. If an operational issue occurs, document root cause, mitigation, and prevention.
3. If a documentation review reveals a code issue, track it separately instead of hiding it inside a docs-only change.
