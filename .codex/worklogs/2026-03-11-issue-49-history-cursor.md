# 2026-03-11 issue-49-history-cursor

## Context
- issue #49 tracked a pagination gap where messages sharing the same timestamp as the page boundary could be skipped forever
- the fix had to stay narrow and avoid changing unrelated chat UI behavior

## Changes
- updated `server/routes/chatroom.routes.cjs` to use a `timestamp|messageId` cursor format
- changed history pagination queries to use a timestamp + `_id` tie-breaker
- fixed sort order to `timestamp desc, _id desc` for stable pagination
- updated `docs/common/api-spec.md` to reflect the new cursor contract
- marked the pagination backlog item complete in `docs/common/wbs.md`
- recorded the implemented fix in `docs/operations/worklog.md`

## Validation
- ran `npm run build`
- ran `node --check server/routes/chatroom.routes.cjs`

## Risks
- no local deterministic fixture was used to simulate many same-millisecond messages
- if cursor format changes again later, API docs and clients must be updated together

## Next
- use this log for any future work on chat history pagination, cursor evolution, or history API compatibility

## Korean Notes

### Context (KR)
- 이슈 #49는 페이지 경계와 동일한 timestamp를 가진 메시지가 과거 조회에서 누락될 수 있는 문제를 다뤘습니다.
- 다른 채팅 UI 동작은 건드리지 않고 커서 안정성만 최소 범위로 고치는 것이 목표였습니다.

### Changes (KR)
- `server/routes/chatroom.routes.cjs` 에서 커서를 `timestamp|messageId` 형식으로 변경했습니다.
- 과거 조회 조건을 timestamp + `_id` tie-breaker 기준으로 바꿨습니다.
- 정렬을 `timestamp desc, _id desc` 로 고정했습니다.
- `docs/common/api-spec.md` 에 새 커서 형식을 반영했습니다.
- `docs/common/wbs.md` 의 커서 페이지네이션 항목을 완료로 표시했습니다.
- 구현 내역을 `docs/operations/worklog.md` 에도 기록했습니다.

### Validation (KR)
- `npm run build` 실행
- `node --check server/routes/chatroom.routes.cjs` 실행

### Risks (KR)
- 동일 millisecond 메시지를 강제로 많이 만드는 로컬 fixture 검증은 아직 하지 않았습니다.
- 이후 커서 형식이 다시 바뀌면 API 문서와 클라이언트를 같이 맞춰야 합니다.

### Next (KR)
- 앞으로 채팅 히스토리 API나 커서 구조를 손볼 때 이 로그를 기준으로 이어서 보면 됩니다.
