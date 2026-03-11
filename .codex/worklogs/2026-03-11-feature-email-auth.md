# 2026-03-11 - Email auth phase 1

## Summary

- Added phase 1 email auth with signup start, verification, and email login.
- Kept pending signup data in `EmailVerification` and created `User + AuthIdentity(email)` only after verification succeeds.
- Used console/log and DB-backed verification flow for development instead of SMTP.
- Kept Kakao login and email login separate without automatic account linking.
- Follow-up UX fix: split email login errors into clearer cases and exposed `debugCode` in the login screen during development.

## Files

- `server/models/emailverification.model.cjs`
- `server/models/authidentity.model.cjs`
- `server/routes/auth.routes.cjs`
- `server/services/auth.service.cjs`
- `server/index.cjs`
- `src/services/api/authApi.js`
- `src/features/auth/hooks/useKakaoAuth.js`
- `src/features/auth/components/LoginGate.jsx`
- `src/features/auth/components/LoginGate.css`
- `src/app/AppShell.jsx`
- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/common/wbs.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Validation

- `node --check server/routes/auth.routes.cjs`
- `node --check server/services/auth.service.cjs`
- `node --check server/models/emailverification.model.cjs`
- `node --check server/index.cjs`
- `npm run build`

## Notes

- This phase still excludes real email delivery, password reset, email change, and Kakao account linking.
- In development, the verification code is now available in both the server log and the signup response/UI as `debugCode`.
- GitHub CLI was installed locally but not exposed on PATH, so PR creation used `C:\Program Files\GitHub CLI\gh.exe` directly.
- Follow-up backlog note added: friend search should later move from nickname-based lookup to email-based lookup.
