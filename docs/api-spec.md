# API Specification

Base URL: `/api`

## Health

### GET /health
- Server health check
- Response: `{ "ok": true }`

## Auth

### GET /auth/kakao/callback?code=
- Exchange Kakao code and issue access/refresh tokens.

### POST /auth/refresh
- Validate refresh token and rotate tokens.

Request:
```json
{
  "refreshToken": "jwt"
}
```

## ChatRooms

All chatroom APIs require `Authorization: Bearer <accessToken>`.

### POST /chatrooms
- Create group room.
- Creator is added as initial member.

Request:
```json
{
  "name": "Project Meeting"
}
```

Response 201:
```json
{
  "room": {
    "id": "chatroomObjectId",
    "name": "Project Meeting",
    "isGroup": true,
    "memberIds": ["creatorUserId"],
    "lastMessage": "",
    "lastMessageAt": null
  }
}
```

Errors:
- `400` name is required
- `401` unauthorized
- `503` database is not connected
- `500` failed to create chatroom

### GET /chatrooms
- Get rooms where current user is a member.
- Sort: `lastMessageAt desc`, then `createdAt desc`.

Response 200:
```json
{
  "rooms": [
    {
      "id": "chatroomObjectId",
      "name": "Project Meeting",
      "isGroup": true,
      "memberIds": ["u1", "u2"],
      "lastMessage": "hello",
      "lastMessageAt": "2026-03-05T10:00:00.000Z"
    }
  ]
}
```

## Messages

### GET /chatrooms/:id/messages
- Get room messages.
- Auth required.
- Current user must be room member.
- Query: `limit` (default 50, max 100)

Response:
```json
{
  "roomId": "chatroomObjectId",
  "count": 2,
  "messages": [
    {
      "chatRoomId": "chatroomObjectId",
      "senderId": "user-id",
      "senderNickname": "tester",
      "type": "text",
      "text": "hello",
      "timestamp": "2026-03-05T12:00:00.000Z"
    }
  ]
}
```
