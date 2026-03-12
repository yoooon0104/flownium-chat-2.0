# 아키텍처

업데이트: 2026-03-12

## 시스템 구조

클라이언트(React + Vite + Tailwind CSS)
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
- `chat`: `RoomPanel`, `ChatPanel`, `CreateRoomModal`, `InviteFriendsModal`, `ParticipantsMenu`, `useChatRooms`, `useChatMessages`, `useChatSocket`
- `friends`: `AddFriendModal`, `FriendActionSheet`, `useFriends`
- `notifications`: `NotificationMenu`, `NotificationsScreen`, `useNotifications`
- `navigation`: `MobileBottomTabBar`
- `user`: `UserMenu`, `ProfileModal`, `SettingsModal`, `SettingsScreen`

3. `domain/`
- `AuthSession`: 토큰 로드/저장/삭제
- `UserProfile`: 사용자 정규화/표기 규칙 (`email`, `nickname`, `profileImage`, `isDeleted`, `linkedProviders`)

4. `services/`
- `api/authApi`, `api/chatApi`
- `socket/chatSocketClient`

## 테마 / 스타일 구조

- Tailwind CSS가 전역에 연결되어 있으며 `src/index.css`에서 `@tailwind base/components/utilities`를 로드한다.
- `tailwind.config.js`에는 브랜드 컬러와 `Sora` 폰트가 등록되어 있다.
- 전역 CSS 변수는 `data-resolved-theme="light|dark"` 기준으로 light/dark 값을 분기한다.
- `AppShell`은 `themePreference`(`light | dark | system`)를 localStorage에 저장하고 시스템 다크모드와 동기화한다.

## 백엔드 구조

- `server/index.cjs`: 서버 엔트리 + 소켓 이벤트
- `routes/auth.routes.cjs`: 카카오/온보딩/email signup/email login/kakao link/refresh/me/profile/password/account delete
- `routes/chatroom.routes.cjs`: 채팅방 생성/초대/나가기/메시지/read 상태 REST + 커서 기반 메시지 페이지네이션
- `routes/friend.routes.cjs`: 친구 검색/요청/수락/거절/차단
- `routes/notification.routes.cjs`: 알림 목록/읽음 처리
- `services/auth.service.cjs`: JWT/해시/signup 토큰 검증 + 신규/변경용 비밀번호 규칙
- `models/AuthIdentity`: 로그인 수단 매핑
- `models/EmailVerification`: 이메일 가입 전 임시 인증 레코드
- `services/kakao.service.cjs`: 카카오 외부 API 연동(이메일 포함)
- `utils/error-response.cjs`: 공통 HTTP 에러 응답 포맷

## 인증 구조

- `User`는 서비스 내부 사용자 본체를 유지한다.
- `AuthIdentity`가 카카오 등 외부 로그인 수단을 담당한다.
- 카카오는 회원 본체가 아니라 간편로그인 수단으로만 관리한다.
- 기존 legacy `User.kakaoId` 사용자는 첫 카카오 로그인에서 `AuthIdentity(kakao)`로 점진 마이그레이션한다.
- 이메일 회원은 설정 화면에서 명시적으로 `AuthIdentity(kakao)`를 연결할 수 있다.
- 탈퇴한 tombstone `User`는 유지하되, 연결된 로그인 수단은 제거한다.
- 같은 카카오 계정 재가입은 기존 tombstone 계정 복구가 아니라 새 `User` 생성 흐름으로 간다.

## 다음 인증 구조(계획)

- 기본 회원가입 도입 시 `AuthIdentity(email)` 같은 추가 로그인 수단을 연결한다.
- 계정 연결/병합 정책은 이후 별도 작업으로 정의한다.
- 기본 회원가입/간편로그인 공존 시에도 `User.id`는 친구/채팅/history의 고정 식별자로 유지한다.

## 인증/채팅 흐름

1. 카카오 로그인
2. `/auth/kakao/callback` 결과 분기(`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
3. 온보딩 완료 시 `/auth/signup/complete`
4. 이메일 회원가입 시작 시 `/auth/email/signup/start`
5. 이메일 인증 완료 시 `/auth/email/signup/verify`
6. 이메일 로그인 시 `/auth/email/login`
7. 이메일 회원은 설정 화면에서 `/auth/kakao/link/start`로 카카오 계정 연결 시작
8. 연결 콜백은 `/auth/kakao/callback?state=...`에서 `LINK_SUCCESS`로 종료
9. 토큰 저장 후 초기 세션 복원 시 `/auth/me` 호출
10. REST/Socket 인증 시작
11. Friends/Rooms 목록 조회
12. 채팅방 조회/입장/메시지 송수신
13. `room_participants`로 전체 멤버 + 온라인 상태 표시
14. 채팅 상세에서 친구 초대/나가기 처리
15. 메시지 목록은 `before` 커서 기반으로 이전 메시지 추가 로드
16. 알림 허브/모바일 알림 화면에서 친구 요청과 초대 처리
17. 메뉴에서 `내 정보`와 `설정`을 분리해 진입
18. `내 정보` 화면에서 닉네임 변경, 비밀번호 변경, 카카오 계정 연결, 회원탈퇴 처리
19. `설정` 화면에서는 테마(light/dark/system) 같은 앱 환경 설정만 관리
20. 회원탈퇴 시 사용자 문서를 tombstone 상태로 바꾸고 친구/방/알림/읽음 상태를 함께 정리한 뒤 로그인 게이트로 복귀

## 데이터 핵심 필드

- `User`: `email`, `nickname`, `profileImage`, `accountStatus`, `deletedAt`, `refreshTokenHash`
- `AuthIdentity`: `userId`, `provider`, `providerUserId`, `providerEmail`, `lastLoginAt`
- `EmailVerification`: `email`, `codeHash`, `passwordHash`, `nickname`, `agreedToTermsAt`, `expiresAt`, `resendAvailableAt`
- `ChatRoom`: `name`, `memberIds`, `lastMessage`, `lastMessageAt`, `deletedMemberIds`(응답 가공 필드), `directChatDisabled`(응답 가공 필드)
- `Message`: `chatRoomId`, `senderId`, `type`, `text`, `timestamp`
- `Friendship`: `requesterId`, `addresseeId`, `pairKey`, `status`
- `Notification`: `userId`, `type`, `payload`, `isRead`, `readAt`
- `ChatReadState`: `roomId`, `userId`, `lastReadAt`

## 실시간 동기화 구조

- 소켓 연결 시 사용자 전용 room(`user:<userId>`) 자동 참여
- `receive_message`
  - 현재 방이면 본문 즉시 반영
  - 다른 방이면 방 목록/unread 재조회 트리거
- `message_updated`
  - 읽음 처리 후 기존 메시지의 unread count를 같은 `id` 기준으로 merge
- `notification_created`, `notification_read`
  - 알림 허브/모바일 알림 화면 재조회 트리거
- `friendship_updated`
  - 친구 목록과 알림 허브 재조회 트리거
- `room_participants`
  - 현재 입장 방 기준 참여자 online/offline 반영
- `room_updated`
  - 새 방 생성/초대/나가기 뒤 방 목록 메타 재조회 트리거
- `room_deleted`
  - 삭제되거나 내가 떠난 방을 목록/상세에서 제거하는 트리거
- `DELETED_MEMBER`
  - direct 상대가 탈퇴한 방에서 메시지 전송을 막는 소켓 에러 코드

## 운영 보정 로직

- 서버 시작 시 `chatrooms.roomKey_1` 레거시 유니크 인덱스 자동 삭제
- 서버 시작 시 `users.kakaoId_1` 레거시 유니크 인덱스 자동 삭제
- 목적: 과거 스키마 잔재로 인한 `E11000 duplicate key` 오류 완화

## 현재 제약

- 프로필 이미지는 카카오 원본 우선(업로드/편집은 다음 단계)
- 관리자/초대/강퇴 정책 미구현
- 초대 승인 절차/강퇴 정책은 아직 없음(친구 검증 후 즉시 반영)
- presence는 메모리 기반(서버 재시작 시 초기화)
- unread 감소/증가 흐름은 실제 친구 계정 2개 이상 기준 추가 검증 필요
- 인증 화면은 카카오 로그인과 이메일 로그인/회원가입 패널을 분리해 제공
- 이메일 회원가입은 서비스 이용 약관 동의가 선행되어야 한다
- 이메일 회원가입은 비밀번호 확인과 강화된 검증(닉네임 2~20자, 영문/숫자 포함 비밀번호)을 적용
- 설정은 앱 환경 설정만 담당하고, 계정 관리는 `내 정보` 화면으로 분리
- 카카오 계정 연결은 1차 구현되었지만 연결 해제/병합 정책은 아직 미구현
- 개발 단계 이메일 인증 코드는 서버 로그/DB로 확인한다

## 익명방 확장 방향(계획)

- 익명방은 기존 친구 기반 채팅의 옵션이 아니라 별도 도메인으로 분리한다.
- 비회원은 로그인 화면에서 별도 진입 후 닉네임만 설정하고 익명방만 사용할 수 있다.
- 익명방은 URL 토큰과 비밀번호를 통해 입장한다.
- 회원도 익명방에 참여할 수 있지만, 익명방 안에서는 본계정 닉네임 대신 방별 익명 닉네임을 사용한다.
- 비회원은 일정 기간(예: 7일) 미접속 시 삭제하고, 참여 중인 익명방에서도 정리하는 정책을 검토한다.
- 이 확장은 `AnonymousRoom`, `AnonymousParticipant`, `GuestSession` 같은 별도 모델이 필요할 가능성이 높다.
