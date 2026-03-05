# UI 계획 (브랜딩 반영)

기준일: 2026-03-05

## 목표

- 그룹 채팅 중심 UX 유지
- 방 탐색은 검색 중심, 생성은 FAB(+) + 모달
- 로그인 화면은 브랜드 로고 중심 게이트
- 로그인 후 화면은 라이트 모달/패널 + 브랜드 포인트 컬러 적용

## 화면 구조

1. 로그인 게이트
- 로고 영역: 워드마크 라이트 로고
- 로고 박스: 흰색 배경 고정
- 카카오 로그인 버튼: 브랜드 그라데이션

2. 상단 액션
- 우측 상단 플로팅 점3개 메뉴(`⋮`)
- 메뉴 항목: `내 정보`, `설정`, `로그아웃`

3. 좌측 패널: 방 목록
- 방 검색 입력
- 방 목록(이름/최근 메시지/시간)
- 우측 하단 FAB(+) 버튼

4. 우측 패널: 채팅 상세
- 채팅방 헤더
- 참여자 메뉴 드롭다운
- 메시지 영역(스크롤)
- 입력창 + 전송 버튼(하단 고정)

5. 모달
- 방 생성 모달
- 내 정보 모달
- 설정 모달(닉네임 변경)

## 브랜딩/컬러 가이드

브랜딩 기준 문서: `assets/branding/usage-guide.md`

주요 토큰:
- `Primary`: `#5B5CFF`
- `Secondary`: `#7A3CFF`
- `Accent`: `#00D4FF`
- `Background`: `#0B0F1A` (배경 그라데이션 베이스)
- `Surface`: `#12152A` (디자인 기준 토큰)
- `Text`: `#F5F7FF`
- `SubText`: `#9AA3B2`

로고 에셋:
- `assets/branding/logo/flownium-wordmark-light.png`
- `assets/branding/logo/flownium-wordmark-dark.png`
- `assets/branding/logo/flownium-icon.png`

적용 원칙:
1. 배경은 브랜드 그라데이션 사용
2. 실제 동작 패널/모달은 라이트 서피스(흰색) 우선
3. 버튼/활성 상태/핵심 강조에만 브랜드 그라데이션 적용

## 반응형 규칙

- Desktop (`>= 1024px`): 2열(`320px / 1fr`)
- Tablet (`768px ~ 1023px`): 2열(`280px / 1fr`)
- Mobile (`< 768px`): 단일 화면 전환
  - 기본: 방 목록
  - 방 선택 후: 채팅 상세
- 모바일 채팅 헤더 좌측 아이콘(←) 뒤로가기 표시
- 플로팅 메뉴는 safe-area 고려 우측 상단 고정

## 컴포넌트 분리 원칙

- `AppShell`: 화면 조합/흐름 제어
- `features/*/components`: UI 렌더링
- `features/*/hooks`: 상태/비즈니스
- `services/*`: REST/Socket I/O
- `domain/*`: 정규화/표기 규칙
