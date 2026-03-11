# 아키텍처

업데이트: 2026-03-11

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
- `UserProfile`: 사용자 정규화/표기 규칙 (`email`, `nickname`, `profileImage`, `isDeleted`)

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
- `routes/auth.routes.cjs`: 카카오/온보딩/refresh/me/profile/account delete
- `routes/chatroom.routes.cjs`: 채팅방 생성/초대/나가기/메시지/read 상태 REST + 커서 기반 메시지 페이지네이션
- `routes/friend.routes.cjs`: 친구 검색/요청/수락/거절/차단
- `routes/notification.routes.cjs`: 알림 목록/읽음 처리
- `services/auth.service.cjs`: JWT/해시/signup 토큰 검증
- `services/kakao.service.cjs`: 카카오 외부 API 연동(이메일 포함)
- `utils/error-response.cjs`: 공통 HTTP 에러 응답 포맷

## 인증/채팅 흐름

1. 카카오 로그인
2. `/auth/kakao/callback` 결과 분기(`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
3. 온보딩 완료 시 `/auth/signup/complete`
4. 토큰 저장 후 초기 세션 복원 시 `/auth/me` 호출
5. REST/Socket 인증 시작
6. Friends/Rooms 목록 조회
7. 채팅방 조회/입장/메시지 송수신
8. `room_participants`로 전체 멤버 + 온라인 상태 표시
9. 채팅 상세에서 친구 초대/나가기 처리
10. 메시지 목록은 `before` 커서 기반으로 이전 메시지 추가 로드
11. 알림 허브/모바일 알림 화면에서 친구 요청과 초대 처리
12. 설정 화면/모달에서 닉네임과 테마(light/dark/system) 변경
13. 회원탈퇴 시 사용자 문서를 tombstone 상태로 바꾸고 친구/방/알림/읽음 상태를 함께 정리한 뒤 로그인 게이트로 복귀

## 데이터 핵심 필드

- `User`: `kakaoId`, `email`, `nickname`, `profileImage`, `accountStatus`, `deletedAt`, `refreshTokenHash`
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
- 목적: 과거 스키마 잔재로 인한 `E11000 duplicate key` 오류 완화

## 현재 제약

- 프로필 이미지는 카카오 원본 우선(업로드/편집은 다음 단계)
- 관리자/초대/강퇴 정책 미구현
- 초대 승인 절차/강퇴 정책은 아직 없음(친구 검증 후 즉시 반영)
- presence는 메모리 기반(서버 재시작 시 초기화)
- unread 감소/증가 흐름은 실제 친구 계정 2개 이상 기준 추가 검증 필요
- 설정은 모바일 별도 화면 + 데스크톱 모달 구조이며 닉네임/테마 변경과 회원탈퇴를 지원
- 탈퇴 회원 재로그인은 다시 signup flow를 거쳐 활성화되며, tombstone 기간 동안 accepted friendship과 direct room 맥락은 유지된다
