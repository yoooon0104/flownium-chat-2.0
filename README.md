# Flownium Chat 2.0

카카오 로그인 기반 1:1 채팅을 목표로 하는 실시간 채팅 프로젝트입니다.  
현재는 Socket.IO 기반 실시간 메시지, 메시지 저장/히스토리 조회, JWT handshake 인증, 카카오톡형 UI 1차 레이아웃까지 구현되어 있습니다.

## Tech Stack

- Frontend: React + Vite
- Backend: Express + Socket.IO + Mongoose
- Database: MongoDB Atlas (또는 로컬 MongoDB)
- Auth: JWT (Socket handshake 검증 적용)

## Project Structure

```txt
flownium-chat-2.0/
  src/                 # 프론트엔드
  server/              # 백엔드
    models/            # Mongoose 모델
  docs/                # 아키텍처/명세/WBS 문서
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB (선택, 미설정 시 실시간 기능만 동작)

## Environment Variables

`server/.env` 예시:

```env
PORT=3010
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev-secret
MONGODB_URI=mongodb://127.0.0.1:27017/flownium-chat
```

- `JWT_SECRET` 없으면 Socket 연결 시 `server auth misconfigured`가 발생합니다.
- `MONGODB_URI`가 없으면 서버는 기동되지만 히스토리 API는 `503`을 반환합니다.

## Run (Local)

1. 프론트 의존성 설치
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

## Current Features

- `GET /api/health`
- Socket events
  - `join_room`
  - `send_message`
  - `receive_message`
  - `room_joined`
  - `error`
- Socket JWT handshake 인증 (`auth.token` 또는 Bearer)
- 메시지 저장 (`Message` 모델)
- 메시지 히스토리 조회 (`GET /api/chatrooms/:id/messages?limit=50`)
- 카카오톡형 2단 레이아웃 UI (1차)
- Enter key up 메시지 전송

## Docs

- Architecture: `docs/architecture.md`
- API Spec: `docs/api-spec.md`
- Socket Events: `docs/socket-events.md`
- Database Design: `docs/database-design.md`
- UI Plan: `docs/ui-plan.md`
- WBS: `docs/wbs.md`
- Development Rules: `docs/development-rules.md`

## Next Milestones

- 카카오 OAuth callback + JWT 발급/재발급 API
- `User` / `ChatRoom` 모델 및 API
- 방 목록 API 연동
- CSS 2차 정리
