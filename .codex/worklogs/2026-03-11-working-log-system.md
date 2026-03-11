# 2026-03-11 working-log-system

## Context
- the current prompt chain treated worklog updates as a shared project doc update
- the intended behavior is a task-specific working log folder for collaborator handoff

## Changes
- added `.codex/worklogs/` as the default working log location
- updated worklog prompt rules to use one file per task, issue, or branch
- updated `feature.md`, `bugfix.md`, `deliver.md`, and `workflows/issue-to-pr.md` to call `worklog-update.md` in the normal flow
- added `.codex/worklogs/README.md` to define naming and usage rules

## Validation
- prompt files reviewed locally
- no runtime validation required beyond file consistency for this prompt/docs change

## Risks
- `.codex/prompts/README.md` still reflects the older shared-log wording and should be aligned later if that guide is actively used

## Next
- use `.codex/worklogs/` for new task-level logs instead of defaulting to `docs/operations/worklog.md`

## Korean Notes

### Context (KR)
- 기존 프롬프트 체계는 worklog를 프로젝트 공용 문서 업데이트로 해석하고 있었습니다.
- 의도한 방식은 협업 handoff를 위한 작업별 working log 파일 관리입니다.

### Changes (KR)
- `.codex/worklogs/`를 기본 working log 위치로 추가했습니다.
- worklog 프롬프트가 작업, 이슈, 브랜치 단위 파일을 기본으로 사용하도록 바꿨습니다.
- `feature.md`, `bugfix.md`, `deliver.md`, `workflows/issue-to-pr.md`가 `worklog-update.md`를 기본 흐름에서 따라가도록 정리했습니다.
- `.codex/worklogs/README.md`에 파일명 규칙과 사용 규칙을 추가했습니다.

### Validation (KR)
- 프롬프트 파일과 README를 로컬에서 검토했습니다.
- 런타임 검증이 필요한 변경은 아니어서 파일 일관성만 확인했습니다.

### Risks (KR)
- `.codex/prompts/README.md`는 아직 이전 shared log 관점을 일부 담고 있을 수 있어 후속 정리가 필요합니다.

### Next (KR)
- 새 작업부터는 `docs/operations/worklog.md` 대신 `.codex/worklogs/` 아래 작업별 파일을 사용합니다.
