# 2026-03-11 issue-autoclose-guidance

## Timestamp
- 2026-03-11 17:35

## Task ID / Branch
- branch: `codex/issue-autoclose-guidance`

## Task
- investigated why a merged PR did not auto-close its linked issue and added guidance to prevent the same mistake

## Context
- PR #60 was merged, but issue #58 remained open
- the merged PR body did not include `Fixes #58` / `Closes #58` or any other GitHub closing keyword
- current repository rules and issue-to-pr workflow did not explicitly require issue-closing keywords

## Changes
- added an AGENTS rule requiring a closing keyword in PR bodies when a PR is meant to resolve a tracked issue
- added a CONTRIBUTING checklist item and summary section for issue closure
- updated `.codex/prompts/workflows/issue-to-pr.md` to require an issue-closing line in PR delivery

## Docs
- `AGENTS.md`
- `CONTRIBUTING.md`
- `.codex/prompts/workflows/issue-to-pr.md`

## Validation
- executed: reviewed merged PR #60 body via GitHub API and confirmed the closing keyword was missing
- follow-up: close issue #58 manually and use the new rule in the next issue-linked PR

## Open risks
- older open PRs may still be missing closing keywords and will need manual cleanup if they are merged as-is

## Next
- close issue #58 manually because the merged PR will not retroactively auto-close it on its own
- include `Closes #...` in future issue-linked PR bodies
