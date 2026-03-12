# 2026-03-12 - Notification hub polish

## Summary

- stopped creating room invite notifications in chat room flows
- hid legacy room invite notifications from the notification API and client state
- tightened notification dropdown/mobile spacing and improved notification text hierarchy

## Changed Files

- `server/routes/chatroom.routes.cjs`
- `server/routes/notification.routes.cjs`
- `src/app/AppShell.jsx`
- `src/App.css`
- `src/features/notifications/components/NotificationMenu.jsx`
- `src/features/notifications/components/NotificationsScreen.jsx`
- `src/features/notifications/hooks/useNotifications.js`
- `docs/common/api-spec.md`
- `docs/common/socket-events.md`
- `docs/common/ui-plan.md`
- `docs/common/wbs.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Validation

- `node --check server/routes/chatroom.routes.cjs`
- `node --check server/routes/notification.routes.cjs`
- `npm run build`
