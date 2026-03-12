# 2026-03-12 Feature Worklog - Kakao Account Linking

## Summary

- Added a first-pass Kakao account linking flow for users who signed up with email.
- Kept login identity mapping explicit: no automatic merge by email.
- Exposed linked providers in the authenticated user payload so settings UI can reflect connection state.

## Changed Files

- `server/routes/auth.routes.cjs`
- `server/services/auth.service.cjs`
- `src/services/api/authApi.js`
- `src/features/auth/hooks/useKakaoAuth.js`
- `src/domain/user/UserProfile.js`
- `src/app/AppShell.jsx`
- `src/features/user/components/SettingsModal.jsx`
- `src/features/user/components/SettingsScreen.jsx`
- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`
- `docs/common/wbs.md`

## What Changed

- Added `POST /auth/kakao/link/start` to issue a short-lived link token and return a Kakao authorize URL.
- Extended Kakao callback handling so `state` can complete account linking with `LINK_SUCCESS`.
- Added `issueLinkToken` / `verifyLinkToken` helpers to the auth service.
- Included `linkedProviders` in `/auth/me`, profile update responses, and auth callback responses.
- Added a Kakao link action to desktop/mobile settings screens.
- Documented the new API branch, settings behavior, and milestone status.

## Validation

- `node --check server/routes/auth.routes.cjs`
- `node --check server/services/auth.service.cjs`
- `npm run build`

## Notes

- This task only adds linking. Unlinking and merge-policy follow-up remain separate backlog items.
- Existing Kakao login and email login flows remain separate unless the currently logged-in user explicitly links Kakao from settings.
