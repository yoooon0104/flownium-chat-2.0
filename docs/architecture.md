# 아키텍처

## 시스템 구조

클라이언트(React + Vite)
-> LoginGate + 채팅 UI(App)
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

## 인증/채팅 흐름

1. 로그인 게이트에서 카카오 인가 URL로 이동
2. 콜백 `code`를 프론트가 직접 읽어 `/auth/kakao/callback` 호출
3. access/refresh 토큰 저장 후 채팅 UI 진입
4. REST는 `fetchWithAuth`를 통해 401 발생 시 refresh 후 1회 재시도
5. Socket은 `auth.token`으로 연결, unauthorized 시 refresh 후 재연결
6. 실패 시 세션 정리 후 로그인 게이트로 복귀

## 그룹 채팅 흐름

1. 클라이언트가 REST로 방 목록 조회
2. 사용자가 방 선택 시 `join_room` 전송
3. 서버는 멤버십 확인/보정 후 room 입장
4. 서버는 `room_participants`를 전송
5. 메시지 전송 시 DB 저장 + room 요약 갱신 + 브로드캐스트

## 현재 제약

- 관리자/초대/강퇴 정책은 다음 단계
- 멤버십은 `join_room` 시 자동 추가
- presence는 메모리 기반이므로 서버 재시작 시 초기화
