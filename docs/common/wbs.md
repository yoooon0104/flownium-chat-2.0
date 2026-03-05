# WBS (작업 분해 현황)

업데이트: 2026-03-05

## 1) 완료

- [x] Express + Socket.IO 서버 기본 구성
- [x] Socket handshake JWT 인증 적용
- [x] Message/ChatRoom 모델 및 그룹채팅 REST/Socket 구현
- [x] `room_participants` (전체 멤버 + online/offline) 구현
- [x] 방 목록 검색 + FAB(+) + 방 생성 모달 UI 적용
- [x] 모바일 채팅 헤더 아이콘(←) 뒤로가기 UX 적용
- [x] 카카오 로그인 게이트 + 현재 페이지 콜백 처리 구현
- [x] 소켓 재연결 루프 안정화
- [x] 인증 온보딩 분기 도입 (`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
- [x] `POST /auth/signup/complete` 구현
- [x] `PATCH /auth/profile` 닉네임 변경 API 구현
- [x] 우측 상단 플로팅 사용자 메뉴 구현 (`내 정보`/`설정`/`로그아웃`)
- [x] 프론트 구조 분리 (`app/features/domain/services`)
- [x] 채팅 REST 라우트 분리 (`routes/chatroom.routes.cjs`)
- [x] 서버 시작 시 레거시 `roomKey_1` 인덱스 자동 정리 로직 적용

## 2) 진행 중

- [ ] 카카오 실로그인 기반 2인 E2E 검증
- [ ] 설정 모달 UX 다듬기(에러 문구/로딩 상태)

## 3) 다음 작업

- [ ] 배포 환경 전환(프론트/백엔드/DB)
- [ ] 프론트 `API_BASE_URL` 환경변수 전환 (`VITE_API_BASE_URL`)
- [ ] 프로필 이미지 편집(업로드/URL 변경) 기능
- [ ] 관리자 권한/초대/강퇴 정책 설계
- [ ] `leave_room` 이벤트 및 REST API 설계

## 4) 백로그

- [ ] 메시지 커서 기반 페이지네이션
- [ ] 에러 코드 표준화 (`error.code`)
- [ ] E2E 테스트 스크립트 구축
- [ ] 메시지 암호화 전략 확정 및 적용 계획
