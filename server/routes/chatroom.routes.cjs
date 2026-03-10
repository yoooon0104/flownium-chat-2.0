const express = require('express');
const { sendError } = require('../utils/error-response.cjs');

// ChatRoom REST API를 생성한다.
// 생성/초대/나가기/읽음 상태까지 한 라우터에서 유지해 방 lifecycle 규칙을 서버에서 일관되게 강제한다.
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
  emitRoomUpdated,
  emitRoomDeleted,
  emitRoomParticipants,
  emitRoomMessage,
  emitMessageUpdated,
  disconnectUserFromRoom,
}) => {
  const router = express.Router();

  const normalizeUserIds = (values) =>
    [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))];

  // 응답 형태를 한곳에서 고정해 두면 REST/소켓의 room 메타가 어긋나지 않는다.
  const toRoomResponse = (roomDoc, unreadCount = 0) => ({
    id: String(roomDoc._id),
    name: roomDoc.name,
    isGroup: Boolean(roomDoc.isGroup),
    memberIds: Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds.map((value) => String(value)) : [],
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

  // 프론트에서 친구만 보여줘도 서버가 다시 확인해야 직접 호출과 오래된 캐시를 막을 수 있다.
  const hasAcceptedFriendship = async (me, targetUserId) => {
    if (!Friendship) return false;

    const friendship = await Friendship.findOne({
      pairKey: [String(me), String(targetUserId)].sort().join(':'),
      status: 'accepted',
    }).lean();

    return Boolean(friendship);
  };

  const assertFriendTargets = async (currentUserId, targetUserIds) => {
    for (const targetUserId of targetUserIds) {
      const isFriend = await hasAcceptedFriendship(currentUserId, targetUserId);
      if (!isFriend) {
        return { ok: false, targetUserId };
      }
    }

    return { ok: true };
  };

  // 1:1 재사용 규칙은 "같은 두 사람만 있는 방" 기준으로 판단한다.
  // 별도 room type을 새로 만들지 않고 기존 isGroup=false direct 방을 찾는다.
  const findExistingDirectRoom = async (memberA, memberB) => {
    const rooms = await ChatRoom.find({
      memberIds: { $all: [memberA, memberB] },
      isGroup: false,
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

  const broadcastRoomUpdated = async (memberIds, roomDoc) => {
    await Promise.all(
      memberIds.map((memberId) => emitRoomUpdated?.(String(memberId), toRoomResponse(roomDoc)))
    );
  };

  const buildGroupRoomName = (memberUsers) => {
    const names = memberUsers
      .map((user) => String(user?.nickname || '').trim())
      .filter(Boolean)
      .slice(0, 4);

    return names.length > 0 ? names.join(', ') : '그룹 채팅';
  };

  // 새로 초대된 사용자는 기존 대화 전체를 unread로 받으면 UX가 깨진다.
  // 그래서 초대 직전의 lastMessageAt까지만 읽은 것으로 잡고, 이후 시스템 메시지부터 unread를 시작한다.
  const seedReadStatesForInvitedUsers = async (roomDoc, invitedUserIds) => {
    if (!Array.isArray(invitedUserIds) || invitedUserIds.length === 0) return;

    const baseline = roomDoc.lastMessageAt
      ? new Date(roomDoc.lastMessageAt)
      : new Date(Date.now() - 1000);

    await Promise.all(
      invitedUserIds.map((userId) =>
        ChatReadState.findOneAndUpdate(
          { roomId: String(roomDoc._id), userId: String(userId) },
          { $set: { lastReadAt: baseline } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );
  };

  // 시스템 메시지도 일반 메시지와 같은 저장소를 쓰되, type만 system으로 구분한다.
  // lastMessage / lastMessageAt도 같이 갱신해야 방 목록 최신 메시지가 시스템 이벤트를 반영한다.
  const createSystemMessage = async ({ roomDoc, actorUserId, text }) => {
    const message = await Message.create({
      chatRoomId: String(roomDoc._id),
      senderId: String(actorUserId || ''),
      senderNickname: 'system',
      type: 'system',
      text,
      timestamp: new Date(),
    });

    roomDoc.lastMessage = message.text;
    roomDoc.lastMessageAt = message.timestamp;
    await roomDoc.save();

    await emitRoomMessage?.(roomDoc, message);
    return message;
  };

  const deleteRoomResources = async (roomId) => {
    await Promise.all([
      Message.deleteMany({ chatRoomId: String(roomId) }),
      ChatReadState.deleteMany({ roomId: String(roomId) }),
      ChatRoom.deleteOne({ _id: roomId }),
    ]);
  };

  router.post('/chatrooms', requireAuth, async (req, res) => {
    const currentUserId = req.user.userId;
    const name = String(req.body?.name || '').trim();
    const rawMemberUserIds = Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : null;
    const normalizedTargetIds = rawMemberUserIds ? normalizeUserIds(rawMemberUserIds) : null;

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

        await broadcastRoomUpdated([currentUserId], room);
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

      const friendCheck = await assertFriendTargets(currentUserId, normalizedTargetIds);
      if (!friendCheck.ok) {
        sendError(res, 403, 'FRIENDSHIP_REQUIRED', 'friendship is required');
        return;
      }

      const targetUserById = new Map(targetUsers.map((user) => [String(user._id), user]));

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

        await broadcastRoomUpdated(room.memberIds, room);
        res.status(201).json({ room: toRoomResponse(room), reused: false });
        return;
      }

      const memberIds = [currentUserId, ...normalizedTargetIds];
      const memberUsers = [
        { _id: currentUserId, nickname: req.user.nickname },
        ...targetUsers,
      ];
      const room = await ChatRoom.create({
        name: name || buildGroupRoomName(memberUsers),
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

      await broadcastRoomUpdated(memberIds, room);
      res.status(201).json({ room: toRoomResponse(room) });
    } catch (error) {
      sendError(res, 500, 'CHATROOM_CREATE_FAILED', error.message || 'failed to create chatroom');
    }
  });

  router.post('/chatrooms/:id/invite', requireAuth, async (req, res) => {
    const roomId = String(req.params.id || '').trim();
    const currentUserId = String(req.user.userId || '').trim();
    const targetUserIds = normalizeUserIds(req.body?.userIds);

    if (!roomId || targetUserIds.length === 0) {
      sendError(res, 400, 'INVALID_REQUEST', 'roomId and userIds are required');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        sendError(res, 404, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(currentUserId)) {
        sendError(res, 403, 'FORBIDDEN', 'forbidden');
        return;
      }

      if (targetUserIds.includes(currentUserId)) {
        sendError(res, 400, 'INVALID_REQUEST', 'cannot invite yourself');
        return;
      }

      const targetUsers = await User.find({ _id: { $in: targetUserIds } }).lean();
      if (targetUsers.length !== targetUserIds.length) {
        sendError(res, 404, 'USER_NOT_FOUND', 'one or more users were not found');
        return;
      }

      const friendCheck = await assertFriendTargets(currentUserId, targetUserIds);
      if (!friendCheck.ok) {
        sendError(res, 403, 'FRIENDSHIP_REQUIRED', 'friendship is required');
        return;
      }

      const invitedNames = targetUsers
        .map((user) => String(user?.nickname || '').trim())
        .filter(Boolean)
        .join(', ');

      if (room.isGroup) {
        const existingMemberSet = new Set(room.memberIds.map((value) => String(value)));
        const alreadyInRoomIds = targetUserIds.filter((userId) => existingMemberSet.has(userId));

        if (alreadyInRoomIds.length > 0) {
          sendError(res, 409, 'ALREADY_IN_ROOM', 'one or more users are already in the room');
          return;
        }

        await seedReadStatesForInvitedUsers(room, targetUserIds);

        room.memberIds = [...room.memberIds.map((value) => String(value)), ...targetUserIds];
        room.isGroup = true;
        await room.save();

        await createSystemMessage({
          roomDoc: room,
          actorUserId: currentUserId,
          text: `${req.user.nickname}님이 ${invitedNames}님을 초대했습니다.`,
        });

        await Promise.all(
          targetUserIds.map((targetUserId) =>
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

        await broadcastRoomUpdated(room.memberIds, room);
        await emitRoomParticipants?.(String(room._id));

        res.status(200).json({
          room: toRoomResponse(room),
          createdNewRoom: false,
        });
        return;
      }

      const baseMemberIds = room.memberIds.map((value) => String(value));
      const nextMemberIds = [...baseMemberIds, ...targetUserIds];
      const nextUsers = [
        ...targetUsers,
        ...(await User.find({ _id: { $in: baseMemberIds } }).lean()),
      ];
      const nextRoom = await ChatRoom.create({
        name: buildGroupRoomName(nextUsers),
        isGroup: true,
        memberIds: nextMemberIds,
      });

      await createSystemMessage({
        roomDoc: nextRoom,
        actorUserId: currentUserId,
        text: `${req.user.nickname}님이 ${invitedNames}님을 초대했습니다.`,
      });

      await Promise.all(
        targetUserIds.map((targetUserId) =>
          createNotification(targetUserId, 'room_invite', {
            roomId: String(nextRoom._id),
            roomName: nextRoom.name,
            inviter: {
              userId: currentUserId,
              nickname: req.user.nickname,
            },
          })
        )
      );

      await broadcastRoomUpdated(nextMemberIds, nextRoom);
      res.status(201).json({
        room: toRoomResponse(nextRoom),
        createdNewRoom: true,
      });
    } catch (error) {
      sendError(res, 500, 'CHATROOM_INVITE_FAILED', error.message || 'failed to invite users');
    }
  });

  router.post('/chatrooms/:id/leave', requireAuth, async (req, res) => {
    const roomId = String(req.params.id || '').trim();
    const currentUserId = String(req.user.userId || '').trim();

    if (!roomId) {
      sendError(res, 400, 'INVALID_REQUEST', 'roomId is required');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        sendError(res, 404, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(currentUserId)) {
        sendError(res, 403, 'FORBIDDEN', 'forbidden');
        return;
      }

      const currentMemberIds = room.memberIds.map((value) => String(value));

      if (!room.isGroup) {
        await Promise.all(
          currentMemberIds.map((memberId) => disconnectUserFromRoom?.(String(roomId), String(memberId)))
        );
        await deleteRoomResources(roomId);
        currentMemberIds.forEach((memberId) => {
          emitRoomDeleted?.(memberId, roomId);
        });

        res.status(200).json({
          roomId,
          deleted: true,
        });
        return;
      }

      const nextMemberIds = currentMemberIds.filter((memberId) => memberId !== currentUserId);
      await disconnectUserFromRoom?.(roomId, currentUserId);
      await ChatReadState.deleteOne({ roomId, userId: currentUserId });

      if (nextMemberIds.length === 0) {
        await deleteRoomResources(roomId);
        emitRoomDeleted?.(currentUserId, roomId);

        res.status(200).json({
          roomId,
          deleted: true,
        });
        return;
      }

      room.memberIds = nextMemberIds;
      room.isGroup = true;
      await room.save();

      await createSystemMessage({
        roomDoc: room,
        actorUserId: currentUserId,
        text: `${req.user.nickname}님이 나갔습니다.`,
      });

      await broadcastRoomUpdated(nextMemberIds, room);
      emitRoomDeleted?.(currentUserId, roomId);
      await emitRoomParticipants?.(roomId);

      res.status(200).json({
        room: toRoomResponse(room),
        deleted: false,
      });
    } catch (error) {
      sendError(res, 500, 'CHATROOM_LEAVE_FAILED', error.message || 'failed to leave room');
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
          const currentRoomId = String(room._id);
          const readState = readStateByRoomId.get(currentRoomId);
          const unreadCount = await getUnreadCountForRoom(currentRoomId, req.user.userId, readState?.lastReadAt || null);
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

      const previousReadState = await ChatReadState.findOne({
        roomId,
        userId: req.user.userId,
      }).lean();

      const readState = await ChatReadState.findOneAndUpdate(
        { roomId, userId: req.user.userId },
        { $set: { lastReadAt: new Date() } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      const affectedMessagesQuery = {
        chatRoomId: roomId,
        senderId: { $ne: req.user.userId },
      }

      if (previousReadState?.lastReadAt) {
        affectedMessagesQuery.timestamp = { $gt: previousReadState.lastReadAt }
      }

      const affectedMessages = await Message.find(affectedMessagesQuery)
        .sort({ timestamp: 1 })
        .lean()

      await Promise.all(
        affectedMessages.map((message) => emitMessageUpdated?.(room, message))
      )

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
