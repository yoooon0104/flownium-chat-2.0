# Working Logs

This folder stores task-specific working logs for Codex-assisted work.

Purpose
- keep one log file per task, issue, or branch
- make handoff easier for another collaborator
- separate collaboration logs from project-facing documentation

Naming
- use `YYYY-MM-DD-{short-task-name}.md`
- examples:
  - `2026-03-11-issue-49-history-cursor.md`
  - `2026-03-11-feature-mobile-settings.md`
  - `2026-03-11-bugfix-room-scroll.md`

Usage rules
- update an existing file for the same task instead of creating duplicates
- record actual work only
- include validation that was actually executed
- include the next concrete action when the task is not finished

Suggested structure

```md
# 2026-03-11 issue-49-history-cursor

## Context
- why this task exists

## Changes
- files changed
- key decisions

## Validation
- commands run
- results

## Risks
- remaining concerns

## Next
- next concrete step
```
