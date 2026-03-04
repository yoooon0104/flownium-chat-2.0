# Architecture

## System Structure

Client (React + Vite)
  -> Socket.IO Client
  -> Express + Socket.IO Server
  -> MongoDB (Atlas)

## Communication Policy

### REST API
- 채팅방 목록 조회
- 채팅방 생성
- 메시지 히스토리 조회
- 사용자 인증 처리
- 헬스체크: `GET /api/health` -> `{ "ok": true }`

### WebSocket (Socket.IO)
- 실시간 메시지 송수신
- `join_room`
- `send_message`
- `receive_message`
- `room_joined`
- `error`

## Authentication Flow

1. 카카오 로그인 -> 서버 callback 처리
2. JWT Access Token 발급
3. REST 요청 시 Authorization Header 사용
4. Socket 연결 시 handshake에서 JWT 검증 (구현 완료)

## Deployment Structure

- Frontend: Vercel
- Backend: Render or Railway
- Database: MongoDB Atlas

모든 URL은 환경변수 기반으로 관리한다.
하드코딩을 금지한다.

## Current Local Stage (2026-03-04)

- 소켓 기본 연결 테스트 완료
- `join_room`, `send_message`, `receive_message` 최소 이벤트 구현 완료
- 메시지 DB 저장 및 히스토리 조회 API 구현 완료
- Socket handshake JWT 인증 적용 완료
- 카카오톡형 2단 레이아웃 UI 1차 적용 완료
- DB 미설정 환경에서도 서버 기동 가능 (로컬 스모크 테스트용)