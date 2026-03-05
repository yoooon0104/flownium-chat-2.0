# 데이터베이스 설계

MongoDB + Mongoose 기반 설계입니다.

## User 스키마

- `kakaoId`: String, unique, required, index
- `nickname`: String, required
- `profileImage`: String
- `lastLoginAt`: Date
- `refreshTokenHash`: String (SHA-256 해시)
- `timestamps: true`

## ChatRoom 스키마

컬렉션: `chatrooms`

- `name`: String, required
- `isGroup`: Boolean, 기본값 `true`
- `memberIds`: `[String]`, 기본값 `[]`
- `lastMessage`: String, 기본값 `""`
- `lastMessageAt`: Date, 기본값 `null`
- `timestamps: true`

인덱스:
- `memberIds` 인덱스
- `lastMessageAt` 인덱스

## Message 스키마

- `chatRoomId`: String, required, index (ChatRoom ObjectId 문자열)
- `senderId`: String
- `senderNickname`: String, required
- `type`: `text | system`, 기본값 `text`
- `text`: String, required
- `timestamp`: Date, index
- `timestamps: true`

## Presence 설계 (online)

- 소켓 서버 메모리 맵으로 관리
- 키: `roomId`
- 값: `Map<userId, Set<socketId>>`
- `online = true` 조건: set 크기 > 0
- 계산 결과를 `room_participants`로 전송
