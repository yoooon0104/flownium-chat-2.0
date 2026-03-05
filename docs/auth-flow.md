# 인증 흐름

## 카카오 로그인 흐름 (현재 페이지 콜백 처리)

1. 로그인 게이트에서 `카카오로 시작하기` 버튼을 누릅니다.
2. 클라이언트가 카카오 인가 URL로 이동합니다.
3. 카카오가 `code`를 포함해 `VITE_KAKAO_REDIRECT_URI`로 콜백합니다.
4. 프론트 `App`가 현재 URL의 `code`를 읽어 `GET /auth/kakao/callback?code=`를 호출합니다.
5. 서버가 카카오 토큰 교환/사용자 조회 후 Access/Refresh JWT를 반환합니다.
6. 클라이언트가 토큰을 localStorage에 저장합니다.
7. 저장된 access token으로 REST/Socket 인증을 시작합니다.
8. 콜백 처리 후 주소창의 `?code=`를 제거합니다.

## 토큰 재발급 흐름

1. 인증이 필요한 REST 요청에서 401이 발생하면 `POST /auth/refresh`를 1회 호출합니다.
2. 재발급 성공 시 localStorage 토큰을 갱신하고 원요청을 재시도합니다.
3. 재발급 실패 시 세션을 정리하고 로그인 게이트로 복귀합니다.

## 소켓 인증 흐름

- Socket.IO 연결 시 `auth.token`으로 access token 전달
- 서버 `io.use`에서 JWT 검증
- `unauthorized` 발생 시 refresh 시도 후 재연결
- refresh 실패 시 로그아웃 처리 후 로그인 게이트로 복귀
