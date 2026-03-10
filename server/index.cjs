const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { Server } = require('socket.io');
const Message = require('./models/message.model.cjs');
const User = require('./models/user.model.cjs');
const ChatRoom = require('./models/chatroom.model.cjs');
const ChatReadState = require('./models/chatreadstate.model.cjs');
const { Friendship } = require('./models/friendship.model.cjs');
const Notification = require('./models/notification.model.cjs');
const createAuthRouter = require('./routes/auth.routes.cjs');
const createChatroomRouter = require('./routes/chatroom.routes.cjs');
const createFriendRouter = require('./routes/friend.routes.cjs');
const createNotificationRouter = require('./routes/notification.routes.cjs');
const { verifyAccessToken } = require('./services/auth.service.cjs');
const { sendError } = require('./utils/error-response.cjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3010;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_SIGNUP_SECRET = process.env.JWT_SIGNUP_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';
const SIGNUP_TOKEN_EXPIRES_IN = process.env.SIGNUP_TOKEN_EXPIRES_IN || '10m';
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// roomId -> (userId -> Set(socketId)) 구조로 룸별 온라인 상태를 관리한다.
// unread count와는 별도 개념이다. presence는 지금 접속 중인지, read state는 마지막으로 어디까지 읽었는지를 의미한다.
const roomPresence = new Map();

const assertDbConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    sendError(res, 503, 'DB_NOT_CONNECTED', 'database is not connected');
    return false;
  }
  return true;
};

const toRoomResponse = (roomDoc) => ({
  id: String(roomDoc._id),
  name: roomDoc.name,
  isGroup: Boolean(roomDoc.isGroup),
  memberIds: Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds : [],
  lastMessage: roomDoc.lastMessage || '',
  lastMessageAt: roomDoc.lastMessageAt ? new Date(roomDoc.lastMessageAt).toISOString() : null,
});

const toNotificationResponse = (notificationDoc) => ({
  id: String(notificationDoc._id || notificationDoc.id),
  type: notificationDoc.type,
  payload: notificationDoc.payload || {},
  isRead: Boolean(notificationDoc.isRead),
  createdAt: notificationDoc.createdAt ? new Date(notificationDoc.createdAt).toISOString() : null,
  readAt: notificationDoc.readAt ? new Date(notificationDoc.readAt).toISOString() : null,
});

const extractBearerToken = (req) => {
  const raw = String(req.headers.authorization || '').trim();
  return raw.replace(/^Bearer\s+/i, '').trim();
};

const requireAuth = (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
      return;
    }

    if (!JWT_SECRET) {
      sendError(res, 500, 'SERVER_MISCONFIGURED', 'server auth misconfigured');
      return;
    }

    req.user = verifyAccessToken(token, JWT_SECRET);
    next();
  } catch (_error) {
    sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
  }
};

const emitSocketError = (socket, code, message, details) => {
  const payload = { code, message };
  if (typeof details !== 'undefined') {
    payload.details = details;
  }
  socket.emit('error', payload);
};

// 사용자 전용 room으로 알림 생성 이벤트를 보낸다.
const emitNotificationCreated = (userId, notification) => {
  io.to(`user:${String(userId)}`).emit('notification_created', {
    notification: toNotificationResponse(notification),
  });
};

// 읽음 처리된 알림도 사용자 전용 room으로 동기화한다.
const emitNotificationRead = (userId, notification) => {
  io.to(`user:${String(userId)}`).emit('notification_read', {
    notification: toNotificationResponse(notification),
  });
};

// 친구 요청/수락/거절은 요청자와 대상자 화면이 동시에 바뀐다.
// 세부 항목을 직접 patch하는 대신, 양쪽이 목록을 다시 읽도록 최소 이벤트만 보낸다.
const emitFriendshipUpdated = (userId, payload = {}) => {
  io.to(`user:${String(userId)}`).emit('friendship_updated', payload);
};

const addPresence = (roomId, userId, socketId) => {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }

  const userSockets = roomPresence.get(roomId);
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socketId);
};

const removePresence = (roomId, userId, socketId) => {
  const userSockets = roomPresence.get(roomId);
  if (!userSockets) return;

  const socketSet = userSockets.get(userId);
  if (!socketSet) return;

  socketSet.delete(socketId);

  if (socketSet.size === 0) {
    userSockets.delete(userId);
  }

  if (userSockets.size === 0) {
    roomPresence.delete(roomId);
  }
};

// 과거 스키마에 있던 roomKey 인덱스를 제거해 E11000 충돌을 방지한다.
const dropLegacyChatRoomIndexIfExists = async () => {
  try {
    const indexes = await ChatRoom.collection.indexes();
    const hasLegacyRoomKeyIndex = indexes.some((index) => index.name === 'roomKey_1');

    if (hasLegacyRoomKeyIndex) {
      await ChatRoom.collection.dropIndex('roomKey_1');
      console.log('Dropped legacy index: chatrooms.roomKey_1');
    }
  } catch (error) {
    const knownNoIndexError = error?.codeName === 'IndexNotFound' || error?.code === 27;
    if (!knownNoIndexError) {
      console.warn('Failed to drop legacy roomKey index:', error.message);
    }
  }
};

const collectJoinedRoomIds = (socket) => {
  const joinedRooms = [];
  socket.rooms.forEach((roomId) => {
    if (roomId !== socket.id) {
      joinedRooms.push(roomId);
    }
  });
  return joinedRooms;
};

// 전체 멤버(ChatRoom.memberIds)와 현재 온라인 상태(roomPresence)를 합쳐 전송한다.
const emitRoomParticipants = async (roomId) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const room = await ChatRoom.findById(roomId).lean();
  if (!room) {
    return;
  }

  const memberIds = Array.isArray(room.memberIds) ? room.memberIds : [];
  const objectIdMemberIds = memberIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const users = await User.find({ _id: { $in: objectIdMemberIds } })
    .select({ _id: 1, nickname: 1 })
    .lean();

  const userById = new Map(users.map((u) => [String(u._id), u]));
  const onlineMap = roomPresence.get(String(room._id)) || new Map();

  const participants = memberIds.map((memberId) => {
    const found = userById.get(memberId);
    const online = Boolean(onlineMap.get(memberId)?.size);

    return {
      userId: memberId,
      nickname: found?.nickname || memberId,
      online,
    };
  });

  io.to(String(room._id)).emit('room_participants', {
    roomId: String(room._id),
    participants,
  });
};

io.use((socket, next) => {
  try {
    const authToken = socket.handshake?.auth?.token || '';
    const bearerHeader = String(socket.handshake?.headers?.authorization || '');
    const bearerToken = bearerHeader.replace(/^Bearer\s+/i, '');
    const token = authToken || bearerToken;

    if (!token) {
      return next(new Error('unauthorized'));
    }
    if (!JWT_SECRET) {
      return next(new Error('server auth misconfigured'));
    }

    socket.user = verifyAccessToken(token, JWT_SECRET);
    return next();
  } catch (_error) {
    return next(new Error('unauthorized'));
  }
});

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(express.json());

app.use(
  '/auth',
  createAuthRouter({
    User,
    assertDbConnected,
    config: {
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      JWT_SIGNUP_SECRET,
      ACCESS_TOKEN_EXPIRES_IN,
      REFRESH_TOKEN_EXPIRES_IN,
      SIGNUP_TOKEN_EXPIRES_IN,
      KAKAO_REST_API_KEY,
      KAKAO_REDIRECT_URI,
      KAKAO_CLIENT_SECRET,
    },
    logger: console,
  })
);

app.use(
  '/api',
  createChatroomRouter({
    ChatRoom,
    Message,
    User,
    Friendship,
    Notification,
    ChatReadState,
    requireAuth,
    assertDbConnected,
    emitNotificationCreated,
    emitFriendshipUpdated,
  })
);

app.use(
  '/api',
  createFriendRouter({
    User,
    Friendship,
    Notification,
    requireAuth,
    assertDbConnected,
    emitNotificationCreated,
    emitFriendshipUpdated,
  })
);

app.use(
  '/api',
  createNotificationRouter({
    Notification,
    requireAuth,
    assertDbConnected,
    emitNotificationRead,
  })
);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.join(`user:${socket.user.userId}`);

  socket.on('join_room', async (payload = {}) => {
    const roomId = String(payload.roomId || '').trim();

    if (!roomId) {
      emitSocketError(socket, 'INVALID_REQUEST', 'roomId is required');
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      emitSocketError(socket, 'DB_NOT_CONNECTED', 'database is not connected');
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        emitSocketError(socket, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(socket.user.userId)) {
        emitSocketError(socket, 'FORBIDDEN', 'forbidden');
        return;
      }

      socket.join(roomId);
      addPresence(roomId, socket.user.userId, socket.id);

      socket.emit('room_joined', {
        roomId,
        room: toRoomResponse(room),
      });

      await emitRoomParticipants(roomId);
    } catch (_error) {
      emitSocketError(socket, 'ROOM_JOIN_FAILED', 'failed to join room');
    }
  });

  socket.on('send_message', async (payload = {}) => {
    const roomId = String(payload.roomId || '').trim();
    const text = String(payload.text || '').trim();
    const type = payload.type === 'system' ? 'system' : 'text';

    if (!roomId || !text) {
      emitSocketError(socket, 'INVALID_REQUEST', 'roomId and text are required');
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      emitSocketError(socket, 'DB_NOT_CONNECTED', 'database is not connected');
      return;
    }

    try {
      const room = await ChatRoom.findById(roomId);
      if (!room) {
        emitSocketError(socket, 'ROOM_NOT_FOUND', 'chatroom not found');
        return;
      }

      if (!room.memberIds.includes(socket.user.userId)) {
        emitSocketError(socket, 'FORBIDDEN', 'forbidden');
        return;
      }

      const message = await Message.create({
        chatRoomId: roomId,
        senderId: socket.user.userId,
        senderNickname: socket.user.nickname,
        type,
        text,
        timestamp: new Date(),
      });

      room.lastMessage = message.text;
      room.lastMessageAt = message.timestamp;
      await room.save();

      // 새 메시지를 보낸 직후 unreadCount를 계산해 두면 같은 payload를 현재 방/다른 방 UI에서 모두 재사용할 수 있다.
      // 보낸 사람 자신은 unread 대상이 아니므로 읽음 상태 조회 대상에서도 제외한다.
      const memberIds = Array.isArray(room.memberIds) ? room.memberIds.map((value) => String(value)) : [];
      const targetReadStates = await ChatReadState.find({
        roomId,
        userId: { $in: memberIds.filter((memberId) => memberId !== socket.user.userId) },
      }).lean();
      const readStateByUserId = new Map(targetReadStates.map((state) => [String(state.userId), state]));
      // 규칙: lastReadAt이 없거나 메시지 시각보다 이전이면 아직 읽지 않은 것으로 본다.
      const unreadCount = memberIds.filter((memberId) => {
        if (memberId === socket.user.userId) return false;
        const readState = readStateByUserId.get(String(memberId));
        if (!readState?.lastReadAt) return true;
        return new Date(readState.lastReadAt) < message.timestamp;
      }).length;

      io.to(roomId).emit('receive_message', {
        id: String(message._id),
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        senderNickname: message.senderNickname,
        type: message.type,
        text: message.text,
        timestamp: new Date(message.timestamp).toISOString(),
        unreadCount,
      });
    } catch (_error) {
      emitSocketError(socket, 'MESSAGE_PROCESS_FAILED', 'failed to process message');
    }
  });

  socket.on('disconnect', async () => {
    const joinedRoomIds = collectJoinedRoomIds(socket);
    joinedRoomIds.forEach((roomId) => {
      removePresence(roomId, socket.user.userId, socket.id);
    });

    for (const roomId of joinedRoomIds) {
      try {
        await emitRoomParticipants(roomId);
      } catch (_error) {
        // 연결 종료 중 브로드캐스트 실패는 무시한다.
      }
    }

    console.log(`Socket disconnected: ${socket.id}`);
  });
});

async function start() {
  const { MONGODB_URI } = process.env;

  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await dropLegacyChatRoomIndexIfExists();
  } else {
    console.log('MONGODB_URI not set. Starting without database connection.');
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});






