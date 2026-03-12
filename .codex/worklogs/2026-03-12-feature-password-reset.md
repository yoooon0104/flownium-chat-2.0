# 2026-03-12 Feature Worklog - Email Password Reset

## Summary

- Added a first-pass email password reset flow based on verification codes.
- Reused the existing development pattern: no real SMTP yet, debug code available in development.
- Kept the flow minimal by returning users to the login screen after a successful reset instead of auto-login.

## Changed Files

- `server/models/passwordresetverification.model.cjs`
- `server/index.cjs`
- `server/routes/auth.routes.cjs`
- `src/services/api/authApi.js`
- `src/features/auth/hooks/useKakaoAuth.js`
- `src/features/auth/components/LoginGate.jsx`
- `src/features/auth/components/LoginGate.css`
- `src/app/AppShell.jsx`
- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`
- `docs/common/wbs.md`

## What Changed

- Added password reset start/verify APIs for verified email identities.
- Added `PasswordResetVerification` to store pending reset codes and the next password hash.
- Invalidated stored refresh tokens when a password reset is completed.
- Added a password reset tab to the login gate with development debug code display.
- Documented the new API, screen flow, object, architecture, and milestone status.

## Validation

- `node --check server/routes/auth.routes.cjs`
- `node --check server/models/passwordresetverification.model.cjs`
- `node --check server/index.cjs`
- `npm run build`
