# Development Rules

1. All MongoDB models must use `timestamps: true`.
2. Current MVP is group chat; do not use 1:1 `roomKey` dedup logic in this phase.
3. `ChatRoom` must keep `lastMessage` and `lastMessageAt` updated after message save.
4. Keep REST and Socket event specs in docs synchronized with code changes.
5. JWT auth is required for both REST and Socket communication.
6. Avoid hardcoded URLs; use environment variables.
7. Online participants are computed from socket in-memory presence map.
8. When major feature direction changes, update `docs/wbs.md` and related design docs in the same task.
9. Use ES6+ and `async/await`.
10. Before large implementation, share the change proposal and get review.
