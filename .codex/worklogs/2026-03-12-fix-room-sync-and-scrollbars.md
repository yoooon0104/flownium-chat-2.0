# 2026-03-12 - Fix room sync and scrollbar styling

## Summary

- fixed room list realtime sync so incoming messages also trigger `room_updated`
- aligned scrollbar styling with the current Flownium UI using global theme-aware tokens

## Changed Files

- `server/index.cjs`
- `src/index.css`
- `docs/common/socket-events.md`

## Validation

- `node --check server/index.cjs`
- `npm run build`

## Notes

- current room messages still append immediately through `receive_message`
- room list refresh now follows `room_updated` for both active and inactive rooms
