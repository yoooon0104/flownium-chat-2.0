# Branding Usage Guide

업데이트: 2026-03-05

## 1) 브랜드 컬러 토큰

- `Primary`: `#5B5CFF`
- `Secondary`: `#7A3CFF`
- `Accent`: `#00D4FF`
- `Gradient`: `#5B5CFF -> #7A3CFF` + `#00D4FF`
- `Background`: `#0B0F1A`
- `Surface`: `#12152A`
- `Text`: `#F5F7FF`
- `SubText`: `#9AA3B2`

## 2) 권장 사용처

1. `Primary`
- 기본 CTA 버튼
- 활성 상태 핵심 강조

2. `Secondary`
- 보조 CTA
- 보조 강조 요소

3. `Accent`
- 링크/상태 강조(정보성 하이라이트)
- 포커스 링/강조선

4. `Gradient`
- 히어로 영역
- 선택 상태 강조 배경
- 핵심 배너

5. `Background` / `Surface`
- 앱 전체 배경 / 카드 및 패널 배경

6. `Text` / `SubText`
- 본문 텍스트 / 설명 텍스트

## 3) 사용 규칙

1. `Primary`와 `Secondary`는 역할이 겹치지 않도록 컴포넌트별 사용 규칙을 고정한다.
2. `Gradient`는 과사용하지 않고 핵심 영역에만 제한적으로 사용한다.
3. `SubText`는 작은 폰트(특히 12px 이하)에서 대비를 재검증한다.
4. 새 컴포넌트 추가 시 컬러 사용 이유를 PR 설명에 남긴다.

## 4) 접근성 체크

1. 텍스트 대비는 WCAG 기준을 충족하도록 검증한다.
2. 상태 색상만으로 의미를 전달하지 않고 라벨/아이콘을 함께 사용한다.
3. 다크 배경 위 버튼/링크는 hover/active 대비 차이를 명확히 둔다.

## 5) 구현 연동 가이드 (CSS 변수 예시)

```css
:root {
  --color-primary: #5B5CFF;
  --color-secondary: #7A3CFF;
  --color-accent: #00D4FF;
  --color-bg: #0B0F1A;
  --color-surface: #12152A;
  --color-text: #F5F7FF;
  --color-subtext: #9AA3B2;
}
```

## 6) 로고 에셋 경로 (초안)

- `Light Wordmark`: `assets/branding/logo/flownium-wordmark-light.png`
- `Dark Wordmark`: `assets/branding/logo/flownium-wordmark-dark.png`
- `Icon`: `assets/branding/logo/flownium-icon.png`

권장 규칙:
1. 로그인/온보딩 라이트 배경: `Light Wordmark`
2. 다크 배경 헤더/스플래시: `Dark Wordmark`
3. 정사각 아이콘 슬롯(favicon/app-icon): `Icon`

## 7) 향후 보완 TODO

- 컴포넌트별 상태색(hover/active/disabled) 명시
- 라이트 테마 확장 여부 결정
- 브랜드 로고 사용 금지/허용 예시 추가
