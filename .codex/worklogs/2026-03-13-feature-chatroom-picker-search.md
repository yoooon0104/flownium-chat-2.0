Timestamp
- 2026-03-13

Task ID / Branch
- feat/chatroom-picker-search

Task
- Add local friend search inside chat room create and invite modals.

Context
- The chatroom picker flows already supported selection, but large friend lists made room creation and invite actions slow to use.

Changes
- Added local `searchKeyword` state to `CreateRoomModal` and `InviteFriendsModal`.
- Filtered picker rows by nickname or email without changing backend contracts.
- Added empty search-result messaging for both modals.
- Hardened avatar/name fallbacks in `CreateRoomModal` to avoid empty nickname rendering issues.

Docs
- Updated `docs/planning/screen-spec.md` to note search inputs in the create-room and invite flows.

Validation
- Executed: `npm run build`
- Result: success

Open risks
- Search is local-only, so it only filters the already loaded friend list.
- Realtime behavior was not changed, so no extra socket validation was executed in this task.

Next
- Visually confirm both modals filter by nickname/email and reset the search field when reopened.
