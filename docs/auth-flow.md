# 인증 흐름

## 카카오 로그인 흐름

1. 클라이언트가 카카오 로그인 페이지로 이동합니다.
2. 카카오가 `code`를 포함해 `KAKAO_REDIRECT_URI`로 콜백합니다.
3. 서버가 `GET /auth/kakao/callback?code=`에서 code를 수신합니다.
4. 서버가 카카오 토큰 API로 access token을 교환합니다.
5. 서버가 카카오 사용자 정보를 조회합니다.
6. `kakaoId` 기준으로 `User`를 upsert 합니다.
7. 서버가 Access/Refresh JWT를 발급해 응답합니다.
8. 클라이언트는 access token을 저장하고 REST/소켓 인증에 사용합니다.

## 토큰 재발급 흐름

1. access token 만료 시 클라이언트가 `POST /auth/refresh`를 호출합니다.
2. 서버가 refresh token 서명/형식을 검증합니다.
3. 서버가 DB의 `refreshTokenHash`와 비교해 유효성을 재검증합니다.
4. 서버가 새 Access/Refresh 토큰을 발급합니다.

## 소켓 인증 흐름

- Socket.IO 연결 시 `auth.token`으로 access token 전달
- 서버 `io.use`에서 JWT 검증
- `tokenType=access`가 아니면 연결 거부
