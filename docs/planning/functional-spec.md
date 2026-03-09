# MVP2~MVP3 기능 정의서

업데이트: 2026-03-09
기준 문서: `docs/planning/requirements.md`

## 1. 문서 목적

요구사항 정의서를 실제 구현 단위로 풀어쓴다. 기능별 입력, 처리, 출력, 예외를 정리해 API/화면/오브젝트 정의서와 연결한다.

## 2. 현재 기준 메모

- MVP2-A 운영 로그인/배포 안정화 1차 완료
- MVP2-B는 친구 도메인 백엔드 1차와 Friends/Rooms 프론트 UI 1차가 진행된 상태
- 회원탈퇴, `leave_room`, 익명 채팅은 다음 scope 후보

## 3. 기능 목록

## F-01 인증/세션

### 목적
- 카카오 로그인 기반 세션 처리와 상태 복원

### 입력
- 카카오 인가 코드
- refresh token

### 처리
- 토큰 발급 및 재발급
- 로그인 상태 조회(`/auth/me`)
- 현재 페이지 callback code 중복 처리 방어
- redirect URI 정규화

### 출력
- 사용자 세션 정보
- access/refresh token

### 예외
- `UNAUTHORIZED`
- `TOKEN_EXPIRED`
- `KAKAO_LOGIN_FAILED`

## F-02 친구 검색/추가

### 목적
- 이메일 또는 닉네임으로 사용자를 검색하고 친구 요청을 생성

### 입력
- `keyword`
- `targetUserId`
- `action` (`accept | reject | block`)

### 처리
- 사용자 검색
- 자기 자신 제외
- 친구 요청 생성
- 친구 상태 전이 처리
- 친구 요청 알림 생성

### 출력
- 검색 결과
- 친구 관계 상태
- 친구 목록 (`accepted`, `pendingReceived`, `pendingSent`)

### 예외
- `USER_NOT_FOUND`
- `INVALID_REQUEST`
- `ALREADY_FRIENDS`
- `FRIEND_REQUEST_PENDING`
- `FRIEND_REQUEST_ALREADY_RECEIVED`
- `FRIEND_REQUEST_BLOCKED`

## F-03 Friends/Rooms 메인 패널

### 목적
- 친구 중심 메인 진입 구조 제공

### 입력
- 현재 탭(`friends | rooms`)
- 검색 키워드
- 친구/방 목록

### 처리
- 기본 탭을 Friends로 유지
- Friends 탭에는 친구 목록만 표시
- Rooms 탭에는 채팅방 목록만 표시
- 친구 요청/초대는 알림 허브로 분리
- 검색 버튼으로 검색창 열고 닫기

### 출력
- Friends/Rooms 패널
- 상단 프로필 + 액션 4개
- 검색 상태 반영 목록

### 예외
- 친구/방 데이터 로딩 실패 시 에러 메시지 표시

## F-04 1:1/그룹 채팅 생성

### 목적
- 친구 관계를 기반으로 1:1 또는 그룹 채팅 생성

### 입력
- `memberUserIds`
- `name` (그룹 생성 시)

### 처리
- 선택 대상이 모두 친구인지 검증
- 1명 선택 시 기존 2인 방 재사용 또는 새 생성
- 2명 이상 선택 시 그룹 이름 입력 후 새 생성
- 그룹 생성 시 `room_invite` 알림 생성
- 기존 1:1 방을 그룹으로 변형하지 않고 새 그룹방 생성

### 출력
- 생성 또는 재사용된 방 정보
- `reused` 여부

### 예외
- `FRIENDSHIP_REQUIRED`
- `INVALID_ROOM_NAME`
- `USER_NOT_FOUND`
- `INVALID_REQUEST`

## F-05 알림 허브

### 목적
- 친구 요청과 방 초대, 최근 알림을 한곳에서 처리

### 입력
- 친구 요청 이벤트
- 방 초대 이벤트
- 읽음 처리 대상 알림 ID

### 처리
- 알림 생성
- 읽음 처리
- 소켓 이벤트 전파
- 친구 요청 수락/거절 액션 처리

### 출력
- unread count
- 받은 친구 요청
- 보낸 친구 요청
- 최근 알림 목록

### 예외
- `NOTIFICATION_NOT_FOUND`

## F-06 프로필 이미지 표시

### 목적
- 카카오 프로필 이미지를 친구 탐색과 생성 UX에 일관되게 표시

### 입력
- `profileImage`

### 처리
- Friends 목록, 친구 선택 모달, 내 정보 모달에 출력
- 이미지가 없으면 이니셜 fallback 적용

### 출력
- 프로필 이미지 또는 fallback 아바타

### 예외
- 이미지 URL이 없거나 깨졌을 때 fallback 표시

## 4. 공통 처리 규칙

1. API/소켓 실패 응답은 `{ error: { code, message, details? } }` 형식 사용
2. 친구 관계는 `accepted` 상태만 채팅 대상
3. 비친구는 UI에서 채팅 대상에서 제외하되, 서버도 한 번 더 검증
4. redirect URI는 프론트/서버/카카오 콘솔에서 동일 문자열 사용
5. 한글 포함 파일은 UTF-8로 저장

## 5. 연결 문서

- 요구사항 정의서: `docs/planning/requirements.md`
- UI 계획: `docs/common/ui-plan.md`
- API 명세: `docs/common/api-spec.md`
- 소켓 명세: `docs/common/socket-events.md`
- WBS: `docs/common/wbs.md`
