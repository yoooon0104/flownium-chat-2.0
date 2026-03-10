# 프롬프트 사용 가이드

이 디렉터리는 Flownium Chat 작업을 더 안정적이고 일관되게 진행하기 위한 작업별 프롬프트와 워크플로우를 담고 있습니다.

각 프롬프트는 작업 범위를 좁히고, 위험한 동작을 줄이고, 출력 형식을 일정하게 맞추기 위한 용도입니다.

## 1. 기본 원칙

프롬프트 파일 안에 `Permission Scope`가 있으면, 해당 작업에서는 그 권한 범위를 우선 적용합니다.

즉, 프롬프트별 권한은 아래 저장소 공통 규칙 위에 얹히는 더 좁고 구체적인 작업 제한입니다.

- `AGENTS.md`
- `docs/development-rules.md`
- `CONTRIBUTING.md`

어떤 동작이 명시적으로 허용되어 있지 않으면, 기본적으로 금지된 것으로 간주합니다.

## 2. 기본적으로 위험한 작업

명시적으로 허용되지 않았다면 아래 작업은 위험 작업으로 봅니다.

- 코드 수정
- 문서 수정
- 커밋
- push
- PR 생성
- GitHub Issue 생성
- merge 또는 브랜치 통합 작업

## 3. 단일 작업용 프롬프트

### `analyze.md`

다음 상황에서 사용합니다.

- 요청이 아직 모호할 때
- 구현 전에 빠진 질문, 가드레일, acceptance criteria를 먼저 정리해야 할 때
- 바로 코드 수정에 들어가면 위험할 때

### `review.md`

다음 상황에서 사용합니다.

- 코드 수정 없이 리뷰 finding만 보고 싶을 때
- 버그, 리스크, 회귀 가능성, 검증 누락을 찾고 싶을 때

### `bugfix.md`

다음 상황에서 사용합니다.

- 재현 가능한 버그가 이미 어느 정도 구체적일 때
- 최소 수정으로 해결하고 검증까지 끝내고 싶을 때

### `feature.md`

다음 상황에서 사용합니다.

- 구현해야 할 기능이 비교적 명확할 때
- 과도한 탐색보다 바로 구현과 검증까지 이어가고 싶을 때

### `issue.md`

다음 상황에서 사용합니다.

- 결과물이 이슈 초안이어야 할 때
- 리뷰 결과나 분석 결과를 작업 가능한 backlog 항목으로 바꾸고 싶을 때

### `validate.md`

다음 상황에서 사용합니다.

- 핵심 질문이 “무엇을 어떻게 검증할지”일 때
- 구현은 이미 끝났고 검증 범위와 결과 정리가 필요할 때
- 실제 실행한 검증과 남은 리스크를 분리해서 보고하고 싶을 때

### `docs-sync.md`

다음 상황에서 사용합니다.

- API, socket, 화면, 아키텍처, 객체 의미가 바뀌었을 수 있을 때
- 문서 최신화가 필요한지 빠르게 판단하고 싶을 때
- 영향 있는 문서만 골라서 동기화하고 싶을 때

### `realtime-verify.md`

다음 상황에서 사용합니다.

- unread, notification, presence, room sync 같은 실시간 동작이 바뀌었을 때
- build만으로는 충분하지 않고 멀티탭 / 2계정 검증이 중요할 때

### `release-check.md`

다음 상황에서 사용합니다.

- 현재 변경분이 배포 가능한 상태인지 점검하고 싶을 때
- 환경변수, redirect URI, 배포 가정, 검증 누락 같은 릴리즈 관점이 중요할 때

### `deliver.md`

다음 상황에서 사용합니다.

- 작업 완료 후 최종 보고를 일정한 형식으로 정리하고 싶을 때
- commit / push / PR 전후로 결과를 깔끔하게 남기고 싶을 때

### `worklog-update.md`

다음 상황에서 사용합니다.

- 협업을 위해 작업 이력을 짧게 남기고 싶을 때
- 다른 사람이 같은 브랜치를 이어받을 가능성이 있을 때
- 변경 이유, 검증 상태, 다음 액션을 남겨두고 싶을 때

## 4. 워크플로우 프롬프트

### `workflows/analyze-to-feature.md`

다음 상황에서 사용합니다.

- 기능 요청이 덜 정리된 상태에서
- 분석부터 구현까지 한 번에 이어서 진행하고 싶을 때

### `workflows/issue-to-pr.md`

다음 상황에서 사용합니다.

- 구체적인 이슈를 받아서
- 구현, 검증, PR 준비까지 한 흐름으로 진행하고 싶을 때

### `workflows/review-to-fix.md`

다음 상황에서 사용합니다.

- 리뷰 finding을 바로 최소 수정으로 해결하고 싶을 때

### `workflows/review-to-issue.md`

다음 상황에서 사용합니다.

- 리뷰 finding을 이슈 후보나 이슈 초안으로 바꾸고 싶을 때

### `workflows/review-to-validate.md`

다음 상황에서 사용합니다.

- 리뷰 finding을 바로 고치기 전에
- 실제로 재현되는지, 우선순위가 높은지 먼저 확인하고 싶을 때

### `workflows/feature-to-docs-to-pr.md`

다음 상황에서 사용합니다.

- 기능 구현과 문서 반영이 같이 필요한 작업일 때
- 검증과 PR용 정리까지 한 번에 묶고 싶을 때

## 5. 추천 사용 순서

### 애매한 기능 요청

1. `analyze.md`
2. `feature.md`
3. 계약, 화면, 아키텍처 영향이 있으면 `docs-sync.md`
4. `validate.md`
5. `deliver.md`
6. 협업 기록이 필요하면 `worklog-update.md`

### 구체적인 버그 수정

1. `bugfix.md`
2. `validate.md`
3. `deliver.md`
4. 인수인계 가능성이 있으면 `worklog-update.md`

### 리뷰 finding 처리

1. `review.md`
2. `workflows/review-to-validate.md`
3. 결과에 따라 `workflows/review-to-fix.md` 또는 `workflows/review-to-issue.md`

### 문서 영향이 있는 기능 작업

1. `feature.md`
2. `docs-sync.md`
3. `validate.md`
4. `deliver.md`
5. `worklog-update.md`

### 배포 직전 점검

1. `validate.md`
2. `docs-sync.md`
3. `release-check.md`
4. `deliver.md`
5. 결과를 남겨야 하면 `worklog-update.md`

## 6. 자동화 친화적인 요청 형식

가능하면 아래 형식으로 요청하면 자동화 품질이 좋아집니다.

```text
Task Type:
- feature | bugfix | review | issue-draft | validation | docs-sync | realtime-verify | release-check | delivery | worklog

Goal:
- 무엇을 달성해야 하는지

Success Criteria:
- 무엇이 만족되면 완료인지

Non-Goals:
- 무엇은 건드리면 안 되는지

Relevant Context:
- 이슈, 리뷰 finding, 버그 제보, 기능 메모 등

Touched Areas:
- frontend / backend / docs / realtime / deploy

Required Validation:
- 반드시 필요한 검증

Optional Validation:
- 여유가 있거나 추가 확신이 필요할 때 할 검증

Delivery Mode:
- local summary | commit-ready | PR-ready | draft only
```

## 7. Worklog 운영 원칙

다음 중 하나에 해당하면 worklog를 남기는 것을 권장합니다.

- 코드가 바뀌었을 때
- 문서가 바뀌었을 때
- 검증 상태가 바뀌었을 때
- 배포 가능 여부 판단이 바뀌었을 때
- blocker나 handoff 메모가 필요할 때

좋은 worklog entry는 아래 기준을 따릅니다.

- 짧아야 함
- 실제 작업만 기록해야 함
- 실행한 검증과 후속 검증을 구분해야 함
- 막힌 경우 blocker와 다음 액션이 분명해야 함

기본 worklog 대상 파일:

- `docs/operations/worklog.md`

## 8. 공통 템플릿

새 프롬프트를 만들거나 기존 프롬프트를 정리할 때는 아래 템플릿 파일을 참고합니다.

- `templates/standard-automation-template.md`

이 템플릿에는 작업 입력 형식, 권한 블록, 검증 매핑, 문서 동기화 매핑, 최종 보고 형식, worklog 형식이 함께 정리되어 있습니다.

## 9. 후속 프롬프트 연결 원칙

현재 프롬프트 체계는 각 프롬프트 안에 `Follow-up` 섹션을 둘 수 있도록 정리되어 있습니다.

이 섹션은 “이 프롬프트 다음에 무엇을 이어서 쓰면 좋은지”를 안내하기 위한 정책입니다.

후속 연결은 아래 3단계로 나눕니다.

- `Required`
  - 거의 반드시 이어져야 하는 후속 작업
- `Conditional`
  - 특정 조건을 만족할 때만 이어져야 하는 후속 작업
- `Optional`
  - 협업, handoff, 릴리즈 준비, 최종 보고를 위해 선택적으로 이어지는 작업

예시:

- `feature.md`
  - Required: `validate.md`
  - Conditional: `docs-sync.md`, `realtime-verify.md`
  - Optional: `deliver.md`, `worklog-update.md`

- `bugfix.md`
  - Required: `validate.md`
  - Conditional: `docs-sync.md`, `realtime-verify.md`
  - Optional: `deliver.md`, `worklog-update.md`

- `review.md`
  - Conditional: `workflows/review-to-validate.md`, `workflows/review-to-fix.md`, `workflows/review-to-issue.md`

운영 원칙:

- 모든 후속 프롬프트를 무조건 강제하지는 않습니다.
- 작은 작업까지 과도하게 무거워지지 않도록 조건부 후속 연결을 우선합니다.
- 검증, 문서 최신화, worklog처럼 자주 빠지는 후속 작업을 구조적으로 챙기기 위한 목적입니다.
