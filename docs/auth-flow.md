# 인증 흐름

## 카카오 로그인 + 온보딩 분기

1. 로그인 게이트에서 `카카오로 시작하기` 클릭
2. 카카오 인증 후 `code`가 `VITE_KAKAO_REDIRECT_URI`로 전달됨
3. 프론트가 `GET /auth/kakao/callback?code=` 호출
4. 서버 응답 분기:
- `LOGIN_SUCCESS`: 토큰 저장 후 채팅 화면 진입
- `SIGNUP_REQUIRED`: 온보딩 화면으로 이동

## 온보딩(최초 가입) 흐름

1. 온보딩 화면에서 닉네임(2~20자) 입력
2. 가입 동의 체크(`agreedToTerms=true`)
3. `POST /auth/signup/complete` 호출
4. 성공 시 토큰 저장 + 채팅 화면 진입

## 토큰 재발급 흐름

1. 인증 REST 요청에서 401 발생
2. `POST /auth/refresh` 1회 시도
3. 성공 시 토큰 갱신 후 원요청 재시도
4. 실패 시 세션 정리 후 로그인 게이트로 복귀

## 소켓 인증 흐름

- Socket.IO 연결 시 `auth.token`으로 access token 전달
- 서버 `io.use`에서 JWT 검증
- `unauthorized` 발생 시 refresh 후 재연결 시도
- 재연결 실패 시 세션 종료

## 로그아웃 흐름

- 로컬 토큰 삭제
- 소켓 연결 정리(disconnect)
- 방/메시지/모달 상태 초기화
- 로그인 게이트로 복귀
