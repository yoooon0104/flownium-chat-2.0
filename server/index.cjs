const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Server } = require('socket.io');
const Message = require('./models/message.model.cjs');
const User = require('./models/user.model.cjs');

// 실행 위치와 무관하게 server/.env를 항상 읽도록 절대 경로 기준으로 로드한다.
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// 환경변수가 없을 때도 로컬 개발이 가능하도록 안전한 기본값을 둔다.
const PORT = process.env.PORT || 3010;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';

// REST와 Socket 모두 동일한 origin 정책을 적용해 CORS 불일치를 방지한다.
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

const toClientUser = (userDoc) => ({
  id: String(userDoc._id),
  kakaoId: userDoc.kakaoId,
  nickname: userDoc.nickname,
  profileImage: userDoc.profileImage || '',
});

// Access/Refresh 토큰을 한 곳에서 발급해 payload/만료 정책을 일관되게 유지한다.
const issueJwtTokens = (userDoc) => {
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('JWT secret is not configured');
  }

  const userId = String(userDoc._id);
  const nickname = String(userDoc.nickname || 'unknown');

  const accessToken = jwt.sign(
    {
      userId,
      nickname,
      tokenType: 'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      tokenType: 'refresh',
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const assertDbConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'database is not connected' });
    return false;
  }

  return true;
};

const exchangeKakaoAccessToken = async (code) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: KAKAO_REDIRECT_URI,
    code,
  });

  if (KAKAO_CLIENT_SECRET) {
    params.append('client_secret', KAKAO_CLIENT_SECRET);
  }

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error('failed to exchange kakao token');
  }

  return response.json();
};

const fetchKakaoUserProfile = async (accessToken) => {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!response.ok) {
    throw new Error('failed to fetch kakao profile');
  }

  const profile = await response.json();
  const kakaoId = String(profile.id || '').trim();

  if (!kakaoId) {
    throw new Error('invalid kakao profile');
  }

  return {
    kakaoId,
    nickname:
      profile?.kakao_account?.profile?.nickname ||
      profile?.properties?.nickname ||
      `kakao-${kakaoId}`,
    profileImage:
      profile?.kakao_account?.profile?.profile_image_url ||
      profile?.properties?.profile_image ||
      '',
  };
};

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
    const tokenType = String(decoded.tokenType || 'access').trim();

    if (!userId || tokenType !== 'access') {
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

// 카카오 OAuth callback code를 access token으로 교환하고,
// 카카오 사용자 정보를 바탕으로 User를 upsert한 뒤 JWT를 발급한다.
app.get('/auth/kakao/callback', async (req, res) => {
  const code = String(req.query.code || '').trim();

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    res.status(500).json({ error: 'kakao oauth config is missing' });
    return;
  }

  if (!assertDbConnected(res)) {
    return;
  }

  try {
    const kakaoToken = await exchangeKakaoAccessToken(code);
    const kakaoUser = await fetchKakaoUserProfile(kakaoToken.access_token);

    const user = await User.findOneAndUpdate(
      { kakaoId: kakaoUser.kakaoId },
      {
        $set: {
          nickname: kakaoUser.nickname,
          profileImage: kakaoUser.profileImage,
          lastLoginAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const tokens = issueJwtTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      user: toClientUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (_error) {
    res.status(502).json({ error: 'failed to complete kakao login' });
  }
});

// refresh token을 검증하고 access/refresh token을 재발급한다.
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || '').trim();

  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  if (!assertDbConnected(res)) {
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const userId = String(decoded.userId || '').trim();
    const tokenType = String(decoded.tokenType || '').trim();

    if (!userId || tokenType !== 'refresh') {
      res.status(401).json({ error: 'invalid refresh token' });
      return;
    }

    const user = await User.findOne({ _id: userId, refreshToken });

    if (!user) {
      res.status(401).json({ error: 'refresh token is not recognized' });
      return;
    }

    const tokens = issueJwtTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      user: toClientUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (_error) {
    res.status(401).json({ error: 'invalid refresh token' });
  }
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

  if (!assertDbConnected(res)) {
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
  // 단, 히스토리 조회/API 인증 관련 기능은 DB 미연결 시 제약이 있다.
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
