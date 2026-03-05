# WBS (작업 분해 현황)

업데이트: 2026-03-05

## 1) 완료

- [x] Express + Socket.IO 서버 기본 구성
- [x] Kakao OAuth callback + JWT refresh API 구현
- [x] Socket handshake JWT 인증 적용
- [x] Message 모델 + 메시지 히스토리 API 구현
- [x] ChatRoom 모델 구현 (`name`, `isGroup`, `memberIds`, `lastMessage`, `lastMessageAt`)
- [x] `POST /api/chatrooms` 구현
- [x] `GET /api/chatrooms` 구현
- [x] `GET /api/chatrooms/:id/messages` 인증/멤버십 가드 적용
- [x] `join_room` 멤버 자동 등록(upsert) 구현
- [x] `room_participants` 구현 (전체 멤버 + online/offline)
- [x] `send_message` 시 방 요약 업데이트
- [x] 참여자 메뉴(우측 상단 드롭다운) UI 적용
- [x] 방 목록 검색 + FAB(+) + 방 생성 모달 UI 적용
- [x] 채팅 영역 스크롤 + 하단 입력 고정 UX 유지
- [x] 모바일 채팅 헤더 좌측 아이콘 뒤로가기 UX 적용
- [x] 핵심 문서 그룹채팅 기준 동기화

## 2) 진행 중

- [ ] 카카오 실로그인 기반 2인 E2E 검증
- [ ] 다중 탭/다중 소켓 presence 엣지케이스 점검

## 3) 다음 작업

- [ ] 관리자 권한/초대/강퇴 정책 설계
- [ ] `leave_room` 이벤트 및 REST API 설계
- [ ] 컴포넌트 분리 (`RoomPanel`, `ChatPanel`, `ParticipantMenu`)
- [ ] 메시지 커서 기반 페이지네이션
- [ ] 에러 코드 표준화 (`error.code`)

## 4) 백로그

- [ ] E2E 테스트 스크립트 구축
- [ ] 배포 체크리스트 고도화
- [ ] 메시지 암호화 전략 확정 및 적용 계획

