# Issue #59 Deleted User Tombstone

## Summary

- 회원탈퇴를 hard delete에서 soft-delete(tombstone)로 변경했다.
- direct 방은 유지하고, 남은 상대방에게는 `탈퇴한 회원입니다.` 상태로 표시되도록 했다.
- 친구 목록에서는 탈퇴 회원을 `(탈퇴한 회원)` suffix와 muted row로 표시하고 상호작용을 막았다.

## Changed Areas

- `server/models/user.model.cjs`
- `server/routes/auth.routes.cjs`
- `server/routes/friend.routes.cjs`
- `server/routes/chatroom.routes.cjs`
- `server/index.cjs`
- `src/app/AppShell.jsx`
- `src/features/chat/components/ChatPanel.jsx`
- `src/features/chat/components/RoomPanel.jsx`
- `src/features/chat/components/ParticipantsMenu.jsx`
- `src/features/chat/hooks/useChatSocket.js`
- `src/features/friends/components/FriendActionSheet.jsx`
- `src/domain/user/UserProfile.js`
- 관련 문서: `api-spec`, `socket-events`, `architecture`, `object-spec`, `screen-spec`, `wbs`

## Key Decisions

- 탈퇴한 사용자 문서는 삭제하지 않고 `accountStatus=deleted`, `deletedAt`을 기록한다.
- accepted friendship은 유지해 친구 목록에서 tombstone 행을 보여준다.
- pending/rejected/blocked friendship은 탈퇴 시 정리한다.
- direct 방은 유지하고, group 방에서는 탈퇴 사용자를 `memberIds`에서 제거한다.
- direct 방에서 탈퇴 회원이 남아 있으면 읽기 전용으로만 두고 새 메시지 전송은 막는다.
- 탈퇴 회원 재로그인은 다시 signup flow를 거쳐 활성화한다.

## Validation

- `node --check server/index.cjs`
- `node --check server/routes/auth.routes.cjs`
- `node --check server/routes/friend.routes.cjs`
- `node --check server/routes/chatroom.routes.cjs`
- `npm run build`

## Follow-up

- 실제 두 계정으로 회원탈퇴 후 direct/group/friend list tombstone 흐름 확인 필요
- tombstone 상태에서 재가입했을 때 기존 friendship/direct room을 그대로 이어갈지 UX 확인 필요
