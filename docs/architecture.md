# 아키텍처

## 시스템 구조

클라이언트(React + Vite)
-> Socket.IO Client + REST 요청
-> Express + Socket.IO 서버
-> MongoDB

## 통신 분리

### REST API
- `GET /api/health`
- `POST /api/chatrooms`
- `GET /api/chatrooms`
- `GET /api/chatrooms/:id/messages`
- `GET /auth/kakao/callback`
- `POST /auth/refresh`

### WebSocket
- `join_room`
- `room_joined`
- `room_participants`
- `send_message`
- `receive_message`
- `error`

## 그룹 채팅 흐름

1. 사용자가 인증 후 access token을 획득한다.
2. 클라이언트가 REST로 방 목록을 조회한다.
3. 사용자가 방을 선택하면 `join_room`을 보낸다.
4. 서버는 멤버십을 확인/보정 후 소켓 room에 입장시킨다.
5. 서버는 DB 멤버 + presence 맵 기준으로 `room_participants`를 전송한다.
6. 사용자가 `send_message`를 전송하면 서버가 DB 저장 후 브로드캐스트한다.
7. 서버는 방 요약(`lastMessage`, `lastMessageAt`)을 함께 갱신한다.

## 현재 제약

- 관리자/초대/강퇴 정책은 이번 단계 범위 밖
- 멤버십은 `join_room` 시 자동 추가
- presence는 메모리 기반이라 서버 재시작 시 초기화
