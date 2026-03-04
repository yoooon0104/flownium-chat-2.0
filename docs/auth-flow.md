# Authentication Flow

1. Client가 카카오 로그인 페이지로 이동한다.
2. 카카오가 `code`를 포함해 `KAKAO_REDIRECT_URI`로 callback 한다.
3. 서버가 `GET /auth/kakao/callback?code=`에서 코드를 받는다.
4. 서버가 카카오 토큰 API로 access token을 교환한다.
5. 서버가 카카오 사용자 정보를 조회한다.
6. `User`를 kakaoId 기준으로 upsert 한다.
7. 서버가 Access/Refresh JWT를 발급해 응답한다.
8. Client는 access token을 저장하고 Socket handshake에 사용한다.

## Refresh Flow

1. access token 만료 시 Client가 `POST /auth/refresh` 호출
2. 서버가 refresh token 검증 + DB 보관 토큰 일치 여부 확인
3. 새 Access/Refresh 토큰 재발급

## Socket Authentication

- Socket.IO 연결 시 `auth.token`(access token) 전달
- 서버 `io.use`에서 JWT를 검증
- `tokenType=access`가 아니면 연결 거부