# AGENTS

This document defines how AI agents should operate in this repository.

Agents must review `docs/development-rules.md` before changing code, documentation, or configuration. For branching, PR, and merge flow, follow `CONTRIBUTING.md`.

## 0. Prompt Permission Rule

1. When a prompt file under `.codex/prompts/` defines a `Permission Scope` section, that scope must be followed for the current task.
2. Prompt-level permission rules narrow behavior for that task and should be treated as stricter, task-specific limits.
3. If a dangerous action is not explicitly allowed by the active prompt, treat it as disallowed by default.
4. Dangerous actions include:
   - code changes
   - documentation changes
   - commits
   - pushes
   - PR creation
   - GitHub Issue creation

## 1. Working Principles

1. Prefer the smallest change that solves the problem.
2. Do not refactor unrelated code.
3. Do not add speculative improvements.
4. Do not add dependencies unless they are required by the task.
5. If something is unclear, inspect files, logs, and configuration before making assumptions.
6. Do not report a change as applied until the file content or command result confirms it.

## 2. Editing and Verification

1. After modifying a file, re-read the relevant lines to confirm the intended change is actually present.
2. Files that contain Korean text must be saved in UTF-8.
3. If exact string replacement fails twice, stop repeating it and switch to another method.
4. Prefer block-level or file-level rewrites over fragile partial insertion when section boundaries are unstable.
5. Keep comments in code aligned with the implemented behavior in the same change.

## 3. Permission and Tool Use

1. If a change is blocked by permissions, do not keep retrying the same failing method.
2. Use an alternative method such as `apply_patch`, explicit UTF-8 write, regex replacement, or block rewrite when appropriate.
3. Permission justifications must be written in Korean.
4. Do not run destructive actions unless explicitly requested.
5. Do not push or merge unless explicitly instructed.
6. If `gh` is not available on PATH but GitHub CLI is installed, use the explicit executable path `C:\Program Files\GitHub CLI\gh.exe`.

## 4. Reporting Rules

1. Share PR information only after commit and push are both complete.
2. Reports must include changed files, summary, validation, branch/commit, and PR or compare link.
3. If something failed or was not applied, state that first and clearly.
4. When a task changes code, docs, validation status, or release readiness, update a task-specific worklog under `.codex/worklogs/` in the same task.
5. When a PR is intended to resolve a tracked GitHub Issue, include a closing keyword such as `Closes #123` in the PR body.

## 5. Validation Baseline

1. Run the narrowest useful validation for the task.
2. Use `npm run build` as the default frontend validation when UI code changes.
3. Use `node --check` for touched server entrypoints, routes, or models when backend code changes.
4. When realtime behavior changes, prefer multi-account or multi-tab validation if feasible.
