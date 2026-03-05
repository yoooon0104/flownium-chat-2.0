# Database Design

MongoDB + Mongoose based design.

## User Schema

- `kakaoId`: String, unique, required, index
- `nickname`: String, required
- `profileImage`: String
- `lastLoginAt`: Date
- `refreshTokenHash`: String (SHA-256 hash)
- `timestamps: true`

## ChatRoom Schema

Collection: `chatrooms`

- `name`: String, required
- `isGroup`: Boolean, default `true`
- `memberIds`: `[String]`, default `[]`
- `lastMessage`: String, default `""`
- `lastMessageAt`: Date, default `null`
- `timestamps: true`

Indexes:
- `memberIds` index
- `lastMessageAt` index

## Message Schema

- `chatRoomId`: String, required, index (stores ChatRoom ObjectId string)
- `senderId`: String
- `senderNickname`: String, required
- `type`: `text | system`, default `text`
- `text`: String, required
- `timestamp`: Date, index
- `timestamps: true`

## Presence Design (Online)

- In-memory map managed by socket server
- Key: `roomId`
- Value: `Map<userId, Set<socketId>>`
- `online = true` when set size > 0
- Recalculated and emitted as `room_participants`
