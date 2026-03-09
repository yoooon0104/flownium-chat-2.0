# WBS (작업 분해 현황)

업데이트: 2026-03-09

## 1) 전체 진행 상태 요약

- 완료: MVP1 핵심 기능, 브랜딩 1차, 운영 로그인 및 배포 검증 1차
- 진행 중: MVP2-B Friends/Rooms UI와 친구 기반 채팅 UX 정리
- 다음: 실제 친구 데이터 기준 검증, 모바일 하단 탭바 여부 검토, 익명 채팅 다음 scope 상세화

## 2) 완료

- [x] Express + Socket.IO 서버 기본 구성
- [x] Socket handshake JWT 인증 적용
- [x] Message/ChatRoom 모델 및 그룹채팅 REST/Socket 구현
- [x] `room_participants` (전체 멤버 + online/offline) 구현
- [x] 방 목록 검색 + FAB(+) + 방 생성 모달 UI 적용
- [x] 모바일 채팅 헤더 아이콘 뒤로가기 UX 적용
- [x] 카카오 로그인 게이트 + 현재 페이지 콜백 처리 구현
- [x] 토큰 재연결 루프 안정화
- [x] 인증 온보딩 분기 도입 (`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
- [x] `POST /auth/signup/complete` 구현
- [x] `PATCH /auth/profile` 닉네임 변경 API 구현
- [x] `GET /auth/me` 구현 및 초기 세션 복원 연동
- [x] 사용자 `email` 필드 수집/저장/응답 연동
- [x] 사용자 메뉴 구현 (`내 정보`, `설정`, `로그아웃`)
- [x] `app/features/domain/services` 구조로 프론트 분리
- [x] 채팅 REST 라우트 분리 (`routes/chatroom.routes.cjs`)
- [x] 브랜딩 1차 적용(로고 에셋, 컬러 토큰, 로그인 화면 반영)
- [x] 오류 응답 표준화(`error.code`) 1차 적용
- [x] `scripts/test-error-code.ps1`, `scripts/test-auth-me.ps1`, `scripts/test-prod-ready.ps1` 추가
- [x] Vercel/Render/Atlas 1차 배포 셋업 완료
- [x] 카카오 운영 로그인 성공
- [x] redirect URI 슬래시 이슈 해결
- [x] `vercel.json` 배포 오류 수정
- [x] PR 공유 양식 규칙 문서화
- [x] Friendship 모델 추가
- [x] Notification 모델 추가
- [x] 친구 검색/요청/처리 API 추가
- [x] 알림 목록/읽음 API 추가
- [x] 친구 기반 채팅방 생성 백엔드 규칙 추가
- [x] `notification_created`, `notification_read` 소켓 이벤트 추가
- [x] `join_room` 멤버 검증 강화

## 3) 진행 중

### MVP2-A 마무리
- [ ] 운영 환경 2탭 메시지/참여자 E2E 검증
- [ ] 배포 실행 기록 최종 정리

### MVP2-B 프론트 UI
- [x] Friends/Rooms 탭 구조 도입
- [x] 기본 탭을 Friends로 전환
- [x] 친구 추가 모달 도입
- [x] 친구 선택 기반 채팅 생성 모달 도입
- [x] 친구 요청/방 초대 알림 허브 분리
- [x] 데스크톱 더블 클릭 1:1 시작 흐름 도입
- [x] 모바일 친구 액션 시트 도입
- [x] 좌측 패널 상단 프로필/액션 헤더 재구성
- [ ] 실제 친구 데이터 기준 1:1/그룹 생성 검증
- [x] 모바일 알림 화면 분리(데스크톱 드롭다운 유지)`r`n- [ ] 알림 허브 UI 세부 다듬기`r`n- [ ] 모바일 하단 탭바 적용 여부 결정 및 반영

## 4) 다음 작업

- [ ] 실제 친구 계정 2개 기준 로컬 검증
- [ ] Friends 탭 정렬을 초성/알파벳 그룹 헤더까지 확장할지 결정
- [ ] 모바일 하단 탭바(친구/채팅방/알림/설정) 적용 검토
- [ ] 알림 허브에서 친구 요청/방 초대 처리 UX 마무리
- [ ] 채팅방 목록 unread count 표시 정책 확정
- [ ] 프로필 이미지 수정 기능 설계
- [ ] 관리자 권한/초대/강퇴 정책 설계

## 5) 백로그

- [ ] `leave_room` 이벤트 및 REST 설계/구현
- [ ] 회원탈퇴/계정 라이프사이클 정책 정리
- [ ] 익명 채팅방 도메인 및 방 키 초대 구조 설계
- [ ] 메시지 커서 기반 페이지네이션
- [ ] 메시지 검색/북마크/읽음 상태 고도화
- [ ] 다국어(i18n) 지원
- [ ] 다크모드 지원

## 6) 차수별 액션아이템 현황

### MVP1
- 상태: 완료
- [x] 카카오 OAuth + JWT 인증
- [x] 그룹 채팅방 생성/목록/입장
- [x] 실시간 메시지 송수신
- [x] 참여자 online/offline 표시
- [x] FAB 기반 방 생성 UX
- [x] 사용자 메뉴/프로필/설정

### MVP2-A
- 상태: 진행 중
- [x] 운영 배포 1차 셋업
- [x] `VITE_API_BASE_URL` 전환
- [x] 카카오 Redirect URI 운영/로컬 검증
- [x] 운영 카카오 로그인 성공
- [x] 오류 응답 표준화 1차
- [x] 운영 로그/배포 런북 문서화
- [ ] 운영 2탭 E2E 검증
- [ ] 배포 기록 최종 문서화

### MVP2-B
- 상태: 진행 중
- [x] 친구/알림 백엔드 도메인
- [x] 친구 검색/요청/수락/거절/차단 API
- [x] 친구 요청/방 초대 알림 API + 소켓 이벤트
- [x] 친구 기반 채팅방 생성 규칙
- [x] Friends/Rooms 탭 UI 뼈대
- [x] 친구 목록 전용 Friends 탭
- [x] 검색 버튼 토글형 검색 UI
- [x] 알림 허브 분리
- [ ] 실제 친구 데이터 기준 UI/UX 검증`r`n- [x] 모바일 알림 화면 분리`r`n- [ ] 모바일 하단 탭바 검토

### MVP3
- 상태: 백로그
- [ ] 인앱 알림 UX 고도화
- [ ] 메시지 검색/북마크/읽음 상태
- [ ] 다국어/다크모드
- [ ] 익명 채팅방
- [ ] 회원탈퇴 및 계정 라이프사이클

