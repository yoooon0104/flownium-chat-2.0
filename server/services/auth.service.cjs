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

// 최초 로그인 사용자를 온보딩 단계로 넘기기 위한 signup 토큰을 발급한다.
const issueSignupToken = (payload, config) => {
  const { JWT_SIGNUP_SECRET, SIGNUP_TOKEN_EXPIRES_IN = '10m' } = config;
  if (!JWT_SIGNUP_SECRET) {
    throw new Error('JWT signup secret is not configured');
  }

  const provider = String(payload.provider || 'kakao').trim().toLowerCase();
  const providerUserId = String(payload.providerUserId || payload.kakaoId || '').trim();

  return jwt.sign(
    {
      tokenType: 'signup',
      provider,
      providerUserId,
      profileImage: String(payload.profileImage || '').trim(),
      kakaoNickname: String(payload.kakaoNickname || '').trim(),
      email: String(payload.email || '').trim().toLowerCase(),
    },
    JWT_SIGNUP_SECRET,
    { expiresIn: SIGNUP_TOKEN_EXPIRES_IN }
  );
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

// signup 토큰은 tokenType=signup인지 추가 검증한다.
const verifySignupToken = (token, signupSecret) => {
  const decoded = jwt.verify(token, signupSecret);
  const provider = String(decoded.provider || 'kakao').trim().toLowerCase();
  const providerUserId = String(decoded.providerUserId || decoded.kakaoId || '').trim();
  const tokenType = String(decoded.tokenType || '').trim();

  if (!provider || !providerUserId || tokenType !== 'signup') {
    throw new Error('invalid signup token');
  }

  return {
    provider,
    providerUserId,
    email: String(decoded.email || '').trim().toLowerCase(),
    profileImage: String(decoded.profileImage || '').trim(),
    kakaoNickname: String(decoded.kakaoNickname || '').trim(),
  };
};

// 닉네임 입력값을 공통 규칙으로 검증/정규화한다.
const validateNickname = (rawNickname) => {
  const nickname = String(rawNickname || '').trim();
  if (nickname.length < 2 || nickname.length > 20) {
    throw new Error('nickname must be between 2 and 20 characters');
  }
  return nickname;
};

module.exports = {
  hashToken,
  issueJwtTokens,
  issueSignupToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySignupToken,
  validateNickname,
};
