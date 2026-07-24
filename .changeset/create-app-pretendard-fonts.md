---
"akanjs": patch
"@akanjs/cli": patch
"@akanjs/devkit": patch
"create-akan-workspace": patch
---

Ship Pretendard as the default font for newly created apps:

- Bundle Pretendard woff2 files under the app template `public/fonts`
- Declare `fonts` with `default: true` in the generated root `_layout.tsx`
