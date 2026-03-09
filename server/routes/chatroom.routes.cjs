const express = require('express');
const { sendError } = require('../utils/error-response.cjs');

// ChatRoom REST API를 생성한다.
// unread count는 사용자별 읽음 상태를 기준으로 계산해 방 목록 응답에 함께 내려준다.
const createChatroomRouter = ({
  ChatRoom,
  Message,
  User,
  Friendship,
  Notification,
  ChatReadState,
  requireAuth,
  assertDbConnected,
  emitNotificationCreated,
}) => {
  const router = express.Router();

  const toRoomResponse = (roomDoc, unreadCount = 0) => ({
    id: String(roomDoc._id),
    name: roomDoc.name,
    isGroup: Boolean(roomDoc.isGroup),
    memberIds: Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds : [],
    lastMessage: roomDoc.lastMessage || '',
    lastMessageAt: roomDoc.lastMessageAt ? new Date(roomDoc.lastMessageAt).toISOString() : null,
    unreadCount: Number(unreadCount) || 0,
  });

  const createNotification = async (userId, type, payload) => {
    if (!Notification) return null;

    const notification = await Notification.create({
      userId,
      type,
      payload,
    });

    emitNotificationCreated?.(String(userId), {
      id: String(notification._id),
      type: notification.type,
      payload: notification.payload || {},
      isRead: notification.isRead,
      createdAt: new Date(notification.createdAt).toISOString(),
      readAt: notification.readAt ? new Date(notification.readAt).toISOString() : null,
    });

    return notification;
  };

  const hasAcceptedFriendship = async (me, targetUserId) => {
    if (!Friendship) return false;

    const friendship = await Friendship.findOne({
      pairKey: [String(me), String(targetUserId)].sort().join(':'),
      status: 'accepted',
    }).lean();

    return Boolean(friendship);
  };

  const findExistingDirectRoom = async (memberA, memberB) => {
    const rooms = await ChatRoom.find({
      memberIds: { $all: [memberA, memberB] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return rooms.find((room) => Array.isArray(room.memberIds) && room.memberIds.length === 2) || null;
  };

  const getUnreadCountForRoom = async (roomId, userId, lastReadAt) => {
    const query = {
      chatRoomId: roomId,
      senderId: { $ne: userId },
    };

    if (lastReadAt) {
      query.timestamp = { $gt: lastReadAt };
    }

    return Message.countDocuments(query);
  };

  const buildMessageResponses = (messages, memberIds, readStateByUserId) =>
    messages.map((message) => {
      const timestamp = message.timestamp ? new Date(message.timestamp) : null;
      const unreadCount = memberIds.filter((memberId) => {
        if (memberId === message.senderId) return false;
        const readState = readStateByUserId.get(String(memberId));
        if (!readState?.lastReadAt || !timestamp) return true;
        return new Date(readState.lastReadAt) < timestamp;
      }).length;

      return {
        id: String(message._id),
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        senderNickname: message.senderNickname,
        type: message.type,
        text: message.text,
        timestamp: timestamp ? timestamp.toISOString() : null,
        unreadCount,
      };
    });

  router.post('/chatrooms', requireAuth, async (req, res) => {
    const currentUserId = req.user.userId;
    const name = String(req.body?.name || '').trim();
    const rawMemberUserIds = Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : null;
    const normalizedTargetIds = rawMemberUserIds
      ? [...new Set(rawMemberUserIds.map((value) => String(value || '').trim()).filter(Boolean))]
      : null;

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      if (!normalizedTargetIds) {
        if (!name) {
          sendError(res, 400, 'INVALID_REQUEST', 'name is required');
          return;
        }

        const room = await ChatRoom.create({
          name,
          isGroup: true,
          memberIds: [currentUserId],
        });

        res.status(201).json({ room: toRoomResponse(room) });
        return;
      }

      if (normalizedTargetIds.includes(currentUserId)) {
        sendError(res, 400, 'INVALID_REQUEST', 'memberUserIds must not include current user');
        return;
      }

      if (normalizedTargetIds.length === 0) {
        sendError(res, 400, 'INVALID_REQUEST', 'memberUserIds is required');
        return;
      }

      const targetUsers = await User.find({ _id: { $in: normalizedTargetIds } }).lean();
      if (targetUsers.length !== normalizedTargetIds.length) {
        sendError(res, 404, 'USER_NOT_FOUND', 'one or more users were not found');
        return;
      }

      const targetUserById = new Map(targetUsers.map((user) => [String(user._id), user]));

      for (const targetUserId of normalizedTargetIds) {
        const isFriend = await hasAcceptedFriendship(currentUserId, targetUserId);
        if (!isFriend) {
          sendError(res, 403, 'FRIENDSHIP_REQUIRED', 'friendship is required');
          return;
        }
      }

      if (normalizedTargetIds.length === 1) {
        const friendUserId = normalizedTargetIds[0];
        const existingRoom = await findExistingDirectRoom(currentUserId, friendUserId);
        if (existingRoom) {
          res.status(200).json({ room: toRoomResponse(existingRoom), reused: true });
          return;
        }

        const friendUser = targetUserById.get(friendUserId);
        const room = await ChatRoom.create({
          name: friendUser?.nickname || '1:1 채팅',
          isGroup: false,
          memberIds: [currentUserId, friendUserId],
        });

        await createNotification(friendUserId, 'room_invite', {
          roomId: String(room._id),
          roomName: room.name,
          inviter: {
            userId: currentUserId,
            nickname: req.user.nickname,
          },
        });

        res.status(201).json({ room: toRoomResponse(room), reused: false });
        return;
      }

      if (!name) {
        sendError(res, 400, 'INVALID_ROOM_NAME', 'name is required for group chatrooms');
        return;
      }

      const memberIds = [currentUserId, ...normalizedTargetIds];
      const room = await ChatRoom.create({
        name,
        isGroup: true,
        memberIds,
      });

      await Promise.all(
        normalizedTargetIds.map((targetUserId) =>
          createNotification(targetUserId, 'room_invite', {
            roomId: String(room._id),
            roomName: room.name,
            inviter: {
              userId: currentUserId,
              nickname: req.user.nickname,
            },
          })
        )
      );

      res.status(201).json({ room: toRoomResponse(room) });
    } catch (error) {
      sendError(res, 500, 'CHATROOM_CREATE_FAILED', error.message || 'failed to create chatroom');
    }
  });

  router.get('/chatrooms', requireAuth, async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const rooms = await ChatRoom.find({ memberIds: req.user.userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .lean();

      const roomIds = rooms.map((room) => String(room._id));
      const readStates = await ChatReadState.find({
        userId: req.user.userId,
        roomId: { $in: roomIds },
      }).lean();

      const readStateByRoomId = new Map(readStates.map((state) => [state.roomId, state]));
      const roomResponses = await Promise.all(
        rooms.map(async (room) => {
          const roomId = String(room._id);
          const readState = readStateByRoomId.get(roomId);
          const unreadCount = await getUnreadCountForRoom(roomId, req.user.userId, readState?.lastReadAt || null);
          return toRoomResponse(room, unreadCount);
        })
      );

      const totalUnreadCount = roomResponses.reduce((sum, room) => sum + (Number(room.unreadCount) || 0), 0);
      res.status(200).json({ rooms: roomResponses, totalUnreadCount });
    } catch (_error) {
      sendError(res, 500, 'CHATROOM_FETCH_FAILED', 'failed to fetch chatrooms');
    }
  });

  router.get('/chatrooms/:id/messages', requireAuth, async (req, res) => {
    const roomId = String(req.params.id || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    if (!roomId) {
      sendError(res, 400, 'INVALID_REQUEST', 'roomId is required');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId).lean();
      if (!room) {
        sendError(res, 404, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(req.user.userId)) {
        sendError(res, 403, 'FORBIDDEN', 'forbidden');
        return;
      }

      const messages = await Message.find({ chatRoomId: roomId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      const memberIds = Array.isArray(room.memberIds) ? room.memberIds.map((value) => String(value)) : [];
      const readStates = await ChatReadState.find({
        roomId,
        userId: { $in: memberIds },
      }).lean();
      const readStateByUserId = new Map(readStates.map((state) => [String(state.userId), state]));
      const messageResponses = buildMessageResponses(messages.reverse(), memberIds, readStateByUserId);

      res.status(200).json({
        roomId,
        count: messageResponses.length,
        messages: messageResponses,
      });
    } catch (_error) {
      sendError(res, 500, 'MESSAGE_FETCH_FAILED', 'failed to fetch messages');
    }
  });

  router.patch('/chatrooms/:id/read', requireAuth, async (req, res) => {
    const roomId = String(req.params.id || '').trim();

    if (!roomId) {
      sendError(res, 400, 'INVALID_REQUEST', 'roomId is required');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId).lean();
      if (!room) {
        sendError(res, 404, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(req.user.userId)) {
        sendError(res, 403, 'FORBIDDEN', 'forbidden');
        return;
      }

      const readState = await ChatReadState.findOneAndUpdate(
        { roomId, userId: req.user.userId },
        { $set: { lastReadAt: new Date() } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(200).json({
        roomId,
        lastReadAt: readState?.lastReadAt ? new Date(readState.lastReadAt).toISOString() : null,
      });
    } catch (_error) {
      sendError(res, 500, 'READ_STATE_UPDATE_FAILED', 'failed to update read state');
    }
  });

  return router;
};

module.exports = createChatroomRouter;
