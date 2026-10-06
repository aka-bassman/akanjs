# @akanjs/cli

## 3.0.2

### Minor Changes

- af66669: Native builds moved from `apps/<app>/.akan/native/<target>` to `dist/native/<app>/<target>` (`build/<platform>`, `dev/<platform>`, `web`, `bin`, `updates`). It sits outside `dist/apps/<app>`, which every `akan build` empties, so a signed release waiting for upload survives the next build. Upload what is waiting in an old `.akan/native/<target>/updates` and delete the folder: `akan start` keeps it and warns until then. A CI step that collects installers reads `dist/native/<app>/*/build/*/` now, and `pack-update`'s default output is `dist/native/<app>/<target>/updates/<platform>`.

### Patch Changes

- be8ed50: A facet folder with nothing to export syncs to `export {};`, so a barrel still exporting a deleted file heals on the next sync, and `akan create-library` no longer scaffolds placeholder `*Logic.ts` files.
- be8ed50: The generated `lib/dict.ts` and `lib/srv.ts` import only what they use.
- 2b0ee5d: Stop referencing `tsconfig.spec.json` from the generated app `tsconfig.json` template so freshly generated apps pass the workspace root-file scan and typecheck.
- Updated dependencies [be8ed50]
- Updated dependencies [af66669]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [af66669]
- Updated dependencies [af66669]
- Updated dependencies [bd55713]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
- Updated dependencies [a789952]
- Updated dependencies [be8ed50]
- Updated dependencies [be8ed50]
  - akanjs@3.1.0

## 3.0.1

### Patch Changes

- Updated dependencies [4871ae5]
- Updated dependencies [4871ae5]
- Updated dependencies [4871ae5]
  - akanjs@3.1.0

## 3.0.0

### Minor Changes

- ccf2ae2: `akan build-desktop --installer` makes a Windows setup program

  On Windows the build adds `<file>-<version>-<arch>-setup.exe`, made with NSIS (`winget install NSIS.NSIS`). It installs
  for the current user under `%LOCALAPPDATA%\Programs\<app name>`, where the updates plugin swaps the app without an
  administrator, with a Start menu shortcut and an uninstall entry. `/S` installs silently and `/RUN` starts the app
  afterwards, and a PC without the WebView2 Runtime gets it. The program is not code-signed yet.

  - What can fail without touching the installed app comes first: WebView2, then the new files, unpacked beside the
    folder. Only then is a copy of the app running from the folder stopped, found by its path, and the folder swapped by
    two renames. A swap that fails puts the old folder back, and with `/RUN` the app left in place starts again.

  - The uninstaller lives beside the app folder (`<folder>.uninstall.exe`), not in the folder an update replaces, so
    Settings › Apps can still remove an updated app. It finds the folder from the uninstall entry and removes it with
    whatever updates left beside it (`.previous`, unpacked or failed releases) and itself, the launch-at-login entry and
    the updates state; the server's data stays. An uninstaller that cannot be
    written there (a `/D=` right under a drive root) fails the install.
  - The Start menu shortcut and the app `/RUN` or the last page starts work in `%LOCALAPPDATA%`: Windows cannot rename a
    folder some process works in, which is what applying an update does.
  - `/RUN` starts the app after a silent install only; an interactive one offers it on its last page.
  - Run again without `/D=`, it installs into the folder the uninstall entry names, so a reinstall replaces the copy
    already installed wherever it was put, and a setup started while another one runs refuses to start.
  - A silent install that cannot finish exits with 2: files it could not write (the script is long-path aware, and the
    build warns when the deepest file nears 260 characters under `%LOCALAPPDATA%\Programs`), a WebView2 Runtime still
    missing after its setup ran (an interactive install asks), or a `/D=` folder holding someone else's files.
  - An update the app confirms sets the version Settings › Apps shows.

- ccf2ae2: `akan start-desktop <app>` (alias `sd`) runs a native target as a desktop app on this computer — macOS, Windows or
  Linux, whichever it is — the way `start-ios` and `start-android` run it on a phone: a debug build whose pages come
  from `akan start` through the dev gateway, so every save shows up, or with `--release` a release build of its own
  bundle. It takes `--target`, `--env`, `--release` and `--write`. `NativeApp` accepts the desktop platforms, and
  `NativeApp.desktopPlatform()` names this computer's.
- ccf2ae2: An app and a lib ship native plugins of their own from a `native/` folder

  A plugin the runtime has no builtin for sits in `apps/<app>/native/<id>/` (or `libs/<lib>/native/<id>/`), the folder
  named after the id in its `native-plugin.json`. It is listed nowhere: every mobile and desktop target of the app
  ships it, and its manifest says what runs on each platform. A lib's plugins reach only the apps that depend on it; an
  app's own plugin wins an id a lib also uses, and two libs claiming one id stop the build. `akan sync`, `akan doctor`
  and `akan quality scan` accept the folder.

  The page API is written with `definePlugin` from `akanjs/client/native` (which also exports `defineWebPlugin`,
  `createLiveValue`, `useLiveValue` and `usePluginEvent`), and the desktop part with `defineDesktopPlugin` from the new
  `akanjs/native/desktop`. A `native/` folder is out of the scope of `no-throw-raw-error` (a plugin throws
  `AkanNativeError`) and of `no-web-only-api-outside-webkit`. A plugin a target names by folder in `native.plugins` is now
  granted by its id instead of its path, and ships once when it is also the app's own `native/<id>`. A desktop plugin's
  `ctx.launch.exit(code)` after its setup ran past the launch phase's 3 s quits the app, since its window exists by then.

- ccf2ae2: An installed app updates itself: a phone its web bundle over the air, a desktop app the whole app.

  - `native.updates: { url, publicKey, channel?, readyTimeout? }` in `akan.config.ts`, per target too, the target's
    fields winning. It brings the runtime's `updates` plugin. A channel left unnamed is the backend env the binary is
    built for (`main`, `develop`, `debug`, …), so a `build-desktop` app (`debug` unless `--env` names another) takes
    only the releases published for that env.
  - The CSR frame confirms a release on trial once the first page is on screen, in every native shell (an unconfirmed
    one is rolled back at the next launch). On a phone it also keeps the bundle current by itself: at start and on each
    return to the front it looks for a newer one and downloads it, and it runs from the next cold start. A desktop
    release is the whole app and a relaunch, so the app checks, downloads and applies it on its own schedule. A dev
    build's pages are left alone. `akanjs/client/native` exports `updates`, `markReady` and `useUpdateState`.
  - `akan update-keygen <app> [--platform]` makes the signing key of the app's id once and prints its public half.
    `akan publish-update <app>` builds a release on this machine and signs it: the whole app for this computer's desktop
    OS and CPU (with the app's server when `desktop.server` says so for the target, as for `build-desktop`), or the
    web bundle for `--platform android|ios`. It writes the manifest and its files under `.akan/native/<target>/updates`,
    to upload to `updates.url`, on the channel of its `--env` (`main` unless named). `--channel` names only the manifest
    written, not the channel the release follows, so a pilot group gets a target whose `updates.channel` is the pilot's.
  - The updates folder holds only what is uploaded, and whoever can reach `updates.url` reads it: the updater sends no
    credentials, and a desktop release is the whole app, with the carried server's `private/` (the app's and its libs')
    and its env file.
  - `akan pack-update <app> --platform ios|android [--target] [--env] [--out]` writes an unsigned phone update instead,
    for a signer that keeps the key elsewhere: `files/<sha256>`, `bundle.json` and `manifest.template.json`, the
    manifest with `channel`, `sequence` and `bundle` left for the signer. `--against <store bundle.json>` also checks
    the bundle runs in that store build, writes `compat.json`, and fails when it needs a new binary. The signing
    contract is in the native runtime's architecture notes: fill the three fields, sign exactly the bytes you upload,
    upload `files/` first.
  - `publish-update` refuses a `--channel` outside the names `updates.channel` accepts (lowercase letters, digits, `.`,
    `_`, `-`) before it builds, and numbers a release past the one its channel already has in the updates folder,
    warning when this computer's clock is behind it. Apps compare against the time their own build was made, so keep the
    building and the publishing computers' clocks in step.
  - While a desktop release is on trial, `updates.check()` answers `available: false` for it and `updates.apply()`
    rejects with `NOT_ALLOWED`: applying would replace the app a failed trial goes back to.
  - A release of a desktop app that carries its server is confirmed only once that server answered ready and stayed up
    for 5 s, and only while it is up; its trial clock (`readyTimeout`) starts then, so a server slow on its first run
    (its new files being scanned) costs no rollback. A server that gives up, or is not up within 120 s of the start,
    rolls the release back at once; the release stays downloaded for the next apply, and its third such failure
    excludes it for good.
  - A desktop release's manifest says whether it carries a server, and an installed app refuses one that differs from
    itself before downloading anything (`check()` answers `available: false`, `download()` rejects with
    `NOT_ALLOWED`), since either way its pages' backend would change place. `publish-update` refuses, before it builds,
    a desktop release whose server presence differs from the channel's previous one: publish it on another channel
    (`updates.channel`), or remove that `<channel>.json` from the output folder to start the channel over. Turning
    `native.desktop.server` on or off for an app already installed takes a reinstall.
  - On Windows an app started from its install folder (the installer, the Start menu, Explorer) applies and rolls back
    updates: Windows renames no folder a process works in, so the app moves to its local data folder before the webview
    starts, and the update helper and the app it starts work elsewhere.
  - The update state and the unpacked releases live in the app's local data (`%LOCALAPPDATA%\<app id>\akan-native-updates`
    on Windows), and plugins get that folder as `ctx.appLocalDataDir`.
  - An app installed under another folder name (`/D=`, a renamed `.app`) takes updates; a download older than a
    reinstalled build is dropped; a Windows swap that did not happen (a file stayed locked, the helper never ran) keeps
    the release downloaded for the next apply until its third such failure excludes it. Reinstalling the app clears the
    list of releases the earlier install refused.
  - `publish-update` checks every target before anything builds — its `updates` settings, its native config, the
    signing key on this computer, and whether its channel's previous release carries a server as it would — so a CI
    without the key stops at once and a publish never releases only the first targets. It writes `<channel>.json`
    together with its signature.
    The channels `bundle`, `manifest.template` and `compat` are refused. `akan start` keeps `.akan/native`, where
    releases wait to be uploaded, and the `bin` downloads in `.akan/cache/bin`.

- ccf2ae2: An app image carries the server env of the environment it runs and no other.

  - `env/env.server.ts` imports every environment's file, so `akan build` used to bundle all of them into `server.js`:
    anyone holding the image of one environment could read the keys of every other. The backend build now keeps only
    `env.server.<AKAN_PUBLIC_ENV>.ts`, the environment the generated Dockerfile fixes, and swaps each other
    environment's file (`local`, `testing`, every branch) for exports that refuse to be read. Booting such an image under
    another `AKAN_PUBLIC_ENV` stops with `env/env.server.<name>.ts is not in this build` instead of running on a
    config it does not have. Nothing in `env/` needs to change.
  - An app's generated `server.ts` no longer re-exports `env` from `env.server.testing.ts`, which put the testing env in
    every image. Signal tests read it from the file. A script or test that imported `env` from an app's `server.ts`
    imports `./env/env.server.testing` instead. A lib's `server.ts` still exports it, since each app's
    `env.server.type.ts` spreads it as the lib's defaults.
  - Keys that already shipped in an image stay readable in it. Rotate them.
  - A build for a named `--env` (a mobile or desktop build) writes that env into the Dockerfile too, so the image boots
    the environment its `server.js` carries.

  **Breaking for an image started under another `AKAN_PUBLIC_ENV`, and for code importing `env` from an app's
  `server.ts`:** the image stops at boot until it runs the environment it was built for, and the import moves to
  `./env/env.server.testing`.

- ccf2ae2: A desktop app nobody attends recovers its page, relaunches itself and opens as a kiosk

  `native.desktop.recovery: "reload"`, for the app or one target, loads a page whose web process ended (a crash, a hang,
  out of memory) again, once per end, instead of showing an error page after the second end, waiting longer after each
  end in a row (1 s, doubling to a minute). It relaunches the app when the webview's browser process ends, where the app
  used to quit: at once the first time, then after 1 s doubling to a minute while each relaunched app dies within a
  minute, and after ten in a row it exits with code 1 instead of restarting for good.
  `native.desktop.window: { fullscreen, skipTaskbar }` opens the main window borderless fullscreen and without a taskbar
  button (Windows, Linux) from its first frame; a plugin's launch phase decides the same per launch with
  `ctx.launch.setWindow`. `app.relaunch()` ends the app and starts it again in a new process on the desktop and Android,
  and reloads the page on the web; one process starts one new app, however many windows or calls asked for it.
  `native.android.autoplay: true` lets media play with sound without a tap first, as it already does on iOS and the
  desktop.

  An app relaunched by an update on Windows no longer quits the moment it starts when `akan start-desktop` had started
  the one before it.

- ccf2ae2: `akan build-desktop` (`akan bd`) builds a native target as a desktop app for this computer: a `.app` on macOS, signed
  ad hoc or with the development identity, and an unsigned app folder on Windows and Linux, like `build-ios` after a
  production web build against `--env` (default `debug`). The native runtime already built all three; only the
  command was missing. Distribution signing and notarization are not part of it yet.
- ccf2ae2: A desktop app can carry the app's own server: with `native: { desktop: { server: true } }` in `akan.config.ts`, or
  `desktop.server` on one target, `akan build-desktop`, `akan start-desktop --release` and `akan publish-update` put the
  backend `akan build` made into the app, so it works on one computer with no backend elsewhere.

  - The build stages what the backend build wrote into `apps/<app>/.akan/desktop/server` — `main.js`, `server.js`, the
    chunks, `akan.build.json`, `private/`, and any `.node`, `.wasm` or file asset a bundled package brought — without the
    Dockerfile, the RSC worker, the console, `csr/` and `public/`. Its packages install there first
    (`bun install --production --prefer-offline`, without the RSC renderer and the drivers of every database mode but
    `single`), before `akan build` runs, so a computer that cannot reach the registry or find them in Bun's cache stops at
    once. The app needs `single` in `database.modes`; the command says so before it builds.
  - The backend is built for the command's own `--env`, not the workspace's `AKAN_PUBLIC_ENV` (the root `.env` usually
    names `local`), so `server.js` holds that environment's `env.server.<env>.ts` and no other.
  - What it carries is readable in plain text by anyone with the app: `private/` (each lib's too, under
    `private/libs/<lib>`), that `env.server.<env>.ts` and the server env defaults of the libs it uses (each lib's
    `env.server.testing.ts`). Keep deployment secrets out of them. It has no `public/`, and its working
    folder is its data folder: read a runtime file from the app folder (`AKAN_APP_DIR`, else the folder of `Bun.main`),
    never from `process.cwd()`.
  - At launch the shell starts it as a child on its own Bun (`BUN_BE_BUN`, with `.env`, `bunfig.toml` and
    auto-install off) on a loopback port, and hands the page its URL as `PUBLIC_AKAN_SERVER_URL`. The port of the last
    session comes first and a fresh one is picked only when it is taken, so an address registered somewhere usually
    stays valid from one launch to the next. The window waits for it up to 8 s.
  - It runs API only, `operationMode` edge, database mode `single`, SSR, CSR and MCP off, bound to 127.0.0.1 with every
    other Host refused. Any program on the computer can still call that port, so guard its endpoints as a network
    server's. It keeps its SQLite data, files, logs and a per-install JWT secret in the app data folder's
    `server/`, and a debug build, which has the release app's id, in its own `server-debug/`. On Windows that folder is
    `%LOCALAPPDATA%\<app id>\server`, not the Roaming folder a profile copies on every sign-in and an organisation may
    put on a file share, where SQLite's WAL does not work. Bun's transpiler cache goes to
    `<server data>/runtime/transpiler-cache`.
  - It trusts the operating system's CAs (`--use-system-ca`), as the page does, and gets the proxy and CA variables
    (`HTTP(S)_PROXY`, `NO_PROXY`, `NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE`, `NODE_USE_SYSTEM_CA`) and the desktop session's
    (`DISPLAY`, `WAYLAND_DISPLAY`, the session bus, the audio server, `XDG_*`, and Windows' `ProgramFiles`, `ComSpec`,
    `PATHEXT` and the like), so a `bin` tool reaches what the page reaches and can open the screen, the audio server or a
    shell.
  - `AkanApp` takes `BUN_BE_BUN` off `process.env` at boot and gives it back only to a spawn of its own executable (the
    ops snapshot, which also gets the server's runtime flags), so a `bin` tool built with `bun build --compile` starts as
    itself rather than as the Bun CLI. A child started with `Bun.spawn` and no `env` still gets the environment the
    process started with, so pass `env: process.env`.
  - A crash restarts it on the same port (1 s doubling to 30 s; the fifth in a row gives up with an alert). A server that
    exits before its first ready starts again 250 ms later, on the same port while it is still free, so one that cannot
    boot gives up while the window still waits for it and the window opens at once with the alert. A server
    that cannot start at all (an unreadable `jwt.secret`, a data folder that cannot be made) still hands the page a
    loopback URL and shows the same alert once the window is up, so the page never falls back to the backend its bundle
    was built for. A restart that throws counts as one failure. Its standard error, and its standard output until it is
    ready, also go to `server/runtime/logs/server-output.log`, where a server that fails before it listens leaves its
    reason.
  - Quitting the app stops it within its 1 s shutdown budget, inside the launcher's 1.5 s grace, and a server still
    there after the grace is killed. On macOS and Linux it leads its own process group, and whatever it started ends
    with it: the launcher ends the group when the app quits, and when the app was killed or crashed — even while the
    server was still starting — the server sees its parent gone and ends the group itself, SIGTERM first and SIGKILL a
    second later. A process started `detached` leaves the group. On Windows the job object ends them all with the app.
  - It runs in one process: a `main.ts` or an env asking for a gateway and replicas (`replica`, `solo: false`,
    `AKAN_SOLO=false`, `AKAN_REPLICA`, `AKAN_COMMAND_TYPE=start`) does not boot in the app, and says which.
  - A native plugin follows the server with `ctx.server.state` and `ctx.server.onState` (`starting`, `up`,
    `restarting`, `gaveUp`, `stopped`), and a page with the `app` plugin's `serverState` event, so an app nobody attends
    can act on a server that gave up (`app.relaunch()`, say).
  - `XAUTHORITY`, `PULSE_COOKIE`, `PULSE_RUNTIME_PATH` and `XDG_DATA_DIRS` reach it too. A second launch that hands
    over to the first starts none. The single-instance plugin comes with it.
  - `akan start-desktop` without `--release`, for such a target, follows this checkout's dev server already answering on
    the app's dev port, or starts `akan start` in the same command and opens the app once it serves; it asks for one
    target before it starts one, needs `single` as a release does, and stops at once when that dev server fails to boot
    (a replica's crash loop included) instead of waiting it out. Ctrl+C or closing the app stops the app, then the dev
    server it started, then the local database, one after another, and exits 130.
  - `akan start-desktop --release` of such a target shows the carried server's lines at the level its logger wrote them.
  - `AkanAppConfig.getProductionEnv()` is the env the image runs with; the Dockerfile's `ENV` lines come from it (same
    keys and order, without the two blank lines the template used to leave).

- ccf2ae2: `akan build-desktop --arch arm64|x64` picks the CPU a Windows or Linux desktop app runs on

  A desktop app is still built on its own OS, now for either of its CPUs: the Rust library is built for that target,
  the executable with `bun build --compile --target=bun-<os>-<arch>`, the carried server installs with
  `bun install --cpu=<arch>` so its addons' prebuilt binaries are that CPU's, and each `bin` entry is that platform's.
  The setup program and the AppImage name the CPU they hold. A macOS app is Apple silicon only: Intel Macs are not a
  target, so `--arch x64` on macOS is refused.

- ccf2ae2: `bin` in `akan.config.ts` puts executables in a desktop app, and the build says what the image installs that the app does not

  A desktop app ran whatever `ffmpeg` the user's computer had on its PATH, if any, and a Finder-launched app sees only
  `/usr/bin:/bin:/usr/sbin:/sbin`. `bin` names an executable and, per platform (`darwin-arm64`, `win32-x64`, …), where it
  comes from: a download with its `sha256` (an archive takes `file`, the executable inside it) or a path next to the
  declaring `akan.config.ts`. `build-desktop` and `start-desktop` fetch the file for the computer they build on, check it,
  and carry it in the app's `bin/`, which the app puts first on its PATH: the carried server's `spawn("ffmpeg")` runs
  that file, and a native plugin finds it in `ctx.binDir`. A download is kept as `download` plus its URL's extension
  (`.zip`, `.tar.xz`, `.exe`, …), never under a name the URL spells. Bun's own `spawn` without `env` reads the environment the app
  started with, so a plugin passes `env: process.env` to run one by name. A lib's entries reach the apps that depend on
  it, and an app's own entry of the same name wins. macOS builds sign every executable the app carries, in `bin/` and
  in the carried server, found by its Mach-O header rather than its name, so one a package ships without an extension
  passes Developer ID signing and notarization too. The image does not read `bin`: it still installs through `docker`.

  `build-desktop` of a target that carries its server now warns when the image runs `docker` steps (or the app writes
  its own Dockerfile) and the app carries no `bin`, since the carried server runs none of those steps.

- ccf2ae2: `desktop.server: { omit }` carries the desktop app's server without packages only the image needs

  `native: { desktop: { server: { omit: ["rclnodejs"] } } }` carries the server as `server: true` does, minus the named
  packages and whatever only they pull in: an addon tied to the image's system (a ROS install), or code only a process
  the desktop app never starts loads. The image's `package.json` keeps them, `externalLibs` included; the desktop
  server's `package.json`, its `bun install --production` and the addon check do not see them. A package another
  dependency still installs stops the build, naming the dependents, and the targets that carry one build's server must
  omit the same packages.

- ccf2ae2: A desktop app's server reads the files the user picks, with no copy and no path in the page

  `filePicker.pickFiles({ forServer: true })` (also `pickDirectory` and `saveFile`; `filePicker` is now exported from
  `akanjs/client/native`) copies nothing on the desktop, whatever the file's size: its FileRefs serve the originals,
  and each result carries a grant. The server exchanges the grant with `NativeFile.resolve(grant, "read" | "write" |
"folder")` from `akanjs/server`, or `NativeFile.resolveIn(folderGrant, relative)`. The carried server asks the shell
  that showed the dialog over its IPC channel, so it reaches what the user picked and nothing else; a debug build
  that carries its server does the same. Behind a dev build without one, `akan start` checks the grant's signature
  instead, in `operationMode` local only. A phone or the web refuses `forServer`.

  `resolveIn` judges a relative path by where it lands once the links on it are resolved — through its nearest existing
  folder when the file is about to be written — so a link inside the granted folder cannot take it elsewhere, and a
  dangling link is refused. A name that starts with two dots (`..cache/x`) is inside the folder, not above it.

- ccf2ae2: `akan build-desktop --installer true` on Linux adds an AppImage

  The app folder gains an `AppRun`, a `.desktop` entry naming the app's icon and its `deepLinks.schemes`, and a 256px icon,
  and is packed with `mksquashfs` behind the AppImage type 2 runtime, pinned to a dated release and checked by its
  digest. The AppImage needs only the WebKitGTK 4.1 and GTK 3 the folder already needs, and runs without FUSE through
  `--appimage-extract-and-run`. It runs from a read-only image, so the updates plugin cannot replace it: an app with
  `updates` is warned to publish a new AppImage for each release.

- ccf2ae2: A macOS desktop release can be downloaded: Developer ID signing, the hardened runtime, notarization and a dmg

  `akan build-desktop` signs with a Developer ID when `AKAN_NATIVE_MACOS_IDENTITY` names one in a keychain, or
  `AKAN_NATIVE_MACOS_CERTIFICATE` + `_CERTIFICATE_PASSWORD` a `.p12` (imported into a keychain made for the build and
  deleted after it, for CI). Every Mach-O file is signed inside out with the hardened runtime and a secure timestamp, and
  the executable gets Bun's JIT entitlements plus the camera's or microphone's when a usage text asks for them;
  `native.desktop.entitlements` adds the app's own. With `AKAN_NATIVE_MACOS_NOTARY_KEY` + `_KEY_ID` + `_ISSUER` (an App
  Store Connect API key) or `_NOTARY_PROFILE`, the app is notarized, stapled and checked with `spctl`.
  `--installer true` on macOS adds a dmg with an Applications link, signed, notarized and stapled the same way.
  `publish-update` signs a macOS release with the same identity, since the updater checks the installed app's signature.
  A release that is not signed with a Developer ID, or not notarized, warns that Gatekeeper blocks a downloaded copy.

- ccf2ae2: Mobile apps build and run on `@akanjs/native` instead of Capacitor.

  The runtime ships inside `akanjs` (vendored, not published on its own), so an app installs nothing extra for it.
  It generates each target's native projects under `.akan/native/<target>/build/<platform>` and loads the web
  root it assembles in `.akan/native/<target>/web` from the production CSR build — nothing native is committed.

  - **Configuration (`akan.config.ts`).** A `native` section, and each of its `targets`, takes `appName`, `appId`,
    `fileName`, `version`, `buildNum`, `basePath`, `indexPath`, `icon`, `splash`, `permissions`, `plugins` (builtin
    ids such as `iap`), `deepLinks`, `ios.{infoPlist, entitlements, files}` and
    `android.{manifest, application, activity, googleServices, files}`; a target overrides the section field by field.
    `files` maps where a file lands (a path in the iOS app bundle, `res/<type>/<file>` or `assets/<path>` on Android)
    to its source. A Capacitor-era key fails, naming the keys the section takes.
  - **Plugins declare, they do not edit projects.** `AkanPlugin.native` names the permission it serves and what the
    target then needs: native plugins, usage texts, plist and entitlement entries, Android permissions and features.
    It replaces `capacitor.configureNative`, `editIosAppDelegate` and `runtimePackages`. A release build names each
    plugin's default permissions as its capabilities.
  - **Commands.** `build-`, `start-` and `release-ios|android` go through the runtime. `start-*` follows `akan start`
    (it refuses when no dev server answers), runs one target at a time and takes `--device` (and `--team`/`-T` on
    iOS); `--release` runs a release build of its own bundle. `release-ios` takes `--team` and `--ad-hoc`;
    `release-android` builds an `.aab` by default (`--assemble-type apk` for an `.apk`), signed from
    `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_STORE_PASSWORD` and `MYAPP_RELEASE_KEY_ALIAS` (plus
    `MYAPP_RELEASE_KEY_PASSWORD` when the key has its own), which it checks before anything builds. `build-*` take
    `--debug`, and
    `akan doctor --ios` adds the native toolchain checks.
  - **Pages.** `akanjs/client/native` wraps the native plugins a page uses, and `isNativeApp()` is true only inside
    a shell. `Device` reads the runtime's device plugin and safe-area variables, `storage` the shell's preferences,
    and the new `secretStorage` keeps the JWT and refresh tokens in the OS credential store (cleared on the first
    launch after a reinstall). `useCamera` is one hook — the native sheet asks camera or library and answers an
    upright JPEG data URL — and `useGeoLocation` answers the flat native position. A native release bundle opened at
    `/` starts on its target's home, and a target opened in a browser is a web device.

  **Breaking, with a migration path.**

  - Delete the app's `ios/`, `android/`, `mobile/` folders and `capacitor.config.*`: `akan sync`, `akan doctor` and
    `akan quality scan` now refuse them in an app root and say why.
  - Move Capacitor settings to the keys above; `google-services.json` goes to `native.android.googleServices`, and
    `GoogleService-Info.plist` is no longer needed.
  - Removed: `-g/--regenerate`, `--open`, `--allow-provisioning-updates`, `configure-app`, `codepush`,
    `release-source`, `capacitor.base.config`, `useContact`, `useCodepush`, the native path of `useSpeech`, and every
    `@capacitor/*`, `@capacitor-community/*`, `@capgo/*`, `capacitor-plugin-safe-area`, `cordova-plugin-purchase`
    and `@trapezedev/project` dependency — `akanjs` no longer lists them as peers.
  - `baseSt` drops `deviceToken`; the notification store owns it.

- ccf2ae2: `native` in `akan.config.ts` replaces `mobile`, with each platform's settings in a section of its own

  **Breaking:** `mobile` is gone with no fallback; a config that still has it, or a key that moved, stops and names the
  new place. `native` and each of `native.targets` take the same fields, a target merging objects key by key and
  replacing lists and every other value, and without `targets` the app has one target, `default`. The next `akan start`
  removes the old `.akan/mobile`.

  The agent guide `akan agent install` writes now covers native apps: the `native` section, the `start-*` / `build-*`
  commands and updates, with the full contract in the `runtimeRule` guideline.

  | Before                                                                             | Now                                                                                                                                   |
  | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `mobile`                                                                           | `native`                                                                                                                              |
  | `mobile.native.X`, `targets.<t>.native.X` (`plugins`, `ios`, `android`, `desktop`) | `native.X`, `native.targets.<t>.X`                                                                                                    |
  | `native.push.android`                                                              | `android.push`                                                                                                                        |
  | `native.privacy`                                                                   | `ios.privacy`                                                                                                                         |
  | `assets.icon`, `assets.splash`                                                     | `icon`, `splash`                                                                                                                      |
  | `files["ios/<path>"]`                                                              | `ios.files["<path>"]`                                                                                                                 |
  | `files["android/res/…"]`, `files["android/assets/…"]`                              | `android.files["res/…"]`, `android.files["assets/…"]`                                                                                 |
  | `deepLinks.ios.teamId`                                                             | `ios.teamId`                                                                                                                          |
  | `deepLinks.android.sha256CertFingerprints`                                         | `android.sha256CertFingerprints`                                                                                                      |
  | `indexPath` on a target only                                                       | on `native` too, inherited by every target                                                                                            |
  | root and target `plugins` joined, Android XML lists appended                       | the target's list replaces                                                                                                            |
  | `.akan/mobile/<target>/native/<platform>`                                          | `.akan/native/<target>/build/<platform>`                                                                                              |
  | `.akan/mobile/<target>/{dev,updates,web,bin}`                                      | `.akan/native/<target>/{dev,updates,web,bin}`                                                                                         |
  | `AkanMobileConfig`, `AkanMobileTargetConfig`                                       | `AkanNativeAppConfig` (resolved: `AkanNativeAppResult`), `AkanNativeTarget`; `AkanNativeSettings` is what `native` and a target share |
  | `AkanMobileUpdatesConfig`, `AkanMobileAppId`, `AkanMobileTargetDeepLinks`          | `AkanNativeUpdatesConfig`, `AkanNativeAppId`, `AkanNativeDeepLinks`                                                                   |
  | `AkanMobileNativeConfig`                                                           | `AkanNativeIosConfig`, `AkanNativeAndroidConfig`, `AkanNativeDesktopConfig`                                                           |
  | `AkanMobileTargetAssets`, `AkanMobileTargetFiles`                                  | removed: `icon`, `splash` and each platform's `files`                                                                                 |
  | `MobilePermission`, `MobileEnv`, `AppConfigResult.mobile`                          | `NativePermission`, `NativeEnv`, `AppConfigResult.native`                                                                             |

- 5f53462: `akan subspace upload-env <name>` sends one subspace's env to the cloud workspace it deploys from

  A subspace's `env/` values were the one thing the mirror had no way to move. Push holds them back and pull
  leaves them alone — deliberately, because the values belong to the repo that deploys — so getting a changed
  value into a customer's deployment meant running `akan upload-env` from somewhere that had both the values and
  that customer's `AKAN_WORKSPACE_ID`, which is nowhere: a workspace has every customer's values and exactly one
  id, its own.

  `SubspaceDeclaration` now carries an optional `workspaceId`, the cloud workspace that subspace deploys from,
  and `akan subspace upload-env <name>` uploads against it. `akan.subspace.ts` is a workspace-only entry that no
  push ever ships, so declaring every customer's id there puts none of them in a customer's repo.

  What is uploaded is the slice a push ships — the declared apps, the libraries their closure pulls in, and those
  apps' `secrets` globs — and nothing else. The whole workspace would be the simpler thing to send, and it is the
  wrong one: an env archive is replaced whole on arrival, so one customer's cloud workspace would end up holding
  every other customer's secrets. `CloudRunner.gatherEnvFiles` takes that scope and an archive path (the slice
  lands in `local/env.<name>.tar`, never over the full `local/env.tar`), while the `akan:secrets` block it
  maintains in the root `.gitignore` keeps being written from every app in the workspace — narrowing that file to
  one slice would silently un-ignore every other app's secrets.

  Because the upload replaces an archive in a repo you are not standing in, three things are refused rather than
  guessed: a subspace with no `workspaceId`, a subspace declaring this workspace's own id (a slice uploaded there
  would leave the workspace's next `download-env` short of every other app), and two subspaces declaring the same
  id. The command asks for confirmation before it replaces anything, naming the subspace and the cloud workspace;
  `-F, --force` skips the question, and with no terminal to ask in the command refuses instead of assuming yes.
  (`-f` is already `--format` and `-y` already `--verify`.)

  The direction is one-way on purpose. There is no `subspace download-env`: it would write a customer's values
  over the workspace's own copies, and which of the two is right is not something a command can know.

- ccf2ae2: `trustedDependencies` in `akan.config.ts` names the packages whose install scripts run where the app is installed

  `bun install --production` skips every dependency's install and postinstall scripts unless the package is trusted, so
  a native addon that builds itself at install time (one that ships no prebuilds) reached the image unbuilt and failed
  at its first call. An app or a lib now lists those packages in `trustedDependencies`; the built `package.json`
  carries the list, and both the image and a desktop app's server run their scripts. A lib's list reaches every app.

- ccf2ae2: A Windows desktop release is signed with Authenticode

  With `AKAN_NATIVE_WINDOWS_CERTIFICATE` + `_CERTIFICATE_PASSWORD` (a `.pfx`), `AKAN_NATIVE_WINDOWS_THUMBPRINT` (a
  certificate in the store) or `AKAN_NATIVE_WINDOWS_SIGN_COMMAND` (a JSON array run once per file with `{file}`, for Azure
  Trusted Signing or a cloud HSM), `akan build-desktop` signs every PE file of the app — the executable, its DLL, the
  server's addons and `bin` — SHA-256 with an RFC 3161 timestamp (`AKAN_NATIVE_WINDOWS_TIMESTAMP_URL`), and verifies them.
  `--installer` signs the setup program and, through makensis's `!uninstfinalize`, the uninstaller it writes; the
  settings reach the signer through the environment only. `publish-update` signs a Windows release the same way, and an
  unsigned release build warns that SmartScreen flags a downloaded copy.

### Patch Changes

- 5f53462: fix(tunnel): reach the tunnel control plane at its real path, and report the status instead of parsing the error page

  `akan tunnel` and `akan start --share` could not open a share at all: `CloudApi` called `/api/requestTunnel`,
  `/api/tunnelListInSelf` and `/api/revokeTunnel`, none of which exist. An endpoint's path carries the model's
  refName — `fetch.serializer.ts` takes it from `sliceCls.srv.cnst?.refName` — so every database module's endpoints
  sit under a segment of their own and the service modules beside them do not. `tunnel` is a database module; its
  neighbours in the same file, `uploadEnv` and `getRemoteSelf`, belong to the `_cloud` service module and have no
  `cnst` to take a prefix from. The three paths now carry `/tunnel/`, with a note saying why they differ from the
  methods above them.

  **The 404 was invisible, which is the more expensive half.** `HttpClient.get` and `post` called `response.json()`
  without looking at `response.ok`, so the control plane's HTML error page reached the user as
  `JSON Parse error: Unrecognized token '<'` — a parse error where the status line had already said `404 Not Found`.
  Both now read the status first and throw with it, matching `getFile`, which has always done so.

  Three failures were being swallowed the same way and now surface:

  - `uploadEnv` returned the parsed error body, which is a truthy object, so **a failed env upload reported success**
    and the project went on to build against env that never arrived.
  - `getRemoteSelf` and `getRemoteAuthToken` are written to catch and answer `null`; with nothing thrown they
    answered an error object instead.
  - `refreshAuthToken` fed a rejected response straight into `toAccessToken`, minting a token from it.

- ccf2ae2: fix: a dev server whose replica crash-loops reports it at once

  When an app's `init` threw at every boot, the gateway gave up on the replica and waited for a code change, but the dev
  host kept reporting the app as starting: `akan start` showed no reason and held its next wave of apps for 180 s, and
  `akan start-desktop` waited 180 s before it gave up. The host now reports the app `failed` with the gateway's message
  as soon as it gives up; `akan start` keeps running and shows the app ready again after the fix is saved.

- 3ebd8e1: fix(agent): stop a workspace's agent guide and lint config from freezing at the release that created it

  `createWorkspace` copies the whole `templates/workspaceRoot` tree — 21 `.cursor/rules/*.mdc`, `AGENTS.md`,
  `biome.json`, `tsconfig.json` — but the only maintenance path, `generateAgentRules`, rewrites three of them, and
  `akan agent install` refreshes only the `akan:agent` block inside `AGENTS.md`. Twenty-one files created, three
  maintained: everything else was a one-time copy that no framework release could ever reach. Adding one lint rule
  meant writing the same sentence into `AGENTS.md`, `.cursor/rules/lint-enforced-rules.mdc`, its `.mdc.template`,
  `AGENTS.md.template`, `biome.json`, and `biome.json.template` — and even then, no existing workspace saw it.

  Four changes, ordered by how much drift each removes.

  **Lint config now extends a config shipped in the package.** `@akanjs/devkit/biome.base.json` carries the
  formatter, the rule set, and every grit plugin registration; a workspace `biome.json` is `extends` plus its own
  `files.includes`. Biome resolves the specifier through node*modules (it does not consult the package `exports`
  map), and `plugins` paths inside an extended config resolve from the entry config's directory, so the
  `./node_modules/@akanjs/devkit/lint/*.grit`form the template already used is correct. Rule changes now reach a
workspace on`bun update`with no command to run. Two merge behaviours decided the split:`overrides`concatenate,
so the generated-file opt-out moved there from`files.includes`, which \_replaces* and would silently drop the base
list the moment a workspace added one exclusion of its own. Because Biome moves rules between groups across minors
(`noUnnecessaryConditions`is`nursery`at 2.4 and`suspicious`at 2.5, and the old position is a hard error), the
base config and the Biome version travel together:`biomeBase.ts`pins the version`createWorkspace`installs
instead of resolving`latest`.

  **The conventions body moved into the managed block.** It now ships as the `conventions` guideline and renders
  between the `akan:agent` markers, so `akan agent install` refreshes it. `AGENTS.md.template` carried a _second_,
  independently written 990-line convention guide — not a copy of the repo's 791-line one, a parallel fork — which
  became the `workspaceOnboarding` guideline. Onboarding renders only outside the framework monorepo, where it would
  otherwise double an always-loaded file for readers who are changing Akan rather than building on it. The two
  guides still overlap and would repay a merge.

  **The 20 duplicate Cursor rules are gone.** `akan.mdc` is `alwaysApply: true` plus `@AGENTS.md`, so the per-topic
  `.mdc` files were a second copy of the same rules drifting on their own schedule. This repo had all 20 and no
  `akan.mdc` at all; it now has the pointer and nothing else.

  **`akan doctor` reports drift.** The block is stamped with the `@akanjs/devkit` version that rendered it, and
  doctor warns `agent-guide-stale` (or `agent-guide-unstamped`) with `akan agent install agents-md` as the repair.

  **`repoName` no longer comes from the folder name.** `WorkspaceExecutor.fromRoot` defaulted to
  `path.basename(process.cwd())`, so every generated file that names the repo — the `AGENTS.md` title, its `- Repo:`
  line — depended on what each person called the directory they cloned into, and the committed diff never settled.
  It now resolves from the `origin` remote, falling back to the directory name when there is no git or no remote.
  `AKAN_PUBLIC_REPO_NAME` is deliberately not consulted: that is a deployment namespace (queue prefixes, cache keys,
  secret paths) which a monorepo hosting several products legitimately points elsewhere.

  Two bugs surfaced on the way. `## Validation` listed `akan quality scan` and `akan quality ssr` in a _generated_
  section — hand-added, and due to be wiped by the next install; they are in the generator's list now. And
  `no-throw-raw-error` exempted `apps/akan/env/**` by name, so `apps/minimal/env/*` failed a rule the guide said did
  not apply to `env/`; the exemption is `**/env/**`. Lint output over the whole repo is otherwise byte-identical
  before and after, and formatter output is unchanged.

  Biome itself moves to **2.5.8** in the same change, so the shared config targets the current release rather than
  freezing the ecosystem at 2.4.4 — workspaces created before this already installed a 2.5.x, and pinning backwards
  would have made adoption a downgrade. The jump adds 263 diagnostics across the monorepo, but only **32 of them are
  in `apps/` and `libs/`** (30 `noUnnecessaryConditions`, 2 `useArrayFind`) and the rest are in the framework's own
  `pkgs/`. No scope regressed from passing to failing: `akan lint minimal`, the one green scope, is still green, and
  `apps/akan`, `libs/util`, and `libs/shared` were already failing on 2.4.4 with pre-existing errors. Every grit
  plugin was re-verified against 2.5.8. `noUnnecessaryConditions` stays at `error` and now reports 220 repo-wide,
  190 of them in `pkgs/` — a real backlog, and a deliberate one to leave visible rather than downgrade to a warning.

  Existing workspaces keep working untouched — they simply stay frozen at the release that created them, which
  `akan doctor` now reports. The migration guide walks through adopting the change in four steps, only one of which
  needs a human decision.

- 5f53462: An endpoint's declared `timeout` bounds the call, on both ends, instead of being read by nobody

  `mutation(cnst.X, { timeout: 5 * 60 * 1000 })` could not work. The value had exactly one reader — the `Timeout`
  middleware, which no app registers because it is opt-in — it was never serialized to the client, `FetchPolicy.timeout`
  was accepted by the public type and dropped by `#makeHttpFn`, and `HttpClient` was constructed without one, so every
  non-upload request was abandoned at the client's hard-coded 30 seconds and restored as `base.error.gatewayTimeout`.
  Anything whose real work outlives half a minute — hardware provisioning, a firmware flow, an SSH round trip, an
  external orchestration — was unreachable from a browser, and the declaration on the endpoint read as if it were
  configured.

  The declared value now travels. `FetchSerializer` puts it on the serialized endpoint and `fetch.<endpoint>()` makes
  it that request's budget, a caller overrides it per call with `{ timeout }` (`false` waits as long as the runtime
  will), and an app moves its own default with `fetch.instance.setTimeout(ms)` — precedence caller, endpoint,
  client default, with an upload still bounded by nothing. Server side the middleware is registered by default and has
  **no default of its own**: it stands aside for every endpoint that declared nothing, which is what makes registering
  it safe, and what made the 5-second fallback it used to apply the reason it could not be. It now rejects with a 504
  carrying `base.error.gatewayTimeout` rather than a bare `Error` that `SignalFailure` generalized to a 500, so both
  sides of a deadline produce the sentence the dictionary already had, and it clears its timer — the loser of the race
  was a pending timer per call, holding the event loop for the whole budget on a call that answered immediately.

  What is still true, and is now written down: losing the race does not cancel the work. `Promise.race` cannot reach
  into `next()`, so a handler that timed out runs to completion with nobody holding its result. A `timeout` bounds
  what a caller waits for; an operation that must not half-happen needs its own idempotency.

  `cache` had the same shape and got the same treatment. The `Cache` middleware was opt-in, ignored the declared
  `cache` value for a hard-coded 60 seconds, and — had anyone registered it — would have cached every endpoint in
  the app including mutations, under a key that names only the endpoint and its arguments, on a hit that skips
  `next()` and therefore skips the guards. It is now registered by default, reads the declared value as its TTL,
  runs `context.checkGuards()` before handing an entry over, and takes an entry only for a `query` that declares no
  internal argument — internal arguments are how a call learns who is asking, so an endpoint that has them answers
  per caller and a shared entry would be one caller's answer handed to the next. A `mutation` or a per-caller query
  that declares `cache` is named once in the log instead of being silently ignored, and a cache backend that is down
  is warned about rather than failing the call.

  `Retry` is removed. Three attempts with a fixed backoff, on an endpoint whose failure it cannot classify, replays
  whatever the first attempt already did — and it was unreferenced.

- 5f53462: fix(cli): scaffolds name their guards, and the mobile and package commands do what they say

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

- 3ebd8e1: feat(lint): enforce the client/server import boundary in both directions

  The layering was documented but nothing checked it. A `.tsx` could `import * as db from "../db"`, a `*.service.ts`
  could `import { st } from "@libs/shared/client"`, and a `*.constant.ts` could reach either side — each one a value
  edge that drags the whole opposite graph along. In the client direction that means the database driver,
  `node:crypto`, and any secret resolved from `process.env` land in the browser bundle; in the server direction it
  means React, the store, and the browser globals underneath them load into every CLI command, worker, and migration
  that touches a service. Both usually fail the build rather than failing at runtime, and the failure names a
  transitive module, never the import that caused it.

  Two rules now hold the line, symmetric by design:

  - `no-import-server-in-client.grit` runs on client files (`ui/`, `webkit/`, `page/`, `*.store.ts`, every `.tsx`) and
    bans `*.document` / `*.dictionary` / `*.service` / `*.signal` modules, `srvkit/`, package `server` entrypoints
    including `akanjs/server`, and the `db` / `srv` / `sig` / `dict` / `option` / `useServer` barrels.
  - `no-import-client-in-server.grit` runs on server files (those four suffixes plus `srvkit/`) and bans `*.store`
    modules, module components (`*.Template` / `*.Unit` / `*.Util` / `*.View` / `*.Zone`), `ui/`, `webkit/`, package
    `client` entrypoints including `akanjs/client`, and the `st` / `store` / `useClient` barrels.

  Shared files — `common/` and `*.constant.ts` — are wired into **both** overrides, so they reach neither side, which
  is what makes them safe for either to import.

  `import type` is exempt in both directions: it is erased before bundling, so it emits no edge, and a shared file
  that only needs to name a server-side type (`libs/shared/lib/summary/summary.constant.ts` names `UserFilter` from
  `user.document`) stays legal. A mixed value-and-type import is not exempt — it emits a real edge. Test files are
  excluded, as are `pkgs/akanjs/**`, which implements the boundary and is where the two graphs legitimately meet.

  Both rules land green: no `apps/**` or `libs/**` file crosses the boundary today, so this is a ratchet, not a
  migration.

- 2d8de1c: fix(cloud): an `akan` command started while another is refreshing the cloud session waits for it

  A command that read `~/.akan/config.json` while another process was mid-refresh saw the session with its refresh
  token already taken and went ahead without signing in. It now waits for that refresh under the same lock and uses the
  session it stored.

- 2d8de1c: fix(cloud): a cloud session in its last hour is refreshed, once across every running `akan` process

  A stored cloud session within an hour of expiry, or past it, was treated as signed out: nothing ever called the
  refresh endpoint, so `akan login` reopened the browser about once a week and `akan tunnel` answered a raw 401 in
  that window. Every command that reaches the cloud — `login`, `upload-env`, `download-env`, `tunnel` and
  `start --share` — now refreshes such a session before using it, and `akan login` only opens the browser when the
  refresh fails.

  The refresh is written for a cloud that rotates the refresh token on every use and treats a second use as theft,
  revoking every session of the account, browser included:

  - It runs under a lock beside `~/.akan/config.json`, held across CLI processes, and re-reads the file once it has
    the lock, so of two commands started together only one refreshes and the other uses its result. A lock whose
    holder has exited is taken over; one whose holder is still running is waited for, and a refresh is never made
    without it.
  - The refresh token leaves the file before it is sent, and the new pair is written before it is used. A command
    killed mid-refresh, or a refresh that fails, therefore leaves no token that could be presented a second time;
    the cost is one browser sign-in.
  - Every other write to the file (hosts, remote env servers, test targets) re-reads under the same lock, so none can
    put back a token that was rotated away, and the file is replaced atomically with mode 0600, so a concurrent
    reader never sees half of it.

- 8c31d54: fix: `akan code` says when compaction failed, leaves the Claude Code-sized buffer, and resolves its default model

  **A failed compaction read as a successful one.** The engine reports a compaction that failed or was cancelled on
  the same `compaction_end` event as one that worked, with `errorMessage` and `aborted` beside the reason. The wire
  kept only the reason, so every end printed "Compacted the conversation" — including an automatic compaction that
  had failed, which nobody else reports, leaving the next sign of it an overflow error turns later. The `compaction`
  frame now carries `error` and `aborted`, and the transcript prints the engine's own sentence as a warning, or
  "Compaction cancelled.". A failed `/compact` still reports once, through the caller it threw to.

  **The buffer is 32,768 tokens, up from the engine's 16,384.** On a million-token window that moves the threshold
  from 98.4% to 96.7% — where Claude Code compacts. The reserve is all the room the response at the threshold gets
  (the request clamps its output to the window less the prompt less 4,096), so at 16k a reasoning model ran out
  mid-thought there and the recovery re-sent a near-full window to retry. It is also the summary's output cap at 80%.
  The small-window warning now reads the settings the session actually runs with rather than the engine's defaults.

  **The default model is `deepseek/deepseek-flash`.** `deepseek-v4-flash` is gone from both the engine's catalogue
  and DeepSeek's own model list, so the default resolved to nothing and `akan code` silently ran on whichever model
  sorted first among those with a key.

- 5f53462: fix(console): a production `akan console` brings services up and starts no schedule

  The `console.js` an `akan build` writes never marked its process as a console, so `server.start()` took the replica
  branch: it registered every `interval` / `cron` / queue worker, ran every internal `init()`, and opened the log
  transport — a second scheduler inside a running deployment. The shim now marks the process before it loads the
  server, the same way `akan console` does in development, so a console runs service and adaptor `onInit` and nothing
  the internals schedule.

  `assertAkanConsoleAllowed()` was handed `server.env`, which carries neither `environment` nor `operationMode`, so it
  effectively checked `NODE_ENV` alone. Called with no argument it now reads the deployment from `AKAN_PUBLIC_ENV` /
  `AKAN_PUBLIC_OPERATION_MODE` (deriving the mode the way `getEnv()` does): a `main` environment, a `cloud` or `edge`
  operation mode, or `NODE_ENV=production` refuses the console unless `AKAN_CONSOLE=1`.

- 69f7178: fix(css): fail the build on a stylesheet import that resolves to nothing, and let a lib own its design tokens

  Two halves of the same problem, reported together. An `@import` the pipeline could not resolve was allowed to
  produce nothing, and a lib had nowhere to declare the colours its own components pin — so the workaround was to
  copy one vendor palette into every app's stylesheet, where a single missed import broke that app alone, silently.
  Since vocabulary closure (`@theme { --color-*: initial }`) makes a component whose token declaration never
  arrived render unstyled rather than wrong, the quiet half is the dangerous one.

  **Every specifier is verified, path-shaped ones included.** `@import "./missing.css"` and
  `@import "../../../libs/shared/ui/brand.css"` used to be turned into a path without asking whether a file was
  there, surfacing later as a bare `ENOENT` that names no importer — or, in the dev server, as one log line while
  the previous CSS kept serving. They now raise the same `[css] failed to resolve stylesheet import "…" from …`
  error a bare specifier already did, naming the path that was tried.

  **A package subpath resolves literally or not at all.** `@import "@libs/shared/ui/brand.css"` fell back to the
  package's own `style` entry (`pkg.exports["."].style`, `pkg.style`, `index.css`) when the subpath was not in
  `exports` — loading a _different_ stylesheet than the author asked for and reporting success. The fallback now
  applies only to the bare package name.

  **`libs/<lib>/ui/tokens.css` is the one CSS file a lib owns.** Plain `:root` custom properties for colours pinned
  by someone else's brand guide — Kakao `#fee500`, Naver `#1ec800` — or by a fixed surface. Every app whose page
  graph reaches that lib compiles the file automatically, ordered ahead of the app's own stylesheets so the app
  stays the last word on any variable both declare. Nothing is imported by hand and adding an app cannot forget it.
  Reference them as `bg-[var(--kakao)]`, which `no-arbitrary-color` allows by design; `@theme` extensions stay in
  the app stylesheet, because the colour vocabulary is closed per stylesheet.

  **A stylesheet under `page/` that no route imports now warns.** It compiles to nothing and reports success, which
  reads exactly like an empty theme — the failure the two fixes above cannot see, because nothing ever asked for
  the file.

  **An `@import` that resolved, was read, and still contributed nothing now warns twice over.** Custom properties
  declared outside `@theme` pass through Tailwind verbatim, so a stylesheet whose every declaration is missing from
  the output did not make it in, whatever dropped it — the last shape of this bug that no check upstream of the
  output can see. The compiled text is checked per compiled stylesheet, and the written asset is checked again
  against the imports of its own base path, because those are two different places a declaration can go missing: a
  build that ships a token to the CSR bundle and not to `styles/<base>-<hash>.css` renders unstyled on a
  server-rendered page while looking correct in the browser bundle. Each resolution also logs at `verbose` with the
  specifier, the importer, the resolved path, and the byte count.

  A name that survives only because something else declares it — an app overriding a lib token, which is the
  ordering this release introduces — keeps the check quiet: the warning fires only when _no_ declaration of the
  imported file's own names is present anywhere in the asset.

- ccf2ae2: fix: `start-ios`, `start-android` and `start-desktop` follow only their own app's dev server

  - A dev server that answered on the app's dev port was taken for the app's, even when it was another app's, and the
    app opened that server's pages. The command now reads the gateway's `/_akan/app/info` and stops with the name of the
    app it found; a port held by something that is not an akan dev server stops it too. A local dev server also names
    its checkout there (`workspaceRoot`), so the same app's `akan start` from another checkout (a worktree) stops it as
    well, with both paths; a dev server of an older akan that names none is still followed.

- 5f53462: `akan start` sizes its boot wave against the machine instead of always booting one app at a time.

  - With no `--concurrency`, the wave is `min(apps, half the memory budget / ~1.8GB per app, cores / 4)` and never
    below one, so a laptop boots its apps together while a small container still staggers them — which is the case
    the old default of 1 existed for. 1.8GB is a cold boot's peak: the SSR registry's boot build adds a build worker
    to every boot, and apps/akan's whole dev host peaks at about 1.76GB.
  - The next wave starts once each app of the previous one serves and its builder's boot builds have settled — the SSR
    registry's, and CSR's when `AKAN_DEV_CSR_REBUILD=1` arms it — or 30 seconds after it serves. The app shows as ready,
    and `--open` opens it, as soon as it serves.
  - The memory budget is the smaller of the host's RAM and `AKAN_MEMORY_LIMIT` / the cgroup limit. `os.freemem()` is
    not consulted: it counts free pages rather than reclaimable ones and reports ~0.3GB on an idle 48GB laptop, which
    would pin every machine to one app at a time.
  - The session prints the wave size and what set it, so a boot that still waits app by app says why.
  - `--concurrency <n>` is unchanged as an override and is clamped to the number of apps selected.

- ccf2ae2: fix: `start-ios`, `start-android` and `start-desktop` see a dev server that is still rendering its first page

  They probed the dev server by fetching its root path, which waits for a cold page render. On a Windows VM that took
  longer than the probe's 3 s, so the command said no dev server answered while `akan start` was up. The probe reads
  the gateway's own `/_akan/app/health` instead.

- bf27773: fix(cli): stop `akan start` from leaving the terminal in raw mode, which killed Ctrl+C

  A dev server that had been running for a few minutes stopped responding to Ctrl+C. The cause was not
  signal handling — the terminal had been left in **raw mode**, so with `isig` off the tty never turned
  `^C` into SIGINT at all. `kill -INT <pid>` still ended the process instantly, which is the tell.

  A Bun child snapshots the controlling terminal's termios when it is spawned and writes that snapshot
  back when it exits. ora's `discardStdin` holds the terminal raw for as long as a spinner runs, and the
  dev host spawns the builder and the backend under the "Preparing backend..." spinner — so those
  children snapshot a raw terminal. The spinner then restores it and Ctrl+C works, which is why a fresh
  `akan start` behaved. The first dev-host recycle (an `akan.config.ts` change, or regenerated runtime
  metadata such as `dict.ts` / `sig.ts`) SIGTERMs the builder, and its exit writes the stale raw termios
  back over a terminal nobody restores again. `Spinner` no longer takes stdin.

  Two nearby hazards with the same symptom are fixed as well.

  `Spinner` refuses to animate against a tty that reports **0 columns** — an unsized pty, which CI
  runners, `expect`/`script` harnesses and some detached panes produce. ora sizes its clear loop as
  `ceil(lineWidth / stream.columns)`, so zero made it `Infinity`: measured 750MB of cursor moves and
  8.7GB RSS inside a minute, in a loop past the point where SIGINT or SIGTERM could be handled, leaving
  SIGKILL as the only way out. Such a terminal now gets plain lines.

  `akan start`'s local-database teardown no longer hangs the exit. Registering a SIGINT listener
  replaces the kernel's "terminate now", so that handler became the only thing that could end the
  process — and it exited only if `docker compose down` succeeded. The teardown is now bounded
  (`ApplicationScript.dbShutdownTimeoutMs`, 20s), the exit runs even when it fails or times out, and a
  second Ctrl+C abandons it instead of queueing behind the first.

- 2d8de1c: fix(devkit): executor, doctor, barrel and code-agent fixes from the devkit/cli bug sweep

  - **Workspace apps, libs and packages are listed in name order**, not in the order the file system answered. It
    shows in pickers, `akan context` / `akan doctor` listings, the `## Workspace` lines `akan agent install` writes,
    and the order a lib's `docker.preRuns` / `postRuns` land in a generated Dockerfile, which is now the same on every
    build.
  - **Barrel import rewriting no longer drops re-exports when two barrels are analyzed at once.** Concurrent analyses
    shared one regex position, so a build could leave an import on the whole barrel, differently from build to build.
  - **`akan doctor`, `akan workflow validate` and MCP `doctor_workspace` ignore a malformed workflow artifact** instead
    of throwing a `TypeError`.
  - **`SysExecutor`'s module listings filter on each module's own file** — they returned every folder — and find a
    service module at `lib/_<name>/<name>.service.ts`. `getScalarDictionaryFiles` reads `lib/__scalar/`, and
    `getTsConfig({ refresh: true })` re-reads the config it extends.
  - `akan code`: a prompt typed instead of answering drops the questions and approvals it replaced, a session past
    512 KiB still shows in `/sessions`, and an MCP token refreshed without `expires_in` is kept until the server
    refuses it instead of being refreshed on every connect.

- 69f7178: fix: the first field run's findings — request context, module identity, and an honest agent surface

  Six fixes from running the in-page agent on a real product app, plus the one its own docs app hit.

  **Server components see the request again.** The RSC worker wrapped a render in `requestStorage.run(...)` only,
  and the flight stream pumps components after that scope has exited — every `getSelf()` read no cookies and
  bounced authed pages to `/signin`. The worker now keeps a request fallback pushed until the render settles, the
  same discipline `ssrFromRscRenderer` already used. The stack is global and last-push-wins across concurrent
  renders; pumping the flight render inside the ALS scope itself is the follow-up that removes the caveat.

  **`akanjs/fetch` is a vendor shared module.** It was bundled separately into the app and the vendored
  `akanjs/store` chunk, so `FetchClient`'s static serialized-signal registry split in two and the agent catalogue
  silently read the empty copy — every endpoint-named action refused as undescribed. The registry also moved to a
  `globalThis` symbol (the anchoring the shared client proxy already had), so a future duplicated module instance
  degrades to nothing instead of an empty surface.

  **The relay's return scalar registers on the client graph.** `agentTurn` lived in `akanjs/signal`, which no
  client bundle loads, so the chat's first probe of `fetch.runAgentTurn` threw `No scalar constant model for
agentTurn`. The scalar now lives in `akanjs/fetch` and `FetchClient` itself force-registers it — Bun links a
  barrel's `export *` modules lazily per used binding and its transpiler drops unused imports, so only a real call
  survives to do that.

  **`labelOf` reads the `text: "title"` role as the `Set` it is.** It asserted `readonly string[]` and called
  `.find`, so every screen-context label on a search-indexed model threw.

  **`akan build` relaunches itself once with the app env in place.** Bun macros snapshot `process.env` at process
  start, so the env the build resolves and publishes later is invisible to them — and any hand-written
  `@libs/<lib>/server` import (the sanctioned cross-lib entrypoint) puts that lib's env files, which read
  `getEnv()` at module scope, into the `getSerializedSignal` macro graph. `AKAN_PUBLIC_APP_NAME` is the one
  required key a workspace root `.env` cannot carry, so the CLI build now spawns itself again with it set and the
  child does the real build — the `AKAN_PUBLIC_APP_NAME=<app> akan build <app>` workaround is built in. The
  relaunch decision compares the env the process was **born** with, never the live `process.env`: the command
  dispatcher writes the resolved app name into `process.env` before any command method runs, which satisfies
  runtime readers but not macros — a guard reading the live value never fires (that inert shape is what alpha.19
  shipped). A `Relaunching with AKAN_PUBLIC_APP_NAME=…` line in the build output is the observable proof. The
  generated `sig`/`dict`/`srv`/`db` barrels also stopped walking parent _server_ barrels (they import the lib's
  own `@libs/<lib>/lib/<facet>` modules after `akan sync`), and `FetchClient.from` resolves its origin tolerantly,
  so a lib whose graph stays clean serializes with no env at all.

  **The agent surface stops publishing two lies.** Form setters for the base document fields (`setIdOnX`,
  `setCreatedAtOnX`, `setUpdatedAtOnX`, `setRemovedAtOnX`) are no longer tools — the server stamps those. And an
  action named after an endpoint is published with the endpoint's schema only when it declares at least as many
  parameters: one declaring fewer would silently drop the borrowed tail and read stale form state, which shipped a
  resident SMS with the wrong unit number in the field run. Such an action is refused by name and warned once in
  the console; trailing extras beyond the endpoint's arguments stay legal, which is the generated
  `create<Model>(data, options?)` shape.

- 2d8de1c: fix(cli): a freshly created workspace builds and starts

  The sample app wrote `srvkit/AuthGuard.ts` and `srvkit/SessionInternalArg.ts`, but a `srvkit/` barrel exports only
  camelCase file names, so no `srvkit/index.ts` was generated. The first `akan build` failed with
  `TS2307: Cannot find module '@apps/<app>/srvkit'` and `akan start` with `Cannot find package '@apps/<app>'`. The
  sample now writes `srvkit/guards.ts` and `srvkit/internalArgs.ts`, the names the conventions give those files.

- 5f53462: The guideline set drops what only the removed code generator read

  Six guidelines existed for `AiSession`'s codegen contract and nothing else, and are gone:
  `docPageRule`, `docSyncRule`, `moduleCodegen`, `enumConstant`, `sharedUiUsage` and `utilUiUsage`. Nothing in the
  workspace or in any skill named them, and their bodies asked the model for a `// File: <path>` block contract that
  an agent with edit tools cannot use. `akan-module` no longer offers `moduleCodegen` as a deeper read.

  Every `<name>.generate.json` is deleted, along with `Prompter.getGuideJson` and the `GuideGenerateJson` /
  `GuideScan` / `GuideUpdate` types `@akanjs/devkit` re-exported. The `codegenPriority`, `scans` and `update.rules`
  fields they carried were read by nothing after the generator left; the only consumer was `akan guideline show
--format json` echoing them back.

  `akan guideline` therefore loses its `--format` option — `list` prints names and `show` prints one instruction,
  which is what both did in their default mode anyway. Guideline names drop from 35 to 29. What remains is the
  deep-dive set the `AGENTS.md` table points at, plus the three documents `akan agent install` composes the
  workspace guide from (`conventions`, `workspaceOnboarding`, `framework`). MCP `get_guideline`, the
  `akan://guidelines/<name>` resources and the `akan guideline list` / `show` commands are unchanged otherwise.

- c45ac6c: perf(build): stop shipping one dictionary copy per lib in the client bundle

  `lib/useClient.ts` inlined the full dictionary through a Bun macro in every app _and_ every lib. Because
  `lib/dict.ts` is cumulative — the generator writes `makeDictionary(<libs...>, { ownModules })`, so a scope's
  dictionary is the union of its lib deps' plus its own — an app that mounts `util` and `shared` bundled the same
  strings three times over. Measured on this workspace: util 17,408B + shared 111,756B + app 111,864B = 241,028B of
  dictionary in a CSR build, of which only the app's 111,864B is unique. The other 129KB was pure duplication.

  The lib copies were never even the ones in use. `registerClientRuntime` returns early for a `lib` scope once an
  `app` scope has registered (`clientRuntime.ts`), so the app's runtime always wins regardless of module evaluation
  order, and every lib payload was executed and thrown away.

  Libs now pass `{}`. Nothing else changes, because `Translator` state is global
  (`globalThis.__AKAN_TRANSLATOR_STATE__`): the constructor only seeds the shared map, and `l()` reads it through
  `Translator.translateByLocale`, so a lib resolves keys the app seeded. This is not a new code path — SSR builds
  already pass `{}` from every `useClient.ts` (`clientEntriesBundler` defines `AKAN_PUBLIC_RENDER_ENV` as `"ssr"`)
  and rely on `SSR.tsx` calling `Translator.replace`. CSR now behaves the same way.

  **Only the dictionary macro moved; `getSerializedSignal()` stays in libs.** `store()` consumes its signal
  eagerly at class-definition time — it reads `serializedSignal.slice` to generate slice state and actions, and
  `signal.fetch` to build form setters — and `store(sig.banner, …)` sits at module top level. Resolving `sig`
  lazily would throw whenever a lib store evaluated before the app registered its runtime, which RSC's
  per-`"use client"` entry splitting cannot guarantee. That leaves ~17KB of signal duplication per app in place.

  Verified by building `apps/akan` before and after: the CSR artifact drops 18,408B and the util dictionary marker
  goes from two copies to one. `apps/akan` only depends on `util`; a `util` + `shared` + app chain saves ~129KB.
  Lib test suites are unaffected — `akan test <lib>` loads `@libs/<lib>/server`, which exports `fetch` from
  `lib/sig.ts` and never evaluates `useClient.ts`.

  Run `akan sync` on each app and lib to regenerate `lib/useClient.ts`.

- 69f7178: fix(sync): hold libraries to the root layout allowlist, and check a library's own `page/` tree

  `apps/<app>/base` was refused by `akan sync`, `akan doctor` and `akan quality scan`; `libs/<lib>/base` passed all
  three. The rule lives in one file — `workspaceLayout.ts` exists precisely so the three tiers cannot disagree — but
  the call sites read it behind `exec.type === "app"` / `for (const app of context.apps)` / `segments[0] === "apps"`,
  so a library root was never compared to anything at all. A lib could carry a `base/`, a `helper.ts`, a stray
  `script/`, and every command stayed green.

  Libraries now answer to their own allowlist, and it is the app's minus what only an app can use: no `main.ts`, no
  `capacitor.config.ts`, no `.akan` / `android` / `ios` / `mobile` / `script` / `secrets`, because a library is never
  booted or packaged. `index.ts`, `README.md` and `tsconfig.spec.json` are added, since a library ships as a package.
  `public/` and `private/` stay, because `syncAssets` symlinks them into each consuming app.

  Three more places the same gate was one-sided:

  - `akan doctor` walked `context.apps` only. It now walks libraries too and reports `lib-root-unknown-entry` beside
    the existing `app-root-unknown-entry`.
  - `akan quality scan` warned on an unexpected app root _file_ and nothing else — not a library root file, and not a
    root _folder_ on either side, which is the shape `base/` actually takes. It now reports all four
    (`akan.layout.{app,lib}-root-{file,folder}`). Its `lib/` facet rule kept its own copy of the allowlist and flagged
    a `<model>.signal.test.ts` that `akan sync` explicitly permits; both now read the shared helper, and the rule is
    renamed `akan.layout.lib-facet-file` so its name no longer collides with the library root it was never about.
  - A library's `page/` folder was validated only once an app opted into it with `syncPageLibs`. An app checks route
    filenames in `getPageKeys`, which a library has no equivalent of, so `libs/<lib>/page/Component.tsx` synced clean
    in the library it belongs to and failed in somebody else's app. `akan sync <lib>` now reports it as a scan
    violation, from the same rule `validatePageSourceFile` throws — split out as `getPageSourceFileViolation` so the
    reason is available where throwing is the wrong answer.

- 69f7178: fix(lint): scope the module plugins to apps/libs, downgrade `noUnnecessaryConditions`, and stop truncating at 20

  Four reports from one workspace migration (5 apps, 11 libs, ~2,950 linted files), all in what the shared config
  and `akan lint` do rather than in what a rule finds.

  **`noUnnecessaryConditions` ships as `warn`.** Biome 2.5.8's inference, with `domains.types: "all"` on, is wrong
  on three shapes this framework uses everywhere — reproduced here, not taken on report: `useRef(false).current`
  narrowed to its initial literal, `useRef<HTMLTextAreaElement>(null).current` treated as non-null, a `#private`
  boolean flag narrowed the same way, and `RegExp.prototype.exec()` treated as non-nullable. Of 86 findings in the
  reporting workspace 65 were of those shapes, where deleting the guard is a null dereference. The 21 real findings
  are worth keeping, so the rule stays on as a warning rather than being dropped.

  **The akan-module plugins apply to `apps/**`and`libs/**` only.** `no-import-external-library` was scoped to a
  bare `**/index.ts`, so it fired on any package entry in the workspace — a Hardhat package whose public surface
  genuinely _is_ third-party types had no way out but a nested `biome.json` for the whole subtree, which replaces
  the parent's config rather than merging. Same scoping for `no-deep-internal-import`,
  `no-redeclare-predefined-endpoint`, `no-return-in-store-action`, `no-js-private-class-method`, and the
  server-component plugins. `no-bang-comment-in-client` stays broad on purpose: it is about browser-reachable code,
  not about akan module conventions, and a `//!` shipping to every visitor is no better in a plain package.

  **`**/lib/\_\_lib/**` joins the generated-file override.** It is scaffolded, gitignored, regenerated by `akan sync`,
  and unused-import-clean by construction — so `biome check --write` stripped the imports and the next sync put
  them back, 116 diagnostics per lap.

  **`akan lint` prints up to 200 diagnostics** and takes `--max-diagnostics <n>` (`0` for no limit). Biome's default
  is 20; a run that shows 20 of 44 reads as "20 problems left", so a change in the _mix_ of findings looks like
  progress.

  **`akan lint` pins the config path.** `biome.json` is strict JSON, and a JSONC comment in it makes Biome 2.5.8
  fall back to config discovery instead of reporting the parse error — it then aborts on whatever nested root
  config the walk finds, typically inside a directory `files.includes` excludes, naming a file the author never
  touched. With `--config-path` the parse error lands on the offending line. `Linter` and the workspace runner also
  accept `biome.jsonc`, which is where a comment is legal, and the workspace template now excludes `.claude` so an
  agent worktree's stale config is not in the walk to begin with.

  Grit plugin diagnostics _are_ suppressible, contrary to the report: the category is `lint/plugin`, so
  `// biome-ignore lint/plugin: <reason>` and `// biome-ignore-all lint/plugin: <reason>` both work. The bare
  `// biome-ignore plugin:` form Biome's own diagnostic label suggests does not. Written down in the agent guide.

- 5f53462: The local registry accepts this repo's own packages again

  Publishing to the verdaccio registry `akan smoke-registry` starts had stopped working once the akan packages were
  published to npm: verdaccio proxied their names to the uplink and answered every whole-package PUT with
  `409 this package is already present`. They are declared without a proxy now, so a local publish owns the name and
  everything else still proxies. The `npm login` that ran before each publish is skipped for a local registry too —
  it carries no registry argument, so it asked for npmjs.org credentials to authorize a publish that never reaches
  npmjs.org, and being interactive it made the whole documented flow unscriptable.

- 2d8de1c: fix(code): an MCP server that refuses a stored token gets one refresh before `akan code` asks for a sign-in

  `akan code` refreshed an MCP server's token only when the stored expiry said it had run out. A server that refused
  the token earlier — it was revoked, or it was a refreshed token the server issued with no lifetime, which is kept
  until refused — sent the session straight to `sign-in needed · /mcp login <name>`, even though the stored refresh
  token would still have worked.

  On a 401 at connect, a server holding a refresh token now gets exactly one refresh (or the token another session
  already stored since), and the connect is retried with it. Only when that refresh is refused, or the new token is
  refused too, is the server listed as needing a sign-in. A 401 is never retried a second time, so a server that
  refuses every token costs one refresh, not a loop.

- 2d8de1c: fix(code): an MCP tool call refused mid-session refreshes the token once and retries

  `akan code` refreshed an MCP server's token only while connecting. A token that expired or was revoked during a
  long session made every call to that server fail with `MCP server "<name>" requires authentication`, which named no
  way out, until the session was reloaded.

  A call answered 401 now gets one refresh (or the token another session stored since), reopens the server with it —
  on a new streamable HTTP session, since a server may bind its session to the token that opened it — and is retried
  once. If the refresh is refused, or the new token is refused too, the call fails with `MCP server "<name>" needs
signing in — /mcp login <name>`, and later calls to that server answer the same without refreshing again.

  Calls refused together share one refresh, and so does every connection in the process that would present the same
  refresh token — a sub-agent's, or one opening with an expired token — because a server that rotates refresh tokens
  may revoke the whole grant when one is presented twice. The token file's format and location are unchanged.

- 2d8de1c: fix(code): two `akan code` sessions refreshing the same MCP token make one refresh between them

  Every `akan code` process refreshes an MCP server's token itself, from the one token file they all share. Two
  sessions whose calls were refused at the same moment each presented the same refresh token, and a server that
  rotates refresh tokens refuses the second use — signing that session out, or revoking the whole grant.

  A refresh now runs under a lock file beside the token file (`mcpAuth.json.lock`, the same kind of lock `akan login`
  takes on `~/.akan/config.json`). The token is read again once the lock is held: if another session already replaced
  it, that token is used and no refresh is made. A lock left by a process that died is taken over; one a live process
  holds for more than 30 seconds reads as a failed refresh. The token file's format and location are unchanged.

- 2d8de1c: fix(code): `/mcp remove` says when the home file still declares the server, and honours `--local`

  `akan code` reads MCP servers from two files — `~/.akan/code/mcp.json`, which every repo reads, and the repo's
  `.akan/code/mcp.json`, which wins a name both declare. `/mcp remove <name>` takes the repo's entry first, so on a
  name both files declare the home file's declaration took over after the reload, possibly with a different command
  or url, while the notice read only "removed X from the workspace file". The notice now adds that the global file
  still declares it, so it still applies, and that running `/mcp remove X` again removes that one too.

  `--local` was accepted by `/mcp remove` and ignored. It now means what it means for `/mcp add`: this repo's file
  only. A name only the home file declares is left alone, and the reply says where it is declared.

  `McpServerConfig.remove(workspaceRoot, name, only?)` takes the scope as an optional third argument; without it the
  lookup order is unchanged. The `akan-code` skill's manual now names both files and both flags.

- 2d8de1c: fix(code): `/mcp` says `sign-in needed` for a server whose token stopped working mid-session

  An MCP server whose token could not be renewed during a session answered every tool call with `needs signing in —
/mcp login <name>`, but `/mcp` kept listing it as `signed in` — the state from when the session connected. Its row
  now turns to the same `sign-in needed · /mcp login <name>` a failed connect shows, and `/mcp <name>` says it needs
  signing in instead of listing tools that cannot answer; a server that failed to connect for want of a sign-in no
  longer claims it "connected and published no tools" there either. `/mcp login <name>` (or `/mcp reload` once a
  usable token is stored) reopens the session, and the server reads as signed in again.

- ccf2ae2: `akan start-desktop`, `start-ios` and `start-android` print a page's log once, at the level it was logged, and say a
  boot came up in one line

  - A boot that comes up prints `cmdc ios ready · iPhone 16 · http://localhost:8283 · 12.4s` and nothing else; its steps
    (prepare, build, install, launch) are debug. A boot that fails prints every step it took ahead of the error. A native
    config warning still prints as it happens.
  - A page line reads `WARN  [page:WsClient] WebSocket message process failed …`: stamped once by the CLI's logger, at
    the page's own level, with no `[default]` label, no empty line after it, and a multi-line message kept together. A
    page logger writes `[Name] message` at the console method of its level inside a native shell, and the desktop host
    and iOS tag each line `[page<+><#window> <level>]` for the CLI to read back.
  - Android forwards the page console through the bridge in a dev build too, so logcat carries each line at its level
    and a `console.error("%s", …)` substitution the way the devtools show it; iOS writes os_log at the page's level. An
    uncaught error forwards its message along with WebKit's frames, which carry none.
  - Frame tracing (`[akan:frame:…]`) is opt-in (`?akanFrameDebug=1` or `localStorage["akan:debug:frame"] = "1"`) and
    logs at debug, once per event; a mobile or desktop target no longer turns it on for every visibility change.
  - Lines no page or host wrote (the simulator, WebKit) and where the host's pages come from are debug; `--verbose` shows
    the former. `start-desktop` and friends ask a dev server whose builder idled out for its health, not its home page,
    so they no longer report it missing while it wakes.

- c45ac6c: fix(lint): stop `//!` markers from shipping to the browser

  Bun's bundler classifies `//!` and `/*!` as legal comments — the `@license` / `@preserve` class it must preserve
  for licence compliance — and keeps them through `minify: true`. Everything else goes: `//`, `/* */`, `//*`, `//?`,
  and `// TODO:` are all stripped. But the workspace `AGENTS.md` prescribes `//!` as in-code marker 4, "disabled or
  must-fix code", so the convention itself guaranteed that internal notes about broken and unfinished code shipped
  verbatim to every visitor. A deployed app served eight of them in one chunk, including `//!env로 옮겨야함`,
  `//!need to change`, and `//! Need to fix after bunjs migration`.

  There is no bundler-side fix: `legalComments` is not a `Bun.build` option, and `Bun.Transpiler.transformSync`
  preserves `//!` too. The source is the only place to stop it.

  `no-bang-comment-in-client.grit` now bans the marker in browser-reachable code — `ui/`, `webkit/`, `common/`,
  `page/**/*.tsx`, `*.constant.ts`, `*.store.ts`, and the five module component suffixes — while leaving it legal in
  server, `srvkit/`, and CLI files, which never reach a bundle. The five existing occurrences in `akanjs` and the
  libs became `// FIXME:`.

  The rule anchors the marker to line start or to whitespace after code, so a literal like `"https://host//!path"`
  does not trip it. Comments are trivia rather than nodes, so the diagnostic spans the module and a marker on a
  file's very first line is invisible to the pattern — the one case the rule cannot see.

  Rebuilding `apps/akan` takes the bundle from two `//!` comments to zero, with the third-party `/*!` licence
  blocks left intact.

- f882bbc: feat(lint): `no-init-fetch-in-client` — keep slice hydration on the server

  `fetch.init<Model><Suffix>` is not a request, it is a hydration snapshot: `#registerSlice` composes it out of the
  slice's list and insight queries and returns a `ServerInit` whose only consumer is the `init` prop of
  `Load.Units` / `Load.View`, which seeds the store from it before React renders. `fetch.get<Model>Init<Suffix>` is
  the same call returning the payload alone. From a route both resolve before the first byte and the markup ships
  populated; from a client component they are two extra round-trips for a shell the browser already painted empty,
  landing in a local variable nothing reads — `Load.*` seeds state, so a value held in a client closure reaches
  nowhere. Nothing in the framework flagged this, and the mistake reads as an ordinary load.

  The fix the message points at is the route: `await fetch.initXInY(...)` in `page/**` and pass the result down as
  an `init` prop, or hand the unawaited promise to a `Zone`. The client is not missing the load either — every
  slice also generates `st.do.init<Model><Suffix>()`, which runs the same two queries and commits them to state.

  The gate is the file, not the call site. `"use client"` is anchored to `JsDirective`, so the same text as an
  ordinary string literal or inside a template-literal code sample — both common in docs pages — is not mistaken
  for the directive. `*.store.ts` is added by name, being client-only by role while carrying no directive.

  The name is matched by shape, a lint rule having no way to know which slices exist. The generated one is `init`

  - `Capitalize<refName>` + `Capitalize<suffix>`, so it always carries two capital-led segments; requiring the
    second is what keeps a hand-written `initPayment` / `initSession` endpoint out, and `initializeSomething` was
    never at risk since `init` is followed by a lowercase letter there. A custom endpoint spelling the generated
    shape exactly — `initPaymentSession`, `get<X>Init<Y>` — is the residue, suppressible with
    `// biome-ignore lint/plugin: <reason>`.

  `view` / `edit` hydrate the same way but are deliberately unmatched: `edit<X>` is a plausible custom endpoint
  name.

  A runtime guard was considered instead and rejected: CSR and Capacitor builds render route modules in the
  browser (`RootRenderLayer` in `pkgs/akanjs/webkit/bootCsr.tsx` awaits the page's own async render), so
  `typeof window !== "undefined"` holds for a perfectly correct page there and nothing at runtime can tell that
  apart from a client component calling the same thing after hydration.

- 69f7178: feat(lint): ban `cnst` model types in `*.Util.tsx` / `*.Zone.tsx` props

  `Util` and `Zone` are always client components, so a `cnst.Banner` / `cnst.LightBanner` prop is a hydrated class
  instance the server has to hand across the boundary — the functions are stripped on the way and what arrives is a
  plain object wearing the model's type. `no-model-type-in-util-zone.grit` reports it and points at the two shapes
  that work: take `bannerId: string` and read the model from the store, or take the payload the framework already
  serializes.

  Three exemptions, because none of them is an instance. `cnst.<Enum>["value"]` is an indexed access that resolves to
  a string union, which is how every enum prop in the codebase is already written (`roles: cnst.AdminRole["value"][]`).
  A `ClientInit` / `ClientView` / `ClientEdit` type argument is mapped through `GetStateObject<…>` before it reaches
  a prop, which is the sanctioned server-to-client handoff. A `ModelsProps<cnst.Setting>` type argument spends the
  model on `onClickItem?: (model: M) => unknown` and nowhere else, so it is the function-typed-prop exemption reached
  through a generic — whoever passes the callback is a client component already holding the value.
  `ModelProps<"setting", cnst.LightSetting>` stays reported: it spreads the model onto the props themselves, and the
  `Unit` / `View` files that take it are server components outside this rule's scope. Any _other_ indexed access is
  still reported — `cnst.Banner["image"]` is a `File`.

  The rule keys on the `cnst.` qualifier in a type position, so it never touches a value expression, and it is scoped
  to those two filename suffixes: `Unit` and `View` are server components and keep taking the model itself.

  Only prop positions are read: a `*Props` interface or type alias, and the inline object type on the component's own
  parameter. A `cnst` type that never leaves the file is not a boundary crossing and is left alone — a local
  annotation, a callback parameter the framework itself types with the model (`renderItem`, `renderList`), a
  module-scope helper, a non-`Props` local shape, and the props of a component nested inside another one. A
  function-typed prop (`onPick?: (t: cnst.LightTicket) => void`) is exempt too: a closure cannot cross the RSC
  boundary at all, so whoever passes it is a client component that already holds the value.

- 2d8de1c: fix(release): the published packages no longer carry test-run files from `local/`

  `akanjs` 3.0.0-beta.19 shipped 65 files (SQLite databases and logs, 820 KB) and `@akanjs/devkit` 2 from the
  gitignored `local/` directory the test suites write into, because both builds copied the package directory whole.
  `build-package` and `akanjs`'s own build now leave `local/` out, and `verify-akan-publish-packages` refuses a package
  whose pack list still contains it.

- 5f53462: feat(route): a route's head is JSX only, and analytics is the app's own component

  **`.metadata()` is gone, along with the `metadata` / `generateMetadata` exports and the `AkanMetadata` type.** A route
  had two ways to say the same thing — an object of `title` / `description` / `openGraph` / `twitter` / `alternates`
  that the server translated into tags, and `.head()` taking the tags themselves — and could use only one of them per
  module. Every app in the workspace already wrote `.head(<>…</>)`. Rewrite an object as the tags it produced:

  ```tsx
  .head(({ projectId }) => (
    <>
      <title>{`Project ${projectId}`}</title>
      <meta name="description" content="Project workspace" />
      <meta property="og:image" content="/og/project.png" />
      <link rel="canonical" href="https://example.com/project" />
    </>
  ))
  ```

  A legacy route that still exports `metadata` or `generateMetadata` now fails the load as an unsupported export,
  the same way any other stray export does. The hreflang alternates Akan adds per locale are unchanged; the only thing
  that could suppress them was an `alternates.languages` object, so leave them out of the JSX.

  **`.gaTrackingId()` and the `gaTrackingId` export / `System.Provider` prop are gone.** Which tags load, in which
  environment and behind which consent banner are the app's decisions, and the framework's built-in `Gtag` made none
  of them. Render a `"use client"` component that loads gtag.js from the root layout's `.render()` instead — the
  routing guide has one. GA4's Enhanced measurement already counts the router's `history.pushState` navigations, so
  the component only loads the tag.

  The head-snapshot path used by the experimental partial commit (`AKAN_PUBLIC_RSC_PARTIAL_COMMIT=1` with
  `rscPatchHeadSafe`) was fed only by the metadata object, so it now always falls back to a full navigation.

- ccf2ae2: docs: the runtime guideline and the agent guide cover what a desktop app's server carries

  `akan guideline show runtimeRule` has a section on a desktop app's carried server (`native.desktop.server`): `bin` and
  `trustedDependencies`, why nothing from `docker` reaches the carried server, why ffmpeg should be a static LGPL build,
  when a server bound to its machine stays a service with the app's target carrying none, and why devices belong to the
  shell's plugins.

- 2d8de1c: fix(code): at most `maxConcurrent` sub-agents run at once across the whole tree

  `/agents` says a profile runs sub-agents "at most N at once", but each `task` pool counted only its own children,
  so a child agent could open N of its own while its parent's N were still running — with the shipped presets (two
  levels, three at once) up to 12 sub-agents ran at once instead of 3.

  The running count now travels with the tree's token tally (`SubagentSpend` gained `running`), so every pool of one
  tree checks the same number. A `task` over the limit is refused, as before, and never queued: every ancestor keeps
  its slot while it waits on its child, so a queued child would deadlock the tree. The refusal tells an agent that has
  sub-agents of its own running to wait for one of them or do the work itself, and one that has none to do it itself.

- 2d8de1c: fix(code): a sub-agent that fails or is stopped still spends from the tree's budget

  A sub-agent's tokens were added to the tree's tally only when its run returned normally. One whose run threw — a
  provider or engine error after it had already spent tokens — added nothing and said nothing, so a tree of failing
  sub-agents could spend past the budget without `task` ever refusing; one stopped by its parent's interrupt was
  counted but announced as "finished".

  Each sub-agent's own tokens are now added exactly once however it ends, and the notice says how it ended:
  `explore sub-agent finished|failed|stopped, N tokens (M of B spent)`. A sub-agent's own children are still counted
  by its pool, so nothing is counted twice.

- 2d8de1c: fix(code): an interrupt that lands before a sub-agent's run is live stops it

  A sub-agent listened for its parent's interrupt only once it had been created, and the engine ignores an abort that
  arrives before a run is live. So an interrupt pressed while a `task` was still opening its sub-agent — connecting
  its MCP servers, say — or in the moment between that and the sub-agent's run starting was lost: the sub-agent ran
  its whole task anyway, and in the second case its notice even said "stopped".

  A sub-agent whose parent was interrupted while it was being created now never starts, and one interrupted after that
  is stopped as soon as its run is live. Either way it reports `stopped`, and its tokens are added to the tree's tally
  once.

- 2d8de1c: fix(code): every sub-agent of one tree draws on one token budget

  A profile's `subagent.budget` is documented, and shown by `/agents`, as the tokens "a whole subagent tree may
  spend", but each `task` pool kept its own count. A child's pool started from zero against the same ceiling and
  counted only its own children, so with the shipped presets (two levels, three at once) a tree could spend several
  times the budget before anything refused.

  The count is now one object for the whole tree: the root pool starts it, hands it to every child agent it opens
  (`CodeAgentOptions.subagentSpend`, forwarded through `AkanCodePlugins` to the child's pool), and each sub-agent's
  tokens are added to it when that sub-agent finishes. Once the tree has spent the budget, `task` refuses at every
  level, and the "sub-agent finished" notice reports the tree's total. Depth and concurrency limits are unchanged.

- 5f53462: The CLI's AI editor is removed, and with it the `--ai` commands

  `AiSession` — the langchain-backed editor that asked a model to write module constants, dictionaries, scalars,
  UI components, guideline instructions and abstract files — is deleted, along with every command that drove it.
  Gone: `akan set-llm`, `akan reset-llm`, `akan ask`, `akan compact`, `akan generate-instruction`, `akan
update-instruction`, `akan generate-document`, `akan reapply-instruction`, and the `--ai` flag on `akan
create-module` and `akan create-scalar`. The scaffolding halves of those two commands are unchanged and are now
  what they always do.

  `akan guideline list` and `akan guideline show` are unaffected — guidelines are bundled files the CLI reads and
  never writes, and MCP `get_guideline` serves the same ones. `akan quality scan` still warns on an abstract past
  300 lines; there is no longer a command that rewrites one for you.

  The `@langchain/*` dependencies leave `@akanjs/cli`, `@akanjs/devkit` and the workspace root — they were the
  heaviest lazy-loaded stack the CLI carried, and `EntryModuleGraph` no longer has to guard against one reaching
  an entry. The workspace-global config at `~/.akan/config.json` no longer holds an LLM key; an existing `llm`
  entry is ignored and can be deleted.

  This is the dev-time editor only. The in-page agent's runtime `LlmAdaptorRole`, `option.setLlm(...)` and the
  shipped adaptors are a different surface and are untouched.

  Step-by-step migration: `akan guideline show workspaceRecipes`, Recipe 8.

- 2d8de1c: fix(windows): `akan` commands and the dev build worker no longer stop silently at a missing file

  On Windows, Bun lets a process exit while a `Bun.file` read of a file that does not exist is still pending, if
  nothing else is keeping it alive. `akan build` stopped right after `sync` without an error, and the dev server's boot
  build ended with "build worker exited with code 0 before reporting a result" on any app that had no font cache yet.
  The CLI and its build workers now await their work from the entry module, which keeps the process alive until it
  settles; a failed command still prints its error once and exits 1.

- ccf2ae2: fix(cloud): on Windows, a `~/.akan/config.json` write waits for another command's read instead of failing

  Windows refuses to rename over a file another process has open, and every `akan` command reads `config.json`
  outside its lock. On a Windows VM, a writer racing two readers had 1374 of 1579 renames fail with `EPERM`. A token
  refresh that lost that race fell back to the stored session. A session in its last hour is sent without
  `Authorization`, so one of two commands started together saw the cloud as signed out. And when the lost write was
  the one after the refresh, the rotated refresh token was never saved, so the next command had to sign in again.
  `GlobalConfig` now retries the rename on `EPERM`, `EACCES` and `EBUSY` for up to about five seconds on Windows.
  Under the same two readers, every write landed, the slowest after 40 tries (1.9s).

- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [f882bbc]
- Updated dependencies [8c31d54]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [f882bbc]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [f882bbc]
- Updated dependencies [f882bbc]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [f882bbc]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [f882bbc]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [c45ac6c]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [2d8de1c]
- Updated dependencies [5f53462]
- Updated dependencies [8c31d54]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [69f7178]
- Updated dependencies [f882bbc]
- Updated dependencies [2d8de1c]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [22aa04f]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [2d8de1c]
- Updated dependencies [69f7178]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [f882bbc]
- Updated dependencies [69f7178]
- Updated dependencies [f882bbc]
- Updated dependencies [f882bbc]
- Updated dependencies [5f53462]
- Updated dependencies [22aa04f]
- Updated dependencies [69f7178]
- Updated dependencies [2d8de1c]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [f882bbc]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [3ebd8e1]
- Updated dependencies [326da07]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [c45ac6c]
- Updated dependencies [2d8de1c]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [22aa04f]
- Updated dependencies [f882bbc]
- Updated dependencies [2d8de1c]
- Updated dependencies [5f53462]
- Updated dependencies [c45ac6c]
- Updated dependencies [f882bbc]
- Updated dependencies [2d8de1c]
- Updated dependencies [ccf2ae2]
- Updated dependencies [2d8de1c]
- Updated dependencies [ccf2ae2]
- Updated dependencies [f882bbc]
- Updated dependencies [326da07]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [2d8de1c]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [f882bbc]
- Updated dependencies [f882bbc]
- Updated dependencies [69f7178]
- Updated dependencies [2d8de1c]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [bf27773]
- Updated dependencies [2d8de1c]
- Updated dependencies [5f53462]
- Updated dependencies [69f7178]
- Updated dependencies [5f53462]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [ccf2ae2]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [2d8de1c]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [ccf2ae2]
- Updated dependencies [5f53462]
- Updated dependencies [f882bbc]
  - akanjs@3.0.0

## 2.4.2

### Patch Changes

- Updated dependencies [6d58c7e]
- Updated dependencies [11aa655]
- Updated dependencies [25d5b15]
- Updated dependencies [11aa655]
- Updated dependencies [11aa655]
- Updated dependencies [25d5b15]
- Updated dependencies [42cf7a2]
- Updated dependencies [25d5b15]
- Updated dependencies [04cb46d]
  - akanjs@2.4.2

## 2.4.1

### Patch Changes

- Updated dependencies [473be34]
- Updated dependencies [f5bfa27]
- Updated dependencies [473be34]
- Updated dependencies [068158b]
- Updated dependencies [46a1a4a]
- Updated dependencies [90c6597]
- Updated dependencies [aca901d]
- Updated dependencies [068158b]
- Updated dependencies [cb895b7]
- Updated dependencies [f8a9bc5]
- Updated dependencies [d973712]
- Updated dependencies [068158b]
- Updated dependencies [cc3dd40]
- Updated dependencies [8a2b795]
- Updated dependencies [068158b]
- Updated dependencies [473be34]
- Updated dependencies [e5fde3b]
- Updated dependencies [473be34]
- Updated dependencies [f28466f]
- Updated dependencies [51851fa]
- Updated dependencies [1c3436f]
- Updated dependencies [128e9a3]
- Updated dependencies [a5d4a8a]
- Updated dependencies [473be34]
  - akanjs@2.4.1

## 2.4.0

### Minor Changes

- 23d43b3: Harden dev host recovery during failed builds:

  - Defer builder/backend recycle while a generation's build is still failing
  - Merge deferred invalidate batches so restarts cover every skipped change
  - Recover the builder with exponential backoff instead of giving up
  - Revive a backend that gave up once the build goes green again
  - Resurrect dev children after a failed recycle so the error overlay stays reachable
  - Enter degraded builder boot mode on compile errors and retry on the next edit
  - Announce recovered pages/css state after a degraded boot succeeds

- 18abf71: Improve dev server stability:

  - Add `isPortInUseError` utility for detecting EADDRINUSE across Bun versions
  - Stop crash-looping replicas after max boot failures in dev mode (`akan start`)
  - Handle parent IPC disconnect to prevent orphaned gateway/child processes
  - Report `wsUpstream` in ready IPC so gateway routes to the actual bound port
  - Fall back to ephemeral port when preferred WS port is in use
  - Support controlled dev-host restart on config changes (`akan.config.ts`, `tsconfig`)
  - Forward backend build-status IPC to dev host for error surfacing in HMR overlay
  - Limit backend recovery attempts (5 max) and idle until next server-side edit
  - Add integration tests for config-edit restart and boot-failure recovery

- 23d43b3: Improve the mobile Capacitor workflow:

  - Auto-declare default Capacitor plugins in the app package.json before iOS/Android launch
  - Expand mobile runtime peer dependencies and workspace-root preflight installs
  - Derive repo-scoped default bundle ids to avoid Apple portal collisions
  - Add `akan doctor --ios` to flag placeholder bundle identifiers
  - Add `--device` to `akan start ios` for non-interactive simulator/device selection
  - Prefer newer iOS runtimes and warn on SwiftUICore-incompatible simulators
  - Detect SwiftUICore dyld failures with actionable guidance
  - Select a routable LAN host for mobile live reload with override support
  - Raise Android minSdkVersion to 26 for bundled Capacitor plugins
  - Include `@capacitor-community/fcm` in push notification runtime packages
  - Resolve client port from `window.location` on the browser client

### Patch Changes

- d56a8f0: Ship Pretendard as the default font for newly created apps:

  - Bundle Pretendard woff2 files under the app template `public/fonts`
  - Declare `fonts` with `default: true` in the generated root `_layout.tsx`

- Updated dependencies [d56a8f0]
- Updated dependencies [23d43b3]
- Updated dependencies [18abf71]
- Updated dependencies [23d43b3]
  - akanjs@2.4.0

## 2.3,11

### Minor Changes

- 595390a: feat: UiOverride 시스템 및 \_overrides.tsx 지원 추가

  - `akanjs/ui/UiOverride` 추가: `Provider`, `createOverridable`, `useUiOverride`, `override` API로 UI 컴포넌트 커스터마이징 지원
  - 모든 akanjs UI 컴포넌트(Button, Modal, Select, Table 등)에 `useUiOverride()` 통합
  - 라우트 시스템에 `_overrides.tsx` 지원 추가 (routeConvention, routeTreeBuilder)
  - qualityScanner에 `_overrides.tsx` 파일 검증 로직 추가
  - 앱 예제: `apps/minimal`에 `_overrides.tsx`, `BrandModal`, `OverrideDemo` 추가
  - `apps/akan` 문서에 UI 커스터마이징 가이드 페이지 추가
  - devkit에 `no-throw-raw-error.grit` lint rule 추가
  - `PushNotificationServer.ts` 리팩토링
  - biome.json 업데이트 및 패키지 의존성 정리

### Patch Changes

- 5ce752a: enhance: add host option for staging server tests
- 5ce752a: add host option for staging server tests
- Updated dependencies [5ce752a]
- Updated dependencies [5ce752a]
- Updated dependencies [595390a]
  - akanjs@2.4.0

## 2.3.10

### Patch Changes

- b92003a: fix: cross-platform path handling using path.resolve/path.join/path.sep
- Updated dependencies [b92003a]
  - akanjs@2.3.10

## 2.3.9

### Patch Changes

- f518afd: Improve dictionary type inference and lint coverage for generated workspaces.
- 6bc2209: auto-select app when the workspace has only one app
- Updated dependencies [f518afd]
- Updated dependencies [f518afd]
  - akanjs@2.3.9

## 2.3.6

### Patch Changes

- 1919062: Pin DaisyUI to 5.5.23 so generated workspaces and published CLI artifacts avoid the 5.6.x theme resolution regression.
- 0802422: Remove the published CLI `types` export that points at an unpacked TypeScript source file.
- Updated dependencies [0a4815a]
  - akanjs@2.3.6

## 2.3.5

### Patch Changes

- Updated dependencies
  - akanjs@2.3.5

## 2.3.2

### Patch Changes

- 940d6db: Optimize generated fetch client type inference while preserving ordered signal override semantics.
- Updated dependencies [940d6db]
- Updated dependencies [d6db24d]
- Updated dependencies [dc60773]
- Updated dependencies [ffe68ec]
- Updated dependencies [1a48756]
- Updated dependencies [1a48756]
- Updated dependencies [1a48756]
- Updated dependencies [1a48756]
- Updated dependencies [1a48756]
- Updated dependencies [4fc2673]
  - akanjs@2.4.0

## 2.2.12

### Patch Changes

- Updated dependencies [666e46c]
- Updated dependencies [666e46c]
  - akanjs@2.2.12

## 2.2.11

### Patch Changes

- 8af7a9d: Add agent-oriented workspace context tooling, generated agent rule templates, and LLM documentation surfaces for Akan workspaces.
- 8190632: Add Akan server console support with CLI/build integration and documentation for console-oriented workflows.
- 4bce7f9: Add initial LLM discovery docs and stabilize Akan client/runtime behavior.

  - Add `/llms.txt` documentation discovery for Akan docs.
  - Add `wsConnect` support for automatic WebSocket connections.
  - Delay client bootstrap module execution until the SSR fizz stream is ready.
  - Improve route tree, HMR, fetch, store, and SSR/client runtime stability.

- Updated dependencies [8190632]
- Updated dependencies [4bce7f9]
  - akanjs@2.2.11

## 2.2.7

### Patch Changes

- Updated dependencies [bf51564]
- Updated dependencies [bf51564]
  - akanjs@2.2.7

## 2.2.5

### Patch Changes

- 5cdb05e: reverse dependency of file upload api
- Updated dependencies [d636456]
- Updated dependencies [a1ee4e8]
- Updated dependencies [5cdb05e]
- Updated dependencies [a7da50e]
  - akanjs@2.2.5

## 2.2.3

### Patch Changes

- 587cc68: add upload-env and download-env for on-premise use case
- 587cc68: fix dictionary loading
- 587cc68: fix fetchClient for setting origin with clone or fetchPolicy
- Updated dependencies [587cc68]
- Updated dependencies [587cc68]
  - akanjs@2.2.4

## 2.2.0

### Minor Changes

- cb5b07a: enable custom not found and error render on \_layout.tsx files
- 1d35d4e: Automatically install dependencies required by databaseMode during application setup.

### Patch Changes

- Updated dependencies [cb5b07a]
- Updated dependencies [258284e]
  - akanjs@2.2.0
