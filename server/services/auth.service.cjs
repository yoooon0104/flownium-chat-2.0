const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 토큰 원문을 DB에 저장하지 않기 위해 SHA-256 해시 문자열로 변환한다.
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

// 사용자 문서를 바탕으로 access/refresh JWT를 동시에 발급한다.
const issueJwtTokens = (userDoc, config) => {
  const {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES_IN = '1h',
    REFRESH_TOKEN_EXPIRES_IN = '14d',
  } = config;

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

// access 토큰의 구조와 타입을 검증한다.
const verifyAccessToken = (token, jwtSecret) => {
  const decoded = jwt.verify(token, jwtSecret);
  const userId = String(decoded.userId || decoded.sub || '').trim();
  const nickname = String(decoded.nickname || 'unknown').trim();
  const tokenType = String(decoded.tokenType || 'access').trim();

  if (!userId || tokenType !== 'access') {
    throw new Error('unauthorized');
  }

  return { userId, nickname };
};

// refresh 토큰은 tokenType=refresh인지 추가 검증한다.
const verifyRefreshToken = (token, refreshSecret) => {
  const decoded = jwt.verify(token, refreshSecret);
  const userId = String(decoded.userId || '').trim();
  const tokenType = String(decoded.tokenType || '').trim();

  if (!userId || tokenType !== 'refresh') {
    throw new Error('invalid refresh token');
  }

  return { userId };
};

module.exports = {
  hashToken,
  issueJwtTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
