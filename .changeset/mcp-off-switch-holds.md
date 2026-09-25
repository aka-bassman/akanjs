---
"akanjs": patch
---

fix(mcp): `AKAN_MCP=false` keeps `/mcp` off whatever an `option.ts` configures

`setMcp()` with an object read a missing `enabled` as `true`, so any `option.ts` that only configured the surface
switched it back on. `libs/shared` hands over its OAuth settings exactly that way, so every app mounting it served
`/mcp` under `AKAN_MCP=false`. An object without `enabled` now leaves the switch where it was, and the env switch only
ever narrows: `AKAN_MCP=false` (or `AKAN_PUBLIC_MCP=false`) turns the surface off even over an explicit `enabled: true`.
