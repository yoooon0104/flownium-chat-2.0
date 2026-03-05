# Flownium Chat 2.0

Flownium Chat 2.0은 **Kakao OAuth + JWT + Socket.IO** 기반의 실시간 그룹 채팅 프로젝트입니다.  
현재 구현 기준은 그룹방 생성/목록/입장, 실시간 메시지 송수신, 참여자 online/offline 표시, 카카오 온보딩 분기(`SIGNUP_REQUIRED`)입니다.

## 주요 기능

- 그룹방 생성/목록 조회/입장
- 실시간 메시지 송수신 (`send_message`, `receive_message`)
- 메시지 히스토리 조회 (`GET /api/chatrooms/:id/messages`)
- 참여자 목록 표시 (`room_participants`, 전체 멤버 + online/offline)
- 카카오 로그인 + 온보딩 분기
  - 가입 완료 사용자: 즉시 로그인 (`LOGIN_SUCCESS`)
  - 최초 사용자: 가입 의사 + 닉네임 입력 (`SIGNUP_REQUIRED`)
- 우측 상단 점3개 사용자 메뉴
  - 내 정보
  - 설정(닉네임 변경)
  - 로그아웃

## 기술 스택

- 프론트엔드: React, Vite
- 백엔드: Express, Socket.IO, Mongoose
- 데이터베이스: MongoDB
- 인증: JWT (Access/Refresh/Signup)

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
  docs/
```

## 환경변수

### 프론트 (`.env`)

```env
VITE_KAKAO_CLIENT_ID=
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
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

## 테스트 포인트

1. 카카오 로그인
- 기존 사용자: 바로 채팅 UI 진입
- 신규 사용자: 온보딩 화면에서 닉네임/동의 후 진입

2. 사용자 메뉴
- 우측 상단 점3개 메뉴 열림/닫힘
- 내 정보/설정/로그아웃 동작

3. 방 생성/입장
- FAB(+) -> 방 생성 모달 -> 생성 후 자동 입장

4. 메시지/참여자
- Enter keyup 또는 전송 버튼 송신
- 참여자 메뉴 online/offline 반영

## 문서

- [프로젝트 개요](docs/project-overview.md)
- [아키텍처](docs/architecture.md)
- [API 명세](docs/api-spec.md)
- [소켓 이벤트](docs/socket-events.md)
- [데이터베이스 설계](docs/database-design.md)
- [인증 흐름](docs/auth-flow.md)
- [UI 계획](docs/ui-plan.md)
- [WBS](docs/wbs.md)
- [개발 규칙](docs/development-rules.md)
- [환경변수 정책](docs/env-policy.md)
