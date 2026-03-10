const express = require("express");
const { sendError } = require("../utils/error-response.cjs");

// 친구 관계 REST API를 생성한다.
// 검색, 요청 생성, 상태 변경만 담당하고, 실시간 동기화는 emit 콜백으로 위임한다.
const createFriendRouter = ({
  User,
  Friendship,
  Notification,
  requireAuth,
  assertDbConnected,
  emitNotificationCreated,
  emitFriendshipUpdated,
}) => {
  const router = express.Router();

  const toUserSummary = (userDoc) => ({
    id: String(userDoc._id),
    email: userDoc.email || "",
    nickname: userDoc.nickname || "",
    profileImage: userDoc.profileImage || "",
  });

  const toFriendRequestResponse = (friendshipDoc, me, userById) => {
    const requesterId = String(friendshipDoc.requesterId);
    const addresseeId = String(friendshipDoc.addresseeId);
    const counterpartId = requesterId === me ? addresseeId : requesterId;
    const counterpart = userById.get(counterpartId);

    return {
      id: String(friendshipDoc._id),
      status: friendshipDoc.status,
      requesterId,
      addresseeId,
      counterpart: counterpart
        ? toUserSummary(counterpart)
        : { id: counterpartId, email: "", nickname: counterpartId, profileImage: "" },
    };
  };

  const createNotification = async (userId, type, payload) => {
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

  // 친구 검색은 이메일/닉네임 기준으로 수행하고, 현재 친구 상태를 함께 내려준다.
  router.get("/friends/search", requireAuth, async (req, res) => {
    const me = req.user.userId;
    const keyword = String(req.query.keyword || "").trim();

    if (!assertDbConnected(res)) {
      return;
    }

    if (!keyword) {
      res.status(200).json({ keyword: "", results: [] });
      return;
    }

    try {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const users = await User.find({
        _id: { $ne: me },
        $or: [{ nickname: regex }, { email: regex }],
      })
        .limit(20)
        .lean();

      const targetIds = users.map((user) => String(user._id));
      const friendships = await Friendship.find({
        pairKey: { $in: targetIds.map((targetId) => [me, targetId].sort().join(":")) },
      }).lean();

      const friendshipByPairKey = new Map(friendships.map((doc) => [doc.pairKey, doc]));

      const results = users.map((user) => {
        const targetId = String(user._id);
        const friendship = friendshipByPairKey.get([me, targetId].sort().join(":"));

        return {
          user: toUserSummary(user),
          friendship: friendship
            ? {
                id: String(friendship._id),
                status: friendship.status,
                requesterId: String(friendship.requesterId),
                addresseeId: String(friendship.addresseeId),
              }
            : null,
        };
      });

      res.status(200).json({ keyword, results });
    } catch (_error) {
      sendError(res, 500, "FRIEND_SEARCH_FAILED", "failed to search friends");
    }
  });

  // 친구 목록은 수락된 친구, 받은 요청, 보낸 요청으로 나눠 내려준다.
  router.get("/friends", requireAuth, async (req, res) => {
    const me = req.user.userId;

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const friendships = await Friendship.find({
        $or: [{ requesterId: me }, { addresseeId: me }],
      }).lean();

      const relatedUserIds = [
        ...new Set(
          friendships.flatMap((doc) => [String(doc.requesterId), String(doc.addresseeId)]).filter((id) => id !== me)
        ),
      ];

      const users = await User.find({ _id: { $in: relatedUserIds } }).lean();
      const userById = new Map(users.map((user) => [String(user._id), user]));

      const accepted = [];
      const pendingReceived = [];
      const pendingSent = [];

      friendships.forEach((doc) => {
        const item = toFriendRequestResponse(doc, me, userById);
        if (doc.status === "accepted") {
          accepted.push(item);
          return;
        }

        if (doc.status === "pending" && String(doc.addresseeId) === me) {
          pendingReceived.push(item);
          return;
        }

        if (doc.status === "pending" && String(doc.requesterId) === me) {
          pendingSent.push(item);
        }
      });

      res.status(200).json({ accepted, pendingReceived, pendingSent });
    } catch (_error) {
      sendError(res, 500, "FRIEND_LIST_FAILED", "failed to fetch friends");
    }
  });

  // 친구 요청은 동일 사용자쌍 당 하나의 관계 문서만 유지한다.
  router.post("/friends/request", requireAuth, async (req, res) => {
    const me = req.user.userId;
    const targetUserId = String(req.body?.targetUserId || "").trim();

    if (!targetUserId) {
      sendError(res, 400, "INVALID_REQUEST", "targetUserId is required");
      return;
    }

    if (targetUserId === me) {
      sendError(res, 400, "INVALID_REQUEST", "cannot request yourself");
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const [targetUser, existing] = await Promise.all([
        User.findById(targetUserId).lean(),
        Friendship.findOne({ pairKey: [me, targetUserId].sort().join(":") }),
      ]);

      if (!targetUser) {
        sendError(res, 404, "USER_NOT_FOUND", "user not found");
        return;
      }

      if (existing?.status === "accepted") {
        sendError(res, 409, "ALREADY_FRIENDS", "already friends");
        return;
      }

      if (existing?.status === "blocked") {
        sendError(res, 403, "FRIEND_REQUEST_BLOCKED", "friend request is blocked");
        return;
      }

      if (existing?.status === "pending") {
        const code =
          String(existing.requesterId) === me ? "FRIEND_REQUEST_PENDING" : "FRIEND_REQUEST_ALREADY_RECEIVED";
        const message =
          String(existing.requesterId) === me ? "friend request is already pending" : "friend request already received";
        sendError(res, 409, code, message);
        return;
      }

      const friendship =
        existing ||
        new Friendship({
          requesterId: me,
          addresseeId: targetUserId,
          status: "pending",
        });

      friendship.requesterId = me;
      friendship.addresseeId = targetUserId;
      friendship.status = "pending";
      await friendship.save();

      await createNotification(targetUserId, "friend_request", {
        friendshipId: String(friendship._id),
        requester: {
          userId: me,
          nickname: req.user.nickname,
        },
      });

      // 요청을 보낸 사람과 받은 사람 모두 Friends/알림 목록을 즉시 다시 가져오게 한다.
      emitFriendshipUpdated?.(me, {
        type: "friend_request_created",
        friendshipId: String(friendship._id),
      });
      emitFriendshipUpdated?.(targetUserId, {
        type: "friend_request_created",
        friendshipId: String(friendship._id),
      });

      res.status(201).json({
        friendship: {
          id: String(friendship._id),
          status: friendship.status,
          requesterId: String(friendship.requesterId),
          addresseeId: String(friendship.addresseeId),
        },
      });
    } catch (_error) {
      sendError(res, 500, "FRIEND_REQUEST_FAILED", "failed to create friend request");
    }
  });

  // 친구 요청 상태 변경은 수락, 거절, 차단만 허용한다.
  router.patch("/friends/request/:id", requireAuth, async (req, res) => {
    const me = req.user.userId;
    const requestId = String(req.params.id || "").trim();
    const action = String(req.body?.action || "").trim();

    if (!requestId || !action) {
      sendError(res, 400, "INVALID_REQUEST", "requestId and action are required");
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const friendship = await Friendship.findById(requestId);
      if (!friendship) {
        sendError(res, 404, "FRIEND_REQUEST_NOT_FOUND", "friend request not found");
        return;
      }

      const requesterId = String(friendship.requesterId);
      const addresseeId = String(friendship.addresseeId);
      const isParticipant = requesterId === me || addresseeId === me;
      if (!isParticipant) {
        sendError(res, 403, "FORBIDDEN", "forbidden");
        return;
      }

      if (action === "accept") {
        if (addresseeId !== me || friendship.status !== "pending") {
          sendError(res, 409, "INVALID_FRIEND_REQUEST_STATE", "friend request cannot be accepted");
          return;
        }
        friendship.status = "accepted";
      } else if (action === "reject") {
        if (addresseeId !== me || friendship.status !== "pending") {
          sendError(res, 409, "INVALID_FRIEND_REQUEST_STATE", "friend request cannot be rejected");
          return;
        }
        friendship.status = "rejected";
      } else if (action === "block") {
        friendship.status = "blocked";
      } else {
        sendError(res, 400, "INVALID_REQUEST", "action must be accept, reject, or block");
        return;
      }

      await friendship.save();

      // 상태가 바뀌면 요청 당사자 둘 다 목록 구조가 변하므로 양쪽에 동시에 갱신 이벤트를 보낸다.
      emitFriendshipUpdated?.(requesterId, {
        type: "friend_request_updated",
        friendshipId: String(friendship._id),
        status: friendship.status,
      });
      emitFriendshipUpdated?.(addresseeId, {
        type: "friend_request_updated",
        friendshipId: String(friendship._id),
        status: friendship.status,
      });

      res.status(200).json({
        friendship: {
          id: String(friendship._id),
          status: friendship.status,
          requesterId,
          addresseeId,
        },
      });
    } catch (_error) {
      sendError(res, 500, "FRIEND_REQUEST_UPDATE_FAILED", "failed to update friend request");
    }
  });

  return router;
};

module.exports = createFriendRouter;
