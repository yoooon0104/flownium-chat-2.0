# 소켓 이벤트 명세

## 인증

- 소켓 연결 시 `auth.token`으로 access JWT를 전달해야 합니다.
- 토큰이 유효하지 않으면 `connect_error: unauthorized`가 반환됩니다.
- 소켓 연결 직후 서버는 사용자 전용 room(`user:<userId>`)에 자동 참여시켜 알림 이벤트를 전달합니다.

## 클라이언트 -> 서버

### join_room
```json
{
  "roomId": "chatroomObjectId"
}
```

동작:
1. 방 존재 여부 확인
2. 현재 사용자가 이미 방 멤버인지 검증
3. 소켓 room 입장
4. `room_joined` 전송
5. `room_participants` 전송

### send_message
```json
{
  "roomId": "chatroomObjectId",
  "text": "message text",
  "type": "text",
  "clientMessageId": "local-1710057600000-ab12cd"
}
```

동작:
- 메시지 DB 저장
- 방의 `lastMessage`, `lastMessageAt` 갱신
- `receive_message` 브로드캐스트
- ack 응답으로 전송 성공/실패를 호출자에게 즉시 반환

ack 성공:
```json
{
  "ok": true,
  "clientMessageId": "local-1710057600000-ab12cd",
  "messageId": "messageId"
}
```

ack 실패:
```json
{
  "ok": false,
  "code": "DB_NOT_CONNECTED",
  "message": "database is not connected",
  "clientMessageId": "local-1710057600000-ab12cd"
}
```

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
- 초대/나가기 후 멤버가 바뀌면 재계산 후 재전송

### room_updated
```json
{
  "room": {
    "id": "chatroomObjectId",
    "name": "프로젝트 회의방",
    "isGroup": true,
    "memberIds": ["u1", "u2", "u3"],
    "lastMessage": "alice님이 bob님을 초대했습니다.",
    "lastMessageAt": "2026-03-10T12:00:00.000Z"
  }
}
```

규칙:
- 사용자 전용 room(`user:<userId>`)으로 전달
- 새 방 생성, 초대, 나가기 후 방 메타가 바뀌면 전송
- 프론트는 이 이벤트를 받으면 방 목록을 다시 조회해 room 메타와 unread를 맞춘다

### room_deleted
```json
{
  "roomId": "chatroomObjectId"
}
```

규칙:
- 사용자 전용 room(`user:<userId>`)으로 전달
- direct 방 삭제 또는 현재 사용자의 leave 처리 후 목록/상세 제거용으로 사용
- 프론트는 현재 열려 있는 방이면 상세를 닫고 방 목록을 다시 조회한다

### receive_message
```json
{
  "clientMessageId": "local-1710057600000-ab12cd",
  "id": "messageId",
  "chatRoomId": "chatroomObjectId",
  "senderId": "u1",
  "senderNickname": "alice",
  "type": "text",
  "text": "hello",
  "timestamp": "2026-03-05T10:00:00.000Z",
  "unreadCount": 1
}
```

규칙:
- 보낸 사람에게는 같은 `clientMessageId`가 다시 전달되어 optimistic 메시지를 실제 메시지로 치환할 수 있음
- `unreadCount`는 해당 메시지를 아직 읽지 않은 상대 인원 수
- 모두 읽었으면 `0`
- 채팅창에서는 숫자만 노출하고 0은 숨김
- `type: "system"` 메시지는 입장/퇴장 lifecycle 기록에 사용

### message_updated
```json
{
  "id": "messageId",
  "chatRoomId": "chatroomObjectId",
  "senderId": "u1",
  "senderNickname": "alice",
  "type": "text",
  "text": "hello",
  "timestamp": "2026-03-05T10:00:00.000Z",
  "unreadCount": 0
}
```

규칙:
- 기존 메시지와 같은 `id`를 사용해 unread count 같은 후속 상태만 갱신
- 주로 읽음 처리 후 해당 메시지들의 unread count 재계산 결과를 브로드캐스트
- 프론트는 새 메시지로 추가하지 말고 같은 `id` 메시지에 merge해야 함

### notification_created
```json
{
  "notification": {
    "id": "notificationId",
    "type": "friend_request",
    "payload": {},
    "isRead": false,
    "createdAt": "2026-03-09T10:00:00.000Z",
    "readAt": null
  }
}
```

### notification_read
```json
{
  "notification": {
    "id": "notificationId",
    "type": "room_invite",
    "payload": {},
    "isRead": true,
    "createdAt": "2026-03-09T10:00:00.000Z",
    "readAt": "2026-03-09T10:10:00.000Z"
  }
}
```

### friendship_updated
```json
{
  "userId": "userId",
  "reason": "friend_request_accepted"
}
```

규칙:
- 친구 요청 생성/수락/거절/차단 시 양쪽 사용자 전용 room으로 전송
- 프론트는 이 이벤트를 받으면 `fetchFriends()`와 `fetchNotifications()`를 다시 호출
- 친구 목록/알림 허브를 새로고침 없이 맞추기 위한 동기화 이벤트

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
