# 2026-03-11 issue-48-scroll-update

## Context
- issue #48 tracked a chat scroll jump caused by unread/read metadata updates being treated like newly appended messages
- the goal was to keep automatic scroll-to-bottom only for actual new message additions

## Changes
- updated `src/features/chat/hooks/useChatMessages.js`
- changed message mutation tracking so optimistic replacements and existing message updates are marked as `update`
- kept `append` only for real list growth, which prevents the chat view from jumping when metadata updates arrive

## Validation
- ran `npm run build`

## Risks
- realtime multi-tab verification is still recommended if more message update event types are added later

## Next
- use this log if scroll behavior around `message_updated` events needs more follow-up

## Korean Notes

### Context (KR)
- 이슈 #48은 unread/read 메타데이터 갱신이 새 메시지 추가로 오인되면서 채팅 화면이 아래로 튀는 문제를 다뤘습니다.
- 목표는 실제 새 메시지 추가일 때만 자동 하단 스크롤이 동작하도록 제한하는 것이었습니다.

### Changes (KR)
- `src/features/chat/hooks/useChatMessages.js` 를 수정했습니다.
- optimistic 교체와 기존 메시지 갱신은 `update` 로 기록하고, 실제 목록 증가만 `append` 로 기록하게 바꿨습니다.
- 그 결과 메타데이터 업데이트만 들어올 때는 자동 스크롤이 동작하지 않습니다.

### Validation (KR)
- `npm run build` 실행

### Risks (KR)
- 이후 다른 종류의 메시지 업데이트 이벤트가 추가되면 멀티탭 기준으로 한 번 더 확인하는 것이 좋습니다.

### Next (KR)
- `message_updated` 계열 스크롤 동작을 다시 손볼 일이 생기면 이 로그를 기준으로 이어서 보면 됩니다.
