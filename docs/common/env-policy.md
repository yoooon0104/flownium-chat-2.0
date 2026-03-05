# 환경변수 정책

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
- `VITE_API_BASE_URL` (배포 전환 시 사용)

## 현재 구현 주의사항

1. 현재 `src/app/AppShell.jsx`는 `API_BASE_URL = 'http://localhost:3010'` 고정값을 사용한다.
2. 배포 전환 시 `VITE_API_BASE_URL` 기반으로 코드 전환이 필요하다.
3. `VITE_SOCKET_URL`은 현재 코드에서 직접 사용하지 않는다.

## 운영 규칙

1. 모든 URL/시크릿 값은 환경변수로 관리한다.
2. `localhost` 하드코딩은 개발 환경 외 사용을 금지한다.
3. 운영/개발 환경 값을 분리한다.
4. 민감정보는 저장소에 커밋하지 않는다.
5. 신규 환경변수 추가 시 `.env.example`과 문서를 같이 갱신한다.
