# API Specification

Base URL: `/api`

## Health

### GET /health
- 서버 상태 확인
- Response: `{ "ok": true }`

## Messages

### GET /chatrooms/:id/messages
- 채팅방 메시지 히스토리 조회
- Query: `limit` (기본 50, 최대 100)
- DB 미연결 시 `503` 반환

Response:
```json
{
  "roomId": "room-1",
  "count": 2,
  "messages": [
    {
      "chatRoomId": "room-1",
      "senderId": "socket-id",
      "senderNickname": "user-ab123",
      "type": "text",
      "text": "hello",
      "timestamp": "2026-03-04T12:00:00.000Z"
    }
  ]
}
```

## Planned APIs

- `GET /chatrooms`
- `POST /chatrooms`
- `GET /chatrooms/:id`
- `GET /users/me`
- `GET /users/search?keyword=`
- `GET /auth/kakao/callback`
- `POST /auth/refresh`