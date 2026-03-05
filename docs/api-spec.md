# API 명세

기본 경로: `/api` (인증 관련은 `/auth`)

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
    "nickname": "kakao-nickname",
    "profileImage": ""
  }
}
```

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

오류 코드:
- `400` signupToken/동의/닉네임 검증 실패
- `401` invalid signup token
- `503` database is not connected

### POST /auth/refresh
- Refresh 토큰 검증 후 Access/Refresh 토큰 재발급

요청 예시:
```json
{
  "refreshToken": "jwt"
}
```

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
    "nickname": "새닉네임",
    "profileImage": ""
  }
}
```

## 채팅방

모든 채팅방 API는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

### POST /api/chatrooms
- 그룹방 생성
- 생성자는 초기 멤버로 자동 등록

### GET /api/chatrooms
- 현재 사용자가 참여 중인 방 목록 조회
- 정렬: `lastMessageAt desc` -> `createdAt desc`

### GET /api/chatrooms/:id/messages
- 방 메시지 히스토리 조회
- 현재 사용자가 해당 방 멤버여야 함
- 쿼리: `limit` (기본 50, 최대 100)
