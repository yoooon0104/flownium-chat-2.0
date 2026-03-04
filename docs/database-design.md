# Database Design

MongoDB + Mongoose 기반 설계

---

## User Schema

- kakaoId (unique)
- nickname
- profileImage
- lastLoginAt
- timestamps: true

---

## ChatRoom Schema

- participants: [ObjectId]
- roomKey: String (unique)
- isAnonymous: Boolean
- isTimed: Boolean
- expiresAt: Date
- isGroup: Boolean
- ownerId: ObjectId
- lastMessage: String
- lastMessageAt: Date
- timestamps: true

### roomKey Rule

1:1 채팅일 경우
participants 2명의 ObjectId를 정렬 후 조합하여 생성

예:
sortedIds.join(":")

roomKey는 unique index 적용

---

## Message Schema

- chatRoomId (index)
- senderId (nullable)
- senderNickname
- type: text | system
- text
- timestamp
- timestamps: true

---

## TTL Policy (Timed Room)

expiresAt 필드에 TTL Index 적용

expireAfterSeconds = 0