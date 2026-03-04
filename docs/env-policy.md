# Environment Policy

---

## Server (.env)

PORT
MONGO_URI
JWT_ACCESS_SECRET
CLIENT_ORIGIN
KAKAO_CLIENT_ID
KAKAO_REDIRECT_URI

---

## Client (.env)

VITE_API_BASE_URL
VITE_SOCKET_URL
VITE_KAKAO_CLIENT_ID
VITE_KAKAO_REDIRECT_URI

---

## Rules

- 모든 URL은 환경변수 기반으로 관리
- localhost 하드코딩 금지
- Production / Development 환경 분리