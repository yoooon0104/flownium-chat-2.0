# MVP2 오브젝트 정의서

업데이트: 2026-03-10

현재 구현 기준으로 실제 사용 중인 도메인 오브젝트를 정리합니다.  
MVP2-B 1차 구현까지 반영하며, 실계정 검증 후 세부 규칙은 추가 보완합니다.

## 1) User

### 필드

- `id: string` (필수)
- `kakaoId: string` (필수, unique)
- `email: string` (선택)
- `nickname: string` (필수)
- `profileImage: string` (선택)
- `accountStatus: 'active' | 'deleted'`
- `deletedAt: date|null`
- `refreshTokenHash: string` (선택)
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 카카오 로그인 시 조회 후 없으면 생성
- 카카오 응답 기준으로 `email`, `nickname`, `profileImage`를 동기화
- `PATCH /auth/profile`로 닉네임 수정 가능
- `DELETE /auth/account` 호출 시 사용자 문서를 tombstone 상태로 전환하고 관련 관계 데이터 정리를 시작
- tombstone 사용자는 `signupCompletedAt`이 비워져 재로그인 시 다시 signup flow로 진입

### 검증 규칙

- `kakaoId` unique 보장
- 닉네임 길이/문자 검증
- 이메일은 없을 수 있으므로 nullable 처리

### 인덱스/성능

- `kakaoId` unique index
- 이메일 검색 고도화가 필요하면 `email` index 검토

### API/소켓 매핑

- `/auth/kakao/callback`
- `/auth/signup/complete`
- `/auth/profile`
- `/auth/me`
- `/auth/account`

## 2) Friendship

### 필드

- `id: string`
- `requesterId: string`
- `addresseeId: string`
- `pairKey: string`
- `status: 'pending' | 'accepted' | 'rejected' | 'blocked'`
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 친구 요청 생성 시 `pending`
- 수락 시 `accepted`
- 거절 시 `rejected`
- 차단 시 `blocked`
- 같은 두 사용자 조합은 `pairKey`로 1건만 유지
- 회원탈퇴 시 참여한 관계 문서는 모두 삭제

### 검증 규칙

- 자기 자신에게 친구 요청 금지
- 동일 사용자쌍 중복 요청 금지
- 상태 전이는 서버에서만 제어

### 인덱스/성능

- `pairKey` unique index
- `requesterId`, `addresseeId`, `status` 조회 빈도 높음

### API/소켓 매핑

- `GET /api/friends`
- `GET /api/friends/search`
- `POST /api/friends/request`
- `PATCH /api/friends/request/:id`
- `friendship_updated`

## 3) Notification

### 필드

- `id: string`
- `userId: string`
- `type: 'friend_request' | 'room_invite'`
- `payload: object`
- `isRead: boolean`
- `readAt: date|null`
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 친구 요청 시 상대에게 `friend_request` 생성
- 그룹 초대 시 대상자에게 `room_invite` 생성
- 허브/모바일 알림 화면 열람 시 최근 알림 자동 읽음 처리 가능
- 회원탈퇴 시 자신의 알림과 탈퇴 사용자를 가리키는 요청/초대 알림은 함께 정리 가능

### 검증 규칙

- `userId` 필수
- `type`별 `payload` 최소 필드 필요
- 읽음 상태는 불리언 + 시점으로 관리

### 인덱스/성능

- `userId`, `isRead`, `createdAt` 조회 최적화 필요

### API/소켓 매핑

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `notification_created`
- `notification_read`

## 4) ChatRoom

### 필드

- `id: string` (ObjectId 문자열)
- `name: string`
- `isGroup: boolean`
- `memberIds: string[]`
- `lastMessage: string`
- `lastMessageAt: date|null`
- `deletedMemberIds?: string[]` (응답 가공 필드)
- `hasDeletedMember?: boolean` (응답 가공 필드)
- `directChatDisabled?: boolean` (응답 가공 필드)
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 1명 선택 시 기존 2인 방이 있으면 재사용
- 없으면 새 2인 방 생성
- 2명 이상 선택 시 그룹방 생성
- 기존 1:1 방에 친구를 초대하면 기존 방은 유지하고 새 다인방 생성
- 기존 그룹방에 친구를 초대하면 현재 방 `memberIds`에 즉시 반영
- direct(`isGroup=false`) 방은 한 명이라도 나가면 삭제
- group(`isGroup=true`) 방은 멤버가 0명이 될 때만 삭제
- 메시지 전송 시 `lastMessage`, `lastMessageAt` 갱신
- 기존 1:1 방을 직접 그룹으로 변형하지 않고 새 그룹방 생성
- 초대/나가기는 시스템 메시지로 기록되어 `lastMessage`, `lastMessageAt`를 함께 갱신
- 회원탈퇴 시 direct 방은 유지하고, group 방은 탈퇴 사용자를 `memberIds`에서 제거
- direct 방에 탈퇴 회원이 남아 있으면 `directChatDisabled=true`로 내려 보내고 새 메시지 전송은 차단

### 검증 규칙

- `memberIds` 중복 방지
- 방 생성 시 현재 사용자 포함
- 친구 기반 생성 정책은 서버에서 한 번 더 검증
- 그룹방 초대 시 이미 멤버인 사용자는 `ALREADY_IN_ROOM`

### 인덱스/성능

- `memberIds` index
- `lastMessageAt` index
- 레거시 `roomKey_1` 인덱스 사용 금지

### API/소켓 매핑

- `GET /api/chatrooms`
- `POST /api/chatrooms`
- `POST /api/chatrooms/:id/invite`
- `POST /api/chatrooms/:id/leave`
- `GET /api/chatrooms/:id/messages`
- `PATCH /api/chatrooms/:id/read`
- `join_room`
- `room_joined`
- `room_participants`
- `room_updated`
- `room_deleted`

## 5) Message

### 필드

- `id: string`
- `chatRoomId: string`
- `senderId: string`
- `senderNickname: string`
- `type: 'text' | 'system'`
- `text: string`
- `timestamp: date`
- `createdAt: date`
- `updatedAt: date`
- `unreadCount?: number` (응답 가공 필드)

### 생성/갱신 규칙

- `send_message` 시 생성
- 초대/나가기 시 `type: 'system'` 메시지 생성
- 실시간 수신 payload에 `unreadCount` 포함 가능
- optimistic UI에서는 `clientMessageId`로 임시 메시지를 실제 메시지로 치환
- 읽음 처리 후 `message_updated` 이벤트로 기존 메시지의 `unreadCount`만 갱신 가능

### 검증 규칙

- text 빈값 금지
- room 멤버만 생성 가능

### 인덱스/성능

- `chatRoomId` index
- `timestamp` index

### API/소켓 매핑

- `GET /api/chatrooms/:id/messages`
- `send_message`
- `receive_message`
- `message_updated`

## 6) ChatReadState

### 필드

- `id: string`
- `roomId: string`
- `userId: string`
- `lastReadAt: date|null`
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 방 진입 후 히스토리 로드가 끝나면 읽음 처리
- 현재 방에서 상대 메시지를 받으면 즉시 읽음 처리
- 다른 방 메시지는 unread 증가만 하고 읽음 처리하지 않음
- 초대받아 새로 들어온 사용자는 초대 직전 `lastMessageAt` 기준으로 초기 read state를 seed할 수 있음
- 회원탈퇴 시 사용자 본인의 읽음 상태는 모두 삭제

### 검증 규칙

- `roomId + userId` 조합은 1건만 유지
- 읽음 시점은 서버 시간 기준 저장

### 인덱스/성능

- `(roomId, userId)` unique index 권장

### API/소켓 매핑

- `PATCH /api/chatrooms/:id/read`
- unread 계산용 내부 조회

## 7) Presence

### 필드(메모리 모델)

- `roomId -> Map<userId, Set<socketId>>`

### 생성/갱신 규칙

- `join_room` 시 add
- disconnect 시 remove
- room 변경 시 재계산

### 검증 규칙

- `online = socketId set size > 0`

### 인덱스/성능

- 메모리 구조, 영속 저장 없음
- 멀티 인스턴스 전환 시 외부 저장소 필요

### API/소켓 매핑

- `room_participants`

## 8) AuthSession (Client)

### 필드

- `accessToken: string`
- `refreshToken: string`
- `user: { id, email, nickname, profileImage, isDeleted }`
- `pendingSignup`

### 생성/갱신 규칙

- 로그인 성공 시 localStorage 저장
- refresh 성공 시 토큰 갱신
- 로그아웃 시 삭제
- 회원탈퇴 성공 시 localStorage 세션과 현재 사용자 상태를 함께 삭제

### 검증 규칙

- 토큰 payload 파싱 실패 시 fallback 처리
- 토큰 없음/만료 시 로그인 게이트 복귀

### API/소켓 매핑

- `/auth/refresh`
- `/auth/me`
- `/auth/account`
- 소켓 handshake auth token

## 9) 예정 도메인: AuthIdentity

### 목적

- 서비스 사용자 본체(`User`)와 로그인 수단을 분리하기 위한 계획 도메인

### 예상 필드

- `id: string`
- `userId: string`
- `provider: 'kakao' | 'email' | ...`
- `providerUserId: string`
- `providerEmail?: string`
- `lastLoginAt: date|null`
- `createdAt: date`
- `updatedAt: date`

### 예상 규칙

- 하나의 `User`는 여러 `AuthIdentity`를 가질 수 있다.
- 카카오는 간편로그인 수단으로만 저장한다.
- 회원탈퇴 시 tombstone `User`는 유지하되, `AuthIdentity`는 비활성 또는 제거한다.
- 재가입 시 기존 tombstone `User` 복구 대신 새 `User` + 새 `AuthIdentity` 생성을 목표로 한다.

## 10) 예정 도메인: AnonymousRoom / AnonymousParticipant / GuestSession

### 목적

- 회원 채팅과 분리된 익명방/비회원 기능 확장을 위한 계획 도메인

### 예상 필드

- `GuestSession`
  - `id`
  - `nickname`
  - `lastSeenAt`
  - `expiresAt`
- `AnonymousRoom`
  - `id`
  - `title`
  - `roomToken`
  - `passwordHash`
  - `createdByUserId?`
  - `createdByGuestId?`
- `AnonymousParticipant`
  - `roomId`
  - `participantType: 'user' | 'guest'`
  - `participantId`
  - `aliasNickname`
  - `joinedAt`
  - `lastSeenAt`

### 예상 규칙

- 비회원은 익명방만 사용 가능하다.
- 익명방은 URL 토큰 + 비밀번호 기반으로 입장한다.
- 회원도 익명방에 참여할 수 있지만 방별 익명 닉네임을 사용한다.
- 비회원은 장기간 미접속 시 삭제하고, 익명방 participant도 함께 정리한다.
