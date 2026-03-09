const express = require("express");
const { sendError } = require("../utils/error-response.cjs");

// 알림 REST API를 생성한다. 목록 조회와 읽음 처리만 담당한다.
const createNotificationRouter = ({ Notification, requireAuth, assertDbConnected, emitNotificationRead }) => {
  const router = express.Router();

  const toNotificationResponse = (notificationDoc) => ({
    id: String(notificationDoc._id),
    type: notificationDoc.type,
    payload: notificationDoc.payload || {},
    isRead: Boolean(notificationDoc.isRead),
    createdAt: notificationDoc.createdAt ? new Date(notificationDoc.createdAt).toISOString() : null,
    readAt: notificationDoc.readAt ? new Date(notificationDoc.readAt).toISOString() : null,
  });

  // 현재 사용자의 최신 알림 목록을 반환한다.
  router.get("/notifications", requireAuth, async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const notifications = await Notification.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const unreadCount = notifications.filter((item) => !item.isRead).length;
      res.status(200).json({
        unreadCount,
        notifications: notifications.map(toNotificationResponse),
      });
    } catch (_error) {
      sendError(res, 500, "NOTIFICATION_FETCH_FAILED", "failed to fetch notifications");
    }
  });

  // 알림을 읽음 처리하고 같은 사용자 room으로 상태 변경을 전파한다.
  router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
    const notificationId = String(req.params.id || "").trim();

    if (!notificationId) {
      sendError(res, 400, "INVALID_REQUEST", "notificationId is required");
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId: req.user.userId,
      });

      if (!notification) {
        sendError(res, 404, "NOTIFICATION_NOT_FOUND", "notification not found");
        return;
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      const payload = toNotificationResponse(notification);
      emitNotificationRead?.(req.user.userId, payload);

      res.status(200).json({ notification: payload });
    } catch (_error) {
      sendError(res, 500, "NOTIFICATION_UPDATE_FAILED", "failed to update notification");
    }
  });

  return router;
};

module.exports = createNotificationRouter;