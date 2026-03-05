# WBS (Work Breakdown Status)

Updated: 2026-03-05

## 1) Done

- [x] Base Express + Socket.IO server
- [x] Kakao OAuth callback + JWT refresh API
- [x] JWT auth for socket handshake
- [x] Message model + message history API
- [x] ChatRoom model (`name`, `isGroup`, `memberIds`, `lastMessage`, `lastMessageAt`)
- [x] `POST /api/chatrooms` (create group room)
- [x] `GET /api/chatrooms` (member room list)
- [x] Auth guard applied to `GET /api/chatrooms/:id/messages`
- [x] Socket `join_room` with membership upsert
- [x] Socket `room_participants` (all members + online/offline)
- [x] `send_message` updates `lastMessage`, `lastMessageAt`
- [x] Frontend room list/create/join wiring
- [x] Frontend participant chips in chat header
- [x] Chat area scroll + fixed composer UX 유지
- [x] Core docs synced to group chat scope

## 2) In Progress

- [ ] Kakao real login E2E validation with two real users
- [ ] Presence behavior verification for multi-tab edge cases

## 3) Next

- [ ] Admin role / invite / kick policy design
- [ ] Leave room event and API (`leave_room`, REST endpoint)
- [ ] Component split (`RoomPanel`, `ChatPanel`, `ParticipantList`)
- [ ] Message pagination cursor support
- [ ] Error code standardization (`error.code`)

## 4) Backlog

- [ ] End-to-end test scripts
- [ ] Deployment checklist hardening
- [ ] Message encryption strategy decision and rollout plan
