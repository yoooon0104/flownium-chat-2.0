# 인증 흐름

업데이트: 2026-03-12

## 1) 카카오 간편로그인

1. 로그인 화면에서 `카카오로 시작하기` 클릭
2. 프론트가 카카오 인가 URL로 이동
3. 카카오 인증 후 `code`가 redirect URI로 돌아옴
4. 프론트가 `GET /auth/kakao/callback?code=` 호출
5. 서버가 `AuthIdentity(provider='kakao')` 기준으로 사용자 식별

응답 분기:
- `LOGIN_SUCCESS`
  - 기존 active 사용자 로그인
- `SIGNUP_REQUIRED`
  - 최초 사용자 가입 필요
- `LINK_SUCCESS`
  - 현재 로그인한 이메일 회원 계정에 카카오 연결 완료

참고:
- 카카오 매핑 기준은 이메일이 아니라 카카오 고유 사용자 ID
- 카카오 이메일은 가입 완료 필수값이 아니라 참고 정보

## 2) 카카오 최초 가입(온보딩) 흐름

1. `SIGNUP_REQUIRED` 응답 수신
2. 온보딩 화면에서 닉네임 입력
3. 약관 동의
4. `POST /auth/signup/complete`
5. 성공 시 토큰 저장 + 메인 화면 진입

정책:
- tombstone 계정은 복구하지 않음
- 필요한 경우 새 `User` 생성

## 3) 이메일 회원가입 흐름

1. 로그인 화면에서 `회원가입` 진입
2. 입력:
   - 이메일
   - 닉네임
   - 비밀번호
   - 비밀번호 확인
   - 약관 동의
3. `POST /auth/email/signup/start`
4. 서버가 `EmailVerification` pending record 생성
5. 개발 단계에서는 `debugCode` 또는 서버 로그로 인증 코드 확인
6. `POST /auth/email/signup/verify`
7. 성공 시 `User + AuthIdentity(email)` 생성
8. 즉시 로그인 성공 후 메인 화면 진입

정책:
- 인증 전에는 `User`를 만들지 않음
- active 동일 이메일 계정이 있으면 회원가입 시작 차단
- 이메일 회원가입과 카카오 계정은 자동 병합하지 않음

## 4) 이메일 로그인 흐름

1. 로그인 화면에서 이메일/비밀번호 입력
2. `POST /auth/email/login`
3. verified email identity 기준 로그인
4. 성공 시 토큰 저장 + 메인 화면 진입

대표 실패 분기:
- 미가입 이메일
- 미인증 이메일
- 비밀번호 불일치
- 사용 불가 계정

## 5) 비밀번호 재설정 흐름

1. 로그인 화면에서 `비밀번호 재설정` 진입
2. 이메일 + 새 비밀번호 입력
3. `POST /auth/email/password-reset/start`
4. 서버가 `PasswordResetVerification` pending record 생성
5. 개발 단계에서는 `debugCode` 또는 서버 로그로 코드 확인
6. `POST /auth/email/password-reset/verify`
7. 성공 시 `AuthIdentity(email).secretHash` 교체
8. 기존 refresh token 무효화
9. 로그인 화면으로 복귀 후 새 비밀번호로 로그인

## 6) 카카오 계정 연결 흐름

1. 이메일 회원이 로그인
2. `내 정보` 화면에서 `카카오 계정 연결`
3. `POST /auth/kakao/link/start`
4. 프론트가 authorize URL로 이동
5. 카카오 인증 후 callback 복귀
6. callback에 `state`가 있으면 로그인 대신 연결 처리
7. `LINK_SUCCESS` 응답 후 현재 계정에 `linkedProviders` 갱신

정책:
- 자동 병합 없음
- 이미 다른 사용자에 연결된 카카오 계정은 연결 불가

## 7) 카카오 계정 연결 해제 흐름

1. `내 정보` 화면에서 `카카오 연결 해제`
2. `DELETE /auth/kakao/link`
3. 서버가 현재 사용자에 연결된 kakao identity를 제거

정책:
- 연결된 카카오가 없으면 실패
- 마지막 로그인 수단 하나만 남은 계정은 해제 불가
- 해제 후 `linkedProviders` 갱신

## 8) 앱 초기 진입(세션 복원)

1. 저장된 access token 존재 여부 확인
2. 있으면 `GET /auth/me`
3. 401이면 `POST /auth/refresh` 1회 시도
4. refresh 성공 시 `/auth/me` 재호출
5. 실패 시 세션 정리 후 로그인 화면 복귀

## 9) 소켓 인증 흐름

- Socket.IO 연결 시 `auth.token`으로 access token 전달
- 서버 `io.use`에서 JWT 검증
- `unauthorized` 발생 시 refresh 후 재연결 시도
- 재연결 실패 시 세션 종료

## 10) 회원탈퇴 흐름

1. `DELETE /auth/account`
2. 사용자 문서는 tombstone 상태로 전환
3. 연결된 로그인 수단 제거
4. 친구/알림/읽음 상태 정리
5. direct/group 방 정책에 따라 채팅 문맥 정리
6. 클라이언트 세션 삭제 후 로그인 화면 복귀

## 11) Redirect URI 규칙

아래 세 값은 완전히 동일한 문자열이어야 합니다.

1. 프론트 `VITE_KAKAO_REDIRECT_URI`
2. 서버 `KAKAO_REDIRECT_URI`
3. 카카오 콘솔 Redirect URI

기본 정책은 끝 슬래시 없는 URI를 사용합니다.
