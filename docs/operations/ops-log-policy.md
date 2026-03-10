# Ops Log Policy (운영 로그/장애 기준)

업데이트: 2026-03-10

## 1) 목적

운영 환경에서 로그 레벨, 장애 판정 기준, 기록 항목을 통일해 대응 시간을 줄이고 재발을 방지한다.

## 2) 로그 레벨 기준

1. `info`
- 정상 흐름/상태 변경
- 예: 서버 시작, DB 연결 성공, 배포 완료

2. `warn`
- 즉시 장애는 아니지만 주의 필요한 상태
- 예: 재시도 발생, 외부 API 일시 실패, fallback 동작

3. `error`
- 요청 실패/기능 중단/사용자 영향
- 예: 인증 실패 반복, DB 연결 실패, 소켓 이벤트 처리 실패

## 3) 공통 로그 필드

가능하면 아래 필드를 포함한다.
- `timestamp` (ISO-8601)
- `level` (`info|warn|error`)
- `scope` (예: `auth`, `chatroom`, `socket`)
- `event` (예: `refresh_failed`, `join_room_failed`)
- `message`
- `requestId` 또는 `traceId` (있으면 포함)
- `userId` (가능한 경우)
- `error.code` (표준 코드)
- `status` (외부 API/HTTP 상태가 있으면 포함)
- `details` (예: `redirectUri`)

## 4) 장애 판정 기준

아래 중 하나라도 충족하면 `Incident`로 기록한다.

1. 인증 실패 급증
- `UNAUTHORIZED`/`INVALID_REFRESH_TOKEN` 오류가 짧은 시간 내 반복
- 카카오 로그인 `KOE006`, `KOE320` 등 인증 관련 외부 오류 반복

2. 핵심 기능 중단
- 로그인 불가
- 방 생성/입장 불가
- 메시지 송수신 불가

3. 인프라 오류
- DB 연결 불가
- 서버 프로세스 반복 다운
- 배포 실패로 서비스 영향 발생

## 5) 대응 프로세스

1. 탐지
- 콘솔/모니터링/사용자 제보로 이상 감지

2. 분류
- `P1` 치명: 핵심 기능 중단
- `P2` 높음: 일부 기능 장애
- `P3` 보통: 우회 가능 문제

3. 조치
- 즉시 완화(롤백/재시작/기능 우회)
- 근본 원인 분석
- 재발 방지 항목 도출

4. 기록
- 원인/영향/조치/재발방지 항목을 문서화

## 6) 운영 이슈 예시

1. 카카오 로그인 실패
- 확인 로그: `status`, `body`, `details.redirectUri`
- 대표 원인: Redirect URI 불일치, 인가 코드 재사용, 환경변수 미반영

2. OAuth 설정 불일치
- 확인 로그: `error.code`, `status`, `message`
- 대표 원인: Vercel/Render env 불일치, 카카오 콘솔 설정 누락

3. 실시간 동기화 누락
- 확인 로그: `scope=socket`, `event=receive_message|notification_created|friendship_updated`
- 대표 원인: 프론트 소켓 리스너 누락, 현재 방/다른 방 분기 오류, 재조회 트리거 누락

## 7) Incident 기록 템플릿

```md
### Incident: <제목>
- 발생 시각:
- 감지 경로:
- 영향 범위:
- 주요 에러 코드:
- 임시 조치:
- 근본 원인:
- 영구 조치:
- 재발 방지:
- 관련 커밋/PR:
```

## 8) 개발 규칙 연계

- API/Socket 오류는 표준 `error.code`를 유지한다.
- 사용자 노출 메시지와 내부 로그를 구분한다.
- 주요 장애 발생 시 WBS/릴리즈 노트 문서를 함께 갱신한다.
