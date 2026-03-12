# 2026-03-12 - room list unread visibility

## Goal
- Make the room list unread count easier to notice.
- Stop showing the room-list loading message when new messages arrive and rooms are already visible.
- Show the direct-room counterpart profile image in the room list when it exists.
- Make the composer send button readable even when text rendering is unreliable.

## Changes
- Removed the room-list and friend-list loading copy instead of showing transient loading text.
- Updated room refresh to stay in background mode when the list is already visible.
- Switched room unread badges to a simpler solid brand-primary circle with white text.
- Added direct-room `profileImage` to room responses and rendered it in the room list avatar.
- Kept the composer send button as the `전송` text label and switched it to a solid brand-primary style so it stays readable in light mode.
- Guarded mobile back navigation so a delayed room-join response does not re-open the chat view.
- Restored garbled Korean copy in `ChatPanel.jsx` with UTF-8-safe strings.

## Validation
- `node --check server/routes/chatroom.routes.cjs`
- `node --check server/index.cjs`
- `npm run build`
