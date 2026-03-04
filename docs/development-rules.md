# Development Rules

1. 모든 모델은 timestamps: true 사용
2. 1:1 채팅은 roomKey 기반 중복 방지
3. ChatRoom에는 lastMessage, lastMessageAt 유지
4. Socket 이벤트 이름 변경 금지
5. REST와 Socket 모두 JWT 인증 필수
6. URL 하드코딩 금지
7. TTL은 MongoDB Index 사용
8. Controller / Service 분리 구조 유지
9. 코드 스타일: ES6+, async/await 사용