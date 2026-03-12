# 2026-03-12 Review Fix - Friend Action Sheet Email Fallback

## Target Finding

- Mobile friend action sheet still rendered `이메일 미등록`, which treats a missing email as a normal state even though current signup policy requires email.

## Root Cause

- The fallback copy in `FriendActionSheet` was not updated when settings screens were changed to treat missing email as an abnormal state.

## Fix

- Replaced the fallback label with `이메일 정보를 불러오지 못했습니다.` for non-deleted friends.

## Validation

- `npm run build`
