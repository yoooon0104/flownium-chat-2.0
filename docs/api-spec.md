# API 명세

기본 경로: `/api`

## 상태 확인

### GET /health
- 서버 상태 확인
- 응답: `{ "ok": true }`

## 인증

### GET /auth/kakao/callback?code=
- 카카오 인가 코드를 교환해 Access/Refresh 토큰을 발급합니다.

### POST /auth/refresh
- Refresh 토큰 검증 후 Access/Refresh 토큰을 재발급합니다.

요청 예시:
```json
{
  "refreshToken": "jwt"
}
```

## 채팅방

모든 채팅방 API는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

### POST /chatrooms
- 그룹방 생성
- 생성자는 초기 멤버로 자동 등록

요청 예시:
```json
{
  "name": "프로젝트 회의방"
}
```

응답 201:
```json
{
  "room": {
    "id": "chatroomObjectId",
    "name": "프로젝트 회의방",
    "isGroup": true,
    "memberIds": ["creatorUserId"],
    "lastMessage": "",
    "lastMessageAt": null
  }
}
```

오류 코드:
- `400` name is required
- `401` unauthorized
- `503` database is not connected
- `500` failed to create chatroom

### GET /chatrooms
- 현재 사용자가 참여 중인 방 목록 조회
- 정렬: `lastMessageAt desc` -> `createdAt desc`

응답 200:
```json
{
  "rooms": [
    {
      "id": "chatroomObjectId",
      "name": "프로젝트 회의방",
      "isGroup": true,
      "memberIds": ["u1", "u2"],
      "lastMessage": "안녕하세요",
      "lastMessageAt": "2026-03-05T10:00:00.000Z"
    }
  ]
}
```

## 메시지

### GET /chatrooms/:id/messages
- 방 메시지 히스토리 조회
- 인증 필요
- 현재 사용자가 해당 방 멤버여야 함
- 쿼리: `limit` (기본 50, 최대 100)

응답 예시:
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
