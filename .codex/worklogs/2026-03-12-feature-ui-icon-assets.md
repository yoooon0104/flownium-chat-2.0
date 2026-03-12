# 2026-03-12 - UI icon assets first pass

## Summary

- changed the top notification button label from Korean text to a bell emoji
- created a first-pass SVG system icon set under `assets/branding/icons/system/`
- kept the assets neutral with `currentColor` so they can be adapted later in light and dark themes

## Changed Files

- `src/components/InlineIcon.jsx`
- `src/features/notifications/components/NotificationMenu.jsx`
- `src/features/user/components/UserMenu.jsx`
- `src/features/navigation/components/MobileBottomTabBar.jsx`
- `src/App.css`
- `assets/branding/icons/system/back.svg`
- `assets/branding/icons/system/friends.svg`
- `assets/branding/icons/system/rooms.svg`
- `assets/branding/icons/system/notifications.svg`
- `assets/branding/icons/system/settings.svg`
- `assets/branding/icons/system/menu.svg`

## Validation

- `npm run build`

## Notes

- live image generation was not available because `OPENAI_API_KEY` was not set in this environment
- generated SVG icons are intended as a shippable first pass and can later be replaced with AI-generated variants if needed
- adjusted the top notification button so the bell icon sits centered within the 36x36 action button
- split the previous settings icon into a dedicated `theme.svg` and a clearer gear-style `settings.svg`
