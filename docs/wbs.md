# WBS (Work Breakdown Status)

기준일: 2026-03-04

## 1) 완료 (Done)

- [x] Express + Socket.IO 서버 기본 부트스트랩
- [x] 헬스체크 API (`GET /api/health`)
- [x] Socket 기본 이벤트 구현
- [x] `join_room`
- [x] `send_message`
- [x] `receive_message`
- [x] 메시지 저장 모델 구현 (`Message`)
- [x] 메시지 히스토리 API 구현 (`GET /api/chatrooms/:id/messages`)
- [x] Socket JWT handshake 인증 구현
- [x] 카카오 OAuth callback API 구현 (`GET /auth/kakao/callback`)
- [x] JWT refresh API 구현 (`POST /auth/refresh`)
- [x] `User` 모델 구현
- [x] 프론트 소켓 테스트 UI 구현
- [x] 프론트에서 room 입장 후 히스토리 로드 구현
- [x] UI 1차 레이아웃 전환 (카카오톡형 2단 구조)
- [x] 문서 동기화 프로세스 정착 (변경 시 docs 동시 업데이트)

## 2) 진행중 (In Progress)

- [ ] 테스트용 방 목록을 실제 ChatRoom API 연동으로 전환
- [ ] 컴포넌트 분리 (`RoomListPanel`, `ChatPanel`, `MessageComposer`)

## 3) 다음 작업 (Next)

- [ ] `ChatRoom` 모델 구현
- [ ] 채팅방 API 구현
- [ ] `POST /api/chatrooms` (roomKey 기반 중복 방지)
- [ ] `GET /api/chatrooms`
- [ ] 프론트 room 목록 API 연동
- [ ] 프론트 구조 분리 (`socketClient`, `chatApi`, `useChatSocket`)
- [ ] CSS 2차 정리 (hover/active/skeleton/접근성)

## 4) 백로그 (Backlog)

- [ ] JWT 인증을 REST/Socket 공통 미들웨어 구조로 정리
- [ ] 메시지 페이징 커서 방식 고도화 (`before`, `limit`)
- [ ] 에러 코드 표준화 (`error.code`, `error.message`)
- [ ] E2E 테스트 시나리오 추가
- [ ] 메시지 암호화 전략 확정 (전송/저장/키관리)
- [ ] 배포 환경 체크리스트 문서화 (Vercel/Render/Railway)

## 5) 운영 규칙

- 기능 변경 시 관련 `docs/*.md`를 같은 작업에서 함께 업데이트한다.
- 중간/대규모 기능은 변경안을 먼저 공유하고 검토 후 구현한다.
- 이 문서는 작업 상태가 바뀔 때마다 즉시 갱신한다.