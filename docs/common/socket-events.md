# 소켓 이벤트 명세

## 인증

- 소켓 연결 시 `auth.token`으로 access JWT를 전달해야 합니다.
- 토큰이 유효하지 않으면 `connect_error: unauthorized`가 반환됩니다.

## 클라이언트 -> 서버

### join_room
```json
{
  "roomId": "chatroomObjectId"
}
```

동작:
1. 방 존재 여부 확인
2. 멤버가 아니면 `memberIds`에 추가
3. 소켓 room 입장
4. `room_joined` 전송
5. `room_participants` 전송

### send_message
```json
{
  "roomId": "chatroomObjectId",
  "text": "message text",
  "type": "text"
}
```

동작:
- 메시지 DB 저장
- 방의 `lastMessage`, `lastMessageAt` 갱신
- `receive_message` 브로드캐스트

## 서버 -> 클라이언트

### room_joined
```json
{
  "roomId": "chatroomObjectId",
  "room": {
    "id": "chatroomObjectId",
    "name": "프로젝트 회의방",
    "isGroup": true,
    "memberIds": ["u1", "u2"],
    "lastMessage": "",
    "lastMessageAt": null
  }
}
```

### room_participants
```json
{
  "roomId": "chatroomObjectId",
  "participants": [
    { "userId": "u1", "nickname": "alice", "online": true },
    { "userId": "u2", "nickname": "bob", "online": false }
  ]
}
```

규칙:
- 멤버 목록은 `ChatRoom.memberIds` 기준
- online 여부는 소켓 메모리 presence 맵 기준
- 방 입장/연결 종료 시 재계산 후 재전송

### receive_message
```json
{
  "chatRoomId": "chatroomObjectId",
  "senderId": "u1",
  "senderNickname": "alice",
  "type": "text",
  "text": "hello",
  "timestamp": "2026-03-05T10:00:00.000Z"
}
```

### error
MVP2-A 1차 표준:

```json
{
  "code": "ROOM_NOT_FOUND",
  "message": "chatroom not found",
  "details": {}
}
```

- `details`는 선택 필드입니다.
- 주요 코드: `INVALID_REQUEST`, `DB_NOT_CONNECTED`, `ROOM_NOT_FOUND`, `FORBIDDEN`, `ROOM_JOIN_FAILED`, `MESSAGE_PROCESS_FAILED`
