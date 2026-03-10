# Flownium Chat Architecture

This document gives AI agents a compact, implementation-oriented view of the current system architecture.

## System Overview

Flownium Chat currently consists of these runtime layers:

- Frontend: React + Vite
- API Server: Express
- Realtime Server: Socket.IO running in the same Node process
- Database: MongoDB + Mongoose
- Deployment: Vercel (frontend), Render (backend), MongoDB Atlas (database)

The product currently supports:

- Kakao-based login and onboarding
- Friend-based direct chat
- Group chat creation from selected friends
- Notification hub
- Room-level and message-level unread count foundation
- Mobile notification screen
- Mobile bottom tab bar

## Runtime Flow

Frontend (`src/`)
-> API clients (`src/services/api/*`)
-> Socket client (`src/services/socket/chatSocketClient.js`)
-> Express/Socket server (`server/index.cjs`)
-> MongoDB

## Frontend Structure

### App Layer

- `src/app/AppShell.jsx`
  - top-level screen composition
  - desktop/mobile view switching
  - friend/room/notification/settings state coordination
  - realtime message, unread, and notification sync coordination

### Feature Layers

- `src/features/auth`
  - Kakao login
  - onboarding
  - session restore
- `src/features/chat`
  - room list
  - chat panel
  - create room modal
  - room/message/socket hooks
- `src/features/friends`
  - add friend modal
  - friend action sheet
  - friend hooks
- `src/features/notifications`
  - notification dropdown
  - mobile notification screen
  - notification hooks
- `src/features/navigation`
  - mobile bottom tab bar
- `src/features/user`
  - user menu
  - profile modal
  - settings modal

### Domain / Service Layers

- `src/domain/AuthSession.js`
- `src/domain/UserProfile.js`
- `src/services/api/authApi.js`
- `src/services/api/chatApi.js`
- `src/services/socket/chatSocketClient.js`

## Backend Structure

- `server/index.cjs`
  - Express entrypoint
  - Socket.IO event wiring
  - user socket mapping and room presence
  - realtime notification and friendship update broadcasting
- `server/routes/auth.routes.cjs`
  - Kakao callback
  - signup complete
  - refresh
  - me/profile
- `server/routes/chatroom.routes.cjs`
  - room list/create
  - message list
  - read-state update
- `server/routes/friend.routes.cjs`
  - friend search
  - request
  - accept/reject/block
- `server/routes/notification.routes.cjs`
  - notification list
  - mark read
- `server/services/auth.service.cjs`
  - JWT and token helpers
- `server/services/kakao.service.cjs`
  - Kakao API exchange and profile fetch
- `server/utils/error-response.cjs`
  - common API error shape

## Core Data Objects

- `User`
  - `kakaoId`, `email`, `nickname`, `profileImage`, `refreshTokenHash`
- `Friendship`
  - `requesterId`, `addresseeId`, `pairKey`, `status`
- `Notification`
  - `userId`, `type`, `payload`, `isRead`, `readAt`
- `ChatRoom`
  - `name`, `memberIds`, `lastMessage`, `lastMessageAt`, `isGroup`
- `Message`
  - `chatRoomId`, `senderId`, `senderNickname`, `text`, `timestamp`
- `ChatReadState`
  - `roomId`, `userId`, `lastReadAt`

## Realtime Model

### Room Presence

- The server keeps room presence in memory.
- Effective shape:
  - `roomId -> Map<userId, Set<socketId>>`
- `room_participants` exposes room members plus online/offline state.
- `room_joined` now includes an initial participants snapshot so the UI can render participant count immediately.

### User Notification Rooms

- Each authenticated user joins a private socket room:
  - `user:<userId>`
- This is used for:
  - `notification_created`
  - `notification_read`
  - `friendship_updated`

### Message Flow

1. User sends `send_message`
2. Server validates membership
3. Message is stored in MongoDB
4. ChatRoom metadata is updated
5. `receive_message` is emitted
6. Frontend behavior splits by room:
   - current room: append immediately and update unread/read state
   - other rooms: refresh room list and unread counts

## Unread Strategy

Unread behavior is based on `ChatReadState`.

- Room list API returns per-room `unreadCount`
- Room list API also returns `totalUnreadCount`
- Message list response includes per-message `unreadCount`
- Entering a room triggers read-state updates after message history is loaded
- Current room incoming messages are marked read immediately after receipt
- Optimistic local messages may show a temporary expected unread count before the confirmed server payload arrives

## Security Model

- REST uses JWT bearer auth
- Socket handshake also uses JWT auth
- Unauthorized and invalid requests should use standard `error.code` responses when possible
- Kakao OAuth redirect URIs must match exactly across frontend, backend, and Kakao console configuration

## Current Constraints

- Profile image editing/upload is not implemented yet
- Settings still uses modal-first UX and is expected to move toward a dedicated screen
- Anonymous chat is planned but not implemented
- `leave_room` is not implemented yet
- Presence is memory-based and not multi-instance safe
- Some realtime behavior still needs real two-account validation in production-like conditions

## Current Working Policy

- Work in small, focused branches
- Do not commit directly to `main`
- Push before sharing PR information
- Keep Korean code comments in UTF-8
- Keep implementation and docs synchronized in the same task when contracts or flows change

## Key Reference Documents

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/development-rules.md`
- `docs/common/architecture.md`
- `docs/common/api-spec.md`
- `docs/common/socket-events.md`
- `docs/common/wbs.md`
