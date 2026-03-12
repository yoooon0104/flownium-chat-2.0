# 2026-03-12 Auth / Account UX Refinement

## Scope

- 로그인 화면을 현재 테마(light/dark/system resolved)에 맞게 정리
- 회원가입을 로그인과 시각적으로 분리된 화면 흐름으로 재구성
- 이메일 회원가입 시 약관 동의 필수화
- 내 정보 화면을 edit mode 기반으로 조정
- 계정 화면 스크롤을 눈에 덜 띄는 subtle scrollbar로 정리

## Decisions

- 기본 폰트는 `Noto Sans KR` 계열로 전환했다.
- 이메일 회원가입은 `이메일 / 닉네임 / 비밀번호 / 비밀번호 확인 / 약관 동의`를 필수로 받는다.
- 약관은 우선 서비스 요약형 카드로 제공하고, 정식 전문 페이지는 후속 작업으로 분리한다.
- 내 정보 화면은 기본 read-only이며 `내 정보 변경` 클릭 시에만 편집 가능하다.
- edit mode에서는 `확인 / 취소`로 저장 여부를 명시적으로 결정한다.

## Code Changes

- `server/models/emailverification.model.cjs`
  - `agreedToTermsAt` 추가
- `server/routes/auth.routes.cjs`
  - `POST /auth/email/signup/start`에서 `agreedToTerms === true` 필수화
  - 인증 성공 시 `EmailVerification.agreedToTermsAt`를 `User.agreedToTermsAt`로 반영
- `src/index.css`
  - 기본 폰트를 `Noto Sans KR` 계열로 전환
- `src/features/auth/components/LoginGate.jsx`
  - 로그인/회원가입 화면 흐름 분리
  - 테마별 워드마크 대응
- `src/features/auth/components/LoginGate.css`
  - 시스템 테마 기반 색상 사용, 에러 가시성 강화
- `src/features/auth/components/EmailSignupForm.jsx`
  - 약관 요약 카드, 약관 동의 체크, 인증 단계 메타 정보 추가
- `src/features/user/components/AccountPanel.jsx`
  - edit mode, `확인 / 취소`, 비밀번호 변경/간편로그인/탈퇴 섹션 정리
- `src/features/user/components/ProfileModal.jsx`
  - 스크롤 가능한 계정 모달 구조 반영
- `src/features/user/components/AccountScreen.jsx`
  - 모바일 내 정보 화면과 subtle scrollbar 반영
- `src/App.css`
  - 계정 모달 body, subtle scrollbar, inline action 레이아웃 추가

## Docs Updated

- `docs/common/api-spec.md`
- `docs/common/architecture.md`
- `docs/common/wbs.md`
- `docs/planning/object-spec.md`
- `docs/planning/screen-spec.md`

## Validation

- `node --check server/routes/auth.routes.cjs`
- `node --check server/models/emailverification.model.cjs`
- `npm run build`

## Follow-ups

- 서비스 이용 약관 정식 문서/전문 페이지 분리
- 카카오 계정 연결 해제 정책
- 이메일 변경
