const express = require("express");
const { sendError } = require("../utils/error-response.cjs");

// ChatRoom REST API를 생성한다. 인증과 DB 체크는 상위에서 주입받는다.
const createChatroomRouter = ({
  ChatRoom,
  Message,
  User,
  Friendship,
  Notification,
  requireAuth,
  assertDbConnected,
  emitNotificationCreated,
}) => {
  const router = express.Router();

  const toRoomResponse = (roomDoc) => ({
    id: String(roomDoc._id),
    name: roomDoc.name,
    isGroup: Boolean(roomDoc.isGroup),
    memberIds: Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds : [],
    lastMessage: roomDoc.lastMessage || "",
    lastMessageAt: roomDoc.lastMessageAt ? new Date(roomDoc.lastMessageAt).toISOString() : null,
  });

  const createNotification = async (userId, type, payload) => {
    if (!Notification) {
      return null;
    }

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

  // 현재 사용자와 대상 사용자가 수락된 친구 관계인지 확인한다.
  const hasAcceptedFriendship = async (me, targetUserId) => {
    if (!Friendship) {
      return false;
    }

    const friendship = await Friendship.findOne({
      pairKey: [String(me), String(targetUserId)].sort().join(":"),
      status: "accepted",
    }).lean();

    return Boolean(friendship);
  };

  // 현재 사용자와 대상 사용자만 포함된 기존 2인 방이 있으면 재사용한다.
  const findExistingDirectRoom = async (memberA, memberB) => {
    const rooms = await ChatRoom.find({
      memberIds: { $all: [memberA, memberB] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return rooms.find((room) => Array.isArray(room.memberIds) && room.memberIds.length === 2) || null;
  };

  // 채팅방 생성은 기존 그룹 생성과 친구 기반 1:1/그룹 생성을 모두 지원한다.
  router.post("/chatrooms", requireAuth, async (req, res) => {
    const currentUserId = req.user.userId;
    const name = String(req.body?.name || "").trim();
    const rawMemberUserIds = Array.isArray(req.body?.memberUserIds) ? req.body.memberUserIds : null;
    const normalizedTargetIds = rawMemberUserIds
      ? [...new Set(rawMemberUserIds.map((value) => String(value || "").trim()).filter(Boolean))]
      : null;

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      // 현재 프론트와의 호환성을 위해 memberUserIds가 없으면 기존 name 기반 그룹 생성으로 처리한다.
      if (!normalizedTargetIds) {
        if (!name) {
          sendError(res, 400, "INVALID_REQUEST", "name is required");
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
        sendError(res, 400, "INVALID_REQUEST", "memberUserIds must not include current user");
        return;
      }

      if (normalizedTargetIds.length === 0) {
        sendError(res, 400, "INVALID_REQUEST", "memberUserIds is required");
        return;
      }

      const targetUsers = await User.find({ _id: { $in: normalizedTargetIds } }).lean();
      if (targetUsers.length !== normalizedTargetIds.length) {
        sendError(res, 404, "USER_NOT_FOUND", "one or more users were not found");
        return;
      }

      const targetUserById = new Map(targetUsers.map((user) => [String(user._id), user]));

      for (const targetUserId of normalizedTargetIds) {
        const isFriend = await hasAcceptedFriendship(currentUserId, targetUserId);
        if (!isFriend) {
          sendError(res, 403, "FRIENDSHIP_REQUIRED", "friendship is required");
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
          name: friendUser?.nickname || "1:1 채팅",
          isGroup: false,
          memberIds: [currentUserId, friendUserId],
        });

        await createNotification(friendUserId, "room_invite", {
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
        sendError(res, 400, "INVALID_ROOM_NAME", "name is required for group chatrooms");
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
          createNotification(targetUserId, "room_invite", {
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
      sendError(res, 500, "CHATROOM_CREATE_FAILED", error.message || "failed to create chatroom");
    }
  });

  // 현재 사용자가 참여한 채팅방 목록을 최신 메시지 기준으로 내려준다.
  router.get("/chatrooms", requireAuth, async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const rooms = await ChatRoom.find({ memberIds: req.user.userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .lean();

      res.status(200).json({ rooms: rooms.map(toRoomResponse) });
    } catch (_error) {
      sendError(res, 500, "CHATROOM_FETCH_FAILED", "failed to fetch chatrooms");
    }
  });

  // 현재 사용자에게 허용된 방의 메시지 히스토리를 조회한다.
  router.get("/chatrooms/:id/messages", requireAuth, async (req, res) => {
    const roomId = String(req.params.id || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    if (!roomId) {
      sendError(res, 400, "INVALID_REQUEST", "roomId is required");
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId).lean();
      if (!room) {
        sendError(res, 404, "ROOM_NOT_FOUND", "chatroom not found");
        return;
      }

      if (!room.memberIds.includes(req.user.userId)) {
        sendError(res, 403, "FORBIDDEN", "forbidden");
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
      sendError(res, 500, "MESSAGE_FETCH_FAILED", "failed to fetch messages");
    }
  });

  return router;
};

module.exports = createChatroomRouter;