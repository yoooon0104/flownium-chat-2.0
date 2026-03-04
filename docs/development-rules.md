# Development Rules

1. 모든 모델은 `timestamps: true`를 사용한다.
2. 1:1 채팅은 `roomKey` 기반 중복 방지 규칙을 유지한다.
3. `ChatRoom`에는 `lastMessage`, `lastMessageAt`를 유지한다.
4. Socket 이벤트 이름 변경은 문서 업데이트와 함께 진행한다.
5. REST와 Socket 모두 JWT 인증을 필수로 한다.
6. URL 하드코딩을 금지하고 환경변수를 사용한다.
7. TTL은 MongoDB Index로 처리한다.
8. Controller / Service 분리 구조를 유지한다.
9. 코드 스타일은 ES6+, `async/await`를 사용한다.
10. 기능 변경이 발생하면 관련 `docs/*.md`를 같은 작업에서 함께 업데이트한다.
11. 대화 중 사용자 지침(작업 규칙)이 추가되면 `docs/development-rules.md`에 즉시 반영한다.