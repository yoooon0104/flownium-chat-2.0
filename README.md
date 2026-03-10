# Flownium Chat 2.0

<p align="left">
  <img src="assets/branding/logo/flownium-wordmark-light.png" alt="Flownium" width="260" />
</p>

Flownium Chat 2.0은 **카카오 로그인 기반의 실시간 친구/그룹 채팅 서비스**입니다.  
처음 보는 사람도 바로 이해할 수 있도록 요약하면,

- 카카오 계정으로 로그인하고
- 친구를 추가하거나 채팅방을 만들고
- 실시간으로 대화를 주고받는 앱입니다.

## Flownium이란?

Flownium은 "대화 흐름(flow)을 끊지 않는 팀 커뮤니케이션"을 목표로 합니다.
현재 버전은 **MVP2-B 1차 구현**까지 반영되어 있으며,
친구 기반 1:1/그룹 채팅, 알림 허브, unread 표시까지 포함합니다.

## 현재 상태

- 로컬/운영 환경 카카오 로그인 1차 검증 완료
- Vercel/Render/Atlas 배포 경로 확정
- MVP2-B 1차 구현 완료
- 실제 친구 계정 기준 E2E 일부만 남아 있음

## 현재 제공 기능 (지금 기준)

- 카카오 OAuth 로그인 + 온보딩 분기
- JWT Access/Refresh 인증
- Friends/Rooms 탭 UI
- 친구 검색/요청/수락/거절/차단
- 친구 기반 1:1 방 재사용 / 그룹방 생성
- 그룹 채팅방 생성/목록/입장
- 실시간 메시지 송수신 (Socket.IO)
- 메시지 히스토리 조회
- 친구 요청/방 초대 알림 허브
- 모바일 알림 전용 화면
- 모바일 하단 탭바
- 참여자 목록 + online/offline 상태 표시
- 방 검색 + FAB(+) 생성 UX
- 방 목록 unread count / 메시지 unread 숫자 표시
- 사용자 메뉴(내 정보/설정/로그아웃)
- 표준 에러 응답(`error.code`, `error.message`)
- 로그인 상태 확인 API(`/auth/me`)
- 운영 배포 기준 카카오 로그인 성공

## 기술 스택

- Frontend: React, Vite
- Backend: Express, Socket.IO
- Database: MongoDB (Mongoose)
- Auth: Kakao OAuth + JWT
- Deploy: Vercel, Render, MongoDB Atlas

## 프로젝트 구조

```txt
flownium-chat-2.0/
  src/
    app/                # AppShell(조립)
    features/           # auth/chat/user 기능 단위
    domain/             # 순수 규칙 객체
    services/           # API/Socket I/O
  server/
    models/
    routes/
    services/
    utils/
  docs/
```

## 환경변수

### 프론트 (`.env`)

```env
VITE_KAKAO_CLIENT_ID=
# Redirect URI는 끝 슬래시 없이 통일 권장
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
# 미설정 시 http://localhost:3010 fallback
VITE_API_BASE_URL=http://localhost:3010
```

### 서버 (`server/.env`)

```env
PORT=3010
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/flownium-chat

JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_SIGNUP_SECRET=dev-signup-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=14d
SIGNUP_TOKEN_EXPIRES_IN=10m

KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=http://localhost:5173
KAKAO_CLIENT_SECRET=
```

주의:
- 현재 구현에서 프론트 `VITE_KAKAO_CLIENT_ID`는 카카오 인가 URL의 `client_id`로 사용되며, 코드 기준 `REST API 키`를 사용한다.
- `VITE_KAKAO_REDIRECT_URI`, `KAKAO_REDIRECT_URI`, 카카오 콘솔 Redirect URI는 동일 문자열이어야 한다.
- 기본 정책은 끝 슬래시 없는 URI로 통일한다.

## 로컬 실행

1. 루트 의존성 설치
```bash
npm install
```

2. 서버 의존성 설치
```bash
cd server
npm install
```

3. 서버 실행
```bash
cd server
npm run dev
```

4. 프론트 실행 (새 터미널)
```bash
npm run dev
```

5. 접속
- 프론트: `http://localhost:5173`
- 서버 헬스체크: `http://localhost:3010/api/health`

## 검증 스크립트

- 에러 표준 검증: `scripts/test-error-code.ps1`
- 인증 상태 검증(`/auth/me`): `scripts/test-auth-me.ps1`
- 배포 전 빠른 통합 검증: `scripts/test-prod-ready.ps1`

## 문서 바로가기

- [문서 인덱스](docs/README.md)
- [프로젝트 개요](docs/common/project-overview.md)
- [아키텍처](docs/common/architecture.md)
- [API 명세](docs/common/api-spec.md)
- [소켓 이벤트](docs/common/socket-events.md)
- [인증 흐름](docs/common/auth-flow.md)
- [UI 계획](docs/common/ui-plan.md)
- [WBS](docs/common/wbs.md)
- [배포 런북](docs/operations/deploy-runbook.md)
- [운영 로그 기준](docs/operations/ops-log-policy.md)
