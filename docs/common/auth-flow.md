# 인증 흐름

업데이트: 2026-03-09

## 1) 카카오 로그인 + 온보딩 분기

1. 로그인 게이트에서 `카카오로 시작하기` 클릭
2. 프론트는 `VITE_KAKAO_CLIENT_ID`와 `VITE_KAKAO_REDIRECT_URI`로 카카오 인가 URL을 생성한다.
3. 카카오 인증 후 `code`가 `VITE_KAKAO_REDIRECT_URI`로 전달된다.
4. 프론트가 `GET /auth/kakao/callback?code=` 호출
5. 서버 응답 분기:
- `LOGIN_SUCCESS`: 토큰 저장 후 채팅 화면 진입
- `SIGNUP_REQUIRED`: 온보딩 화면으로 이동

참고:
- 카카오 프로필에서 `email`, `nickname`, `profileImage`를 수집한다.
- 이메일은 동의 범위에 따라 빈 문자열일 수 있다.
- 현재 구현에서 프론트 `client_id`는 카카오 인가 URL 생성용으로 사용되며, 코드 기준 `REST API 키`를 사용한다.

## 2) 운영 Redirect URI 규칙

1. 프론트 `VITE_KAKAO_REDIRECT_URI`
2. 서버 `KAKAO_REDIRECT_URI`
3. 카카오 콘솔 Redirect URI

위 세 값은 **완전히 동일한 문자열**이어야 한다.
기본 운영 정책은 끝 슬래시 없는 URI(`https://flownium-chat-2-0.vercel.app`)로 통일한다.

## 3) 온보딩(최초 가입) 흐름

1. 온보딩 화면에서 닉네임(2~20자) 입력
2. 가입 동의 체크(`agreedToTerms=true`)
3. `POST /auth/signup/complete` 호출
4. 성공 시 토큰 저장 + 채팅 화면 진입

## 4) 앱 초기 진입(세션 복원) 흐름

1. 저장된 access token 존재 여부 확인
2. 토큰이 있으면 `GET /auth/me` 호출
3. 성공 시 사용자 상태 복원 후 채팅 화면 진입
4. 401이면 `POST /auth/refresh` 재시도 후 `/auth/me` 재호출
5. 재시도 실패 시 세션 정리 + 로그인 게이트 복귀

## 5) 토큰 재발급 흐름

1. 인증 REST 요청에서 401 발생
2. `POST /auth/refresh` 1회 시도
3. 성공 시 토큰 갱신 후 원요청 재시도
4. 실패 시 세션 정리 후 로그인 게이트로 복귀

## 6) 소켓 인증 흐름

- Socket.IO 연결 시 `auth.token`으로 access token 전달
- 서버 `io.use`에서 JWT 검증
- `unauthorized` 발생 시 refresh 후 재연결 시도
- 재연결 실패 시 세션 종료

## 7) 카카오 콜백 중복 처리 방어

- 카카오 인가 코드는 1회용이다.
- 프론트는 callback URL의 `code`를 읽은 직후 주소창 query를 제거한다.
- 동일 `code`는 `sessionStorage` 기준으로 중복 처리하지 않는다.
- 새로고침/재렌더로 같은 `code`를 다시 보내면 로그인 재시도를 유도한다.

## 8) 로그아웃 흐름

- 로컬 토큰 삭제
- 소켓 연결 정리(disconnect)
- 방/메시지/모달 상태 초기화
- 로그인 게이트로 복귀

## 9) 카카오 로그인 실패 시 확인 포인트

1. `VITE_KAKAO_REDIRECT_URI`, `KAKAO_REDIRECT_URI`, 카카오 콘솔 Redirect URI가 완전히 같은지 확인
2. Vercel/Render 환경변수 변경 후 각각 재배포했는지 확인
3. `KOE006`는 redirect URI 불일치 가능성이 높다.
4. `KOE320`는 인가 코드 재사용 또는 client/server redirect URI 불일치 가능성이 높다.
