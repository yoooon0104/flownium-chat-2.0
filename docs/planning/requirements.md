# MVP2 요구사항 정의서

업데이트: 2026-03-05

## 1. 문서 목적

이 문서는 MVP2를 **Sprint A(운영 안정화) -> Sprint B(기능 확장)** 순서로 진행하기 위한 기준 요구사항을 정의한다.

원칙:
1. Sprint A 완료 전 Sprint B 착수 금지
2. 스프린트 완료 기준(DoD) 충족 후 다음 단계 진행
3. 상세 내용은 본 구조를 유지한 채 추후 보완

## 2. Sprint A (배포/운영 안정화)

### 2.1 목표

- 운영 가능한 배포 상태 확보
- 배포/검증/장애 대응 절차 고정

### 2.2 범위 (In)

1. Vercel(프론트) + Render(백엔드) + Atlas(DB) 실배포
2. 프론트 `VITE_API_BASE_URL` 전환
3. 카카오 Redirect URI 운영/로컬 병행 검증
4. 운영 체크리스트 고정 (lint/build/server-check + 핵심 수동 테스트)
5. 장애 대응 룰 고정 (hotfix/롤백/로그 점검)

### 2.3 범위 (Out)

- 권한 모델 확장
- leave_room 기능 확장
- 페이지네이션/프로필 이미지 기능 확장

### 2.4 기능 요구사항 (FR-A)

- FR-A01: 운영 도메인 카카오 로그인 성공
- FR-A02: 환경변수 기반 API 연결
- FR-A03: 배포 체크리스트 문서화
- FR-A04: 장애 시 복구 절차 실행 가능

### 2.5 비기능 요구사항 (NFR-A)

- NFR-A01: `npm run lint`, `npm run build`, `node --check server/index.cjs` 통과
- NFR-A02: 소켓 reconnect 루프 없음
- NFR-A03: CORS/환경변수 오설정 없는 운영 접속

### 2.6 수락 기준 (DoD-A)

1. 운영 도메인 로그인/채팅 기본 흐름 정상
2. 방 생성/입장/메시지/참여자 상태 정상
3. 운영 로그 치명 오류 없음
4. 신규 팀원 재현 가능

## 3. Sprint B (기능 확장)

### 3.1 목표

- 운영 안정화 기반 위 핵심 기능 확장

### 3.2 범위 (In)

1. `leave_room` 이벤트 + REST 계약
2. 관리자/초대/강퇴 최소 권한 모델
3. 메시지 커서 기반 페이지네이션
4. 프로필 이미지 편집
5. 에러 코드 표준화 (`error.code`)

### 3.3 범위 (Out)

- E2EE 메시지 암호화 실구현
- 멀티 리전/고가용성 인프라
- 고급 알림/푸시 시스템

### 3.4 기능 요구사항 (FR-B)

- FR-B01: leave_room 후 참여자/권한 상태 일관성
- FR-B02: 권한 정책 API 검증 적용
- FR-B03: cursor 기반 메시지 조회
- FR-B04: 프로필 이미지 수정 기능
- FR-B05: 표준 에러 포맷 적용

### 3.5 비기능 요구사항 (NFR-B)

- NFR-B01: 페이지네이션 성능 저하 없이 동작
- NFR-B02: 권한 실패 시 표준 에러 응답 일관성
- NFR-B03: MVP1 기능 회귀 없음

### 3.6 수락 기준 (DoD-B)

1. leave_room/권한 시나리오 통과
2. 페이지네이션 중복/누락 없음
3. 프로필 이미지 수정 후 UI/DB 동기화
4. 에러코드 문서/구현 일치

## 4. 공통 제약사항

1. 카카오 Redirect URI는 콘솔 설정과 정확히 일치해야 한다.
2. 현재 구조(`app/features/domain/services`, Express+Socket+Mongo)를 유지한다.
3. presence는 메모리 기반이므로 서버 재시작 시 초기화된다.

## 5. 산출물 연계

1. 화면 정의서: `docs/planning/screen-spec.md`
2. 오브젝트 정의서: `docs/planning/object-spec.md`
3. 작업 현황: `docs/common/wbs.md`

## 6. 추후 상세화 TODO

- 각 FR/NFR 세부 기준치(수치, 에러코드 표)
- Sprint별 테스트 케이스 상세 절차
- API/소켓 상세 계약 링크 매핑



