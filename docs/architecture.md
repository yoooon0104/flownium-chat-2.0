# Architecture

## System Structure

Client (React + Vite)
-> Socket.IO Client + REST fetch
-> Express + Socket.IO Server
-> MongoDB

## Communication Split

### REST API
- `GET /api/health`
- `POST /api/chatrooms`
- `GET /api/chatrooms`
- `GET /api/chatrooms/:id/messages`
- `GET /auth/kakao/callback`
- `POST /auth/refresh`

### WebSocket
- `join_room`
- `room_joined`
- `room_participants`
- `send_message`
- `receive_message`
- `error`

## Group Chat Flow

1. User authenticates and gets access token.
2. Client fetches room list with REST.
3. Client joins selected room with `join_room`.
4. Server ensures membership and joins socket room.
5. Server emits `room_participants` using DB members + socket presence.
6. Client sends message via `send_message`.
7. Server stores message, updates room summary, broadcasts `receive_message`.

## Current Constraints

- No admin/invite/kick model in this phase.
- Membership is appended on `join_room`.
- Presence state is in-memory and reset on server restart.
