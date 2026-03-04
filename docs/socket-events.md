# Socket Events

## Auth
- Socket 연결 시 `auth.token`(JWT) 필수
- 인증 실패 시 `connect_error: unauthorized` 반환

## Client -> Server

### join_room
payload:
```json
{
  "roomId": "string"
}
```

### send_message
payload:
```json
{
  "roomId": "string",
  "text": "string",
  "type": "text"
}
```

### leave_room (예정)
payload:
```json
{
  "roomId": "string"
}
```

## Server -> Client

### room_joined
payload:
```json
{
  "roomId": "string"
}
```

### receive_message
payload:
```json
{
  "chatRoomId": "string",
  "senderId": "string",
  "senderNickname": "string",
  "type": "text",
  "text": "string",
  "timestamp": "ISO-8601 string"
}
```

### error
payload:
```json
{
  "message": "string"
}
```