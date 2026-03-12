# Flownium Chat 2.0

<p align="left">
  <img src="assets/branding/logo/flownium-logo_wordmark-on-dark.png" alt="Flownium" width="260" />
</p>

Flownium Chat 2.0는 친구 기반 1:1/그룹 채팅을 중심으로, 이메일 로그인과 카카오 간편로그인을 함께 지원하는 실시간 채팅 서비스입니다.

현재 기준 주요 기능:
- 친구 검색/요청/수락/거절/차단
- 친구 기반 1:1 채팅방 재사용, 그룹 채팅방 생성
- 실시간 메시지 송수신, unread 표시, 이전 메시지 커서 로드
- 알림 허브(데스크톱 드롭다운 / 모바일 전용 화면)
- 이메일 회원가입, 이메일 로그인, 비밀번호 재설정
- 카카오 간편로그인, 카카오 계정 연결/해제
- 내 정보 / 설정 분리 구조
- 회원탈퇴 tombstone 처리

## 현재 상태

- MVP2-B 1차 구현 완료
- 이메일 인증/비밀번호 재설정/카카오 연결 흐름 1차 구현 완료
- 브랜딩/아이콘/로그인 화면 1차 반영 완료
- 실제 다계정 E2E 검증은 추가 진행 필요

## 기술 스택

- Frontend: React, Vite, Tailwind CSS
- Backend: Express, Socket.IO
- Database: MongoDB (Mongoose)
- Auth: JWT + Kakao OAuth + Email AuthIdentity
- Deploy: Vercel, Render, MongoDB Atlas

## 프로젝트 구조

```txt
flownium-chat-2.0/
  src/
    app/                # AppShell 조립
    features/           # auth/chat/friends/user 등 기능 단위
    domain/             # 사용자/세션 정규화 규칙
    services/           # REST / Socket I/O
  server/
    models/
    routes/
    services/
    utils/
  docs/
```

## 환경 변수

### 프론트 (`.env`)

```env
VITE_KAKAO_CLIENT_ID=
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
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
- `VITE_KAKAO_REDIRECT_URI`, `KAKAO_REDIRECT_URI`, 카카오 콘솔 Redirect URI는 완전히 같은 문자열이어야 합니다.
- 기본 정책은 끝 슬래시 없는 URI를 사용합니다.

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

4. 프론트 실행

```bash
npm run dev
```

5. 접속
- 프론트: `http://localhost:5173`
- 서버 헬스체크: `http://localhost:3010/api/health`

## 기본 검증

- 프론트: `npm run build`
- 서버 라우트/모델: `node --check <file>`

## 문서 바로가기

- [문서 인덱스](docs/README.md)
- [프로젝트 개요](docs/common/project-overview.md)
- [아키텍처](docs/common/architecture.md)
- [인증 흐름](docs/common/auth-flow.md)
- [API 명세](docs/common/api-spec.md)
- [소켓 이벤트](docs/common/socket-events.md)
- [화면 정의](docs/planning/screen-spec.md)
- [오브젝트 정의](docs/planning/object-spec.md)
- [WBS](docs/common/wbs.md)
- [배포 런북](docs/operations/deploy-runbook.md)
- [개발 규칙](docs/development-rules.md)
- [기여 가이드](CONTRIBUTING.md)
