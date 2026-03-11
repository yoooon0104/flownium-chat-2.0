# 2026-03-11 - AuthIdentity split 1차

## Summary

- `User`와 카카오 로그인 식별을 분리하기 위해 `AuthIdentity` 모델을 추가했다.
- 카카오 로그인/온보딩 완료 흐름은 이제 `AuthIdentity(provider='kakao')` 기준으로 사용자를 찾는다.
- 기존 legacy `User.kakaoId` 사용자는 첫 카카오 로그인 시 identity로 점진 마이그레이션한다.
- 회원탈퇴 시 tombstone `User`는 유지하고, 로그인 수단은 제거하도록 바꿨다.
- 같은 카카오 계정 재진입 시 tombstone 사용자를 복구하지 않고 새 가입 흐름으로 보내는 구조를 만들었다.

## Files

- `server/models/authidentity.model.cjs`
- `server/models/user.model.cjs`
- `server/services/auth.service.cjs`
- `server/routes/auth.routes.cjs`
- `server/index.cjs`
- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/common/wbs.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Validation Plan

- `node --check server/index.cjs`
- `node --check server/routes/auth.routes.cjs`
- `node --check server/models/authidentity.model.cjs`
- `node --check server/services/auth.service.cjs`
- `npm run build`

## Notes

- 이번 단계는 기본 회원가입 UI 자체가 아니라, 이후 기본 회원가입과 재가입 비복구 정책을 받을 수 있는 인증 모델 정리까지를 목표로 했다.
- 익명방/비회원 기능은 이번 변경 범위에 포함하지 않았다.
