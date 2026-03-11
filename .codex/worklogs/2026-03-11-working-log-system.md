# 2026-03-11 working-log-system

## Context
- the current prompt chain treated worklog updates as a shared project doc update
- the intended behavior is a task-specific working log folder for collaborator handoff

## Changes
- added `.codex/worklogs/` as the default working log location
- updated worklog prompt rules to use one file per task, issue, or branch
- updated `feature.md`, `bugfix.md`, `deliver.md`, and `workflows/issue-to-pr.md` to call `worklog-update.md` in the normal flow
- added `.codex/worklogs/README.md` to define naming and usage rules

## Validation
- prompt files reviewed locally
- no runtime validation required beyond file consistency for this prompt/docs change

## Risks
- `.codex/prompts/README.md` still reflects the older shared-log wording and should be aligned later if that guide is actively used

## Next
- use `.codex/worklogs/` for new task-level logs instead of defaulting to `docs/operations/worklog.md`
