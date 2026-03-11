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
const { sendError } = require('../utils/error-response.cjs');

// 인증 관련 라우터를 의존성 주입 방식으로 생성한다.
const createAuthRouter = ({
  User,
  AuthIdentity,
  Friendship,
  ChatRoom,
  Message,
  ChatReadState,
  Notification,
  assertDbConnected,
  disconnectUserFromRoom,
  emitFriendshipUpdated,
  emitRoomUpdated,
  emitRoomDeleted,
  emitRoomParticipants,
  config,
  logger = console,
}) => {
  const router = express.Router();

  const extractBearerToken = (req) => {
    const raw = String(req.headers.authorization || '').trim();
    return raw.replace(/^Bearer\s+/i, '').trim();
  };

  const isDeletedUser = (userDoc) => String(userDoc?.accountStatus || 'active') === 'deleted';

  const findDeletedMemberIds = async (memberIds) => {
    const normalizedMemberIds = Array.isArray(memberIds)
      ? memberIds.map((value) => String(value))
      : [];

    if (normalizedMemberIds.length === 0) {
      return [];
    }

    const deletedUsers = await User.find({
      _id: { $in: normalizedMemberIds },
      accountStatus: 'deleted',
    })
      .select({ _id: 1 })
      .lean();

    return deletedUsers.map((user) => String(user._id));
  };

  // DB 사용자 문서를 클라이언트 응답 포맷으로 변환한다.
  const toClientUser = (userDoc) => ({
    id: String(userDoc._id),
    kakaoId: userDoc.kakaoId || '',
    email: userDoc.email || '',
    nickname: userDoc.nickname,
    profileImage: userDoc.profileImage || '',
    isDeleted: isDeletedUser(userDoc),
  });

  const findIdentity = async (provider, providerUserId) => {
    return AuthIdentity.findOne({
      provider: String(provider || '').trim().toLowerCase(),
      providerUserId: String(providerUserId || '').trim(),
    });
  };

  // 레거시 kakaoId 기반 사용자도 첫 로그인 시 identity로 승격해 점진적으로 이전한다.
  const migrateLegacyKakaoIdentityIfNeeded = async (kakaoUser) => {
    const existingIdentity = await findIdentity('kakao', kakaoUser.kakaoId);
    if (existingIdentity) {
      return existingIdentity;
    }

    const legacyUser = await User.findOne({ kakaoId: kakaoUser.kakaoId });
    if (!legacyUser || isDeletedUser(legacyUser)) {
      return null;
    }

    return AuthIdentity.findOneAndUpdate(
      {
        provider: 'kakao',
        providerUserId: kakaoUser.kakaoId,
      },
      {
        $set: {
          userId: legacyUser._id,
          providerEmail: kakaoUser.email || legacyUser.email || '',
          lastLoginAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  };

  // 로그인 성공 공통 응답: 토큰 발급/해시 저장을 한곳에서 처리한다.
  const respondLoginSuccess = async (res, user, identity = null) => {
    const tokens = issueJwtTokens(user, config);
    user.refreshTokenHash = hashToken(tokens.refreshToken);
    await user.save();
    if (identity) {
      identity.lastLoginAt = new Date();
      if (!identity.providerEmail && user.email) {
        identity.providerEmail = user.email;
      }
      await identity.save();
    }

    res.status(200).json({
      resultType: 'LOGIN_SUCCESS',
      user: toClientUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  };

  const toRoomResponse = async (roomDoc) => {
    const memberIds = Array.isArray(roomDoc.memberIds) ? roomDoc.memberIds.map((value) => String(value)) : [];
    const deletedMemberIds = await findDeletedMemberIds(memberIds);

    return {
      id: String(roomDoc._id),
      name: roomDoc.name,
      isGroup: Boolean(roomDoc.isGroup),
      memberIds,
      lastMessage: roomDoc.lastMessage || '',
      lastMessageAt: roomDoc.lastMessageAt ? new Date(roomDoc.lastMessageAt).toISOString() : null,
      unreadCount: 0,
      deletedMemberIds,
      hasDeletedMember: deletedMemberIds.length > 0,
      directChatDisabled: !roomDoc.isGroup && deletedMemberIds.length > 0,
    };
  };

  const deleteRoomResources = async (roomId) => {
    await Promise.all([
      Message.deleteMany({ chatRoomId: String(roomId) }),
      ChatReadState.deleteMany({ roomId: String(roomId) }),
      ChatRoom.deleteOne({ _id: roomId }),
    ]);
  };

  // 회원탈퇴 시 남는 찌꺼기를 줄이기 위해, 친구/방/알림의 관련 사용자에게 즉시 재조회 신호를 보낸다.
  const cleanupUserAccount = async (userDoc) => {
    const userId = String(userDoc._id);
    const now = new Date();
    const rooms = await ChatRoom.find({ memberIds: userId });
    const friendships = await Friendship.find({
      $or: [{ requesterId: userId }, { addresseeId: userId }],
    }).lean();

    const relatedFriendUserIds = [
      ...new Set(
        friendships
          .flatMap((friendship) => [String(friendship.requesterId), String(friendship.addresseeId)])
          .filter((targetUserId) => targetUserId && targetUserId !== userId)
      ),
    ];

    for (const room of rooms) {
      const roomId = String(room._id);
      const currentMemberIds = Array.isArray(room.memberIds)
        ? room.memberIds.map((memberId) => String(memberId))
        : [];

      if (!room.isGroup) {
        await disconnectUserFromRoom?.(roomId, userId);
        await ChatReadState.deleteOne({ roomId, userId });

        const nextRoomPayload = await toRoomResponse(room);
        await Promise.all(
          currentMemberIds
            .filter((memberId) => memberId !== userId)
            .map((memberId) => emitRoomUpdated?.(memberId, nextRoomPayload))
        );
        await emitRoomParticipants?.(roomId);
        continue;
      }

      const nextMemberIds = currentMemberIds.filter((memberId) => memberId !== userId);
      await disconnectUserFromRoom?.(roomId, userId);
      await ChatReadState.deleteOne({ roomId, userId });

      if (nextMemberIds.length === 0) {
        await deleteRoomResources(roomId);
        currentMemberIds.forEach((memberId) => emitRoomDeleted?.(memberId, roomId));
        continue;
      }

      room.memberIds = nextMemberIds;
      room.isGroup = true;
      await room.save();

      await Promise.all(
        nextMemberIds.map(async (memberId) => emitRoomUpdated?.(memberId, await toRoomResponse(room)))
      );
      emitRoomDeleted?.(userId, roomId);
      await emitRoomParticipants?.(roomId);
    }

    await Promise.all([
      AuthIdentity.deleteMany({ userId }),
      Friendship.deleteMany({
        status: { $ne: 'accepted' },
        $or: [{ requesterId: userId }, { addresseeId: userId }],
      }),
      Notification.deleteMany({
        $or: [
          { userId },
          { 'payload.requester.userId': userId },
          { 'payload.inviter.userId': userId },
        ],
      }),
      ChatReadState.deleteMany({ userId }),
      User.updateOne(
        { _id: userId },
        {
          $set: {
            accountStatus: 'deleted',
            deletedAt: now,
            kakaoId: '',
            email: '',
            profileImage: '',
            refreshTokenHash: null,
            signupCompletedAt: null,
            agreedToTermsAt: null,
          },
        }
      ),
    ]);

    relatedFriendUserIds.forEach((targetUserId) => {
      emitFriendshipUpdated?.(targetUserId, {
        type: 'account_deleted',
        userId,
      });
    });
  };

  // 카카오 OAuth callback code를 처리해 로그인 또는 온보딩 분기를 수행한다.
  router.get('/kakao/callback', async (req, res) => {
    const code = String(req.query.code || '').trim();

    if (!code) {
      sendError(res, 400, 'INVALID_REQUEST', 'code is required');
      return;
    }

    if (!config.KAKAO_REST_API_KEY || !config.KAKAO_REDIRECT_URI) {
      sendError(res, 500, 'SERVER_MISCONFIGURED', 'kakao oauth config is missing');
      return;
    }

    if (!config.JWT_SIGNUP_SECRET) {
      sendError(res, 500, 'SERVER_MISCONFIGURED', 'signup auth config is missing');
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

      const identity = await migrateLegacyKakaoIdentityIfNeeded(kakaoUser);
      const existingUser = identity ? await User.findById(identity.userId) : null;

      // 가입이 완료된 사용자는 즉시 로그인 처리하고 최신 로그인 시점만 갱신한다.
      if (existingUser && existingUser.signupCompletedAt && !isDeletedUser(existingUser)) {
        existingUser.lastLoginAt = new Date();
        existingUser.email = kakaoUser.email || existingUser.email || '';
        // 1차 정책: 프로필 이미지는 카카오 원본을 우선 반영한다.
        existingUser.profileImage = kakaoUser.profileImage || existingUser.profileImage || '';
        await existingUser.save();
        await respondLoginSuccess(res, existingUser, identity);
        return;
      }

      const signupToken = issueSignupToken(
        {
          provider: 'kakao',
          providerUserId: kakaoUser.kakaoId,
          email: kakaoUser.email,
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
          email: kakaoUser.email || '',
          nickname: kakaoUser.nickname,
          profileImage: kakaoUser.profileImage || '',
        },
      });
    } catch (error) {
      logger.error('[auth:kakao/callback] failed', {
        message: error.message,
        status: error.status || null,
        body: error.body || null,
        details: error.details || null,
      });
      sendError(res, 502, 'KAKAO_LOGIN_FAILED', 'failed to complete kakao login');
    }
  });

  // 가입 의사를 받은 최초 사용자를 실제 회원으로 확정하고 토큰을 발급한다.
  router.post('/signup/complete', async (req, res) => {
    const signupToken = String(req.body?.signupToken || '').trim();
    const agreedToTerms = req.body?.agreedToTerms === true;

    if (!signupToken) {
      sendError(res, 400, 'INVALID_REQUEST', 'signupToken is required');
      return;
    }

    if (!agreedToTerms) {
      sendError(res, 400, 'TERMS_NOT_AGREED', 'agreedToTerms must be true');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const {
        provider,
        providerUserId,
        email,
        profileImage,
        kakaoNickname,
      } = verifySignupToken(signupToken, config.JWT_SIGNUP_SECRET);
      const nickname = validateNickname(req.body?.nickname || kakaoNickname);
      const now = new Date();
      let identity = await findIdentity(provider, providerUserId);
      let user = identity ? await User.findById(identity.userId) : null;

      // 레거시 kakaoId 사용자는 첫 가입 완료 시점에 identity를 생성하고 사용자 문서를 재사용한다.
      if (!identity && provider === 'kakao') {
        const legacyUser = await User.findOne({
          kakaoId: providerUserId,
          accountStatus: { $ne: 'deleted' },
        });

        if (legacyUser) {
          user = legacyUser;
          identity = await AuthIdentity.findOneAndUpdate(
            {
              provider,
              providerUserId,
            },
            {
              $set: {
                userId: legacyUser._id,
                providerEmail: String(email || '').trim().toLowerCase(),
                lastLoginAt: now,
              },
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );
        }
      }

      if (!user || isDeletedUser(user)) {
        user = await User.create({
          email: String(email || '').trim().toLowerCase(),
          nickname,
          profileImage: profileImage || '',
          lastLoginAt: now,
          signupCompletedAt: now,
          agreedToTermsAt: now,
          nicknameUpdatedAt: now,
          accountStatus: 'active',
          deletedAt: null,
          kakaoId: provider === 'kakao' ? '' : '',
        });
      } else {
        user.email = String(email || '').trim().toLowerCase();
        user.nickname = nickname;
        user.profileImage = profileImage || '';
        user.lastLoginAt = now;
        user.signupCompletedAt = now;
        user.agreedToTermsAt = now;
        user.nicknameUpdatedAt = now;
        user.accountStatus = 'active';
        user.deletedAt = null;
        user.kakaoId = '';
        await user.save();
      }

      if (!identity) {
        identity = await AuthIdentity.create({
          userId: user._id,
          provider,
          providerUserId,
          providerEmail: String(email || '').trim().toLowerCase(),
          lastLoginAt: now,
        });
      } else {
        identity.userId = user._id;
        identity.providerEmail = String(email || '').trim().toLowerCase();
        identity.lastLoginAt = now;
        await identity.save();
      }

      await respondLoginSuccess(res, user, identity);
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('nickname must be between')) {
        sendError(res, 400, 'INVALID_NICKNAME', 'nickname must be between 2 and 20 characters');
        return;
      }

      sendError(res, 401, 'INVALID_SIGNUP_TOKEN', 'invalid signup token');
    }
  });

  // refresh token을 검증하고 access/refresh 토큰을 재발급한다.
  router.post('/refresh', async (req, res) => {
    const refreshToken = String(req.body?.refreshToken || '').trim();

    if (!refreshToken) {
      sendError(res, 400, 'INVALID_REQUEST', 'refreshToken is required');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const { userId } = verifyRefreshToken(refreshToken, config.JWT_REFRESH_SECRET);
      const refreshTokenHash = hashToken(refreshToken);
      const user = await User.findOne({ _id: userId, refreshTokenHash, accountStatus: { $ne: 'deleted' } });

      if (!user) {
        sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'refresh token is not recognized');
        return;
      }

      await respondLoginSuccess(res, user);
    } catch (_error) {
      sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'invalid refresh token');
    }
  });

  // 현재 인증 사용자의 프로필 정보를 조회한다.
  router.get('/me', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const auth = verifyAccessToken(accessToken, config.JWT_SECRET);
      const user = await User.findById(auth.userId);

      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      res.status(200).json({ user: toClientUser(user) });
    } catch (_error) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
    }
  });

  // 인증 사용자 프로필(1차: 닉네임)을 수정한다.
  router.patch('/profile', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const auth = verifyAccessToken(accessToken, config.JWT_SECRET);
      const nickname = validateNickname(req.body?.nickname);

      const user = await User.findById(auth.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      user.nickname = nickname;
      user.nicknameUpdatedAt = new Date();
      await user.save();

      res.status(200).json({ user: toClientUser(user) });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('nickname must be between')) {
        sendError(res, 400, 'INVALID_NICKNAME', 'nickname must be between 2 and 20 characters');
        return;
      }

      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
    }
  });

  // 회원탈퇴는 사용자 문서뿐 아니라 친구/채팅/알림 데이터도 함께 정리한다.
  router.delete('/account', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const auth = verifyAccessToken(accessToken, config.JWT_SECRET);
      const user = await User.findById(auth.userId);

      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      await cleanupUserAccount(user);

      res.status(200).json({
        deleted: true,
        userId: String(user._id),
      });
    } catch (error) {
      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
        return;
      }

      logger.error('[auth:delete/account] failed', {
        message: error.message,
      });
      sendError(res, 500, 'ACCOUNT_DELETE_FAILED', 'failed to delete account');
    }
  });

  return router;
};

module.exports = createAuthRouter;

