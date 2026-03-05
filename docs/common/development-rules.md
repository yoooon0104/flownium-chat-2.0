# 개발 규칙

## 공통 개발 규칙

1. 모든 MongoDB 모델은 `timestamps: true`를 사용한다.
2. 현재 MVP는 그룹채팅 기준이며, 1:1 `roomKey` 중복 방지 규칙은 이번 단계에서 사용하지 않는다.
3. `ChatRoom`은 메시지 저장 시 `lastMessage`, `lastMessageAt`를 함께 갱신한다.
4. REST/Socket 스펙이 바뀌면 관련 `docs/*.md`를 같은 작업에서 동기화한다.
5. REST와 Socket 모두 JWT 인증을 적용한다.
6. URL 하드코딩을 피하고 환경변수를 사용한다.
7. online 상태는 소켓 메모리 presence 맵 기준으로 계산한다.
8. 큰 기능 방향이 바뀌면 `docs/common/wbs.md`와 설계 문서를 함께 갱신한다.
9. 비동기 로직은 `async/await`를 기본으로 사용한다.
10. 중/대규모 작업은 변경안을 먼저 공유하고 리뷰 후 구현한다.
11. 코드 주석은 한글로 작성하고, 핵심 비즈니스 로직에는 의도/입출력 기준 설명을 남긴다.
12. 레거시 DB 인덱스/스키마 이슈가 있으면 서버 시작 시점 보정 로직 또는 마이그레이션 계획을 문서화한다.

## 배포/검증 규칙

1. 배포 전 `npm run lint`, `npm run build`를 반드시 통과시킨다.
2. 서버 변경 시 `node --check server/index.cjs`로 문법 검증을 수행한다.
3. API/Socket 스펙 변경이 있으면 `docs/common/api-spec.md`, `docs/common/socket-events.md`를 같은 작업에서 갱신한다.
4. 인증/환경변수 변경이 있으면 `.env` 키 목록과 `docs/common/architecture.md`를 함께 점검한다.
5. 운영 장애 대응을 위해 클라이언트 노출 메시지와 서버 내부 로그를 구분한다.
6. 문서 업데이트 중 코드 이슈(빌드 실패 등)를 발견하면 문서 PR과 별도로 이슈를 분리해 추적한다.
## 운영 문서 연계 규칙

1. 배포 관련 변경은 docs/operations/deploy-runbook.md 체크리스트를 기준으로 검증한다.
2. 장애/운영 이슈 기준은 docs/operations/ops-log-policy.md를 따른다.
3. 장애 발생 후에는 원인/조치/재발방지를 문서로 남기고 WBS를 동기화한다.
