# 2026-03-11 feature-account-delete-flow

## Timestamp
- 2026-03-11 16:35

## Task ID / Branch
- feature: account deletion flow
- branch: `codex/account-delete-flow`

## Task
- added a minimal member account deletion flow across auth API, settings UI, session cleanup, and related data cleanup

## Context
- the user requested a real 회원탈퇴 flow from the existing analyze-to-feature workflow
- the repository rules did not explicitly require a task worklog for feature PRs, so the rule was added in the same task

## Changes
- added `DELETE /auth/account` in `server/routes/auth.routes.cjs`
- wired account deletion cleanup for user, friendship, notification, read-state, direct rooms, and group room membership
- injected the required models and emitters from `server/index.cjs`
- added account deletion client API and auth hook handling
- added delete actions to desktop/mobile settings
- kept the agreed policy that group-room history stays and only membership is removed

## Docs
- `AGENTS.md`
- `docs/development-rules.md`
- `CONTRIBUTING.md`
- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/common/wbs.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Validation
- executed: `npm run build`
- executed: `node --check server/index.cjs`
- executed: `node --check server/routes/auth.routes.cjs`
- follow-up: verify with two real accounts that direct rooms disappear, group rooms keep history, and friend/room lists refresh as expected after deletion

## Open risks
- no live multi-account verification yet for account deletion side effects
- surviving group rooms keep historical messages from the deleted user by design; if product policy changes, message cleanup rules will need a separate pass

## Next
- update the existing PR branch and PR body to include the new worklog/rule sync
- run a real two-account deletion scenario before merge if possible
