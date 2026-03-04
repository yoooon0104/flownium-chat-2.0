# Flownium Chat

## Project Goal

Flownium Chat은 카카오 OAuth2 기반 인증을 지원하는
1:1 실시간 채팅 플랫폼입니다.

Socket.IO 기반 WebSocket 통신과 MongoDB를 활용하여
로그인 기반 채팅과 선택적 익명/시간제한 채팅 기능을 제공합니다.

---

## MVP Scope

다음 기능이 완료되면 MVP 완료로 간주합니다.

- 카카오 로그인 (OAuth2)
- JWT 기반 인증
- 1:1 채팅방 생성
- 채팅방 중복 방지 (roomKey 기반)
- 메시지 DB 저장 + 실시간 송수신
- 채팅방 목록 조회
- 마지막 메시지 표시
- 배포 완료 (Vercel + Render/Railway)

---

## Chat Room Types

### 1. Normal Room (MVP)
- 로그인 사용자만 참여
- 메시지 영구 저장
- 대화 이력 유지

### 2. Anonymous Room (Optional)
- 로그인 없이 참여 가능
- 자동 닉네임 생성
- senderId는 null 허용
- senderNickname 필드 사용

### 3. Timed Room (Optional)
- expiresAt 필드 사용
- MongoDB TTL Index 기반 자동 삭제