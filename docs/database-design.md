# Database Design

MongoDB + Mongoose 기반 설계

## Message Schema (현재 구현)

- `chatRoomId`: String, required, index
- `senderId`: String, nullable
- `senderNickname`: String, required
- `type`: `text | system`, 기본값 `text`
- `text`: String, required
- `timestamp`: Date, index
- `timestamps: true`

## Planned Schema

### User
- `kakaoId` (unique)
- `nickname`
- `profileImage`
- `lastLoginAt`
- `timestamps: true`

### ChatRoom
- `participants: [ObjectId]`
- `roomKey: String (unique)`
- `isAnonymous: Boolean`
- `isTimed: Boolean`
- `expiresAt: Date`
- `isGroup: Boolean`
- `ownerId: ObjectId`
- `lastMessage: String`
- `lastMessageAt: Date`
- `timestamps: true`

### roomKey Rule
- 1:1 채팅은 participants 2명의 ID를 정렬 후 `:`로 결합
- 예: `sortedIds.join(':')`
- `roomKey` unique index 적용

## TTL Policy (Timed Room)

- `expiresAt`에 TTL index 적용
- `expireAfterSeconds = 0`