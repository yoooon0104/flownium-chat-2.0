# API Specification

Base URL: `/api`

## Health

### GET /health
- 서버 상태 확인
- Response: `{ "ok": true }`

## Auth

### GET /auth/kakao/callback?code=
- 카카오 OAuth callback code를 서버에서 처리
- 카카오 사용자 정보 조회 후 User upsert
- Access/Refresh 토큰 발급

Response:
```json
{
  "user": {
    "id": "user-id",
    "kakaoId": "123456789",
    "nickname": "tester",
    "profileImage": "https://..."
  },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

### POST /auth/refresh
- refresh token 검증 후 access/refresh 재발급

Request:
```json
{
  "refreshToken": "jwt"
}
```

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
      "senderId": "user-id",
      "senderNickname": "tester",
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