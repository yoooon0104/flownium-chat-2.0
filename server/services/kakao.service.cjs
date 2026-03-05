// 외부 API 실패를 공통 포맷으로 전달하기 위한 에러 생성 헬퍼.
const createHttpError = (message, status, body) => {
  const error = new Error(message);
  error.status = status;
  error.body = body;
  return error;
};

// 인가 코드를 카카오 access token으로 교환한다.
const exchangeKakaoAccessToken = async (payload) => {
  const { code, restApiKey, redirectUri, clientSecret } = payload;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }

  const response = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params,
  });

  if (!response.ok) {
    const body = await response.text();
    throw createHttpError('failed to exchange kakao token', response.status, body);
  }

  return response.json();
};

// 카카오 사용자 정보를 가져와 내부 사용자 스키마 형식으로 정규화한다.
const fetchKakaoUserProfile = async (accessToken) => {
  const response = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw createHttpError('failed to fetch kakao profile', response.status, body);
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

module.exports = {
  exchangeKakaoAccessToken,
  fetchKakaoUserProfile,
};
