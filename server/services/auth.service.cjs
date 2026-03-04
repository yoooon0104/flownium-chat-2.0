const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

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
