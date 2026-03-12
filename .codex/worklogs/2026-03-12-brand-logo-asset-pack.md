# 2026-03-12 Brand Logo Asset Pack

## Scope

- 제공된 `flownium-logo.png` 원본은 유지
- 투명 PNG 기준으로 워드마크 여백 자동 크롭
- 웹에서 바로 사용할 favicon / app icon 세트 생성
- 앱 엔트리 HTML에서 새 아이콘 세트 사용

## Decisions

- 원본 로고 파일은 덮어쓰지 않고 별도 `flownium-logo-cropped.png`를 만든다.
- 아이콘 파생본은 기존 `flownium-icon.png`를 기준으로 생성한다.
- 웹 기본 자산은 favicon, apple-touch-icon, android chrome icon, webmanifest까지만 포함한다.

## Generated Assets

- `assets/branding/logo/flownium-logo-cropped.png`
- `assets/branding/logo/flownium-symbol-transparent.png`
- `assets/branding/logo/flownium-logo_icon.png`
- `assets/branding/logo/flownium-logo_wordmark-on-light.png`
- `assets/branding/logo/flownium-logo_wordmark-on-dark.png`
- `assets/branding/logo/flownium-wordmark-dark-cropped.png`
- `assets/branding/logo/flownium-wordmark-light-cropped.png`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png`
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`
- `public/site.webmanifest`

## Structure Update

- 실제 배포용 웹 아이콘 세트는 `public/branding/` 아래로 이동했다.
- `index.html`과 `site.webmanifest`는 새 `/branding/...` 경로를 참조한다.
- 사용자가 제공한 원본 초안 로고는 `assets/branding/logo/draft/flownium-logo.png`로 함께 보존한다.

## Notes

- `flownium-logo.png`는 alpha 기준 bounding box에 24px padding을 추가해 크롭했다.
- `flownium-icon.png`는 목업 카드 배경이 포함된 이미지라, 아이콘 세트는 흰 카드 배경을 제거하고 심볼만 추출한 `flownium-symbol-transparent.png` 기준으로 다시 만들었다.
- 이후 사용자가 기존 생성 아이콘 품질을 원치 않아, 현재 로그인에 쓰는 `flownium-logo_wordmark-light.png`의 왼쪽 심볼만 다시 잘라 `flownium-logo_icon.png`과 favicon/app icon 세트를 재생성했다.
- `flownium-wordmark-dark.png`, `flownium-wordmark-light.png`는 각각 여백만 잘라낸 cropped 버전도 같이 만들었다.
- 로그인 화면용 워드마크는 배경 기준으로 `on-light`, `on-dark` 두 버전으로 분리했고, 다크 버전은 기존 라이트 워드마크의 텍스트/글로우 영역만 흰색으로 변환해 만들었다.
- 현재 생성 세트는 웹 앱용 최소 CI 자산 세트다.
- OG 이미지, social preview, press kit은 후속 작업으로 분리 가능하다.

## Validation

- 생성된 크롭 결과 이미지 육안 확인
- `npm run build`
