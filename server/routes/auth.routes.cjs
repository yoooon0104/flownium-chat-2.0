const express = require('express');
const {
  hashToken,
  issueJwtTokens,
  issueSignupToken,
  validateNickname,
  verifyAccessToken,
  verifyRefreshToken,
  verifySignupToken,
} = require('../services/auth.service.cjs');
const {
  exchangeKakaoAccessToken,
  fetchKakaoUserProfile,
} = require('../services/kakao.service.cjs');

// 인증 관련 라우터를 의존성 주입 방식으로 생성한다.
const createAuthRouter = ({ User, assertDbConnected, config, logger = console }) => {
  const router = express.Router();

  const extractBearerToken = (req) => {
    const raw = String(req.headers.authorization || '').trim();
    return raw.replace(/^Bearer\s+/i, '').trim();
  };

  // DB 사용자 문서를 클라이언트 응답 포맷으로 변환한다.
  const toClientUser = (userDoc) => ({
    id: String(userDoc._id),
    kakaoId: userDoc.kakaoId,
    nickname: userDoc.nickname,
    profileImage: userDoc.profileImage || '',
  });

  // 로그인 성공 공통 응답: 토큰 발급/해시 저장을 한곳에서 처리한다.
  const respondLoginSuccess = async (res, user) => {
    const tokens = issueJwtTokens(user, config);
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      resultType: 'LOGIN_SUCCESS',
      user: toClientUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  };

  // 카카오 OAuth callback code를 처리해 로그인 또는 온보딩 분기를 수행한다.
  router.get('/kakao/callback', async (req, res) => {
    const code = String(req.query.code || '').trim();

    if (!code) {
      res.status(400).json({ error: 'code is required' });
      return;
    }

    if (!config.KAKAO_REST_API_KEY || !config.KAKAO_REDIRECT_URI) {
      res.status(500).json({ error: 'kakao oauth config is missing' });
      return;
    }

    if (!config.JWT_SIGNUP_SECRET) {
      res.status(500).json({ error: 'signup auth config is missing' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const kakaoToken = await exchangeKakaoAccessToken({
        code,
        restApiKey: config.KAKAO_REST_API_KEY,
        redirectUri: config.KAKAO_REDIRECT_URI,
        clientSecret: config.KAKAO_CLIENT_SECRET,
      });
      const kakaoUser = await fetchKakaoUserProfile(kakaoToken.access_token);

      const existingUser = await User.findOne({ kakaoId: kakaoUser.kakaoId });

      // 가입이 완료된 사용자는 즉시 로그인 처리하고 최신 로그인 시점만 갱신한다.
      if (existingUser && existingUser.signupCompletedAt) {
        existingUser.lastLoginAt = new Date();
        // 1차 정책: 프로필 이미지는 카카오 원본을 우선 반영한다.
        existingUser.profileImage = kakaoUser.profileImage || existingUser.profileImage || '';
        await existingUser.save();
        await respondLoginSuccess(res, existingUser);
        return;
      }

      const signupToken = issueSignupToken(
        {
          kakaoId: kakaoUser.kakaoId,
          profileImage: kakaoUser.profileImage,
          kakaoNickname: kakaoUser.nickname,
        },
        config
      );

      res.status(200).json({
        resultType: 'SIGNUP_REQUIRED',
        signupToken,
        kakaoProfile: {
          kakaoId: kakaoUser.kakaoId,
          nickname: kakaoUser.nickname,
          profileImage: kakaoUser.profileImage || '',
        },
      });
    } catch (error) {
      logger.error('[auth:kakao/callback] failed', {
        message: error.message,
        status: error.status || null,
        body: error.body || null,
      });
      res.status(502).json({ error: 'failed to complete kakao login' });
    }
  });

  // 가입 의사를 받은 최초 사용자를 실제 회원으로 확정하고 토큰을 발급한다.
  router.post('/signup/complete', async (req, res) => {
    const signupToken = String(req.body?.signupToken || '').trim();
    const agreedToTerms = req.body?.agreedToTerms === true;

    if (!signupToken) {
      res.status(400).json({ error: 'signupToken is required' });
      return;
    }

    if (!agreedToTerms) {
      res.status(400).json({ error: 'agreedToTerms must be true' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const { kakaoId, profileImage, kakaoNickname } = verifySignupToken(signupToken, config.JWT_SIGNUP_SECRET);
      const nickname = validateNickname(req.body?.nickname || kakaoNickname);
      const now = new Date();

      const user = await User.findOneAndUpdate(
        { kakaoId },
        {
          $set: {
            nickname,
            profileImage: profileImage || '',
            lastLoginAt: now,
            signupCompletedAt: now,
            agreedToTermsAt: now,
            nicknameUpdatedAt: now,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      await respondLoginSuccess(res, user);
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('nickname must be between')) {
        res.status(400).json({ error: 'nickname must be between 2 and 20 characters' });
        return;
      }

      res.status(401).json({ error: 'invalid signup token' });
    }
  });

  // refresh token을 검증하고 access/refresh 토큰을 재발급한다.
  router.post('/refresh', async (req, res) => {
    const refreshToken = String(req.body?.refreshToken || '').trim();

    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const { userId } = verifyRefreshToken(refreshToken, config.JWT_REFRESH_SECRET);
      const refreshTokenHash = hashToken(refreshToken);
      const user = await User.findOne({ _id: userId, refreshTokenHash });

      if (!user) {
        res.status(401).json({ error: 'refresh token is not recognized' });
        return;
      }

      await respondLoginSuccess(res, user);
    } catch (_error) {
      res.status(401).json({ error: 'invalid refresh token' });
    }
  });

  // 인증 사용자 프로필(1차: 닉네임)을 수정한다.
  router.patch('/profile', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const auth = verifyAccessToken(accessToken, config.JWT_SECRET);
      const nickname = validateNickname(req.body?.nickname);

      const user = await User.findById(auth.userId);
      if (!user) {
        res.status(404).json({ error: 'user not found' });
        return;
      }

      user.nickname = nickname;
      user.nicknameUpdatedAt = new Date();
      await user.save();

      res.status(200).json({ user: toClientUser(user) });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('nickname must be between')) {
        res.status(400).json({ error: 'nickname must be between 2 and 20 characters' });
        return;
      }

      res.status(401).json({ error: 'unauthorized' });
    }
  });

  return router;
};

module.exports = createAuthRouter;
