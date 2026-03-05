const express = require('express');

// ChatRoom REST API를 생성한다. 인증/DB 체크는 상위에서 주입받는다.
const createChatroomRouter = ({ ChatRoom, Message, requireAuth, assertDbConnected }) => {
  const router = express.Router();

  const toRoomResponse = (roomDoc) => ({
    id: String(roomDoc._id),
    name: roomDoc.name,
    isGroup: Boolean(roomDoc.isGroup),
    memberIds: Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds : [],
    lastMessage: roomDoc.lastMessage || '',
    lastMessageAt: roomDoc.lastMessageAt ? new Date(roomDoc.lastMessageAt).toISOString() : null,
  });

  // 그룹방 생성: 생성자만 초기 멤버로 등록한다.
  router.post('/chatrooms', requireAuth, async (req, res) => {
    const name = String(req.body?.name || '').trim();

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.create({
        name,
        isGroup: true,
        memberIds: [req.user.userId],
      });

      res.status(201).json({ room: toRoomResponse(room) });
    } catch (error) {
      res.status(500).json({ error: error.message || 'failed to create chatroom' });
    }
  });

  // 현재 사용자가 참여한 채팅방 목록을 최신 메시지 기준으로 내려준다.
  router.get('/chatrooms', requireAuth, async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const rooms = await ChatRoom.find({ memberIds: req.user.userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .lean();

      res.status(200).json({ rooms: rooms.map(toRoomResponse) });
    } catch (_error) {
      res.status(500).json({ error: 'failed to fetch chatrooms' });
    }
  });

  // 현재 사용자에게 허용된 방의 메시지 히스토리를 조회한다.
  router.get('/chatrooms/:id/messages', requireAuth, async (req, res) => {
    const roomId = String(req.params.id || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    if (!roomId) {
      res.status(400).json({ error: 'roomId is required' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId).lean();
      if (!room) {
        res.status(404).json({ error: 'chatroom not found' });
        return;
      }

      if (!room.memberIds.includes(req.user.userId)) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      const messages = await Message.find({ chatRoomId: roomId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      res.status(200).json({
        roomId,
        count: messages.length,
        messages: messages.reverse(),
      });
    } catch (_error) {
      res.status(500).json({ error: 'failed to fetch messages' });
    }
  });

  return router;
};

module.exports = createChatroomRouter;
