# Planning

다음 단계 작업 초안과 구현 기준 정의서를 관리합니다.

## 현재 문서

- `requirements.md`
  - MVP2 범위와 우선순위
  - 친구 기반 채팅, 알림, 익명 채팅 초안 포함
- `screen-spec.md`
  - 현재 UI 구조 기준 화면 정의
  - Friends/Rooms, 알림 허브, 모바일 탭바 반영
- `object-spec.md`
  - 실제 도메인 오브젝트 기준 정의
  - Friendship, Notification, ChatReadState 반영

## 운영 원칙

- planning 문서는 “예정”만 적는 문서가 아니라, 현재 구현 상태와 다음 확장 방향을 같이 관리한다.
- 공통 문서와 충돌하지 않도록 화면/오브젝트/요구사항 변경 시 함께 갱신한다.
- 큰 기능 머지 후에는 최소한 `requirements.md`, `screen-spec.md`, `object-spec.md`를 한 번 같이 확인한다.
