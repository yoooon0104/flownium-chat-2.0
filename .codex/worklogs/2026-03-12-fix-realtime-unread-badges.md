## Task
- Fix realtime unread badge behavior for hidden current rooms on mobile

## Problem
- After a room was opened once on mobile, `joinedRoomId` stayed set even when the user moved back to Friends/Rooms/Settings.
- Incoming messages for that room triggered `markRoomRead()` immediately because the code only checked `joinedRoomId`.
- As a result, the rooms badge and per-room unread badge appeared briefly and then cleared right away.

## Change
- Updated `AppShell` so auto-read only runs when the incoming message belongs to the current room **and** the chat surface is actually visible.
- Hidden current rooms on mobile now fall back to `fetchRooms()` so unread counts remain until the user really re-enters the chat.

## Validation
- `npm run build`

