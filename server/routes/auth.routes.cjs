const express = require('express');
const {
  generateVerificationCode,
  hashToken,
  hashSecret,
  issueJwtTokens,
  issueLinkToken,
  issueSignupToken,
  validateNickname,
  validateEmail,
  validatePassword,
  validateStrongPassword,
  verifySecret,
  verifyAccessToken,
  verifyLinkToken,
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
  EmailVerification,
  EmailChangeVerification,
  PasswordResetVerification,
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

  const listUserProviders = async (userId) => {
    if (!userId) return [];

    const identities = await AuthIdentity.find({ userId: String(userId) })
      .select({ provider: 1, _id: 0 })
      .lean();

    return [...new Set(identities.map((identity) => String(identity.provider || '').trim().toLowerCase()).filter(Boolean))];
  };

  // DB 사용자 문서를 클라이언트 응답 포맷으로 변환한다.
  const toClientUser = async (userDoc) => ({
    id: String(userDoc._id),
    kakaoId: userDoc.kakaoId || '',
    email: userDoc.email || '',
    nickname: userDoc.nickname,
    profileImage: userDoc.profileImage || '',
    isDeleted: isDeletedUser(userDoc),
    linkedProviders: await listUserProviders(userDoc._id),
  });

  const findIdentity = async (provider, providerUserId) => {
    return AuthIdentity.findOne({
      provider: String(provider || '').trim().toLowerCase(),
      providerUserId: String(providerUserId || '').trim(),
    });
  };

  const EMAIL_VERIFICATION_EXPIRES_IN_MS = 10 * 60 * 1000;
  const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
  const PASSWORD_RESET_EXPIRES_IN_MS = 10 * 60 * 1000;
  const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;
  const EMAIL_CHANGE_EXPIRES_IN_MS = 10 * 60 * 1000;
  const EMAIL_CHANGE_RESEND_COOLDOWN_MS = 60 * 1000;
  const isDevelopment = String(config.NODE_ENV || '').trim().toLowerCase() !== 'production';
  const buildKakaoAuthorizeUrl = (state = '') => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: String(config.KAKAO_REST_API_KEY || '').trim(),
      redirect_uri: String(config.KAKAO_REDIRECT_URI || '').trim(),
    });

    if (state) {
      params.set('state', state);
    }

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
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
      user: await toClientUser(user),
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

  router.post('/kakao/link/start', async (req, res) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
      return;
    }

    if (!config.KAKAO_REST_API_KEY || !config.KAKAO_REDIRECT_URI) {
      sendError(res, 500, 'SERVER_MISCONFIGURED', 'kakao oauth config is missing');
      return;
    }

    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const auth = verifyAccessToken(accessToken, config.JWT_SECRET);
      const user = await User.findById(auth.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
        return;
      }

      const existingIdentity = await AuthIdentity.findOne({
        userId: String(user._id),
        provider: 'kakao',
      }).lean();

      if (existingIdentity) {
        sendError(res, 409, 'KAKAO_ALREADY_CONNECTED', '이미 연결된 카카오 계정이 있습니다.');
        return;
      }

      const linkToken = issueLinkToken({ userId: user._id }, config);
      res.status(200).json({
        authorizeUrl: buildKakaoAuthorizeUrl(linkToken),
      });
    } catch (error) {
      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
        return;
      }

      logger.error('[auth:kakao/link/start] failed', { message: error.message });
      sendError(res, 500, 'KAKAO_LINK_START_FAILED', 'failed to start kakao link');
    }
  });

  router.delete('/kakao/link', async (req, res) => {
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

      const identities = await AuthIdentity.find({ userId: String(user._id) }).lean();
      const hasKakaoIdentity = identities.some((identity) => String(identity.provider || '').trim().toLowerCase() === 'kakao');
      if (!hasKakaoIdentity) {
        sendError(res, 404, 'KAKAO_NOT_LINKED', 'kakao identity is not linked');
        return;
      }

      if (identities.length <= 1) {
        sendError(res, 409, 'CANNOT_UNLINK_LAST_PROVIDER', 'cannot unlink the last login provider');
        return;
      }

      await AuthIdentity.deleteOne({
        userId: String(user._id),
        provider: 'kakao',
      });

      res.status(200).json({
        unlinked: true,
        provider: 'kakao',
        user: await toClientUser(user),
      });
    } catch (error) {
      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
        return;
      }

      logger.error('[auth:kakao/link/delete] failed', { message: error.message });
      sendError(res, 500, 'KAKAO_UNLINK_FAILED', 'failed to unlink kakao account');
    }
  });

  // 카카오 OAuth callback code를 처리해 로그인 또는 온보딩 분기를 수행한다.
  router.get('/kakao/callback', async (req, res) => {
    const code = String(req.query.code || '').trim();
    const state = String(req.query.state || '').trim();

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

      if (state) {
        const { userId } = verifyLinkToken(state, config);
        const user = await User.findById(userId);
        if (!user || isDeletedUser(user)) {
          sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
          return;
        }

        const existingIdentity = await findIdentity('kakao', kakaoUser.kakaoId);
        if (existingIdentity && String(existingIdentity.userId) !== String(user._id)) {
          sendError(res, 409, 'KAKAO_ALREADY_LINKED', '이미 다른 계정에 연결된 카카오 계정입니다.');
          return;
        }

        if (!existingIdentity) {
          await AuthIdentity.create({
            userId: user._id,
            provider: 'kakao',
            providerUserId: kakaoUser.kakaoId,
            providerEmail: kakaoUser.email || '',
            lastLoginAt: new Date(),
          });
        }

        res.status(200).json({
          resultType: 'LINK_SUCCESS',
          user: await toClientUser(user),
          provider: 'kakao',
          alreadyLinked: Boolean(existingIdentity),
        });
        return;
      }

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

  // 이메일 회원가입은 인증 전까지 임시 레코드만 만들고, 실제 계정은 인증 성공 시점에 생성한다.
  router.post('/email/signup/start', async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const agreedToTerms = req.body?.agreedToTerms === true;
      if (!agreedToTerms) {
        sendError(res, 400, 'TERMS_NOT_AGREED', 'agreedToTerms must be true');
        return;
      }

      const email = validateEmail(req.body?.email);
      const password = validateStrongPassword(req.body?.password);
      const nickname = validateNickname(req.body?.nickname);
      const now = new Date();

      const [activeEmailIdentity, activeUserWithSameEmail, pendingVerification] = await Promise.all([
        findIdentity('email', email),
        User.findOne({ email, accountStatus: { $ne: 'deleted' } }).lean(),
        EmailVerification.findOne({ email }),
      ]);

      if (activeEmailIdentity || activeUserWithSameEmail) {
        sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'email is already registered');
        return;
      }

      if (pendingVerification?.resendAvailableAt && new Date(pendingVerification.resendAvailableAt) > now) {
        sendError(res, 429, 'VERIFICATION_RESEND_COOLDOWN', 'verification resend is cooling down', {
          resendAvailableAt: new Date(pendingVerification.resendAvailableAt).toISOString(),
        });
        return;
      }

      const code = generateVerificationCode();
      const [codeHash, passwordHash] = await Promise.all([hashSecret(code), hashSecret(password)]);
      const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_EXPIRES_IN_MS);
      const resendAvailableAt = new Date(now.getTime() + EMAIL_RESEND_COOLDOWN_MS);

      await EmailVerification.findOneAndUpdate(
        { email },
        {
          $set: {
            email,
            codeHash,
            passwordHash,
            nickname,
            agreedToTermsAt: now,
            expiresAt,
            resendAvailableAt,
            verifiedAt: null,
            attemptCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      logger.info('[auth:email/signup/start] verification issued', {
        email,
        code,
        expiresAt: expiresAt.toISOString(),
      });

      res.status(200).json({
        email,
        expiresAt: expiresAt.toISOString(),
        resendAvailableAt: resendAvailableAt.toISOString(),
        ...(isDevelopment ? { debugCode: code } : {}),
      });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }
      if (message.includes('agreedtoterms')) {
        sendError(res, 400, 'TERMS_NOT_AGREED', 'agreedToTerms must be true');
        return;
      }
      if (message.includes('password must be between')) {
        sendError(res, 400, 'INVALID_PASSWORD', 'password must be between 8 and 72 characters');
        return;
      }
      if (message.includes('password must include both letters and numbers')) {
        sendError(res, 400, 'WEAK_PASSWORD', 'password must include both letters and numbers');
        return;
      }
      if (message.includes('nickname must be between')) {
        sendError(res, 400, 'INVALID_NICKNAME', 'nickname must be between 2 and 20 characters');
        return;
      }

      logger.error('[auth:email/signup/start] failed', { message: error.message });
      sendError(res, 500, 'EMAIL_SIGNUP_START_FAILED', 'failed to start email signup');
    }
  });

  // 이메일 인증 코드가 일치할 때만 실제 사용자와 email identity를 만든다.
  router.post('/email/signup/verify', async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const email = validateEmail(req.body?.email);
      const code = String(req.body?.code || '').trim();

      if (!code) {
        sendError(res, 400, 'INVALID_REQUEST', 'code is required');
        return;
      }

      const verification = await EmailVerification.findOne({ email });
      if (!verification) {
        sendError(res, 404, 'VERIFICATION_NOT_FOUND', 'verification not found');
        return;
      }

      const now = new Date();
      if (new Date(verification.expiresAt) <= now) {
        await EmailVerification.deleteOne({ _id: verification._id });
        sendError(res, 410, 'VERIFICATION_CODE_EXPIRED', 'verification code expired');
        return;
      }

      const matched = await verifySecret(code, verification.codeHash);
      if (!matched) {
        verification.attemptCount = Number(verification.attemptCount || 0) + 1;
        await verification.save();
        sendError(res, 400, 'INVALID_VERIFICATION_CODE', 'invalid verification code');
        return;
      }

      const [existingIdentity, existingUser] = await Promise.all([
        findIdentity('email', email),
        User.findOne({ email, accountStatus: { $ne: 'deleted' } }),
      ]);

      if (existingIdentity || existingUser) {
        await EmailVerification.deleteOne({ _id: verification._id });
        sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'email is already registered');
        return;
      }

      const user = await User.create({
        email,
        nickname: verification.nickname,
        profileImage: '',
        lastLoginAt: now,
        signupCompletedAt: now,
        agreedToTermsAt: verification.agreedToTermsAt || now,
        nicknameUpdatedAt: now,
        accountStatus: 'active',
        deletedAt: null,
      });

      const identity = await AuthIdentity.create({
        userId: user._id,
        provider: 'email',
        providerUserId: email,
        providerEmail: email,
        secretHash: verification.passwordHash,
        verifiedAt: now,
        lastLoginAt: now,
      });

      await EmailVerification.deleteOne({ _id: verification._id });
      await respondLoginSuccess(res, user, identity);
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }

      logger.error('[auth:email/signup/verify] failed', { message: error.message });
      sendError(res, 500, 'EMAIL_SIGNUP_VERIFY_FAILED', 'failed to verify email signup');
    }
  });

  // verified email identity만 이메일 로그인에 사용한다.
  router.post('/email/login', async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const email = validateEmail(req.body?.email);
      const password = validatePassword(req.body?.password);
      const identity = await findIdentity('email', email);

      // 이메일 로그인 실패 이유를 구분해 줘야 사용자가 회원가입/인증/비밀번호 단계를 바로 이해할 수 있다.
      if (!identity) {
        sendError(res, 404, 'EMAIL_NOT_REGISTERED', '가입되지 않은 이메일입니다.');
        return;
      }

      if (!identity?.verifiedAt) {
        sendError(res, 403, 'EMAIL_NOT_VERIFIED', '이메일 인증을 먼저 완료해주세요.');
        return;
      }

      if (!identity?.secretHash) {
        sendError(res, 401, 'INVALID_EMAIL_LOGIN', '이메일 로그인 정보를 확인할 수 없습니다.');
        return;
      }

      const user = await User.findById(identity.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 403, 'ACCOUNT_NOT_AVAILABLE', '사용할 수 없는 계정입니다.');
        return;
      }

      const matched = await verifySecret(password, identity.secretHash);
      if (!matched) {
        sendError(res, 401, 'INVALID_EMAIL_PASSWORD', '비밀번호가 올바르지 않습니다.');
        return;
      }

      user.lastLoginAt = new Date();
      await user.save();
      await respondLoginSuccess(res, user, identity);
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }
      if (message.includes('password must be between')) {
        sendError(res, 400, 'INVALID_PASSWORD', 'password must be between 8 and 72 characters');
        return;
      }

      logger.error('[auth:email/login] failed', { message: error.message });
      sendError(res, 500, 'EMAIL_LOGIN_FAILED', 'failed to login with email');
    }
  });

  // 비밀번호 재설정은 이메일 회원만 대상으로 하며, 개발 단계에서는 인증 코드를 로그/응답으로 확인한다.
  router.post('/email/password-reset/start', async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const email = validateEmail(req.body?.email);
      const nextPassword = validatePassword(req.body?.password);
      const now = new Date();
      const identity = await findIdentity('email', email);

      if (!identity) {
        sendError(res, 404, 'EMAIL_NOT_REGISTERED', '가입되지 않은 이메일입니다.');
        return;
      }

      if (!identity?.verifiedAt) {
        sendError(res, 403, 'EMAIL_NOT_VERIFIED', '이메일 인증을 먼저 완료해주세요.');
        return;
      }

      const user = await User.findById(identity.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 403, 'ACCOUNT_NOT_AVAILABLE', '사용할 수 없는 계정입니다.');
        return;
      }

      const pendingReset = await PasswordResetVerification.findOne({ email });
      if (pendingReset?.resendAvailableAt && new Date(pendingReset.resendAvailableAt) > now) {
        sendError(res, 429, 'PASSWORD_RESET_RESEND_COOLDOWN', 'password reset resend is cooling down', {
          resendAvailableAt: new Date(pendingReset.resendAvailableAt).toISOString(),
        });
        return;
      }

      const code = generateVerificationCode();
      const [codeHash, passwordHash] = await Promise.all([hashSecret(code), hashSecret(nextPassword)]);
      const expiresAt = new Date(now.getTime() + PASSWORD_RESET_EXPIRES_IN_MS);
      const resendAvailableAt = new Date(now.getTime() + PASSWORD_RESET_RESEND_COOLDOWN_MS);

      await PasswordResetVerification.findOneAndUpdate(
        { email },
        {
          $set: {
            email,
            codeHash,
            passwordHash,
            expiresAt,
            resendAvailableAt,
            verifiedAt: null,
            attemptCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      logger.info('[auth:email/password-reset/start] verification issued', {
        email,
        code,
        expiresAt: expiresAt.toISOString(),
      });

      res.status(200).json({
        email,
        expiresAt: expiresAt.toISOString(),
        resendAvailableAt: resendAvailableAt.toISOString(),
        ...(isDevelopment ? { debugCode: code } : {}),
      });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }
      if (message.includes('password must be between')) {
        sendError(res, 400, 'INVALID_PASSWORD', 'password must be between 8 and 72 characters');
        return;
      }

      logger.error('[auth:email/password-reset/start] failed', { message: error.message });
      sendError(res, 500, 'PASSWORD_RESET_START_FAILED', 'failed to start password reset');
    }
  });

  // 인증 코드 검증이 끝나면 email identity의 비밀번호 해시를 교체하고 기존 refresh 토큰은 무효화한다.
  router.post('/email/password-reset/verify', async (req, res) => {
    if (!assertDbConnected(res)) {
      return;
    }

    try {
      const email = validateEmail(req.body?.email);
      const code = String(req.body?.code || '').trim();

      if (!code) {
        sendError(res, 400, 'INVALID_REQUEST', 'code is required');
        return;
      }

      const verification = await PasswordResetVerification.findOne({ email });
      if (!verification) {
        sendError(res, 404, 'PASSWORD_RESET_NOT_FOUND', 'password reset verification not found');
        return;
      }

      const now = new Date();
      if (new Date(verification.expiresAt) <= now) {
        await PasswordResetVerification.deleteOne({ _id: verification._id });
        sendError(res, 410, 'PASSWORD_RESET_CODE_EXPIRED', 'password reset code expired');
        return;
      }

      const matched = await verifySecret(code, verification.codeHash);
      if (!matched) {
        verification.attemptCount = Number(verification.attemptCount || 0) + 1;
        await verification.save();
        sendError(res, 400, 'INVALID_PASSWORD_RESET_CODE', 'invalid password reset code');
        return;
      }

      const identity = await findIdentity('email', email);
      if (!identity) {
        await PasswordResetVerification.deleteOne({ _id: verification._id });
        sendError(res, 404, 'EMAIL_NOT_REGISTERED', '가입되지 않은 이메일입니다.');
        return;
      }

      if (!identity?.verifiedAt) {
        await PasswordResetVerification.deleteOne({ _id: verification._id });
        sendError(res, 403, 'EMAIL_NOT_VERIFIED', '이메일 인증을 먼저 완료해주세요.');
        return;
      }

      const user = await User.findById(identity.userId);
      if (!user || isDeletedUser(user)) {
        await PasswordResetVerification.deleteOne({ _id: verification._id });
        sendError(res, 403, 'ACCOUNT_NOT_AVAILABLE', '사용할 수 없는 계정입니다.');
        return;
      }

      identity.secretHash = verification.passwordHash;
      identity.providerEmail = email;
      identity.verifiedAt = identity.verifiedAt || now;
      await identity.save();

      user.refreshTokenHash = null;
      await user.save();

      await PasswordResetVerification.deleteOne({ _id: verification._id });

      res.status(200).json({
        reset: true,
        email,
      });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }

      logger.error('[auth:email/password-reset/verify] failed', { message: error.message });
      sendError(res, 500, 'PASSWORD_RESET_VERIFY_FAILED', 'failed to verify password reset');
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

      res.status(200).json({ user: await toClientUser(user) });
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

      res.status(200).json({ user: await toClientUser(user) });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('nickname must be between')) {
        sendError(res, 400, 'INVALID_NICKNAME', 'nickname must be between 2 and 20 characters');
        return;
      }

      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
    }
  });

  // 이메일 로그인 계정은 현재 비밀번호 확인 후 새 비밀번호로 변경할 수 있다.
  router.patch('/password', async (req, res) => {
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
      const currentPassword = validatePassword(req.body?.currentPassword);
      const newPassword = validateStrongPassword(req.body?.newPassword);

      const user = await User.findById(auth.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      const emailIdentity = await findIdentity('email', String(user.email || '').trim().toLowerCase());
      if (!emailIdentity?.verifiedAt || !emailIdentity?.secretHash) {
        sendError(res, 409, 'EMAIL_PASSWORD_NOT_AVAILABLE', 'email password login is not available');
        return;
      }

      const matched = await verifySecret(currentPassword, emailIdentity.secretHash);
      if (!matched) {
        sendError(res, 400, 'INVALID_CURRENT_PASSWORD', 'current password is invalid');
        return;
      }

      emailIdentity.secretHash = await hashSecret(newPassword);
      await emailIdentity.save();

      res.status(200).json({ changed: true });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('password must be between')) {
        sendError(res, 400, 'INVALID_PASSWORD', 'password must be between 8 and 72 characters');
        return;
      }
      if (message.includes('password must include both letters and numbers')) {
        sendError(res, 400, 'WEAK_PASSWORD', 'password must include both letters and numbers');
        return;
      }

      sendError(res, 401, 'UNAUTHORIZED', 'unauthorized');
    }
  });

  // 이메일 변경은 verified email 로그인 수단이 있는 계정만 현재 비밀번호 확인 후 진행한다.
  router.post('/email/change/start', async (req, res) => {
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
      const currentPassword = validatePassword(req.body?.currentPassword);
      const nextEmail = validateEmail(req.body?.nextEmail);
      const now = new Date();

      const user = await User.findById(auth.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      const currentEmail = validateEmail(user.email);
      if (currentEmail === nextEmail) {
        sendError(res, 409, 'EMAIL_UNCHANGED', 'email is unchanged');
        return;
      }

      const emailIdentity = await findIdentity('email', currentEmail);
      if (!emailIdentity?.verifiedAt || !emailIdentity?.secretHash) {
        sendError(res, 409, 'EMAIL_CHANGE_NOT_AVAILABLE', 'email change is not available');
        return;
      }

      const matched = await verifySecret(currentPassword, emailIdentity.secretHash);
      if (!matched) {
        sendError(res, 400, 'INVALID_CURRENT_PASSWORD', 'current password is invalid');
        return;
      }

      const [existingIdentity, existingUser] = await Promise.all([
        findIdentity('email', nextEmail),
        User.findOne({ email: nextEmail, accountStatus: { $ne: 'deleted' } }),
      ]);

      if (existingIdentity || existingUser) {
        sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'email is already registered');
        return;
      }

      const pendingChange = await EmailChangeVerification.findOne({ userId: user._id });
      if (pendingChange?.resendAvailableAt && new Date(pendingChange.resendAvailableAt) > now) {
        sendError(res, 429, 'EMAIL_CHANGE_RESEND_COOLDOWN', 'email change resend is cooling down', {
          resendAvailableAt: new Date(pendingChange.resendAvailableAt).toISOString(),
        });
        return;
      }

      const code = generateVerificationCode();
      const codeHash = await hashSecret(code);
      const expiresAt = new Date(now.getTime() + EMAIL_CHANGE_EXPIRES_IN_MS);
      const resendAvailableAt = new Date(now.getTime() + EMAIL_CHANGE_RESEND_COOLDOWN_MS);

      await EmailChangeVerification.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            currentEmail,
            nextEmail,
            codeHash,
            expiresAt,
            resendAvailableAt,
            verifiedAt: null,
            attemptCount: 0,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      logger.info('[auth:email/change/start] verification issued', {
        userId: String(user._id),
        currentEmail,
        nextEmail,
        code,
        expiresAt: expiresAt.toISOString(),
      });

      res.status(200).json({
        currentEmail,
        nextEmail,
        expiresAt: expiresAt.toISOString(),
        resendAvailableAt: resendAvailableAt.toISOString(),
        ...(isDevelopment ? { debugCode: code } : {}),
      });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }
      if (message.includes('password must be between')) {
        sendError(res, 400, 'INVALID_PASSWORD', 'password must be between 8 and 72 characters');
        return;
      }

      logger.error('[auth:email/change/start] failed', { message: error.message });
      sendError(res, 500, 'EMAIL_CHANGE_START_FAILED', 'failed to start email change');
    }
  });

  // 인증 코드가 일치하면 User.email과 email identity의 providerUserId/providerEmail을 함께 바꾼다.
  router.post('/email/change/verify', async (req, res) => {
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
      const code = String(req.body?.code || '').trim();

      if (!code) {
        sendError(res, 400, 'INVALID_REQUEST', 'code is required');
        return;
      }

      const user = await User.findById(auth.userId);
      if (!user || isDeletedUser(user)) {
        sendError(res, 404, 'USER_NOT_FOUND', 'user not found');
        return;
      }

      const verification = await EmailChangeVerification.findOne({ userId: user._id });
      if (!verification) {
        sendError(res, 404, 'EMAIL_CHANGE_NOT_FOUND', 'email change verification not found');
        return;
      }

      const now = new Date();
      if (new Date(verification.expiresAt) <= now) {
        await EmailChangeVerification.deleteOne({ _id: verification._id });
        sendError(res, 410, 'EMAIL_CHANGE_CODE_EXPIRED', 'email change code expired');
        return;
      }

      const matched = await verifySecret(code, verification.codeHash);
      if (!matched) {
        verification.attemptCount = Number(verification.attemptCount || 0) + 1;
        await verification.save();
        sendError(res, 400, 'INVALID_EMAIL_CHANGE_CODE', 'invalid email change code');
        return;
      }

      const nextEmail = validateEmail(verification.nextEmail);
      const currentEmail = validateEmail(verification.currentEmail);

      const [existingIdentity, existingUser, emailIdentity] = await Promise.all([
        findIdentity('email', nextEmail),
        User.findOne({ email: nextEmail, accountStatus: { $ne: 'deleted' } }),
        findIdentity('email', currentEmail),
      ]);

      if ((existingIdentity && String(existingIdentity.userId) !== String(user._id)) || existingUser) {
        await EmailChangeVerification.deleteOne({ _id: verification._id });
        sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'email is already registered');
        return;
      }

      if (!emailIdentity || String(emailIdentity.userId) !== String(user._id)) {
        await EmailChangeVerification.deleteOne({ _id: verification._id });
        sendError(res, 409, 'EMAIL_CHANGE_NOT_AVAILABLE', 'email change is not available');
        return;
      }

      user.email = nextEmail;
      await user.save();

      emailIdentity.providerUserId = nextEmail;
      emailIdentity.providerEmail = nextEmail;
      emailIdentity.verifiedAt = emailIdentity.verifiedAt || now;
      await emailIdentity.save();

      await EmailChangeVerification.deleteOne({ _id: verification._id });

      res.status(200).json({
        changed: true,
        user: await toClientUser(user),
      });
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('invalid email')) {
        sendError(res, 400, 'INVALID_EMAIL', 'invalid email');
        return;
      }

      logger.error('[auth:email/change/verify] failed', { message: error.message });
      sendError(res, 500, 'EMAIL_CHANGE_VERIFY_FAILED', 'failed to verify email change');
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

