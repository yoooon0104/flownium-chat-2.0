const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message = require('./models/message.model.cjs');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3010;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 로컬 개발 시 REST/Socket CORS 정책을 동일하게 유지한다.
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(express.json());

// 서버 기동 확인용 최소 헬스체크 엔드포인트.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// 채팅방 메시지 히스토리 조회 API.
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
  } catch (error) {
    res.status(500).json({ error: 'failed to fetch messages' });
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 클라이언트를 room에 참가시키고 참가 완료 이벤트를 돌려준다.
  socket.on('join_room', (payload = {}) => {
    const roomId = String(payload.roomId || '').trim();

    if (!roomId) {
      socket.emit('error', { message: 'roomId is required' });
      return;
    }

    socket.join(roomId);
    socket.emit('room_joined', { roomId });
  });

  // 같은 room의 모든 클라이언트에게 메시지를 브로드캐스트한다.
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
      senderId: socket.id,
      senderNickname: `user-${socket.id.slice(0, 5)}`,
      type,
      text,
      timestamp: new Date(),
    };

    try {
      // DB 연결 상태에서는 메시지를 먼저 저장한다.
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
    } catch (error) {
      socket.emit('error', { message: 'failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

async function start() {
  const { MONGODB_URI } = process.env;

  // 초기 단계 테스트를 위해 DB 설정이 없어도 서버를 기동한다.
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