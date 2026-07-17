---
"create-akan-workspace": minor
"@akanjs/devkit": minor
"@akanjs/cli": minor
"akanjs": minor
---

feat: UiOverride 시스템 및 _overrides.tsx 지원 추가

- `akanjs/ui/UiOverride` 추가: `Provider`, `createOverridable`, `useUiOverride`, `override` API로 UI 컴포넌트 커스터마이징 지원
- 모든 akanjs UI 컴포넌트(Button, Modal, Select, Table 등)에 `useUiOverride()` 통합
- 라우트 시스템에 `_overrides.tsx` 지원 추가 (routeConvention, routeTreeBuilder)
- qualityScanner에 `_overrides.tsx` 파일 검증 로직 추가
- 앱 예제: `apps/minimal`에 `_overrides.tsx`, `BrandModal`, `OverrideDemo` 추가
- `apps/akan` 문서에 UI 커스터마이징 가이드 페이지 추가
- devkit에 `no-throw-raw-error.grit` lint rule 추가
- `PushNotificationServer.ts` 리팩토링
- biome.json 업데이트 및 패키지 의존성 정리
