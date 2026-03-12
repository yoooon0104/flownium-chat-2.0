# 2026-03-12 - Revert auth typography tuning

## Summary

- reverted the `#83` auth typography tuning so the login/auth screens match the preferred production look more closely
- removed the explicit `Sora` font loading and the tighter/lighter login CTA typography adjustments introduced in that change

## Changed Files

- `index.html`
- `src/index.css`
- `src/features/auth/components/LoginGate.css`

## Validation

- `npm run build`

## Notes

- this revert is intentionally limited to auth typography and font loading
- email signup/login, password reset, kakao link/unlink, and other account flows are unchanged
