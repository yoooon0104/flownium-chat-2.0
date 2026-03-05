# Deploy Runbook (MVP2-A)

업데이트: 2026-03-05

## 1) 목적

본 문서는 MVP2-A 배포 전환 시점에 팀이 동일 절차로 점검/배포/검증/롤백을 수행하도록 기준을 고정한다.

대상 아키텍처:
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

## 2) 사전 준비

1. 도메인/엔드포인트 확정
- 프론트: `https://<app-domain>`
- 백엔드: `https://<api-domain>`

2. 카카오 콘솔 설정
- Redirect URI
  - 운영: `https://<app-domain>`
  - 로컬: `http://localhost:5173`

3. 환경변수 준비
- 프론트(`Vercel`)
  - `VITE_API_BASE_URL=https://<api-domain>`
  - `VITE_KAKAO_CLIENT_ID=<KAKAO_REST_API_KEY>`
  - `VITE_KAKAO_REDIRECT_URI=https://<app-domain>`
- 백엔드(`Render`)
  - `FRONTEND_URL=https://<app-domain>`
  - `MONGODB_URI=<atlas-uri>`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SIGNUP_SECRET`
  - `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI`, `KAKAO_CLIENT_SECRET(optional)`

## 3) 배포 전 체크리스트 (필수)

1. 코드 품질
- `npm run lint`
- `npm run build`
- `node --check server/index.cjs`

2. 기능 회귀
- 카카오 로그인(기존 사용자)
- 카카오 로그인(신규 사용자 온보딩)
- 방 생성(FAB) -> 자동 입장
- 2탭 메시지 송수신
- 참여자 online/offline 반영

3. 인증/에러 표준
- `/auth/me` 정상 조회
- `error.code` 응답 확인
  - `scripts/test-error-code.ps1`
  - `scripts/test-auth-me.ps1`
  - `scripts/test-prod-ready.ps1` (배포 전 빠른 통합 점검)

4. 빠른 통합 점검(권장)
- 로컬/운영 공통으로 아래 스크립트를 먼저 실행한다.
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-prod-ready.ps1 -ApiBaseUrl "https://<api-domain>"
```
- 액세스 토큰까지 함께 검증하려면 아래처럼 실행한다.
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-prod-ready.ps1 -ApiBaseUrl "https://<api-domain>" -AccessToken "<ACCESS_TOKEN>"
```

## 4) Redirect URI 최종 검증 (필수)

1. 환경변수 일치
- 프론트 `VITE_KAKAO_REDIRECT_URI`
- 서버 `KAKAO_REDIRECT_URI`
- 카카오 콘솔 Redirect URI

2. 기대 결과
- 세 값이 완전히 동일해야 함(프로토콜/도메인/포트 포함)

3. 실패 증상
- 카카오 로그인 후 callback 오류
- `KAKAO_LOGIN_FAILED` 또는 인증 화면 재진입 반복

## 5) 배포 절차

1. Render(백엔드) 배포
- 환경변수 주입 확인
- 배포 후 `/api/health` 확인

2. Vercel(프론트) 배포
- 환경변수 주입 확인
- 빌드 로그 오류 확인

3. 카카오 최종 검증
- 운영 Redirect URI와 앱 도메인 일치 확인

## 6) 배포 후 검증

1. API
- `GET /api/health` -> 200
- `GET /auth/me` -> 200 (유효 토큰)

2. Socket
- connect/disconnect 루프 없음
- join/send 흐름 정상

3. 브라우저 콘솔
- CORS 에러 없음
- 인증 에러 표준(`error.code`) 출력 확인

## 7) 롤백 절차

1. Vercel: 이전 배포 버전으로 즉시 롤백
2. Render: 이전 배포 버전으로 즉시 롤백
3. 장애 기록 작성
- `docs/operations/ops-log-policy.md` 기준으로 이슈 기록

## 8) 배포 실행 기록 템플릿

```md
### Deploy Record
- 일시:
- 환경(Prod/Local):
- 프론트 도메인:
- 백엔드 도메인:
- 반영 브랜치/커밋:
- 체크리스트 결과:
- Redirect URI 검증 결과:
- 이슈/대응:
```

## 9) 릴리즈 기록 규칙

- 배포 완료 시 `docs/releases/` 또는 Notion `CHANGELOG_DB`에 아래를 기록한다.
1. 배포 시각
2. 반영 커밋/PR
3. 검증 결과
4. 이슈/롤백 여부

## 10) 최근 실행 기록

### Deploy Record (Local Dry Run)
- 일시: 2026-03-05
- 환경(Prod/Local): Local
- 프론트 도메인: `http://localhost:5173`
- 백엔드 도메인: `http://localhost:3010`
- 반영 브랜치/커밋: `feat/mvp2a-live-deploy-validation` / `64cd3ea`
- 체크리스트 결과:
  - `scripts/test-prod-ready.ps1 -ApiBaseUrl "http://localhost:3010"` PASS
  - `/api/health` PASS
  - 무인증 `/api/chatrooms` -> `error.code=UNAUTHORIZED` PASS
  - `/auth/me`는 토큰 미입력으로 SKIP
- Redirect URI 검증 결과: 운영값 미검증(로컬 기준만 확인)
- 이슈/대응: 없음
