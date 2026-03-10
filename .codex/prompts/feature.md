## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when contracts, screens, architecture, or flows are affected.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Merge is never allowed unless the user explicitly asks for it.
- Validation is required after implementation.

You are implementing a feature in the Flownium Chat project.

Before modifying code:

1. Identify the related files.
2. Provide a short change plan.
3. Confirm scope from the current local documentation and codebase state.
4. Identify likely documentation updates if contracts, screens, or architecture may change.

Implementation rules:

- Make minimal changes.
- Do not refactor unrelated code.
- Follow rules in `AGENTS.md`.
- Follow project rules in `docs/development-rules.md`.
- Keep implementation and docs synchronized when contracts, screens, or architecture change.
- Call out realtime validation needs when unread, presence, notification, or socket flow changes.

Validation requirements:

Run:

- `npm run build`

If server files change also run:

- `node --check server/index.cjs`

Follow-up:

- Required:
  - use `validate.md`
- Conditional:
  - use `docs-sync.md` if contracts, screens, architecture, or object meaning changed
  - use `realtime-verify.md` if the feature affects unread, notifications, presence, direct room reuse, group room flow, or socket behavior
- Optional:
  - use `deliver.md` for final reporting
  - use `worklog-update.md` if the branch may be handed off or the task history should be preserved

Output format:

Changed files

Summary of changes

Documentation impact

Validation results

Risks / side effects

Rollback method

Next suggested action

Worklog recommendation
