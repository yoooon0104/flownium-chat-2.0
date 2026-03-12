## Task
- Email change flow for authenticated email accounts

## Scope
- Add authenticated start/verify email change APIs
- Connect account UI to email change flow
- Update API/screen/object/WBS docs

## Decisions
- Email change is available only when an `AuthIdentity(email)` exists
- Current password confirmation is required before issuing a verification code
- Verification uses the same 6-digit, 10-minute, 60-second resend policy as other auth codes
- In development, `debugCode` may be returned for local testing

## Validation
- `node --check server/routes/auth.routes.cjs`
- `node --check server/models/emailchangeverification.model.cjs`
- `node --check server/index.cjs`
- `npm run build`

## Notes
- The implementation keeps email change orchestration in `AppShell` to avoid expanding the auth hook scope for this task.
