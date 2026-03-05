# Socket Events

## Auth

- Socket connection requires access JWT via `auth.token`.
- Invalid token returns `connect_error: unauthorized`.

## Client -> Server

### join_room
```json
{
  "roomId": "chatroomObjectId"
}
```

Behavior:
1. Validate room exists.
2. If user not in `memberIds`, add user.
3. Join socket room.
4. Emit `room_joined`.
5. Emit `room_participants`.

### send_message
```json
{
  "roomId": "chatroomObjectId",
  "text": "message text",
  "type": "text"
}
```

Behavior:
- Save message in DB.
- Update room `lastMessage`, `lastMessageAt`.
- Broadcast `receive_message`.

## Server -> Client

### room_joined
```json
{
  "roomId": "chatroomObjectId",
  "room": {
    "id": "chatroomObjectId",
    "name": "Project Meeting",
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

Rule:
- Members list comes from `ChatRoom.memberIds`.
- Online flag comes from in-memory socket presence map.
- Re-emitted on room join and disconnect.

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
```json
{
  "message": "string"
}
```
