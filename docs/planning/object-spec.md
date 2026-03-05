# MVP2 오브젝트 정의서

업데이트: 2026-03-05

## 1) User

### 필드

- `id: string` (필수)
- `kakaoId: string` (필수, unique)
- `nickname: string` (필수)
- `profileImage: string` (선택)
- `refreshTokenHash: string` (선택)
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 카카오 로그인 시 조회/생성
- `PATCH /auth/profile`로 nickname/profileImage 갱신

### 검증 규칙

- 닉네임 길이/문자 검증
- kakaoId unique 보장

### 인덱스/성능

- `kakaoId` unique index

### API/소켓 매핑

- `/auth/kakao/callback`
- `/auth/signup/complete`
- `/auth/profile`

### 변경 이력 정책

- 기존 필드 호환 유지
- 신규 필드는 optional로 도입

## 2) ChatRoom

### 필드

- `id: string` (ObjectId 문자열)
- `name: string` (필수)
- `isGroup: boolean` (기본 true)
- `memberIds: string[]`
- `lastMessage: string`
- `lastMessageAt: date|null`
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- 생성 시 생성자만 `memberIds`에 포함
- 메시지 전송 시 `lastMessage`, `lastMessageAt` 갱신

### 검증 규칙

- `name` 공백/길이 검증
- memberIds 중복 방지

### 인덱스/성능

- `memberIds` index
- `lastMessageAt` index
- 레거시 `roomKey_1` 인덱스 사용 금지

### API/소켓 매핑

- `/api/chatrooms` (POST/GET)
- `join_room`
- (MVP2 예정) `leave_room`, 멤버십 API

### 변경 이력 정책

- room id는 ObjectId 문자열 고정
- 1:1 roomKey 규칙 재도입 시 별도 마이그레이션 필수

## 3) Message

### 필드

- `chatRoomId: string` (필수)
- `senderId: string` (선택)
- `senderNickname: string` (필수)
- `type: text|system`
- `text: string` (필수)
- `timestamp: date`
- `createdAt: date`
- `updatedAt: date`

### 생성/갱신 규칙

- `send_message` 시 생성
- 수정/삭제는 MVP2 범위 밖

### 검증 규칙

- text 빈값 금지
- room 멤버만 생성 가능

### 인덱스/성능

- `chatRoomId` index
- `timestamp` index

### API/소켓 매핑

- `/api/chatrooms/:id/messages`
- `send_message`
- `receive_message`

### 변경 이력 정책

- 페이지네이션 도입 시 cursor 필드/정렬 규칙 문서화

## 4) Presence

### 필드(메모리 모델)

- `roomId -> Map<userId, Set<socketId>>`

### 생성/갱신 규칙

- `join_room` 시 add
- disconnect 시 remove
- room 변경 시 재계산

### 검증 규칙

- `online = socketId set size > 0`

### 인덱스/성능

- 메모리 구조(영속 저장 없음)

### API/소켓 매핑

- `room_participants`

### 변경 이력 정책

- 멀티 인스턴스 전환 시 Redis 등 외부 스토리지 도입 검토

## 5) AuthSession (Client)

### 필드

- `accessToken: string`
- `refreshToken: string`
- `user: { id, nickname, profileImage }`
- `pendingSignup`

### 생성/갱신 규칙

- 로그인 성공 시 저장
- refresh 성공 시 토큰 갱신
- 로그아웃 시 삭제

### 검증 규칙

- 토큰 payload 파싱 실패 시 fallback 처리

### 인덱스/성능

- localStorage 저장, 서버 인덱스 없음

### API/소켓 매핑

- `/auth/refresh`
- 소켓 handshake auth token

### 변경 이력 정책

- 세션 구조 변경 시 하위 호환 마이그레이션 함수 제공
