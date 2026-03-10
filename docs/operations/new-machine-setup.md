# New Machine Setup Guide

업데이트: 2026-03-10

## 1) 목적

이 문서는 새 PC를 세팅할 때 Flownium Chat 2.0 개발을 다시 시작하기 위한 기준 문서입니다.

대상:
- Windows 개발 환경
- macOS 개발 환경
- Frontend + Backend 로컬 실행
- Kakao 로그인 로컬 검증
- Git/GitHub PR 작업

## 2) 한 번에 보는 준비물

필수:
- Git
- Node.js 22 LTS 권장
- npm
- MongoDB Community Server 또는 MongoDB Atlas 연결 정보
- Kakao Developers 앱 설정값

권장:
- GitHub CLI (`gh`)
- VS Code
- Codex / AI 도구 사용 시 GitHub 인증 및 로컬 워크스페이스 접근 환경

## 3) 기본 설치

### OS별 패키지 매니저

Windows:
- `winget` 권장

macOS:
- Homebrew 권장

Homebrew 확인:

```bash
brew --version
```

없으면 설치:
- [Homebrew](https://brew.sh/)

### Git

설치 확인:

```powershell
git --version
```

없으면 설치:
- [Git for Windows](https://git-scm.com/download/win)
- macOS(Homebrew): `brew install git`

### Node.js

권장 버전:
- Node.js 22 LTS

설치 확인:

```powershell
node -v
npm -v
```

없으면 설치:
- [Node.js](https://nodejs.org/)
- macOS(Homebrew): `brew install node@22`

### MongoDB

선택지:
1. 로컬 MongoDB Community Server 사용
2. MongoDB Atlas 사용

로컬 설치 확인:

```powershell
mongod --version
```

없으면 설치:
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- macOS(Homebrew):

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

기본 로컬 URI 예시:

```txt
mongodb://127.0.0.1:27017/flownium-chat
```

## 4) 저장소 받기

```powershell
git clone https://github.com/yoooon0104/flownium-chat-2.0.git
cd flownium-chat-2.0
```

macOS:

```bash
git clone https://github.com/yoooon0104/flownium-chat-2.0.git
cd flownium-chat-2.0
```

## 5) 의존성 설치

프론트:

```powershell
npm install
```

macOS:

```bash
npm install
```

서버:

```powershell
cd server
npm install
cd ..
```

macOS:

```bash
cd server
npm install
cd ..
```

## 6) 환경변수 세팅

### 프론트 루트 `.env`

파일 생성:

```powershell
Copy-Item .env.example .env
```

macOS:

```bash
cp .env.example .env
```

값 예시:

```env
VITE_KAKAO_CLIENT_ID=
VITE_KAKAO_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3010
```

규칙:
- `VITE_KAKAO_CLIENT_ID`는 현재 코드 기준 카카오 `REST API 키`
- `VITE_KAKAO_REDIRECT_URI`는 끝 슬래시 없이 통일
- `VITE_API_BASE_URL` 미설정 시 로컬 기본값 `http://localhost:3010` fallback

### 서버 `server/.env`

`server/.env` 파일 생성 후 아래 값 입력:

```env
PORT=3010
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/flownium-chat

JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_SIGNUP_SECRET=dev-signup-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=14d
SIGNUP_TOKEN_EXPIRES_IN=10m

KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=http://localhost:5173
KAKAO_CLIENT_SECRET=
```

규칙:
- `FRONTEND_URL`은 origin 값이므로 슬래시 없이 유지
- `KAKAO_REDIRECT_URI`와 프론트 `VITE_KAKAO_REDIRECT_URI`는 완전히 같은 문자열이어야 함
- 민감정보는 저장소에 커밋하지 않음

참고:
- 자세한 정책은 [env-policy.md](/C:/Users/yoooo/flownium-chat-2.0/docs/common/env-policy.md)

## 7) Kakao Developers 설정

새 PC에서 프로젝트를 실행하려면 로컬 개발용 Redirect URI가 카카오 콘솔에 등록돼 있어야 합니다.

필수 확인:
- Redirect URI: `http://localhost:5173`
- 필요 시 운영 URI도 함께 유지

현재 구현 기준:
- 프론트 `VITE_KAKAO_CLIENT_ID` = 카카오 `REST API 키`
- 서버 `KAKAO_REST_API_KEY` = 같은 키 사용

불일치 시 대표 증상:
- `KOE006`
- `KAKAO_LOGIN_FAILED`
- `KOE320`

## 8) 로컬 실행

### 서버 실행

```powershell
cd server
npm run dev
```

macOS:

```bash
cd server
npm run dev
```

### 프론트 실행

새 터미널:

```powershell
cd C:\Users\yoooo\flownium-chat-2.0
npm run dev
```

macOS 새 터미널:

```bash
cd ~/flownium-chat-2.0
npm run dev
```

접속:
- 프론트: `http://localhost:5173`
- 서버 health: `http://localhost:3010/api/health`

## 9) 기본 검증

프론트 빌드:

```powershell
npm run build
```

macOS:

```bash
npm run build
```

서버 문법 체크:

```powershell
node --check server/index.cjs
```

macOS:

```bash
node --check server/index.cjs
```

운영/인증 관련 스크립트:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-error-code.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\test-auth-me.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\test-prod-ready.ps1 -ApiBaseUrl "http://localhost:3010"
```

실시간 검증 기준:
- [realtime-validation-checklist.md](/C:/Users/yoooo/flownium-chat-2.0/docs/operations/realtime-validation-checklist.md)

## 10) GitHub CLI 세팅

PR 생성까지 로컬에서 직접 하려면 `gh` 설치와 로그인까지 끝내는 편이 좋습니다.

설치 확인:

```powershell
where.exe gh
gh --version
```

설치:

```powershell
winget install --id GitHub.cli -e
```

macOS:

```bash
brew install gh
```

만약 설치됐는데 `gh`가 안 잡히면 현재 세션 PATH 추가:

```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
gh --version
```

로그인:

```powershell
gh auth login
gh auth status
```

macOS:

```bash
gh auth login
gh auth status
```

## 11) 권장 작업 도구

### VS Code

권장 확장:
- ESLint
- Prettier 사용 여부는 팀 규칙 확인 후 선택

### Codex / AI 도구

선택 사항이지만 쓰려면 아래 상태가 편합니다.

권장:
- 저장소 로컬 clone 완료
- GitHub 인증 완료
- `gh auth status` 정상
- 프로젝트 루트 열기

주의:
- AI 도구의 스킬/프롬프트는 작업 절차를 도와주지만 GitHub 인증을 대신하지는 않음

## 12) 배포 관련 참고

운영 배포 구조:
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

관련 파일:
- [render.yaml](/C:/Users/yoooo/flownium-chat-2.0/render.yaml)
- [vercel.json](/C:/Users/yoooo/flownium-chat-2.0/vercel.json)
- [deploy-runbook.md](/C:/Users/yoooo/flownium-chat-2.0/docs/operations/deploy-runbook.md)

## 13) 새 PC에서 가장 자주 막히는 지점

1. `gh`가 설치돼도 PATH에 안 잡힘
- 현재 PowerShell 세션에 `$env:Path += ";C:\Program Files\GitHub CLI"` 추가

macOS에서 `gh`가 안 잡히면:
- `brew --prefix gh`
- `echo $PATH`
- 새 터미널 실행 후 `gh --version` 재확인

2. 카카오 로그인 실패
- `VITE_KAKAO_REDIRECT_URI`
- `KAKAO_REDIRECT_URI`
- 카카오 콘솔 Redirect URI
세 값이 완전히 같은지 확인

3. 프론트는 뜨는데 API 호출 실패
- `VITE_API_BASE_URL`
- 서버 실행 여부
- `FRONTEND_URL`
- CORS 설정 확인

4. MongoDB 연결 실패
- `MONGODB_URI` 확인
- 로컬 MongoDB 서비스 실행 여부 또는 Atlas IP 허용 상태 확인

macOS 로컬 MongoDB 확인:
- `brew services list`
- `mongosh`

5. 인증은 됐는데 세션 복원이 안 됨
- `/auth/me` 호출 확인
- 프론트/서버 URL mismatch 여부 확인

## 14) 최소 부팅 체크리스트

새 PC에서 여기까지만 되면 개발 시작 가능:

1. `git --version`
2. `node -v`
3. `npm -v`
4. `gh auth status`
5. `.env`, `server/.env` 작성
6. `npm install`
7. `cd server && npm install`
8. `cd server && npm run dev`
9. 루트에서 `npm run dev`
10. `npm run build`
11. `node --check server/index.cjs`

macOS도 동일 체크리스트를 사용하면 됨

## 15) 같이 보면 좋은 문서

- [docs/README.md](/C:/Users/yoooo/flownium-chat-2.0/docs/README.md)
- [project-overview.md](/C:/Users/yoooo/flownium-chat-2.0/docs/common/project-overview.md)
- [env-policy.md](/C:/Users/yoooo/flownium-chat-2.0/docs/common/env-policy.md)
- [deploy-runbook.md](/C:/Users/yoooo/flownium-chat-2.0/docs/operations/deploy-runbook.md)
- [realtime-validation-checklist.md](/C:/Users/yoooo/flownium-chat-2.0/docs/operations/realtime-validation-checklist.md)
- [development-rules.md](/C:/Users/yoooo/flownium-chat-2.0/docs/development-rules.md)
- [CONTRIBUTING.md](/C:/Users/yoooo/flownium-chat-2.0/CONTRIBUTING.md)
