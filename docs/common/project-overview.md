# 프로젝트 개요

업데이트: 2026-03-12

## 1) Flownium Chat이 무엇인가?

Flownium Chat은 친구 기반 1:1/그룹 채팅을 중심으로, 이메일 인증과 카카오 간편로그인을 함께 지원하는 실시간 채팅 서비스입니다.

핵심 목표:
- 로그인부터 대화 시작까지 끊기지 않는 흐름 제공
- 친구 관계 기반의 안전한 채팅 경험 제공
- 향후 익명방/비회원 확장까지 고려한 계정 구조 유지

## 2) 현재 제공 기능

- 카카오 간편로그인 + 온보딩 분기(`LOGIN_SUCCESS`, `SIGNUP_REQUIRED`)
- 이메일 회원가입 + 이메일 인증 + 이메일 로그인
- 이메일 비밀번호 재설정
- JWT Access / Refresh 인증
- 로그인 상태 확인 API(`GET /auth/me`)
- 카카오 계정 연결 / 해제
- 친구 검색(이메일 기준), 요청, 수락, 거절, 차단
- 친구 기반 1:1 방 재사용 / 그룹방 생성
- 채팅방 초대 / 나가기
- 실시간 메시지 송수신
- 메시지 unread 숫자 표시
- 방 목록 unread badge / 최근 메시지 정렬
- 이전 메시지 커서 기반 로드
- 알림 허브(Desktop 드롭다운 / Mobile 전용 화면)
- 모바일 하단 탭바
- 내 정보 / 설정 분리 구조
- 회원탈퇴 tombstone 처리

## 3) 현재 상태

- MVP2-B 1차 구현 완료
- 인증/계정 UX 1차 재구성 완료
- 브랜딩 및 아이콘 자산 1차 적용 완료
- 실제 친구 계정 기준 E2E 검증은 추가 진행 필요

## 4) 브랜딩 적용 상태

브랜드 기준 문서:
- `assets/branding/usage-guide.md`

대표 자산:
- `assets/branding/logo/flownium-logo_wordmark-on-light.png`
- `assets/branding/logo/flownium-logo_wordmark-on-dark.png`
- `assets/branding/logo/flownium-logo_icon.png`

배포용 아이콘:
- `public/branding/favicon-16x16.png`
- `public/branding/favicon-32x32.png`
- `public/branding/apple-touch-icon.png`
- `public/branding/android-chrome-192x192.png`
- `public/branding/android-chrome-512x512.png`

UI 적용 원칙:
1. 테마는 `light / dark / system` 기준으로 동작
2. 로그인/인증 화면도 시스템 테마를 따라감
3. 브랜드 워드마크는 `on-light / on-dark`를 테마에 맞게 분기

## 5) 기술 구조 요약

프론트:
- React + Vite + Tailwind CSS
- `AppShell` 조립 구조
- `features/*` 기능 단위
- `services/*` REST / Socket I/O
- `domain/*` 사용자/세션 정규화

백엔드:
- Express + Socket.IO
- MongoDB (Mongoose)
- 라우트 분리(`auth`, `chatrooms`, `friends`, `notifications`)

운영 배포:
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

## 6) 계정 정책 요약

- `User`는 서비스 내부 사용자 본체
- `AuthIdentity`는 로그인 수단 매핑
- 카카오는 회원 본체가 아니라 간편로그인 수단
- 이메일 회원가입과 카카오 로그인을 자동 병합하지 않음
- 이메일 회원은 명시적으로 카카오 계정을 연결할 수 있음
- 회원탈퇴 시 `User`는 tombstone으로 남기고 로그인 수단은 제거
- 같은 카카오 계정 재가입은 기존 tombstone 복구가 아니라 새 사용자 흐름

## 7) 운영 상태

- 로컬/운영 환경 모두 카카오 로그인 흐름 1차 검증 완료
- 이메일 회원가입/인증/로그인/비밀번호 재설정은 개발 단계 `debugCode` 기반 검증 가능
- 서버 시작 시 레거시 `roomKey_1`, `users.kakaoId_1` 인덱스 자동 제거

## 8) 다음 우선순위

1. 실제 친구 계정 2개 기준 채팅/알림/unread E2E 검증
2. 계정 연결/병합 정책 설계
3. 실제 SMTP 또는 메일 서비스 연결 전략 확정
4. 이메일 변경 기능
5. 익명방/비회원 도메인 상세 설계
