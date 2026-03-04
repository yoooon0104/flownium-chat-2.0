# Socket Events

---

## Client → Server

join_room
payload:
{
  roomId: string
}

send_message
payload:
{
  roomId: string,
  text: string,
  type: "text"
}

leave_room
payload:
{
  roomId: string
}

---

## Server → Client

receive_message
payload:
{
  chatRoomId,
  senderId,
  senderNickname,
  text,
  timestamp
}

room_joined
error