# Flownium Chat 2.0

Flownium Chat 2.0은 **Kakao OAuth + JWT + Socket.IO** 기반의 실시간 그룹 채팅 프로젝트입니다.  
현재 구현 기준은 그룹방 생성/목록/입장, 실시간 메시지 송수신, 참여자 online/offline 표시, 카카오톡 스타일 UI(방 검색 + FAB 생성)입니다.

## 주요 기능

- 그룹방 생성/목록 조회/입장
- 실시간 메시지 송수신 (`send_message`, `receive_message`)
- 메시지 히스토리 조회 (`GET /api/chatrooms/:id/messages`)
- 참여자 목록 표시 (`room_participants`, 전체 멤버 + online/offline)
- Socket handshake JWT 인증 (`auth.token`)
- 방 목록 검색(이름/최근 메시지)
- 우측 하단 FAB(+) + 모달 기반 방 생성 UX

## 기술 스택

- 프론트엔드: React, Vite
- 백엔드: Express, Socket.IO, Mongoose
- 데이터베이스: MongoDB
- 인증: JWT (Access/Refresh)

## 프로젝트 구조

```txt
flownium-chat-2.0/
  src/                 # 프론트엔드
  server/              # 백엔드
    models/            # Mongoose 모델
    routes/            # Express 라우트
    services/          # 인증/외부 API 서비스
  docs/                # 아키텍처/명세/WBS 문서
```

## 사전 요구사항

- Node.js 20+
- npm
- MongoDB (로컬 또는 Atlas)

## 환경변수

### 서버 (`server/.env`)

```env
PORT=3010
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/flownium-chat
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=14d
KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=
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

1. 방 목록 검색
- 좌측 검색 입력에 키워드를 입력해 방 이름/최근 메시지 필터 확인

2. 방 생성
- 좌측 하단 `+` 버튼 -> 모달에서 이름 입력 -> 생성
- 생성 성공 시 목록 갱신 + 자동 입장 확인

3. 참여자 메뉴
- 채팅 헤더 우측 `참여자 (N)` 버튼 클릭 시 드롭다운 표시
- online/offline 상태 표시 확인

4. 메시지 송수신
- Enter keyup 또는 전송 버튼으로 메시지 전송
- 자동 스크롤/실시간 수신 확인

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
