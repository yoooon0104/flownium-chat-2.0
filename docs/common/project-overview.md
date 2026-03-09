# 프로젝트 개요

업데이트: 2026-03-09

## 1) Flownium Chat이 무엇인가?

Flownium Chat은 **카카오 로그인 기반 실시간 그룹 채팅 서비스**입니다.
핵심 목표는 "로그인부터 메시지 송수신까지 끊기지 않는 대화 흐름"입니다.

현재 상태:
- MVP1 핵심 기능 완료
- MVP2-A 운영 로그인/배포 검증 1차 완료
- MVP2-B 친구 도메인 확장 준비 중

## 2) 현재 제공 기능

- 카카오 로그인 + 온보딩 분기(`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
- JWT Access/Refresh 인증
- 로그인 상태 확인 API(`GET /auth/me`)
- 그룹방 생성/목록/입장
- 실시간 메시지 송수신 + 메시지 히스토리 조회
- 참여자 목록(전체 멤버 + online/offline)
- 방 검색 + FAB(+) 생성 모달
- 사용자 메뉴(`내 정보`/`설정`/`로그아웃`)
- 표준 에러 응답(`error.code`, `error.message`)
- 운영 배포 기준 카카오 로그인 성공 검증

## 3) 브랜딩 적용 상태

브랜드 기준 문서:
- `assets/branding/usage-guide.md`

실사용 로고:
- `assets/branding/logo/flownium-wordmark-light.png`
- `assets/branding/logo/flownium-wordmark-dark.png`
- `assets/branding/logo/flownium-icon.png`

UI 적용 원칙:
1. 배경은 브랜드 그라데이션
2. 실제 동작 패널/모달은 라이트 서피스
3. CTA/강조는 Primary/Secondary 그라데이션 사용

## 4) 기술 구조 요약

프론트:
- React + Vite
- `AppShell` 조합 구조
- `features/*`(화면/상태), `services/*`(I/O), `domain/*`(규칙)

백엔드:
- Express + Socket.IO
- MongoDB(Mongoose)
- 라우트 분리(`auth`, `chatrooms`)

운영 배포:
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

## 5) 운영 상태

- 로컬/운영 환경 모두 카카오 로그인 흐름 검증 가능
- 프론트 API URL: `VITE_API_BASE_URL` 우선, 미설정 시 `http://localhost:3010` fallback
- 카카오 Redirect URI는 프론트/서버/카카오 콘솔에서 동일 문자열이어야 함
- 기본 정책은 끝 슬래시 없는 URI(`https://flownium-chat-2-0.vercel.app`)로 통일
- 서버 시작 시 레거시 `roomKey_1` 인덱스 자동 제거

## 6) 다음 우선순위

1. 운영 환경 2탭 메시지/참여자 E2E 최종 점검
2. 친구 검색(이메일/닉네임) 및 친구 도메인 확장
3. 친구 기반 1:1/그룹방 생성 정책 구현
4. MVP2 화면/오브젝트 정의서 상세화
5. 회원탈퇴는 다음 scope 후보로 별도 정리
