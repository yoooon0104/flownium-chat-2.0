# 아키텍처

## 시스템 구조

클라이언트(React + Vite)
-> `AppShell` (조립 전용)
-> `features/*` hooks/components
-> `services/*` (REST/Socket)
-> Express + Socket.IO 서버
-> MongoDB

## 프론트 계층

1. `app/`
- `AppShell.jsx`: 화면 분기/조합

2. `features/`
- `auth`: `LoginGate`, `SignupOnboarding`, `useKakaoAuth`
- `chat`: `RoomPanel`, `ChatPanel`, `useChatRooms` / `useChatMessages` / `useChatSocket`
- `user`: `UserMenu`, `ProfileModal`, `SettingsModal`

3. `domain/`
- `AuthSession`: 토큰 로드/저장/삭제
- `UserProfile`: 사용자 정규화/표기 규칙 (`email`, `nickname`, `profileImage`)

4. `services/`
- `api/authApi`, `api/chatApi`
- `socket/chatSocketClient`

## 백엔드 구조

- `server/index.cjs`: 서버 엔트리 + 소켓 이벤트
- `routes/auth.routes.cjs`: 카카오/온보딩/refresh/me/profile
- `routes/chatroom.routes.cjs`: chatroom REST
- `services/auth.service.cjs`: JWT/해시/signup 토큰 검증
- `services/kakao.service.cjs`: 카카오 외부 API 연동(이메일 포함)
- `utils/error-response.cjs`: 공통 HTTP 에러 응답 포맷

## 인증/채팅 흐름

1. 카카오 로그인
2. `/auth/kakao/callback` 결과 분기(`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
3. 온보딩 완료 시 `/auth/signup/complete`
4. 토큰 저장 후 초기 세션 복원 시 `/auth/me` 호출
5. REST/Socket 인증 시작
6. 채팅방 조회/입장/메시지 송수신
7. `room_participants`로 전체 멤버 + 온라인 상태 표시

## 데이터 핵심 필드

- `User`: `kakaoId`, `email`, `nickname`, `profileImage`, `refreshTokenHash`
- `ChatRoom`: `name`, `memberIds`, `lastMessage`, `lastMessageAt`
- `Message`: `chatRoomId`, `senderId`, `text`, `timestamp`

## 운영 보정 로직

- 서버 시작 시 `chatrooms.roomKey_1` 레거시 유니크 인덱스 자동 삭제
- 목적: 과거 스키마 잔재로 인한 `E11000 duplicate key` 오류 완화

## 현재 제약

- 프로필 이미지는 카카오 원본 우선(업로드/편집은 다음 단계)
- 관리자/초대/강퇴 정책 미구현
- presence는 메모리 기반(서버 재시작 시 초기화)
- 프론트 API URL은 현재 로컬 고정값 사용(배포 전 환경변수 전환 필요)
