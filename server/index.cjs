const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Server } = require('socket.io');
const Message = require('./models/message.model.cjs');

// 실행 위치와 무관하게 server/.env를 항상 읽도록 절대 경로 기준으로 로드한다.
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
// 환경변수가 없을 때도 로컬 개발이 가능하도록 안전한 기본값을 둔다.
const PORT = process.env.PORT || 3010;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;

// REST와 Socket 모두 동일한 origin 정책을 적용해 CORS 불일치를 방지한다.
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// 소켓 연결 단계에서 JWT를 검증한다.
// 실패하면 connection 자체를 차단해 이후 이벤트 처리로 진입하지 못하게 한다.
io.use((socket, next) => {
  try {
    // 우선순위: handshake.auth.token -> Authorization Bearer 헤더.
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

    // 토큰 유효성 검증 후 소켓 컨텍스트에 사용자 정보를 실어 둔다.
    // 이후 send_message 등 이벤트 핸들러에서 재사용한다.
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = String(decoded.userId || decoded.sub || '').trim();
    const nickname = String(decoded.nickname || 'unknown').trim();

    if (!userId) {
      return next(new Error('unauthorized'));
    }

    socket.user = { userId, nickname };
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

// 서버 기동/헬스체크 확인용 최소 엔드포인트.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// 채팅방 메시지 히스토리 조회 API.
// 최신 limit개를 조회한 뒤 UI 표시를 위해 오름차순으로 되돌려 반환한다.
app.get('/api/chatrooms/:id/messages', async (req, res) => {
  const roomId = String(req.params.id || '').trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  if (!roomId) {
    res.status(400).json({ error: 'roomId is required' });
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'database is not connected' });
    return;
  }

  try {
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

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 클라이언트를 room에 입장시키고, 입장 확인 이벤트를 해당 클라이언트에 돌려준다.
  socket.on('join_room', (payload = {}) => {
    const roomId = String(payload.roomId || '').trim();

    if (!roomId) {
      socket.emit('error', { message: 'roomId is required' });
      return;
    }

    socket.join(roomId);
    socket.emit('room_joined', { roomId });
  });

  // 메시지를 수신해 DB에 저장한 뒤 같은 room의 모든 클라이언트에 브로드캐스트한다.
  socket.on('send_message', async (payload = {}) => {
    const roomId = String(payload.roomId || '').trim();
    const text = String(payload.text || '').trim();
    const type = payload.type === 'system' ? 'system' : 'text';

    if (!roomId || !text) {
      socket.emit('error', { message: 'roomId and text are required' });
      return;
    }

    const messagePayload = {
      chatRoomId: roomId,
      senderId: socket.user.userId,
      senderNickname: socket.user.nickname,
      type,
      text,
      timestamp: new Date(),
    };

    try {
      // DB 연결 상태면 영속 저장, 미연결 상태면 메모리 payload만으로 실시간 송신을 유지한다.
      const message =
        mongoose.connection.readyState === 1
          ? await Message.create(messagePayload)
          : messagePayload;

      const response = {
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        senderNickname: message.senderNickname,
        type: message.type,
        text: message.text,
        timestamp: new Date(message.timestamp).toISOString(),
      };

      io.to(roomId).emit('receive_message', response);
    } catch (_error) {
      socket.emit('error', { message: 'failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

async function start() {
  const { MONGODB_URI } = process.env;

  // 초기 단계 테스트를 위해 DB 설정이 없어도 서버는 기동한다.
  // 단, 히스토리 조회 API는 DB 미연결 시 503을 반환한다.
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
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