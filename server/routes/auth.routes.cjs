const express = require('express');
const {
  hashToken,
  issueJwtTokens,
  verifyRefreshToken,
} = require('../services/auth.service.cjs');
const {
  exchangeKakaoAccessToken,
  fetchKakaoUserProfile,
} = require('../services/kakao.service.cjs');

const createAuthRouter = ({ User, assertDbConnected, config, logger = console }) => {
  const router = express.Router();

  const toClientUser = (userDoc) => ({
    id: String(userDoc._id),
    kakaoId: userDoc.kakaoId,
    nickname: userDoc.nickname,
    profileImage: userDoc.profileImage || '',
  });

  // 카카오 OAuth callback code를 access token으로 교환하고,
  // 카카오 사용자 정보를 바탕으로 User를 upsert한 뒤 JWT를 발급한다.
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

      const tokens = issueJwtTokens(user, config);
      user.refreshTokenHash = hashToken(tokens.refreshToken);
      await user.save();

      res.status(200).json({
        user: toClientUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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

  // refresh token을 검증하고 access/refresh token을 재발급한다.
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

      const tokens = issueJwtTokens(user, config);
      user.refreshTokenHash = hashToken(tokens.refreshToken);
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

  return router;
};

module.exports = createAuthRouter;
