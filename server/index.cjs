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
const createAuthRouter = require('./routes/auth.routes.cjs');
const createChatroomRouter = require('./routes/chatroom.routes.cjs');
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

// roomId -> (userId -> Set(socketId)) 구조로 온라인 상태를 관리한다.
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


// 과거 스키마에서 남은 roomKey 유니크 인덱스를 제거해 E11000 충돌을 방지한다.
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
  // memberIds에 ObjectId 형식이 아닌 값이 섞여도 캐스팅 에러가 나지 않도록 필터링한다.
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
    requireAuth,
    assertDbConnected,
  })
);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', async (payload = {}) => {
    // 방 입장 시 멤버가 아니면 memberIds에 추가한 뒤 room_participants를 갱신한다.
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
        room.memberIds.push(socket.user.userId);
        await room.save();
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
    // 메시지 저장 후 채팅방 요약(lastMessage, lastMessageAt)을 함께 갱신한다.
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

      io.to(roomId).emit('receive_message', {
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        senderNickname: message.senderNickname,
        type: message.type,
        text: message.text,
        timestamp: new Date(message.timestamp).toISOString(),
      });
    } catch (_error) {
      emitSocketError(socket, 'MESSAGE_PROCESS_FAILED', 'failed to process message');
    }
  });

  socket.on('disconnect', async () => {
    // 연결 종료 시 참여 중인 방들의 온라인 상태를 다시 계산해 브로드캐스트한다.
    const joinedRoomIds = collectJoinedRoomIds(socket);
    joinedRoomIds.forEach((roomId) => {
      removePresence(roomId, socket.user.userId, socket.id);
    });

    for (const roomId of joinedRoomIds) {
      try {
        await emitRoomParticipants(roomId);
      } catch (_error) {
        // Ignore broadcast failures during disconnect cleanup.
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
