# Authentication Flow

1. Client → 카카오 로그인 요청
2. 카카오 → 서버 callback (code 전달)
3. 서버 → 카카오 토큰 교환
4. 사용자 정보 조회
5. User upsert
6. JWT Access Token 발급
7. Client 저장

---

## Socket Authentication

Socket.IO 연결 시

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  JWT 검증
});