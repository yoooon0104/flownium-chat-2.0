# 프로젝트 개요

업데이트: 2026-03-05

## 1) 서비스 한눈에 보기

Flownium Chat은 `Kakao OAuth + JWT + Socket.IO + MongoDB` 기반의 실시간 그룹 채팅 서비스입니다.
현재 기준은 **MVP1 완료 + MVP2-B 일부 착수** 상태입니다.

핵심 가치:
- 빠른 로그인(카카오 OAuth)
- 실시간 대화(소켓)
- 그룹 중심 채팅 UX
- 문서 기반 기능 확장(MVP2/MVP3)

## 2) 현재 제공 기능

- 카카오 로그인 + 온보딩 분기(`LOGIN_SUCCESS` / `SIGNUP_REQUIRED`)
- JWT Access/Refresh 인증
- 그룹방 생성/목록/입장
- 메시지 저장 + 실시간 송수신
- 참여자 목록(전체 멤버 + online/offline)
- 방 검색 + FAB(+) 생성 모달
- 사용자 메뉴(`내 정보`/`설정`/`로그아웃`)
- 표준 에러 응답(`error.code`, `error.message`)
- 로그인 상태 확인 API(`GET /auth/me`)

## 3) 브랜딩 적용 상태

브랜딩 기준 문서:
- `assets/branding/usage-guide.md`

실사용 로고 에셋:
- `assets/branding/logo/flownium-wordmark-light.png`
- `assets/branding/logo/flownium-wordmark-dark.png`
- `assets/branding/logo/flownium-icon.png`

적용 원칙:
- 배경은 브랜드 그라데이션
- 실제 동작 패널/모달은 라이트 서피스(흰색)
- CTA/강조 요소는 Primary/Secondary 그라데이션 사용

## 4) 기술 구조 요약

프론트:
- React + Vite
- `AppShell` 중심 조합 구조
- `features/*`(UI/상태), `services/*`(I/O), `domain/*`(정규화)

백엔드:
- Express + Socket.IO
- MongoDB(Mongoose)
- 라우트 분리(`auth`, `chatrooms`)

## 5) 현재 운영 상태

- 기본 실행 환경: 로컬(`localhost`)
- 프론트 API URL: 현재 코드에 `http://localhost:3010` 고정
- 서버 시작 시 레거시 `roomKey_1` 인덱스 자동 제거

## 6) 다음 단계 (MVP2 우선순위)

1. 운영/배포 안정화 (Vercel/Render/Atlas)
2. 친구 검색/추가 도메인 (이메일/닉네임)
3. 친구 기반 1:1/그룹 방 생성 강제
4. `leave_room` + 권한 정책 설계
5. 운영 로그 기준/장애 대응 체계 확립
