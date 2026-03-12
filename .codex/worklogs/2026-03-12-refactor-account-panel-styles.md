# 2026-03-12 - Refactor account and menu styles

## Summary

- moved `AccountPanel`-specific styles out of `src/App.css` into a dedicated component stylesheet
- moved `NotificationMenu` and `UserMenu` styles next to their components
- kept the settings theme control as a native dropdown and applied app-specific select styling instead of changing the control type
- kept shared modal, settings shell, and app-shell styles in `App.css`
- aimed to reduce accidental style bleed from account polishing into unrelated screens such as login

## Changed Files

- `src/App.css`
- `src/features/user/components/AccountPanel.jsx`
- `src/features/user/components/AccountPanel.css`
- `src/features/notifications/components/NotificationMenu.jsx`
- `src/features/notifications/components/NotificationMenu.css`
- `src/features/user/components/UserMenu.jsx`
- `src/features/user/components/UserMenu.css`
- `src/features/user/components/SettingsScreen.jsx`
- `src/features/user/components/SettingsModal.jsx`

## Validation

- `npm install`
- `npm run build`

## Notes

- `npm install` was run to repair a broken local Vite/Rolldown install before validation
- no API, route, or data-flow changes were made in this task
