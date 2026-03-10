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

## 친구

모든 친구/알림/채팅방 API는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.

### GET /api/friends/search?keyword=
- 이메일/닉네임 기준 사용자 검색
- 자기 자신 제외
- 검색 결과에 현재 친구 상태 포함

응답 예시:
```json
{
  "keyword": "kim",
  "results": [
    {
      "user": {
        "id": "userId",
        "email": "friend@example.com",
        "nickname": "kim",
        "profileImage": ""
      },
      "friendship": {
        "id": "friendshipId",
        "status": "pending",
        "requesterId": "u1",
        "addresseeId": "u2"
      }
    }
  ]
}
```

대표 오류:
- `500 FRIEND_SEARCH_FAILED`
- `503 DB_NOT_CONNECTED`

### GET /api/friends
- 현재 사용자 친구 관계 목록 조회
- 반환 그룹:
  - `accepted`
  - `pendingReceived`
  - `pendingSent`

대표 오류:
- `500 FRIEND_LIST_FAILED`
- `503 DB_NOT_CONNECTED`

### POST /api/friends/request
- 친구 요청 생성

요청:
```json
{
  "targetUserId": "userId"
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `404 USER_NOT_FOUND`
- `403 FRIEND_REQUEST_BLOCKED`
- `409 ALREADY_FRIENDS`
- `409 FRIEND_REQUEST_PENDING`
- `409 FRIEND_REQUEST_ALREADY_RECEIVED`
- `500 FRIEND_REQUEST_FAILED`

### PATCH /api/friends/request/:id
- 친구 요청 상태 변경
- `action`: `accept | reject | block`

요청:
```json
{
  "action": "accept"
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `403 FORBIDDEN`
- `404 FRIEND_REQUEST_NOT_FOUND`
- `409 INVALID_FRIEND_REQUEST_STATE`
- `500 FRIEND_REQUEST_UPDATE_FAILED`

## 알림

### GET /api/notifications
- 현재 사용자 알림 목록 조회
- 최신순 최대 100건 반환

응답 예시:
```json
{
  "unreadCount": 2,
  "notifications": [
    {
      "id": "notificationId",
      "type": "friend_request",
      "payload": {},
      "isRead": false,
      "createdAt": "2026-03-09T10:00:00.000Z",
      "readAt": null
    }
  ]
}
```

대표 오류:
- `500 NOTIFICATION_FETCH_FAILED`
- `503 DB_NOT_CONNECTED`

### PATCH /api/notifications/:id/read
- 현재 사용자 알림 읽음 처리

대표 오류:
- `400 INVALID_REQUEST`
- `404 NOTIFICATION_NOT_FOUND`
- `500 NOTIFICATION_UPDATE_FAILED`
- `503 DB_NOT_CONNECTED`

## 채팅방

### POST /api/chatrooms
- 채팅방 생성
- 현재 프론트 호환을 위해 기존 `{ "name": "방이름" }` 그룹 생성도 지원
- 신규 규칙:
  - `memberUserIds.length === 1`: 기존 2인 방 재사용 또는 새 1:1 방 생성
  - `memberUserIds.length >= 2`: 모든 대상이 친구여야 하며 `name` 필수, 새 그룹방 생성

신규 요청 예시:
```json
{
  "memberUserIds": ["userId-1"]
}
```

```json
{
  "memberUserIds": ["userId-1", "userId-2"],
  "name": "프로젝트 회의방"
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `400 INVALID_ROOM_NAME`
- `403 FRIENDSHIP_REQUIRED`
- `404 USER_NOT_FOUND`
- `500 CHATROOM_CREATE_FAILED`
- `503 DB_NOT_CONNECTED`

### POST /api/chatrooms/:id/invite
- 현재 방에 친구를 초대
- 요청 사용자와 초대 대상은 서로 친구여야 함
- 자기 자신 초대는 불가
- 요청 payload의 중복 `userId`는 서버에서 dedupe
- direct(`isGroup=false`) 방이면 기존 방을 유지하고 새 다인방을 생성
- group(`isGroup=true`) 방이면 기존 방 `memberIds`에 즉시 멤버 추가
- 자동 생성형 그룹명은 초대 후 현재 멤버 기준으로 다시 계산
- 멤버 변경 시 시스템 메시지와 `lastMessage`, `lastMessageAt` 갱신

요청:
```json
{
  "userIds": ["userId-1", "userId-2"]
}
```

응답 예시:
```json
{
  "room": {
    "id": "chatroomId",
    "name": "alice, bob, charlie",
    "isGroup": true,
    "memberIds": ["u1", "u2", "u3"],
    "lastMessage": "alice님이 charlie님을 초대했습니다.",
    "lastMessageAt": "2026-03-10T12:00:00.000Z",
    "unreadCount": 0
  },
  "createdNewRoom": true
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `403 FRIENDSHIP_REQUIRED`
- `404 ROOM_NOT_FOUND`
- `404 USER_NOT_FOUND`
- `409 ALREADY_IN_ROOM`
- `500 CHATROOM_INVITE_FAILED`
- `503 DB_NOT_CONNECTED`

### POST /api/chatrooms/:id/leave
- 현재 사용자가 채팅방에서 나감
- direct(`isGroup=false`) 방은 한 명이라도 나가면 방 삭제
- group(`isGroup=true`) 방은 나간 뒤 멤버가 0명이 될 때만 삭제
- 시스템 메시지와 `lastMessage`, `lastMessageAt` 갱신
- 방 삭제 시 메시지/읽음 상태도 함께 정리

응답 예시:
```json
{
  "roomId": "chatroomId",
  "deleted": true
}
```

```json
{
  "room": {
    "id": "chatroomId",
    "name": "프로젝트 회의방",
    "isGroup": true,
    "memberIds": ["u2", "u3"],
    "lastMessage": "alice님이 나갔습니다.",
    "lastMessageAt": "2026-03-10T12:05:00.000Z",
    "unreadCount": 0
  },
  "deleted": false
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `403 FORBIDDEN`
- `404 ROOM_NOT_FOUND`
- `500 CHATROOM_LEAVE_FAILED`
- `503 DB_NOT_CONNECTED`

### GET /api/chatrooms
- 현재 사용자가 참여 중인 방 목록 조회
- 정렬: `lastMessageAt desc` -> `createdAt desc`
- 응답에 방별 `unreadCount`, 전체 `totalUnreadCount` 포함

응답 예시:
```json
{
  "rooms": [
    {
      "id": "chatroomId",
      "name": "프로젝트 회의방",
      "isGroup": true,
      "memberIds": ["u1", "u2"],
      "lastMessage": "안녕하세요",
      "lastMessageAt": "2026-03-09T12:00:00.000Z",
      "unreadCount": 3
    }
  ],
  "totalUnreadCount": 5
}
```

대표 오류:
- `401 UNAUTHORIZED`
- `500 CHATROOM_FETCH_FAILED`
- `503 DB_NOT_CONNECTED`

### GET /api/chatrooms/:id/messages
- 방 메시지 히스토리 조회
- 현재 사용자가 해당 방 멤버여야 함
- 쿼리:
  - `limit` (기본 50, 최대 100)
  - `before` (선택, ISO datetime, 이 시각보다 오래된 메시지 페이지 조회)
- 각 메시지 응답에 메시지별 `unreadCount` 포함
- `type`은 `text | system`

응답 예시:
```json
{
  "roomId": "chatroomId",
  "count": 2,
  "hasMore": true,
  "nextCursor": "2026-03-09T11:50:00.000Z",
  "messages": [
    {
      "id": "messageId",
      "chatRoomId": "chatroomId",
      "senderId": "u1",
      "senderNickname": "alice",
      "type": "text",
      "text": "hello",
      "timestamp": "2026-03-09T12:00:00.000Z",
      "unreadCount": 1
    }
  ]
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `403 FORBIDDEN`
- `404 ROOM_NOT_FOUND`
- `500 MESSAGE_FETCH_FAILED`
- `503 DB_NOT_CONNECTED`

### PATCH /api/chatrooms/:id/read
- 현재 사용자의 방 읽음 시점 갱신
- 방에 실제 입장한 시점을 기준으로 unread 계산 기준을 갱신

응답 예시:
```json
{
  "roomId": "chatroomId",
  "lastReadAt": "2026-03-09T12:05:00.000Z"
}
```

대표 오류:
- `400 INVALID_REQUEST`
- `403 FORBIDDEN`
- `404 ROOM_NOT_FOUND`
- `500 READ_STATE_UPDATE_FAILED`
- `503 DB_NOT_CONNECTED`
