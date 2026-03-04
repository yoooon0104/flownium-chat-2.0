# Architecture

## System Structure

Client (React + Vite)
    ↓
Socket.IO Client
    ↓
Express + Socket.IO Server
    ↓
MongoDB (Atlas)

---

## Communication Policy

### REST API
- 채팅방 목록 조회
- 채팅방 생성
- 메시지 히스토리 조회
- 사용자 인증 처리

### WebSocket (Socket.IO)
- 실시간 메시지 송수신
- join_room
- send_message
- receive_message

---

## Authentication Flow

1. 카카오 로그인 → 서버 callback 처리
2. JWT Access Token 발급
3. REST 요청 시 Authorization Header 사용
4. Socket 연결 시 handshake에서 JWT 검증

---

## Deployment Structure

Frontend: Vercel  
Backend: Render or Railway  
Database: MongoDB Atlas  

모든 URL은 환경변수 기반으로 관리한다.
하드코딩을 금지한다.