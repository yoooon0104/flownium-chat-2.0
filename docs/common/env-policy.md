# 환경변수 정책

업데이트: 2026-03-09

## 서버 (`server/.env`)

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_SIGNUP_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `SIGNUP_TOKEN_EXPIRES_IN`
- `FRONTEND_URL`
- `KAKAO_REST_API_KEY`
- `KAKAO_REDIRECT_URI`
- `KAKAO_CLIENT_SECRET`

## 클라이언트 (`.env`)

- `VITE_KAKAO_CLIENT_ID`
- `VITE_KAKAO_REDIRECT_URI`
- `VITE_API_BASE_URL` (기본값 fallback: `http://localhost:3010`)

## 현재 구현 주의사항

1. `src/app/AppShell.jsx`는 `VITE_API_BASE_URL`을 우선 사용한다.
2. `VITE_API_BASE_URL`이 비어 있으면 로컬 기본값(`http://localhost:3010`)으로 fallback한다.
3. `VITE_SOCKET_URL`은 현재 코드에서 직접 사용하지 않는다.
4. `/auth/me` 기반 세션 복원 흐름이므로 서버/프론트 URL 불일치 시 인증 실패가 발생한다.
5. 현재 구현에서 `VITE_KAKAO_CLIENT_ID`는 카카오 인가 URL의 `client_id`로 사용되며, 코드 기준 `REST API 키`를 사용한다.

## Redirect URI 운영 규칙

1. 로컬 개발
- `VITE_KAKAO_REDIRECT_URI=http://localhost:5173`
- `KAKAO_REDIRECT_URI=http://localhost:5173`

2. 운영 배포
- `VITE_KAKAO_REDIRECT_URI=https://<app-domain>`
- `KAKAO_REDIRECT_URI=https://<app-domain>`
- 카카오 콘솔 Redirect URI도 같은 문자열로 등록한다.

3. 기본 정책
- Redirect URI는 끝 슬래시 없이 통일한다.
- 예: `https://flownium-chat-2-0.vercel.app`

4. `FRONTEND_URL`
- CORS origin 비교용 값이다.
- origin 문자열이므로 슬래시 없이 유지한다.

## 운영 규칙

1. 모든 URL/시크릿 값은 환경변수로 관리한다.
2. `localhost` 하드코딩은 개발 환경 외 사용을 금지한다.
3. 운영/개발 환경 값을 분리한다.
4. 민감정보는 저장소에 커밋하지 않는다.
5. 신규 환경변수 추가 시 `.env.example`과 문서를 같이 갱신한다.
6. 환경변수 수정 후에는 해당 플랫폼(Vercel/Render)을 반드시 재배포한다.
