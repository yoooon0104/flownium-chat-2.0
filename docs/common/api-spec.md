# API 명세

기본 경로: `/api` (인증 관련은 `/auth`)

## 공통 에러 응답

MVP2-A 1차 표준:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "unauthorized",
    "details": {}
  }
}
```

- `details`는 선택 필드입니다.
- 주요 코드: `INVALID_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `ROOM_NOT_FOUND`, `DB_NOT_CONNECTED`

## 상태 확인

### GET /api/health
- 서버 상태 확인
- 응답: `{ "ok": true }`

## 인증

### GET /auth/kakao/callback?code=
- 카카오 인가 코드를 교환합니다.
- 응답 분기:

1) 가입 완료 사용자
```json
{
  "resultType": "LOGIN_SUCCESS",
  "user": {
    "id": "userId",
    "kakaoId": "kakaoId",
    "email": "user@example.com",
    "nickname": "닉네임",
    "profileImage": ""
  },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

2) 최초 사용자(가입 필요)
```json
{
  "resultType": "SIGNUP_REQUIRED",
  "signupToken": "jwt",
  "kakaoProfile": {
    "kakaoId": "kakaoId",
    "email": "user@example.com",
    "nickname": "kakao-nickname",
    "profileImage": ""
  }
}
```

대표 오류:
- `400 INVALID_REQUEST` (code 누락)
- `500 SERVER_MISCONFIGURED`
- `502 KAKAO_LOGIN_FAILED`

### POST /auth/signup/complete
- 최초 로그인 사용자의 가입 의사 + 닉네임 설정 완료

요청:
```json
{
  "signupToken": "jwt",
  "nickname": "사용자닉네임",
  "agreedToTerms": true
}
```

응답: `LOGIN_SUCCESS` 구조와 동일

대표 오류:
- `400 INVALID_REQUEST`
- `400 TERMS_NOT_AGREED`
- `400 INVALID_NICKNAME`
- `401 INVALID_SIGNUP_TOKEN`
- `503 DB_NOT_CONNECTED`

### POST /auth/refresh
- Refresh 토큰 검증 후 Access/Refresh 토큰 재발급

요청 예시:
```json
{
  "refreshToken": "jwt"
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `401 INVALID_REFRESH_TOKEN`
- `503 DB_NOT_CONNECTED`

### GET /auth/me
- 현재 인증 사용자 프로필 조회
- 헤더: `Authorization: Bearer <accessToken>`

응답:
```json
{
  "user": {
    "id": "userId",
    "kakaoId": "kakaoId",
    "email": "user@example.com",
    "nickname": "닉네임",
    "profileImage": ""
  }
}
```

대표 오류:
- `401 UNAUTHORIZED`
- `404 USER_NOT_FOUND`
- `503 DB_NOT_CONNECTED`

### PATCH /auth/profile
- 현재 인증 사용자 프로필 수정 (1차: 닉네임)
- 헤더: `Authorization: Bearer <accessToken>`

요청:
```json
{
  "nickname": "새닉네임"
}
```

응답:
```json
{
  "user": {
    "id": "userId",
    "kakaoId": "kakaoId",
    "email": "user@example.com",
    "nickname": "새닉네임",
    "profileImage": ""
  }
}
```

대표 오류:
- `400 INVALID_NICKNAME`
- `401 UNAUTHORIZED`
- `404 USER_NOT_FOUND`
- `503 DB_NOT_CONNECTED`

## 채팅방

모든 채팅방 API는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

### POST /api/chatrooms
- 그룹방 생성
- 생성자는 초기 멤버로 자동 등록

대표 오류:
- `400 INVALID_REQUEST`
- `500 CHATROOM_CREATE_FAILED`
- `503 DB_NOT_CONNECTED`

### GET /api/chatrooms
- 현재 사용자가 참여 중인 방 목록 조회
- 정렬: `lastMessageAt desc` -> `createdAt desc`

대표 오류:
- `401 UNAUTHORIZED`
- `500 CHATROOM_FETCH_FAILED`
- `503 DB_NOT_CONNECTED`

### GET /api/chatrooms/:id/messages
- 방 메시지 히스토리 조회
- 현재 사용자가 해당 방 멤버여야 함
- 쿼리: `limit` (기본 50, 최대 100)

대표 오류:
- `400 INVALID_REQUEST`
- `403 FORBIDDEN`
- `404 ROOM_NOT_FOUND`
- `500 MESSAGE_FETCH_FAILED`
- `503 DB_NOT_CONNECTED`
