## Task
- Fix chat room entry scroll so the view lands at the true bottom instead of stopping slightly above the last message.

## Changes
- Switched room-entry bottom alignment from `messagesEndRef.scrollIntoView()` to direct viewport scrolling with `scrollTop = scrollHeight`.
- Updated `ChatPanel` to expose and use the actual history viewport ref, so `AppShell` can scroll the container itself.
- Kept older-history restore logic intact.

## Files
- `src/app/AppShell.jsx`
- `src/features/chat/components/ChatPanel.jsx`

## Validation
- `npm run build`
