# 2026-03-12 - Kakao account unlink

## Summary

- added kakao account unlink API for authenticated users
- blocked unlink when kakao would be the last remaining login provider
- exposed unlink action in account management UI
- adjusted the account hero card layout so the profile image is larger and vertically centered with the text block

## Changed Files

- `server/routes/auth.routes.cjs`
- `src/services/api/authApi.js`
- `src/features/auth/hooks/useKakaoAuth.js`
- `src/features/user/components/AccountPanel.jsx`
- `src/features/user/components/AccountScreen.jsx`
- `src/features/user/components/ProfileModal.jsx`
- `src/app/AppShell.jsx`
- `src/App.css`
- `docs/common/api-spec.md`
- `docs/planning/screen-spec.md`
- `docs/common/wbs.md`

## Validation

- `node --check server/routes/auth.routes.cjs`
- `node --check server/services/auth.service.cjs`
- `npm run build`
