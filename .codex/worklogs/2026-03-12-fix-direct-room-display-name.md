# 2026-03-12 - Direct room display name

## Summary

- Fixed direct room naming so each user sees the counterpart nickname instead of a creator-side stored absolute room name.
- Applied the same rule to both REST room responses and socket room payloads.

## Files

- `server/routes/chatroom.routes.cjs`
- `server/index.cjs`
- `docs/common/api-spec.md`

## Validation

- `node --check server/routes/chatroom.routes.cjs`
- `node --check server/index.cjs`

## Notes

- Group room names still use the stored room name.
- Direct room names are now derived at response time from the current user and the other member.
