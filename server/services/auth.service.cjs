const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 토큰 원문을 DB에 저장하지 않기 위해 SHA-256 해시 문자열로 변환한다.
const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const normalizeEmail = (rawEmail) => {
  return String(rawEmail || '').trim().toLowerCase();
};

const generateVerificationCode = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
};

const hashSecret = async (secret) => {
  const normalizedSecret = String(secret || '');
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.scrypt(normalizedSecret, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

const verifySecret = async (secret, hashedSecret) => {
  const normalizedSecret = String(secret || '');
  const [salt, storedHash] = String(hashedSecret || '').split(':');

  if (!salt || !storedHash) {
    return false;
  }

  return new Promise((resolve, reject) => {
    crypto.scrypt(normalizedSecret, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const storedBuffer = Buffer.from(storedHash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey);

      if (storedBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(storedBuffer, derivedBuffer));
    });
  });
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
      email: normalizeEmail(payload.email),
    },
    JWT_SIGNUP_SECRET,
    { expiresIn: SIGNUP_TOKEN_EXPIRES_IN }
  );
};

const issueLinkToken = (payload, config) => {
  const { JWT_LINK_SECRET, JWT_SECRET, SIGNUP_TOKEN_EXPIRES_IN = '10m' } = config;
  const secret = JWT_LINK_SECRET || JWT_SECRET;
  if (!secret) {
    throw new Error('JWT link secret is not configured');
  }

  return jwt.sign(
    {
      tokenType: 'link',
      userId: String(payload.userId || '').trim(),
    },
    secret,
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
    email: normalizeEmail(decoded.email),
    profileImage: String(decoded.profileImage || '').trim(),
    kakaoNickname: String(decoded.kakaoNickname || '').trim(),
  };
};

const verifyLinkToken = (token, secretOrConfig) => {
  const secret =
    typeof secretOrConfig === 'string'
      ? secretOrConfig
      : secretOrConfig?.JWT_LINK_SECRET || secretOrConfig?.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT link secret is not configured');
  }

  const decoded = jwt.verify(token, secret);
  const userId = String(decoded.userId || '').trim();
  const tokenType = String(decoded.tokenType || '').trim();

  if (!userId || tokenType !== 'link') {
    throw new Error('invalid link token');
  }

  return { userId };
};

const validateEmail = (rawEmail) => {
  const email = normalizeEmail(rawEmail);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new Error('invalid email');
  }

  return email;
};

const validatePassword = (rawPassword) => {
  const password = String(rawPassword || '');
  if (password.length < 8 || password.length > 72) {
    throw new Error('password must be between 8 and 72 characters');
  }
  return password;
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
  normalizeEmail,
  generateVerificationCode,
  hashSecret,
  verifySecret,
  issueJwtTokens,
  issueLinkToken,
  issueSignupToken,
  validateEmail,
  verifyAccessToken,
  verifyRefreshToken,
  verifyLinkToken,
  verifySignupToken,
  validateNickname,
  validatePassword,
};
