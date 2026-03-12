# 2026-03-12 Fix Worklog - Friend Search Email Only and Settings Email Display

## Summary

- Changed friend search to use email only instead of mixed nickname/email matching.
- Added read-only email display to desktop and mobile settings screens.
- Rewrote settings components in UTF-8 to keep Korean copy readable.

## Changed Files

- `server/routes/friend.routes.cjs`
- `src/features/friends/components/AddFriendModal.jsx`
- `src/features/user/components/SettingsModal.jsx`
- `src/features/user/components/SettingsScreen.jsx`
- `docs/common/api-spec.md`
- `docs/planning/screen-spec.md`
- `docs/common/wbs.md`

## What Changed

- Updated `/api/friends/search` to query by `email` only.
- Updated friend search modal copy and placeholder to guide email-based search.
- Added an email field to settings modal/screen as read-only account information.
- Cleaned up the settings component text while rewriting them in UTF-8.

## Validation

- `node --check server/routes/friend.routes.cjs`
- `npm run build`
