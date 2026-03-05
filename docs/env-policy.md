# 환경변수 정책

## 서버 (`server/.env`)

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `FRONTEND_URL`
- `KAKAO_REST_API_KEY`
- `KAKAO_REDIRECT_URI`
- `KAKAO_CLIENT_SECRET`

## 클라이언트 (`.env`)

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`
- `VITE_KAKAO_CLIENT_ID`
- `VITE_KAKAO_REDIRECT_URI`

## 운영 규칙

1. 모든 URL/시크릿 값은 환경변수로 관리한다.
2. `localhost` 하드코딩은 개발 환경 외 사용을 금지한다.
3. 운영/개발 환경 값을 분리한다.
4. 민감정보는 저장소에 커밋하지 않는다.
5. 신규 환경변수 추가 시 `.env.example`과 문서를 같이 갱신한다.
