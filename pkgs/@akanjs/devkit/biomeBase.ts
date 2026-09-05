/** `extends` target for a workspace `biome.json`; Biome resolves it through node_modules. */
export const biomeBaseConfig = "@akanjs/devkit/biome.base.json";

// The `types` and `project` domains are the two that make Biome build a type and a module graph, so `biome.base.json`
// leaves them `none` and the editor never pays for them on save. They live here instead, applied on top of the base
// by the batch runners through `BiomeStrictConfig`. Omitting a domain is not the same as `none` — Biome infers an
// unspecified domain from the project's dependencies and turns it on — so both files spell every domain out.
export const biomeDomainsConfig = "@akanjs/devkit/biome.domains.json";

// Biome moves rules between groups across minors — `noUnnecessaryConditions` sat in `nursery` at 2.4 and moved to
// `suspicious` at 2.5 — and the stale position is a hard "unknown key" error, not a warning. A workspace whose
// Biome disagrees with the shipped base config therefore fails to load it at all, which is why the version is
// pinned here instead of resolved to latest at create time. Bump this, `biome.base.json` and `biome.domains.json`
// in one commit, and run `biome migrate --write` in the workspace root and in `pkgs/@akanjs/devkit` so every config
// moves together.
export const biomeVersion = "2.5.12";
