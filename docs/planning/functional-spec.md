# MVP2~MVP3 기능정의서

업데이트: 2026-03-05
기준 문서: `docs/planning/requirements.md`

## 1. 문서 목적

요구사항 정의서를 구현 단위(기능/입력/처리/출력/예외)로 상세화한다.

## 2. 기능 목록

## F-01 인증/세션

### 목적
- 카카오 + 이메일 로그인 병행 및 세션 확인

### 입력
- 카카오 인가 코드
- 이메일/비밀번호
- refresh token

### 처리
- 토큰 검증/재발급
- 로그인 상태 조회(`/auth/me`)

### 출력
- 사용자 세션 정보
- access/refresh 토큰

### 예외
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`

## F-02 친구 검색/추가

### 목적
- 이메일/닉네임으로 유저 검색 후 친구 요청

### 입력
- `keyword` (이메일 또는 닉네임)

### 처리
- 사용자 검색
- 친구 요청 생성/상태 전이(수락/거절/차단)

### 출력
- 검색 결과 목록
- 친구 관계 상태

### 예외
- `USER_NOT_FOUND`
- `ALREADY_FRIEND`
- `REQUEST_ALREADY_PENDING`

## F-03 친구 기반 방 생성

### 목적
- 친구 관계 사용자끼리만 direct/group 채팅방 생성

### 입력
- direct: 대상 사용자 1명
- group: 대상 사용자 N명

### 처리
- 친구 관계 검증
- 방 생성 및 멤버 등록

### 출력
- 생성된 room 정보

### 예외
- `FRIENDSHIP_REQUIRED`
- `ROOM_NOT_FOUND`

## F-04 방 나가기

### 목적
- 현재 사용자가 참여 중인 방에서 퇴장

### 입력
- `roomId`

### 처리
- 멤버 제거
- presence 재계산
- 소켓 leave 처리

### 출력
- 처리 성공 상태

### 예외
- `FORBIDDEN`
- `ROOM_NOT_FOUND`

## F-05 인앱 알림

### 목적
- 멘션/새 메시지/초대/읽음 상태 알림 제공

### 입력
- 이벤트 payload(메시지/초대/읽음)

### 처리
- 알림 생성
- 읽음 처리
- 배지 카운트 갱신

### 출력
- 알림 리스트/카운트
- 소켓 이벤트(`notification_created`, `notification_read`)

### 예외
- `NOTIFICATION_NOT_FOUND`

## F-06 메시지 고도화

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

## F-07 다국어/다크모드

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

## 3. 공통 처리 규칙

1. API/소켓 실패 응답은 공통 포맷 사용
- `{ error: { code, message, details? } }`
2. 운영 로그 등급 준수
- `info`, `warn`, `error`
3. 인증 필요한 기능은 access token 필수

## 4. 추적 매핑

- 요구사항 문서: `docs/planning/requirements.md`
- 화면 정의서: `docs/planning/screen-spec.md`
- 오브젝트 정의서: `docs/planning/object-spec.md`
- API 명세: `docs/common/api-spec.md`
- 소켓 명세: `docs/common/socket-events.md`
