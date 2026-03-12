# 2026-03-12 docs refresh: overview and machine setup

## 목적

- 현재 구현 상태 기준으로 핵심 프로젝트 문서를 최신화한다.
- 깨진 인코딩 문서를 UTF-8 기준으로 복구한다.
- 다른 컴퓨터에서 작업을 이어갈 때 필요한 항목을 문서로 명확히 남긴다.

## 반영 내용

- `README.md`
  - 현재 제공 기능, 상태, 환경 변수, 실행 방법, 문서 링크 갱신
- `docs/README.md`
  - 문서 인덱스와 폴더 역할 재정리
- `docs/common/project-overview.md`
  - 현재 기능/상태/우선순위 최신화
- `docs/common/auth-flow.md`
  - 이메일 회원가입, 이메일 로그인, 비밀번호 재설정, 이메일 변경, 카카오 연결/해제까지 최신 흐름 반영
- `docs/common/architecture.md`
  - 이미 반영된 최신 인증 구조와 데이터 모델 확인
- `docs/common/wbs.md`
  - 완료/진행 중/다음 작업 항목 확인
- `docs/operations/new-machine-setup.md`
  - `.codex` 폴더 복사만으로는 충분하지 않다는 안내와 복원 순서 확인

## 판단 메모

- 인코딩이 깨진 문서는 부분 수정 대신 전체 재작성으로 복구하는 편이 안전했다.
- 다른 PC 이동 관련 질문에는 `.codex`가 도움이 되지만, 저장소/환경변수/gh 인증/Node/MongoDB까지 함께 필요하다는 점을 문서에도 같이 반영했다.

## 검증

- 수정 파일 내용 재확인
- UTF-8 기준으로 한글이 정상적으로 보이는지 확인
