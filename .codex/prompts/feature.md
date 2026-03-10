## Permission Scope

- Code changes are allowed.
- Documentation changes are allowed when contracts, screens, architecture, or flows are affected.
- Commits are not allowed unless the user explicitly asks for them.
- Pushes are not allowed unless the user explicitly asks for them.
- PR creation is not allowed unless the user explicitly asks for it.
- GitHub Issue creation is not allowed unless the user explicitly asks for it.
- Validation is required after implementation.

You are implementing a feature in the Flownium Chat project.

Before modifying code:

1. Identify the related files.
2. Provide a short change plan (max 5 lines).
3. Confirm scope from the current local documentation and codebase state.

Implementation rules:

- Make minimal changes.
- Do not refactor unrelated code.
- Follow rules in `AGENTS.md`.
- Follow project rules in `docs/development-rules.md`.
- Keep implementation and docs synchronized when contracts, screens, or architecture change.

Validation requirements:

Run:

- `npm run build`

If server files change also run:

- `node --check server/index.cjs`

Output format:

Changed files

Summary of changes

Validation results

Risks / side effects

Rollback method

Next suggested action
