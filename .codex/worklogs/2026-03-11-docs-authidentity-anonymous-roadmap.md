# Docs Roadmap Update: AuthIdentity and Anonymous Room

## Summary

- 다음 실제 개발 과제를 `User / AuthIdentity` 분리와 기본 회원가입 준비로 정리했다.
- 익명방/비회원 이용은 현재 구현 범위에서 제외하고, 별도 확장 계획으로 문서에 남겼다.

## Updated Docs

- `docs/common/wbs.md`
- `docs/common/architecture.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Notes

- 현재 tombstone UX는 유지하되, 재가입 비복구 정책은 다음 단계에서 `AuthIdentity` 분리로 해결하는 방향을 명시했다.
- 익명방은 기존 친구 기반 채팅의 옵션이 아니라, 별도 도메인(`AnonymousRoom`, `AnonymousParticipant`, `GuestSession`)으로 가는 방향을 문서에 남겼다.
- 이번 작업은 계획/분석 문서 업데이트만 포함하며 코드 변경은 없다.
