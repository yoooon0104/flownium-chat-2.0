# MVP2~MVP3 기능정의서

업데이트: 2026-03-09
기준 문서: `docs/planning/requirements.md`

## 1. 문서 목적

요구사항 정의서를 구현 단위(기능/입력/처리/출력/예외)로 상세화한다.

## 2. 현재 기준 메모

- MVP2-A 운영 로그인/배포 안정화 1차 완료
- MVP2-B는 친구 도메인 백엔드부터 구현을 시작했다.
- 회원탈퇴와 `leave_room`은 다음 scope 후보로 둔다.

## 3. 기능 목록

## F-01 인증/세션

### 목적
- 카카오 로그인 기반 세션 처리 및 상태 복원

### 입력
- 카카오 인가 코드
- refresh token

### 처리
- 토큰 검증/재발급
- 로그인 상태 조회(`/auth/me`)
- 카카오 callback code 중복 처리 방어

### 출력
- 사용자 세션 정보
- access/refresh 토큰

### 예외
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `KAKAO_LOGIN_FAILED`

## F-02 친구 검색/추가

### 목적
- 이메일/닉네임으로 유저 검색 후 친구 요청

### 입력
- `keyword` (이메일 또는 닉네임)
- `targetUserId`
- `action` (`accept | reject | block`)

### 처리
- 사용자 검색
- 친구 요청 생성
- 친구 상태 전이(수락/거절/차단)
- 친구 요청 알림 생성

### 출력
- 검색 결과 목록
- 친구 관계 상태
- 친구 목록(`accepted`, `pendingReceived`, `pendingSent`)

### 예외
- `USER_NOT_FOUND`
- `ALREADY_FRIENDS`
- `FRIEND_REQUEST_PENDING`
- `FRIEND_REQUEST_ALREADY_RECEIVED`
- `FRIEND_REQUEST_BLOCKED`

## F-03 친구 기반 방 생성

### 목적
- 친구 관계 사용자끼리만 1:1/그룹 채팅방 생성

### 입력
- 1:1: 대상 사용자 1명 (`memberUserIds` 1건)
- 그룹: 대상 사용자 N명 + `name`

### 처리
- 친구 관계 검증
- 2인 방 재사용 여부 확인
- 없으면 새 방 생성
- 그룹 생성 시 초대 알림 생성

### 출력
- 생성 또는 재사용된 room 정보
- 재사용 여부(`reused`)

### 예외
- `FRIENDSHIP_REQUIRED`
- `INVALID_ROOM_NAME`
- `USER_NOT_FOUND`

## F-04 인앱 알림

### 목적
- 친구 요청/방 초대 알림 제공

### 입력
- 친구 요청 이벤트
- 방 초대 이벤트
- 읽음 처리 대상 알림 ID

### 처리
- 알림 생성
- 읽음 처리
- 소켓 이벤트 전파

### 출력
- 알림 리스트/카운트
- 소켓 이벤트(`notification_created`, `notification_read`)

### 예외
- `NOTIFICATION_NOT_FOUND`

## F-05 메시지 고도화

### 목적
- 검색/북마크/핀/읽음 상태 개선

### 입력
- 검색 조건(사람/기간/키워드)
- 북마크/핀 대상 메시지

### 처리
- 필터 조회
- 북마크/핀 상태 저장

### 출력
- 검색 결과
- 북마크/핀 목록

### 예외
- `MESSAGE_NOT_FOUND`

## F-06 다국어/다크모드

### 목적
- 사용자 선호 언어/테마 적용

### 입력
- `locale`, `theme`

### 처리
- 사용자 설정 저장
- UI 즉시 재렌더링

### 출력
- 적용된 언어/테마 상태

### 예외
- `INVALID_LOCALE`
- `INVALID_THEME`

## 4. 공통 처리 규칙

1. API/소켓 실패 응답은 공통 포맷 사용
- `{ error: { code, message, details? } }`
2. 운영 로그 등급 준수
- `info`, `warn`, `error`
3. 인증 필요한 기능은 access token 필수
4. 카카오 Redirect URI는 프론트/서버/카카오 콘솔에서 동일해야 한다.
5. 친구 기반 채팅 UI에서 비친구는 채팅 대상에 표시하지 않더라도, 서버는 다시 한 번 친구 관계를 검증한다.

## 5. 추적 매핑

- 요구사항 문서: `docs/planning/requirements.md`
- 화면 정의서: `docs/planning/screen-spec.md`
- 오브젝트 정의서: `docs/planning/object-spec.md`
- API 명세: `docs/common/api-spec.md`
- 소켓 명세: `docs/common/socket-events.md`