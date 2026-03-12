## Task
- Polish account management UI without affecting unrelated screens.

## Changes
- Rebuilt `AccountPanel` structure so feedback appears near the top instead of the bottom.
- Added a compact login-method status section for email and Kakao linkage.
- Grouped Kakao actions more clearly and kept all changes inside `AccountPanel.jsx` / `AccountPanel.css`.
- Avoided touching global auth or chat styles.

## Files
- `src/features/user/components/AccountPanel.jsx`
- `src/features/user/components/AccountPanel.css`

## Validation
- `npm run build`
