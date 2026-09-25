---
"@akanjs/cli": patch
"@akanjs/devkit": patch
"akanjs": patch
---

fix(cli): scaffolds name their guards, and the mobile and package commands do what they say

Guards and templates:
- The module scaffold's slice is `{ root: Admin, get: Public, cru: Admin }` when the workspace mounts libs/shared,
  and `{ root: None, get: Public, cru: None }` — closed until you name a guard — when it does not; its sample slice
  and the sample app's `inPublic` take `init({ guards: [Public] })`. `cru: Public` is gone.
- `akan add-mutation` / `add-slice` write `mutation(Boolean, { guards: [None] })` / `init({ guards: [None] })` and
  import `None`, and their surface step returns a review note instead of stopping as unsupported.
- The sample app's `SignedIn` admits only a caller with an identity (`id`, or libs/shared's `self` / `me`); a guest
  carries an account object too and used to pass. `CurrentUserId` reads the same three places, and the sample's
  task fixtures sign a user in through libs/shared when it is installed. Its spec holds no assertions.
- Every scaffolded abstract has the current shape — a title, one sentence and `## Rules` — instead of six headings
  of placeholder text: `create-module` writes `# <model> Abstract` with its guard and soft-removal rules,
  `create-service` writes `# <service> Service Abstract` and `create-scalar` `# <scalar> Abstract`, each with a
  placeholder sentence and two placeholder rules. The sample app's task, noti and workHistory abstracts state their
  real invariants instead of describing the module layout. The dead `module/__model__.abstract.md` template is
  removed.
- `create-crud-page` imports from the module's own client (`@libs/<lib>/client` for a lib module), and
  `create-package` writes a tsconfig that extends the workspace root from any depth and references no missing file.
- `akan add-field --default now` (and every Date default) writes a thunk, `() => dayjs()`.

CLI and mobile:
- iOS usage-description keys map to Apple's real Info.plist keys (`NSPhotoLibraryAddUsageDescription`,
  `NSPhotoLibraryUsageDescription`, both location-always keys) instead of `NS` + the option name.
- A non-main server's `assetlinks.json` also lists `<appId>.debug`, so a debug build's App Links can verify.
- `start-ios` takes `--no-allow-provisioning-updates` (short flag `-a`); every boolean option that defaults to
  `true` now accepts `--no-<name>`.
- `akan update` installs `@akanjs/cli@<tag>`, the package that provides the `akan` binary.
- `sync-package` reads package dependencies again (the tsconfig paths start with `./pkgs/`).
- The quality scanner no longer recommends the nonexistent `akan compact`; `AbstractDoc.compactMinLines` is gone.
- `--role` lists `federation`, and `--since` names its units.
