# akanjs

## 3.0.0

### Minor Changes

- ccf2ae2: A CSR dev page — `?csr=true`, `/__csr`, and every native dev build — updates in place on save instead of reloading.

  - `akan start` serves the CSR page as a module registry: each module is its own factory, and a save sends only the
    modules it changed. A component edit keeps hook and DOM state (React Fast Refresh), a store edit keeps the store,
    and a build error shows the overlay and recovers without a reload.
  - A page or layout edit swaps that route in place through `replacePages`: the page stack, history and stores stay,
    and so does the state of the components under the edited page or layout. A `*.constant.ts`, an added or removed
    route, a new npm dependency or a signal/dictionary change still reloads.
  - `AKAN_DEV_CSR=artifact` brings back the single-file dev bundle, which reloads on every save. `akan build` and a
    release mobile build are unchanged.
  - HMR sockets now say what they are: a CSR page connects as `/_akan/hmr?client=csr` and gets `csr-update` instead of
    the SSR `reload` and `rsc-refresh`, and a page that missed an update while disconnected reloads
    when it reconnects.

- ccf2ae2: A Windows desktop app can share its screen without the picker

  `native.desktop.screenCapture: "auto"` in `akan.config.ts`, or `desktop.screenCapture` on one target, makes the
  Windows app answer the page's `getDisplayMedia()` with the first screen at once, without the picker and without a user
  gesture, for remote support on a screen nobody attends. It is Chromium's switch for automated media tests and covers
  every media request, so leave it off in an app whose pages ask for a camera or a microphone. The default `"picker"`
  keeps the picker; macOS and Linux ignore it.

- ccf2ae2: A page a native shell serves reaches its API, and keeps its session, without the cookies it no longer has.

  The shell serves the page from `app://localhost` (iOS, macOS, Linux) or `https://app.localhost` (Android, Windows),
  which is cross-origin to the API and names neither its host nor its port, and WKWebView keeps no cookies for it.

  - `CrossSiteGuard` admits those two origins instead of `capacitor://localhost`, `ionic://localhost` and
    `http://localhost`, and every signal route answers `OPTIONS` for an allowlisted origin with the verbs it serves,
    so a bearer header or a JSON body preflights without an ingress in front. Never with
    `access-control-allow-credentials`: the `SameSite=None` cookie would let an allowed origin ride a browser session.
  - `AKAN_PUBLIC_SERVER_URL` (http or https) names a CSR bundle's server — host, port and protocol, the websocket
    URL following it. A cloud CSR bundle without it calls its cloud host on 443; SSR tabs and servers ignore it.
  - A CSR client's session is the bearer token `fetch` sends: `getAuthToken()` reads it before the cookie jar and
    `setAuth()` no longer copies it into a cookie. An `app://` page keeps its other cookies (theme,
    `prepareUserId`, …) in a `localStorage` jar. The `CapacitorCookies` mirror is gone.
  - `libs/shared`: a CSR client keeps each scope's refresh token (user, admin) in storage and sends it in the body,
    which the server already accepted; sign-in, activation and refresh keep the rotated token, sign-out drops it, and one
    refresh per scope runs at a time, since a second use of a rotated token reads as theft and ends every session.

  **Breaking for a Capacitor build still in the field:** its `capacitor://localhost` origin is refused.

- ccf2ae2: A native app can sign in through the system browser and hear the callback on every desktop OS.

  - `akanjs/client/native` exports `authSession` and its `AuthSessionApi` type, the runtime's system-browser sign-in,
    and `isNativeShell()`, true in any native shell; `isNativeApp()` stays iOS and Android only.
  - `getServerOrigin()` in `akanjs/base` is the server's origin as a browser outside the page opens it. For a page the
    native dev gateway served, that is the dev server (`http://localhost:<dev port>`), not the app origin the page
    calls; otherwise it is the origin of `getEnv().serverHttpUri`.
  - A native dev build on Android reverses the dev server's port as well as the gateway's, so a browser on the device
    reaches it.
  - A target with `deepLinks.schemes` ships `single-instance`. Windows and Linux open a link by starting the app again,
    and the hand-over is how the link reaches the running app. A second launch of such an app now hands over and exits
    instead of opening a second window, and a desktop debug build keeps the release app id, so it does the same while
    the release app runs.
  - In an app with basePaths whose only target names none, `start-*` and `build-*` without `--target` ask for a basePath
    instead of opening the root, which has no CSR page.

- ccf2ae2: A push for the page on screen is not shown in front, and `usePurchase` verifies with the app's own function.

  - The push plugin's `setForegroundPresentation` takes `except: { key, values }`: a push whose `data[key]` is one of
    `values` is not shown while the app is in front, and still arrives as `received`. The CSR frame keeps it set to
    the page on screen, so the chat room being read does not banner its own messages; `data.url` may spell the page
    with or without the locale and the target's basePath.
  - `usePurchase({ verify })` checks a purchase with the app's function instead of `POST <url>/billing/verifyBilling`.
    It gets the normalized proof and the transaction, whose `verification` carries the store's own; what it resolves
    reaches `onPay`/`onSubscribe`, and `null`, `undefined` or `false` refuses. The finish flow is unchanged.

- ccf2ae2: The app's websocket refuses a page from another site

  A socket has no CORS, so a page on any site could open `/api/ws` on a server it reached — a desktop app's loopback
  server through the user's own browser — and read every room it may subscribe to, riding the `SameSite=None` auth
  cookie where there is one. The upgrade now runs `CrossSiteGuard`'s origin check, the one mutations and the dev HMR
  socket already pass: a same-site page, the native shells (`app://localhost`, `https://app.localhost`), an origin in
  `allowedOrigins` and a caller that sends no `Origin` connect as before, and any other origin is refused with 403.
  `option.setCrossSite({ enabled: false })` turns it off with the rest of the gate.

  **Breaking for a web client on another site that only read and subscribed:** its socket is refused until its origin is
  in `allowedOrigins`, as its mutations already needed.

- 8c31d54: The in-page chat guards the model's window, and answers a refusal for length by compacting once

  Compaction used to watch one number: the transcript, estimated at four characters a token, against `compact.at`
  (24k). It did not know the window, did not count the tools, the screen context or the instructions that ride every
  turn, and read Hangul — nearer one character a token than four — as a fraction of what it costs. Measured on a
  single live DeepSeek turn: the transcript estimate said 23 tokens where the provider counted 458. And when the
  provider refused a prompt too long for its window, the turn simply failed.

  **The relay now reports what it knows.** Every turn's `done` carries the provider's own count (`usage: { input,
output }`, `input` the whole prompt) and what the adaptor knows about its model (`limits: { window, output }`).
  The window is declared with `option.setLlm({ contextWindow })` — a table of models would be a claim about models
  that ship after it. `LlmAdaptor` gains an optional `limits`; `AnthropicLlm` reports the answer ceiling it always
  sends, `OpenaiLlm` sends none and so reports none.

  **The session compacts on whichever trigger comes first.** `compact.at` stays, with its 24k default, as a ceiling
  on what each turn costs — the relay resends the whole transcript every turn and the app pays for each one. Beside
  it, once the window is known, a guard compacts when the prompt passes `window − answer ceiling (8,192 when
unreported) − compact.buffer (13,000)`, measured by the provider's count of the last turn plus the estimate for
  what arrived since. `{ at: Infinity }` leaves only the guard; `{ at: 0 }` still turns all of it off. The count is
  kept on the assistant message (`ChatMessage.usage`), never sent, and dropped from what a compaction keeps.

  **A refusal for length is answered once.** Adaptors build refusals through `LlmOverflow.refusal(host, status,
reason)`, which reads each provider's own "prompt too long" sentence as `agent.error.contextOverflow` with the
  `limit` it named. The relay flags it `overflow` on the wire; the session drops the empty draft, compacts, sends the
  same turn again and remembers the window. A second refusal in the same send fails with the translated message.
  An app's own adaptor that throws through `LlmOverflow.refusal` recovers the same way.

  The chat header now reads `~31k / 107k tokens` — the estimate against whichever trigger is nearer — with the point
  it compacts at in its tooltip.

  ## Upgrading

  Nothing is required. To turn the guard on, declare the window your model has:

  ```ts
  option.setLlm({
    apiKey,
    model: "deepseek-flash",
    host: "https://api.deepseek.com",
    contextWindow: 1_000_000,
  });
  ```

  A backend of your own that speaks the turn wire (use-agentic `WIRE.md`) opts in by adding `usage` and `limits` to
  its `done` event and `overflow: { limit? }` to a refusal for length; one that sends neither keeps working as before.
  The usage, limits and overflow fields ride the streaming answer — which is what `httpRunner` negotiates — and are
  not added to the relay's single-JSON `AgentTurn` answer.

- 5f53462: A message carries the data the user pointed at

  An in-page agent could be handed files but not data. What was on the screen reached the model only as the turn's
  `ContextBlock`s, which are reassembled from the screen every turn — so a record named three turns ago is not in the
  conversation any more, and there was nowhere to say _which_ record, or which field of it, somebody meant.

  `ChatMessage.references` is that place, beside `attachments` and for the same reason: what a person referred to
  while asking is part of the asking. A `MessageReference` names the host's own `refName`, the id, a label, and
  optionally a dotted `path` into the document, and carries the `value` those resolved to.

  Three properties are load-bearing and deliberate:

  - **The value is a snapshot.** It is what the data was when the message was sent, never re-read later. Re-reading
    would rewrite what the person was looking at when they spoke — and the common case is an agent that then edits
    the very field it was pointed at, which would leave the reference showing the result with no record of what was
    being changed from. `refName`/`refId`/`path` travel so a tool can read the current value when the answer needs it.
  - **The value arrives masked, and nothing downstream can mask it again.** Masking needs the model class, which no
    wire carries, so whichever model the host names when it stages a reference is the whole of the decision about
    what leaves the browser.
  - **It is bounded at 20,000 characters per reference, at both ends.** A reference is bulkier than a tool result and
    outlives one: it rides every turn from the moment it is sent and is the last thing compaction folds, because
    folding what the user pointed at is folding the question. `Reference.clipped` bounds it as it is staged, and
    `AgentService.referenceLimit` bounds it again where nothing can route around it.

  `AgentSession` holds the staging slot — `stage` / `staged` / `unstage(key)` / `clearStaged()` — rather than the
  composer, which is where staged files live. The difference is not an inconsistency: a file only ever arrives from
  the composer's own picker or drop zone, while a reference arrives from whichever component drew the data, reaching
  the session it is already inside. Unstaging is keyed on `refName/refId#path`, never on an index, because what
  orders the references of a message is its text.

  The server folds them into the message text in one place (`AgentService.referenced`), under a heading that says the
  values are a snapshot. Text is the one field every provider mapping already reads, so Anthropic, the OpenAI dialect
  and the text-only default all carry references with no change between them and none of them can drop one quietly.
  A string value prints as itself rather than as escaped JSON, which is the common case and the readable one.

  Persistence keeps the pointer and drops the value, with a note saying so — a restored conversation re-reads what
  was pointed at with a tool instead of guessing from the label, which is a better answer than a restored attachment
  can give.

- 5f53462: The composer can point at data, from the menu or from the screen

  Builds the user-facing half of message references on top of the carrier. There are two entry points, and which one
  applies depends on who knows the value.

  `<Agent.Chat reference={[…]} />` takes a `ReferenceSource` per kind of document — `refName`, a `type` in
  `st.expose`'s vocabulary, the app's own `search`, and a `resolve` — and the composer's `@` menu offers whole
  documents from them. Which documents somebody may point at is the app's answer, so the source brings the query; the
  framework brings the token, the masking and the snapshot. The token is written the moment a row is picked and the
  value is staged when `resolve` lands, so a slow fetch never freezes the menu and one that fails leaves a pointer
  rather than a chip that means nothing.

  `useAgentReference()` is the other half, for a field _inside_ a document. The component drawing it already holds
  the value, so it hands that over with no round trip — and it is the only thing that knows a rich-text field stored
  as `field(Any)` reads as a paragraph rather than as the editor document it is stored as. It no-ops with a warning
  outside a session, the call `AgentValue.publishable` already makes: a card carrying a reference button must not
  cost a route its render.

  **The token in the draft is what carries a reference; the chip only draws it.** Deleting the token by hand drops
  the reference exactly as removing the chip does, because removing the chip removes the token. Nothing re-derives a
  value from edited text, so a token pasted out of an earlier message travels as a pointer with a note — the same
  shape a restored conversation produces.

  Staging lives on the session rather than the composer, because `useAgentReference` is called from components the
  composer cannot see. Writing the token is still the composer's, so the session holds the unwritten ones as state
  and a chat acknowledges each by key: two chats on one session — a responsive app rendering a desktop and a mobile
  composer — each hold their own draft and each need the token, which a queue somebody drains would have given to
  whichever rendered first. `refer` warns instead of staging silently when no chat is mounted on that session, which
  is the case where a card sits outside the `<Agent.Zone>` its chat is inside.

  References also ride the parking queue, so one pointed at while a turn is running survives to the message it
  opens; taking a parked message back restores its values, and anything pointed at since wins, because the parked
  value is the older read of the same field.

- 5f53462: A chat's transcript has a turn in it

  `AgentSteps` is a new `_overrides.tsx` slot holding one agent turn: the messages between the user message that
  opened it and the next one, plus `isRunning` for whether more are still coming. It is the grain a chat needs to
  fold a turn's steps into a `details` and stand its final answer outside them — and the one boundary no per-message
  slot can see, because neither message on either side of it knows it is at an edge.

  The transcript now emits per turn rather than per message. A user message still stands alone as its own `Bubble`;
  everything after it goes to one `AgentSteps` until the next user message, which also means a transcript whose head
  is a compaction summary opens a turn of its own. The array handed over is what the turn _renders_ rather than what
  it holds on the wire: a tool message whose results a call row already draws is gone, and one holding results no
  call claims is narrowed to those, so an app folding a turn never re-derives the call/result pairing.

  **The default adds nothing.** It draws the same flat bubbles into a Fragment, not a box, so it takes no
  `className` and no existing layout can tell the component is there. `DefaultSteps` is exported from `akanjs/ui`
  beside the other defaults, for a skin that wants to compose the one it is replacing.

  `isRunning` is only ever true of the last turn of a transcript the session is working on. Without it the same
  messages read the same whether the agent is mid-step or finished, and a scaffold cannot tell a live progress line
  from a completed turn's header.

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

- ccf2ae2: `akan.config.ts` reaches the native settings a store release needs, and an app keeps a different id on each store.

  - `native.android.push` (channel, `smallIcon` relative to the app folder, `color`) and `native.ios.privacy` (the iOS
    privacy manifest) pass through, per target too.
  - `native.icon` takes `{ image, backgroundColor }` and `native.splash` the runtime's `{ image, backgroundColor,
autoHide, timeout }`, besides a path.
  - `appId` is a string or one per platform — `{ ios, android, default }` — for an app whose listings already carry
    different ids. The app-link files serve each platform's own id.

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

- ccf2ae2: feat(native): Android back belongs to the page only while it has somewhere to go, a back swipe moves the page, and
  memory warnings release hidden pages

  - **`app.setBackEnabled({ enabled })`** (Android) tells the shell whether a listening page wants back right now. The
    CSR frame reports it after every navigation: enabled while there is history, the keyboard is up, or the index is
    still to come. At the index with nothing under it the shell no longer registers its back callback, so the system
    shows its back-to-home animation and the app stays warm. Before, the page caught that back and called
    `app.exit()`, which finished the task. A new listener starts enabled, so a page that never reports behaves as before.
  - **`app` event `backProgress`** (Android 14+, `OnBackAnimationCallback`) carries `{ phase, progress, swipeEdge }` for
    a back the page will take. The frame drives the current transition's spring with it: a `stack` or `bottomUp` page
    follows the finger, a fade or `scaleOut` page moves half as far, and a cancelled swipe springs back. The commit
    still arrives as `backButton`, and the back animation finishes from wherever the finger let go.
  - **`app-state` event `memoryWarning`** `{ level: "moderate" | "critical" }`: iOS `didReceiveMemoryWarning`, Android
    `onTrimMemory` (the `RUNNING_LOW` / `RUNNING_CRITICAL` levels Android 13 and earlier still send, `BACKGROUND` and
    above) and `onLowMemory`. The frame releases its hidden pages on one; each mounts again when visited.
  - The runtime's plugin host gained `setBackEnabled` and `setBackProgressListener`; the desktop `app` implementation
    answers both as no-ops.

  Checked on an Android 16 emulator: at a fresh index, back went to the system and the process survived. A left-edge
  swipe on a stack page moved it by the finger (translateX ~76px mid-swipe) and snapped back on cancel; a committed swipe
  went back through `router.back`. `am send-trim-memory RUNNING_CRITICAL` left only the current and previous pages. On an
  iOS 26.5 simulator, Simulate Memory Warning reached the page, and killing the WebContent process reloaded the page onto
  its restored stack.

- c45ac6c: perf(server): stop rebuilding per-row and per-request state on the backend hot paths

  A profile of the backend (`constant` → `signal`) found the database was 3% of a list query and JS
  post-processing was the other 97%. On a 50-row `user` query: 14µs of SQL, then 236µs decoding rows and 221µs
  hydrating them, allocating ~23 000 objects — about 460 per document returned. None of that was the query.

  The same query now runs in **276–293µs and allocates ~3 100–3 900 objects**: −33% latency, −85% allocation.
  Four changes, each measured independently.

  **`hydrate()` no longer snapshots rows it does not have to.** Every row of every query was deep-cloned —
  `JSON.parse(JSON.stringify(sanitizeJson(row)))`, 172µs of the 412µs — purely to back `isModified()`. That
  method has two call sites in a real app, both inside `schema.pre("save")` hooks, and a save hook only ever
  runs on a document that came from `create()` or the update path. `hydrate` takes a trailing
  `{ track }` that **defaults to `true`**, so every caller outside the store — including the `Model(data)`
  facade — keeps today's behaviour; only `find` and the projected read behind it opt out.

  `isModified()` on an untracked document **throws** with a message naming the fix, rather than guessing.
  Both guesses are silently wrong: `false` skips work that was needed, and `true` makes a
  `if (!this.isModified("password"))` hook re-hash an already-hashed password. If you hit it, you are calling
  it on a document that came straight out of a read — move the call into a save hook, or re-load through
  `save()` / `update()`.

  The snapshot stays a deep clone where it is taken. A lazy one would be wrong: `isModified()` compares against
  state as of hydrate, and document chains mutate `this.status = …` directly, so there is no mutation hook to
  defer to. The six per-document closures (`set`, `save`, `refresh`, `isModified`, `toJSON`, `toObject`) also
  moved to one prototype per store; it extends the model's own document prototype, so chain methods and
  `instanceof` are unaffected and the methods stay non-enumerable exactly as before.

  **`ConstantField.getProps()` is memoized.** It rebuilt a 27-key object on every call, and the read paths ask
  per field per row — in `decodeDocumentPayload`, again in `crystalize` via `BaseConstant.set()`, again in
  `purify`. It is now built once per field and frozen; no caller mutated the result.

  **`getDefault()` caches a plan, not a record.** `via()` already memoized it per class, but the database
  adaptor called the standalone function per nested scalar value per row. Thunk defaults
  (`default: () => dayjs()`), array defaults and nested-scalar defaults are still produced per call — only
  values that were already shared before the cache existed are shared now. Caching the finished record would
  have frozen `dayjs()` at boot and aliased one `[]` across every document filled from that model.

  **Middlewares, guards and slice projections resolve once instead of per request.** `use(env)` takes no
  context, so a middleware instance and its handler are a function of `(class, env)` and now live for the
  process; a rejected setup is evicted so a transient failure does not poison the endpoint. Guards are already
  required to be side-effect free and re-runnable — `revalidateWsRooms` re-runs them outside any request — so
  one instance per class serves every call. `Logging`, which is registered by default, built two template
  strings per request and discarded them unbuilt at the default log level; it now checks
  `Logger.shouldLog("debug")` first (new public method, alongside the existing `isVerbose`).

  **`WebRouter` stops rebuilding the merged manifest per request.** `#ensureRoute` took a `snapshot()` and then
  merged the runtime manifest over it on every `/*` and `/__rsc` request — four copies of a structure that is
  276KB of JSON for a small app. `RouteClientCache` now exposes a `revision` that bumps on every mutation of
  `merged`, including a delta merge that leaves `generation` alone, and the merge is memoized against it. In
  production the revision never moves after `seed`, so the manifest is built once; in dev a rebuild bumps it and
  the next request pays for one copy. The cached object is still a copy, so an in-flight request keeps consuming
  a stable manifest across an invalidate, exactly as the per-request snapshot guaranteed.

  **`routeElementComposer` and `routeTreeBuilder` are no longer re-exported from `akanjs/server`.** They pull
  React and the page module graph, and the only consumer is `rscWorker.tsx`, which imports them relatively in its
  own process. Re-exporting them put React into every process touching the barrel — including a
  `SERVER_MODE=batch` replica that renders nothing and any `init({ web: false })` server. The barrel import drops
  from **44.0MiB / 28 338 objects to 38.8MiB / 24 640**. Import them at `akanjs/server/routeTreeBuilder` and
  `akanjs/server/routeElementComposer` if you need them directly.

  The DI container was measured too and left alone: 11 services, 11 signals, 26 adaptors, 8 database models and
  7 scalars cost 3.7MiB and 27ms, which is 2.5% of process RSS. `diLifecycle.ts` is not where backend memory
  goes — the module graph is.

- 69f7178: feat(server): boot a subset of modules with `modules`

  `new AkanApp("./server", { modules: ["article"] })` mounts only the named modules and the ones they reach; every
  other module stays out of the container, so its service, signal, routes and scheduled jobs do not exist. Omitted
  or empty keeps today's behaviour — every module whose service is enabled. This is what lets one codebase run as
  several small processes, such as a batch worker that carries only its own domain.

  Dependencies are followed, so you name entry points rather than the whole graph. The closure takes the services
  and signals a module injects, and also its cascade edges: a `removeRef` target and a monomorphic `removeWith`
  owner both fail `CascadeRunner.seal` when absent, so they are boot requirements the inject graph cannot see. A
  polymorphic `refPath` candidate is left out, matching the existing rule that an unmounted one is a mount choice
  rather than a typo. What was mounted is named at boot:

  ```
  [DiLifecycle] INFO  Mounting 3 of 12 module(s): article, file, user
  ```

  A name no module registered fails the boot instead of being ignored — a typo would otherwise drop a module
  silently, which is the one failure the option exists to prevent. Selection narrows the enabled set rather than
  replacing it, so it never turns on a module whose service is `enabled: false`.

  The same selection is available as `AKAN_MODULES=article,file` for a deployment that decides the split, and as
  `{ modules }` on `AkanServer` for an app that starts the server directly. `AkanApp` hands its own option down to
  every child through that variable, since each replica builds its own container.

  `DiLifecycle`'s constructor now takes `({ env, modules }, ...libs)` instead of `(env, serverMode, ...libs)`. The
  `serverMode` argument was unused — schedule registration takes its own — so it went with the change.

- 5f53462: refactor(server): remove the `@CacheMethod` decorator

  It never hit: it called the model cache as `get(key)` / `set(key, …)` while that cache takes `(topic, key)`, and
  nothing in the framework or its libs used it. Cache an endpoint's answer with `{ cache: <ms> }`, or hold state in a
  service with `memory(...)`.

- 5f53462: feat(constant): `cascade: "removeWithAny"` lets a cascade name any model as its owner

  A polymorphic `removeWith` required its `refPath` to name an `enumOf`, so the one shape an enum cannot express
  had no cascade at all: a child whose owner may be _any_ model in the app — a reaction, a comment, an attachment
  that later models opt into. Listing the candidates in the child's own enum inverts the direction `removeWith`
  exists for, where the owner never learns its children exist.

  That declaration is now available, opt-in and priced, as a third cascade action:

  ```ts
  parent: field(ID, { refPath: "parentType", cascade: "removeWithAny" }),
  parentType: field(String),   // holds the owner's refName
  ```

  The widening is the action, not a flag beside it — `removeWithAny` names the whole decision in one value, so it
  cannot be declared apart from the direction it widens.

  Every model's removal then sweeps the child by the removed model's own refName. The lookup is cheap — the
  declaration auto-creates the same `{ removedAt, typeKey, fk }` index it always did, so a removal that owns
  nothing is one index probe returning zero rows, not a table scan. The real price is bulk: a query-level removal
  of _any_ model would be a removal whose wildcard children were never looked for, so **one wildcard edge anywhere
  turns every cascade in the app back to one document at a time**. The boot log says so in one `info` line naming
  the edges, because "why does this app remove everything per document" must be answerable without reading a
  model file. An app that declares none keeps the fast path exactly as before.

  Refused while the class is built: `removeWithAny` on a `refPath` that already names an `enumOf` (the enum
  names the candidates and indexes better — keep one), a `typeKey` that is not a `String` (the sweep matches a
  refName against that column, and a column that cannot hold one silently finds nothing, which is
  indistinguishable from never having declared the cascade), and `removeWithAny` on a field with no `refPath`.
  A wildcard owner is also exempt from the mount check a monomorphic owner fails at boot — it names no module to
  mount.

- ccf2ae2: feat(csr): every history entry is a page of its own, the stack keeps three hidden entries, and a dev server can swap
  route modules in place

  The CSR frame rendered one container per route pattern. A push to the route on screen (`/item?id=1` → `/item?id=2`)
  re-rendered the same page with new arguments: nothing sat under it for a swipe back, and going back handed the
  first entry the second one's state.

  - **A page container is a history entry.** A push mounts a new page over the old one, which waits under it with its
    state. A replace within one route keeps the entry, so the page updates in place. A `cache` route is still one page
    for the whole session.
  - **The stack keeps the three nearest entries below the one a swipe back reveals,** mounted and hidden (their effects
    stopped), so going back shows each with its state. Older entries are released and mount again on back, with
    their scroll restored.
  - `window.history` entries carry `{ akanEntryId }`, and popstate matches on it (falling back to the href), so two
    entries with one address are told apart.
  - Frame slot targets are per entry too: `<slot>Content-<key>`, with the key in `pathContext.pageKey`. `Navbar`,
    `TopInset`, `TopLeftAction` and `BottomInset` portal into their own page's target, and a page container is
    `#pageContainer-<key>` with `data-path`.
  - **`usePageLocation()`** (`akanjs/webkit`) is this page's own `{ pathname, params, searchParams }`. `st.use.*` follows
    the page on screen, so a page being prepared read the previous page's `?filter=`. `Data.ListContainer` and
    `Data.Dashboard` now seed from their own page.
  - **`replacePages(context)`** (`akanjs/webkit`) rebuilds the route table from new route modules while history,
    mounted pages and stores keep going. It resolves `false` when the set of modules changed, which needs a reload.
    The table itself moved to `CsrRouteTable`, which `bootCsr` now boots.
  - Same-route navigation now replays the enter animation and resets the spring after back, since both follow the
    entry rather than the pathname.

- ccf2ae2: feat(csr): the page stack outlives a reload, popstate lands on any entry, and the page under the current one pauses
  in the background

  - **A reload keeps the stack.** The router writes its entries (`href` + `akanEntryId`) to `sessionStorage` on every
    settled navigation and reads them back at boot when the entry the tab reopened on is the one it was on. That
    covers a reload and a WebView whose content process died and reloaded. Only the current and previous entries
    mount; the rest are dormant until visited. Before this, back after a reload changed the address and left the
    page where it was.
  - **Popstate lands on the entry it names,** not only a neighbour. A long-press back menu or `history.go(-n)` jumps
    there. An entry the stack never saw (from before a reload that kept no stack, or a hash the browser pushed)
    replaces the current one, in place when the route is the same.
  - A popstate whose `hasUAVisualTransition` is set (Safari's own swipe back) skips the frame's back animation, so the
    page does not slide away twice.
  - While the document is hidden (the app in the background), the page under the current one pauses its effects as
    well. `RouteState.isBackgrounded` carries it.
  - On a macOS desktop shell, ⌘[, ⌘← and the mouse back button go back; a text field keeps ⌘←. WebView2 and the browser
    already do this themselves. `desktopPlatform()` is exported from `akanjs/client/native` beside `nativePlatform()`.
  - `useHistory(locations, { idx, dormant })` takes a restored stack, and `setHistoryJump(idx)` moves several entries
    at once.

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

- ccf2ae2: A desktop app reads and sets the system volume and mute, and hears when they change

  The `volume` native plugin (`native.plugins: ["volume"]` in `akan.config.ts`, `volume` from `akanjs/client/native`)
  has `getVolume()`, `setVolume({ level })` and `setMuted({ muted })`, each answering `{ level, muted, settable }`, and
  a `change` event whoever moved the volume. macOS drives the default output device through CoreAudio (an HDMI or
  DisplayPort output takes no volume from the computer and answers `level: null`), Windows the default render endpoint
  the taskbar slider moves, and Linux the default sink of PulseAudio or PipeWire through `pactl`, in any desktop
  language, hearing changes again after the audio server restarts. A phone or the web answers `UNSUPPORTED`, and a Linux
  box without an audio server `NOT_FOUND`.

- ccf2ae2: `akan build-desktop --arch arm64|x64` picks the CPU a Windows or Linux desktop app runs on

  A desktop app is still built on its own OS, now for either of its CPUs: the Rust library is built for that target,
  the executable with `bun build --compile --target=bun-<os>-<arch>`, the carried server installs with
  `bun install --cpu=<arch>` so its addons' prebuilt binaries are that CPU's, and each `bin` entry is that platform's.
  The setup program and the AppImage name the CPU they hold. A macOS app is Apple silicon only: Intel Macs are not a
  target, so `--arch x64` on macOS is refused.

- ccf2ae2: A desktop build stops on a server addon that would not load on a user's computer

  Before it copies the server, a desktop build reads every `.node` file in it by package. A package with no binary for the
  target OS and CPU, a binary that links a library by an absolute path outside the system (a ROS install under `/opt`,
  Homebrew's prefix) or names such an rpath, and a package with a `binding.gyp` that its install never compiled (Bun runs
  no install script of an untrusted package: add it to `trustedDependencies`) are listed and stop the build, instead of
  failing at the first `require` on the user's computer. An addon node-gyp compiled on the build machine only warns.

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

- 5f53462: fix(signal): an endpoint's `cache` is looked up after its guards, not ahead of the account

  The `Cache` middleware sat ahead of every middleware a lib registers, `AccountMiddleware` among them, so on a hit it
  ran the guards before anyone had resolved the caller — a guard reading the account saw none and refused a signed-in
  caller the second time they asked. The lookup is now a step of the call itself: guards, then internal arguments,
  then the cache, then the handler, inside the `timeout` deadline as before.

  `Cache` is no longer exported from `akanjs/signal` and is no longer registered as a middleware, and
  `SignalContext.checkGuards()` — which existed only for it — is gone. `{ cache: <ms> }` on an endpoint is unchanged.

- ccf2ae2: Every builtin native plugin's page API is `akanjs/client/native/<plugin id>`

  `akanjs/client/native` carries the plugins every page uses, and the rest — `window`, `screen`, `global-shortcut`,
  `keep-awake`, `autostart`, `single-instance`, `screen-orientation`, `clipboard`, `network` and every other builtin — had
  no path an app outside this repository could import, since the runtime's own package ships only inside akanjs. Each is
  now `akanjs/client/native/<id>`, for example `import { appWindow } from "akanjs/client/native/window"`.

- 2d8de1c: fix(service): `ServiceModel.getFilterServiceMethods` takes the filter's `FilterInfo` and builds what the runtime builds

  **Breaking for a direct caller.** The static took a bare query function and guessed the trailing query option by its
  shape, so it disagreed with the filter methods every booted model and service actually carries: `{ sample: 2 }` was
  dropped instead of passed on, `{ sort: null, limit: null }` became a filter argument, omitted arguments were not
  filled, and a filter whose query uses its `q` helper threw because no helper was passed.

  It now takes the `FilterInfo` — `ServiceModel.getFilterServiceMethods(key, getFilterInfoByKey(Filter, key))` — and
  reads arguments and options exactly as the runtime does, because the runtime now builds each model's and service's
  filter methods through this same static. There is one implementation left. The returned table's type is unchanged.

- ccf2ae2: `akan build-desktop --installer true` on Linux adds an AppImage

  The app folder gains an `AppRun`, a `.desktop` entry naming the app's icon and its `deepLinks.schemes`, and a 256px icon,
  and is packed with `mksquashfs` behind the AppImage type 2 runtime, pinned to a dated release and checked by its
  digest. The AppImage needs only the WebKitGTK 4.1 and GTK 3 the folder already needs, and runs without FUSE through
  `--appimage-extract-and-run`. It runs from a read-only image, so the updates plugin cannot replace it: an app with
  `updates` is warned to publish a new AppImage for each release.

- 5f53462: feat(document): a model loader remembers nothing unless it declares `cache`

  `loader.byField` / `byArrayField` / `byQuery` built their `DataLoader` with the default `cache: true`, and a model's
  loaders live as long as the process — so a key read once was answered from memory forever, however the document
  changed. They now take an option after the default query, `{ cache }`: `false` by default, a number of milliseconds
  to keep each key, or `true` for the life of the process. A failed load is never kept.

  `DataLoader` itself now defaults to `cache: false` and accepts the same `boolean | number`.

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

- 69f7178: feat(mcp)!: expose every endpoint its guards admit, and mount `/mcp` by default

  MCP exposure was opt-in per endpoint, per slice and per CRUD verb. It is now derived from the guards an endpoint
  already declares, and `/mcp` is mounted unless `AKAN_MCP=false` says otherwise.

  The old model asked the same question twice. `guards` is the authorization decision, and `McpDispatcher`
  re-evaluates the account-scoped ones on every `tools/list` — so a second per-endpoint switch said nothing the
  guards did not, while guaranteeing that every endpoint added later was invisible to agents until somebody
  remembered to flag it. The framework's own OpenAPI document has no per-endpoint opt-in either: one env flag
  publishes the whole HTTP surface, which is the same enumeration.

  **The rule, applied globally with no way to configure it per endpoint or per app:**

  - a real guard publishes
  - **no `guards` at all is refused** — nobody decided who may reach it, and a catalogue entry is where that omission
    would stop being invisible
  - **a mutation whose only guard is `Public` is refused**, unchanged: `[Public]` is having none, spelled out
  - an explicit `guards: [Public]` on a _read_ publishes. It is a decision someone wrote, the data is already served
    anonymously over HTTP and in the OpenAPI document, and refusing it would break a public docs or search endpoint
    while hiding nothing

  Every structural refusal is unchanged: `pubsub`/`message`, an `Any` or `Upload` return, a file upload, a required
  `Any` argument, and the three a prompt's flat string map cannot carry.

  **Removed:** `mcp` on a signal option, on a slice option and on the signal's CRUD verb map — `McpOption` and
  `McpSliceOption` are gone, and `mcp: { expose: true }` no longer typechecks. Delete it; nothing replaces it. The
  `readOnly` / `destructive` / `idempotent` hints are now derived from the endpoint type and key rather than
  overridable, which costs nothing a client trusts. `resource` is gone the same way: the generated reads are
  addressable, a custom endpoint is not, and neither was ever configurable in practice.

  `McpDocument.unguarded` is gone, subsumed by the refusal that now covers it. The `akan.mcp.missing-description`
  and `akan.mcp.unguarded-exposure` quality-scan rules are gone with `McpScanner`: both found the exposure by
  matching an `mcp: { expose: true }` literal in source, which no longer exists. The boot log already answered both
  from the resolved catalogue, and it is now the only place that can.

  **`GuardCls.scope` is required.** Unmarked meant `resource`, which is never evaluated for a listing — so with
  exposure following the guards, one forgotten marker would list its endpoint's name and argument schema to every
  caller and refuse only the call. There is no safe guess, so the author states it: `"account"` for a verdict that
  reads the caller and nothing about the call, `"resource"` for one that needs the call's arguments.

  **Upgrading:** delete every `mcp:` option from your signal files, and add `static scope: GuardScope = "account" |
"resource"` to every guard class. Then read the boot log — `MCP catalogue: tools=…` followed by one line per
  refusal — because with no opt-in to be missing, that log is the only explanation for a tool that is not there.
  An endpoint you want an agent to reach needs real guards, which it needed anyway.

  **Settings moved off `new AkanApp(...)`.** `AkanAppOptions.mcp` is gone; the server settings live on the option
  chain in `lib/option.ts` — `option.setMcp({ enabled, readOnly, path, version, instructions, allowedOrigins,
pageSize, language, auth })`. The old field is a type error on upgrade, which is the signal to move it.

- 5f53462: fix(service): `memory()` is scoped to its owner and does what its options say

  - A non-`Map` memory was keyed by its property name alone, so two services that each declared `token` shared one
    value. It is now stored under the owner's refName, like a `Map` memory already was. Values written under the old
    key are not read back.
  - `get` / `set` were type-checked and then ignored at runtime. They now run: `get` turns the stored value (a `Map`'s
    entry value) into what the code reads, and `set` is its inverse.
  - A declared `default` is what a missing value reads as on Redis too; Redis answers a missing key with `null`, which
    used to skip it.
  - `local: true` on a `Map` gives a `Map`, not `null`.
  - The declaration's `expireAt` was one fixed time computed when the class loaded. It is replaced by `ttl` in
    milliseconds, applied to each write that names no `expireAt` of its own.
  - `RedisCache` expires a hash field on its own. `PEXPIREAT` on the whole hash expired every entry with the last one
    written; each field's expiry now lives in a sorted set beside the hash (portable to Redis before 7.4), expired
    fields read as missing, and they are dropped on every write and every listing.

- 3ebd8e1: feat(document): `updateById` / `removeById` on the model facade

  The facade could already read one document by id (`findById`, `pickById`) but writing one meant spelling the id back
  out as a query: `Model.updateOne({ id }, { … })`. It now carries the id-scoped pair directly.

  ```ts
  await this.Order.updateById(orderId, { status: "archived" });
  await this.Order.updateById(
    orderId,
    { status: "archived" },
    { upsert: true }
  );
  await this.Order.removeById(orderId);
  ```

  **These are the query-level writes narrowed to one id, not the document path.** They compile to the same single
  atomic UPDATE as `updateOne` / `removeOne` — `removedAt IS NULL` ANDed in, counts returned rather than a document,
  and **no hooks**, so no `_pre`/`_postUpdate`, no `_postRemove`, and no cascade. A model whose removal carries a side
  effect or a `removeRef` / `removeWith` edge still goes through the service's `remove<Model>(id)`.

  `updateById` takes the same trailing options as `updateOne`, so `{ upsert: true }` inserts with that id when nothing
  matches. An `undefined` id is rejected by the query compiler rather than widening the write.

- 326da07: fix(document): give a Model's `insight<Query>` a real return type, and declare `db.<Model>Insight`

  Declaring a filter query generates `count<Query>` and `insight<Query>` on both the Model and the Service. On the
  Service the insight was typed; on the Model it came back as `unknown`, because `into()` passed `unknown` where
  `QueryMethodPart` expects the insight type — so `await this.adminModel.insightByAccountId(id)` had no fields and
  any use of the result needed a cast.

  `into()` now threads the insight through from the constant model it already receives, typed as the document shape
  because `insight()` accumulates into a plain record rather than a hydrated document.

  The generated `lib/db.ts` also declares an insight document class per model and exports the type, mirroring what it
  already did for `Input`:

  ```ts
  class AdminInsight extends by(cnst.AdminInsight) {}
  export type { AdminInsight };
  ```

  `DatabaseRegistry.buildModel` takes that class instead of the constant insight, so `db.<Model>Insight` annotates
  the result on both sides:

  ```ts
  const insight: db.AdminInsight = await this.adminModel.insightByAccountId(
    accountId
  );
  const count: number = await this.countByAccountId(accountId);
  ```

  Run `akan sync <app-or-lib>` to regenerate `lib/db.ts`. A hand-written `DatabaseRegistry.buildModel` call — test
  fixtures, mostly — now needs a `by()`-wrapped insight; wrap it after the `ConstantRegistry.buildModel` call, since
  `by()` resolves the refName from the registry.

- ccf2ae2: A native platform section takes its own `indexPath`

  `ios.indexPath`, `android.indexPath` and `desktop.indexPath` win over the section's (or the target's) `indexPath` on
  that platform, so one target opens the phones on `/mobile` and the desktop app on `/` with no `--target`. It moves
  both the dev build's first page and the `indexPath` a release bundle carries.

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

- ccf2ae2: feat(csr): only the current page publishes to the in-page agent, and a page can bind work to being looked at

  A CSR page kept under the current one for a swipe back is mounted and live, so its `st.tool`s, resources, guides and
  `st.use` keys used to sit in the agent's surface beside the current page's. The agent was offered a lever the user
  could not see, and two pages declaring one name clashed.

  - **`<AgentActivity active>`** (`use-agentic`) publishes what is registered below it only while `active`.
    Registrations stay in place, so turning it back on re-publishes without a remount. A parked registration shadows
    nothing and never clashes with a published one. Nested activities close with their parent. A registry kept outside
    the surface reads the same gate through `useAgentGate()`. Under it are `AgenticSurface.gate(active, parent?)` and
    `AgenticSurface.gated(gate)`, and the registration methods take the gate as an optional trailing argument.
  - Every CSR page container renders one, open only for the current page. The store's live keys follow it, so
    `readState` answers for the screen the user sees.
  - The agent's screen targeting (`highlight`, a zone's `readScreen`, the cursor) skips anything under an `inert`,
    `aria-hidden` or `hidden` ancestor, not only elements that carry one themselves.
  - **`usePageFocusEffect(effect, deps)`** (`akanjs/webkit`) runs `effect` while the user is on the page and cleans it up
    when they leave: after the entrance settles, and as soon as the page starts to go. It is for a camera, a poll or a
    key binding that a live page under the current one must not keep running. **`usePageActivity()`** answers
    `"current" | "prev" | "pending" | "hidden"`, and `current` outside a CSR stack.

- ccf2ae2: Push notifications go to each device token over the service that issued it — APNs or FCM — and a tap opens its
  page from the app's first frame.

  - `akanjs/client/native` exports `push`: permission, `register()` answering `{ token, provider, platform }`,
    `unregister`, foreground presentation, and the `token`, `received` and `action` events. A tap that launched the
    app is held until the first listener, and `akanjs` routes it from boot: an `action` whose `data.url` is an app
    path opens it, and a foreground notification shows as a banner.
  - `akanjs/client/capacitor` is gone.

  Libraries synced into a workspace:

  - `libs/util`: `usePushNotification` takes the native `push` plugin in a shell and Firebase on the web, and
    answers a `PushToken` of `{ token, platform, provider, deviceId }`, where `deviceId` is a random id kept per
    installation (`getPushDeviceId()`). `PushNotificationServer` reads `pushNoti.firebase` and `pushNoti.apns`
    (`teamId`, `keyId`, the `.p8` key's `privateKey`, `bundleId`, optional `environment`) and sends APNs itself
    over HTTP/2 with an ES256 provider token; a token APNs or FCM reports gone is dropped. Topics are gone.
  - `libs/shared`: `notiInfo.deviceTokens` holds one `DeviceToken` per installation (token, provider, platform,
    `deviceId`, `updatedAt`), replaced on re-registration and removed on sign-out (`signoutUser(pushDeviceId)`).
    An `all` notification fans out to active users in pages of 500 and honours each one's notification settings,
    which the old topic send did not.

  **Breaking.** Stored plain-string tokens are dropped on read and each device registers again on its next visit.
  `addNotiDeviceTokenOfSelf` takes a `DeviceToken`, `subscribeToMegaphone` is gone, and a server sending to iOS
  needs `pushNoti.apns`.

- ccf2ae2: chore(deps): React 19.3 — `react`, `react-dom` and `react-server-dom-webpack` 19.3.0, `react-refresh` 0.19,
  `scheduler` 0.28

  19.3.0 ships the `pingSuspendedRoot` fix that `patches/react-dom@19.2.7.patch` carried, so the patch and the workspace
  template's copy are gone. The vendor shims name 19.3's new exports: `ViewTransition` and `addTransitionType` from
  `react`, `browser` from `react-dom`, and the whole `react-refresh/runtime` surface.

  **For an existing workspace:** `akanjs` depends on `react` and `react-dom` 19.3.0 exactly, so move any workspace pin to
  19.3.0 in the same install — two React copies break every hook. Drop `patchedDependencies["react-dom@19.2.7"]` from the
  root `package.json` and delete `patches/react-dom@19.2.7.patch`.

- 326da07: feat(document): query-level `remove`/`update` per filter, and rename `deleteMany` to `removeMany`

  The model facade's `deleteMany(query)` and the store's `deleteManyByQuery(query)` never deleted anything: both
  stamp `removedAt` in one atomic UPDATE, exactly like `remove(id)` does. The framework has no hard delete for a
  model table at all — `DELETE FROM` appears only against the cache, `_akan_meta`, and the search mirror. They are
  now `removeMany` and `removeManyByQuery`, so the name matches the write, and `delete` stays free to mean a real
  `DELETE` if one is ever added. Rename the call sites; the behaviour is unchanged.

  Filters now generate four query-level writes alongside the ten readers, on both the service and the model:

  ```ts
  await this.removeInCategory("news"); // every match
  await this.removeOneInCategory("news"); // the newest match (createdAt desc)
  await this.updateInCategory("news").set({ status: "archived" }); // every match
  await this.updateOneInCategory("news").set({ status: "archived" });
  ```

  **The update pair is a chain.** The patch cannot trail the filter args — those may be optional, and no tuple type
  puts a required element after an optional one — and leading it reads backwards. So it lands on a terminal `.set()`,
  which mirrors the `UPDATE … SET …` the call compiles to. Building the chain runs no query; only `.set()` does.

  These are query-level writes: one atomic UPDATE that **fires no hooks**, so no `_pre`/`_postRemove` and no cascade
  run. Reach for them on a model that carries no removal side effect, and remove documents one at a time otherwise.
  `removeOne`/`updateOne` hit the **newest** match: their subquery is ordered `createdAt` descending, the caller cannot
  change that, and the result carries counts rather than an id. They are for "there is at most one of these", not for
  claiming the next item off a queue.

  Because filter methods are assigned after CRUD, a filter keyed after its own model would have silently replaced
  the single-document `remove<Model>`/`update<Model>` with a hookless query-level one. That now throws while the
  service is being resolved instead. Services also gained `__removeMany`, `__removeOne`, `__updateMany`, and
  `__updateOne`, and the store gained `removeOneByQuery`.

  On the **model facade**, `countDocuments(query)` is now `count(query)`; the old name still works and is marked
  `@deprecated`. Its writes keep `Many`/`One` spelled out — `updateOne` / `updateMany` / `removeOne` / `removeMany` —
  rather than following the short `find`/`findOne` pair: a bare `Model.update`/`Model.remove` would read like the
  document-path `update(id)` and `doc.remove()` while quietly hitting every match.

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

- ccf2ae2: `AKAN_LISTEN_HOST` binds the server to one address instead of every interface, and `AKAN_ALLOWED_HOSTS`
  (comma-separated `host:port`) refuses any request, socket upgrade and preflight included, whose `Host` header it
  does not list, with 403. A page on a name that re-resolves to 127.0.0.1 (DNS rebinding) is same-origin with a
  loopback server, and `CrossSiteGuard` reads `Origin` equal to `Host` as same-site; only the `Host` header, never
  `x-forwarded-host`, still names that page's domain. Both apply to a solo server and to the gateway; a server behind
  the gateway skips the check, since the Host it sees is the gateway's hop.

  Both are meant for a server only its own computer calls, as the server a desktop app carries is. A server that renders
  pages calls itself at `localhost:<PORT>` (SSR and its RSC worker), so a list that names only the public host refuses
  those calls with 403: put `localhost:<PORT>` in `AKAN_ALLOWED_HOSTS` too, and keep `AKAN_LISTEN_HOST` on an address
  that `localhost` reaches.

  A CSR bundle reads `PUBLIC_AKAN_SERVER_URL` from the native shell's launch env (`__AKAN_NATIVE__.env`) ahead of the
  built-in `AKAN_PUBLIC_SERVER_URL`, for a server whose port is known only when the app starts.

- 69f7178: feat(signal): serve any app's signals to agents as an MCP server on `POST /mcp`

  An endpoint already declares everything an agent tool needs — a name, typed arguments, a return model, guards, and
  a dictionary entry saying what it is for in two languages. What was missing was the wire. Every `*.signal.ts` can
  now be published as Model Context Protocol tools, resources, and prompts, with no per-endpoint adapter code.

  Turn it on in an app's `main.ts` — `new AkanApp("./server", { mcp: { enabled: true } })`. Every field also has an
  env spelling (`AKAN_MCP`, `AKAN_MCP_READONLY`, `AKAN_MCP_PATH`, `AKAN_MCP_INSTRUCTIONS`, `AKAN_MCP_ALLOWED_ORIGINS`,
  `AKAN_MCP_LANGUAGE`, `AKAN_MCP_AUTH_SERVERS`, `AKAN_MCP_SCOPES`, `AKAN_MCP_RESOURCE`, …) because the gateway reaches
  a child process through its environment; a value written in code wins over the env of the same name.

  **Nothing is exposed until it says so, slices included.** A guard stops a call, but the _name and argument schema_
  of something like `getAccessTokenByAdmin` are themselves worth hiding, and `tools/list` publishes both. Opt in per
  endpoint with `query(cnst.X, { guards: [...], mcp: { expose: true } })`, per slice with `init({ guards: [...],
mcp: { expose: true } })`, and per generated CRUD verb with `slice(srv.x, { guards: {…}, mcp: { get: true } }, …)`
  — one flag per verb, never a blanket `true`.

  **A tool runs the endpoint's own pipeline, not the service behind it.** `McpExecutionContext` extends the HTTP
  one, so guards, middleware, internal args, `hidden`/`secret` masking, and serialization all still run: an agent
  tool is exactly as safe as the endpoint it mirrors, and cannot be more permissive by construction.

  **Refusals are fail-closed and survive opting in** — `pubsub` and `message` (their internal args read a socket an
  MCP request does not have), an `Any` or `Upload` return, a file upload, a mutation with no real guards, and a
  required `Any` argument. Each is named in the boot log beside `MCP catalogue: tools=… prompts=…`, along with every
  entry published with no description and every one published with no guards at all. `akan quality scan` covers the
  two shapes a source scanner can see, `akan.mcp.missing-description` and `akan.mcp.unguarded-exposure`, and the API
  explorer badges each endpoint `MCP` / `MCP refused` from the same shared predicate.

  **Three protocol revisions from one stateless handler**: the modern `2026-07-28` and the legacy `2025-11-25` /
  `2025-06-18`. Supporting the legacy pair turned out to cost almost nothing once it was clear no session store was
  needed, and dropping it would have disconnected every client shipping today.

  Other pieces:

  - **Resources.** Generated reads publish `akan://<model>/{id}`, `akan://<model>/light/{id}`, `akan://<model>/list`,
    and `akan://<model>/list/<sliceKey>` alongside their tool. Those four shapes are the whole set — a custom
    endpoint keeps its tool and is named in the boot log rather than given a template that would resolve to someone
    else's endpoint.
  - **`prompt()`**, a fifth endpoint kind: the one a _user_ invokes by name, which a client renders as a slash
    command. Takes `.param()` and `.search()` only, returns `PromptMessage[]` built with `Msg.user` / `Msg.link` /
    `Msg.resource` / `Msg.image` and friends. Also mounted as a plain HTTP `GET` whether or not MCP is enabled, so a
    web UI can preview one — which is why it is in the OpenAPI document and why it must be guarded like any read.
    An embedded payload is masked by the model you name (`{ model: cnst.LightTask }`), taking the model as an
    argument so a `{ ...doc }` spread masks as correctly as a hydrated document.
  - **`McpProgress.report(n, { total, message })`** streams progress from anywhere inside a call — a service, an
    adapter, a loop several frames down — and is a no-op when nobody is reading, so the same code runs unchanged
    over HTTP, over a websocket, and in tests.
  - **Auth** is OAuth 2.0 protected-resource metadata plus a bearer check. A provably unusable token — expired, or
    audienced elsewhere — is refused up front rather than degraded to anonymous, because an anonymous caller is told
    a tool does not exist instead of being told to authenticate. A token carrying no `aud` is refused once
    `AKAN_MCP_AUTH_SERVERS` names an issuer and accepted while none is: that is the confused-deputy case RFC 8707 is
    a MUST for, whereas a first-party Akan token is already bound by app and environment.
  - **Descriptions come from the dictionary you already wrote.** The words an agent reads to pick a tool are the
    same `[en, ko]` pair the UI renders as a label, so an app that localizes well documents itself to agents for
    free. Generated entries borrow the model's `.of()` and `.desc()`, since none of them has text of its own.
  - `JsonSchemaBuilder` is now shared with the OpenAPI document via a `refPrefix` option rather than forked, and the
    exposure predicate lives in `akanjs/common` so the server catalogue and the browser API explorer cannot disagree.
  - `AgentCatalogue` (`akanjs/signal`) holds the audience-independent half — enumerating a signal registry, holding
    one name per entry, and resolving dictionary text — so a second agent transport reuses it rather than forking
    `McpDocument`.

  Errors are reported as the caller's own where they are: a missing, unparseable, or undeclared argument and a
  document that is not there come back as `isError` naming it, and only a real failure logs a stack. An endpoint
  that did not opt in answers the same "unknown tool" as one that does not exist, and a guard's refusal never names
  the guard — the difference between those answers is what would enumerate the private surface.

- bf27773: feat(devkit): measure and enforce the server/client render split with `akan quality ssr`

  Agent-written UI drifts client-side. The boundary conventions say which file role carries `"use client"`, but
  nothing said how _little_ should sit behind it, so markup that could ship as HTML kept landing in the bundle.
  `akan quality ssr` now reports the server render share per app and lib and flags the client code that should have
  rendered on the server; `akan quality scan` includes both, and `--format json` carries an `ssrBalance` field.

  **The share is measured in JSX elements, not files.** A file count cannot move: the module convention already fixes
  `Zone`/`Template`/`Util` as client and `Unit`/`View` as server, so the ratio sits near 3:2 whatever an agent
  writes. Element mass is what actually shifts when rendering moves across the boundary.

  Six rules under a new `ssr` warning scope:

  - `akan.ssr.unnecessary-use-client` — the directive is present but the file uses no hook, event handler, store, or
    browser API.
  - `akan.ssr.client-static-component` — a component inside a client file renders markup with zero client-only
    capability.
  - `akan.ssr.client-static-markup` — a large subtree wraps one or two interactive touches.
  - `akan.ssr.client-mount-load` — a `useEffect(…, [])` loads server data the route could have fetched first.
  - `akan.ssr.module-missing-server-view` — a module renders only from `Template`/`Zone`/`Util` and declares no
    `Unit`/`View`.
  - `akan.ssr.template-client-state` — a `Template` holds form state in `useState` instead of the store.

  Three exemptions keep the rules from firing on code that has no server alternative, and each one exists because the
  naive version was noisy in practice. A file importing a bare third-party package may need the directive for the
  package's sake, not its own — without this, chart, swiper, markdown, and editor wrappers dominated the output.
  `ui/<Folder>/index_.tsx` is the declared `lazy()` boundary. And only _mount-time_ loads count as findings: a
  `fetch.*` inside an `onClick` is an interaction, and a poll inside `useInterval` has no server equivalent, so
  neither is flagged.

  The 50% server-share target is reported as a metric, not a warning. A scope can be legitimately client-heavy — a lib
  of third-party wrappers will never reach it — and a threshold that fires on unfixable code trains agents to ignore
  the tool, so the warnings stay individually actionable and the share stays a scoreboard.

  Guidance ships with it: an **SSR First** section in the workspace `AGENTS.md` (and in the generated-workspace
  template) covering the cost model, the rule table, and a ten-point server-side playbook — client shells that render
  `children` untouched, `Tab`/`Tab.Panel` composition that keeps panel content server-rendered, `init`/`view`
  state-sync instead of mount fetching, passing an unawaited `ClientInit` promise so `Load.*` streams it behind a
  skeleton, named `ReactNode` slots, derived work on `Light<Model>`, server-side auth gating, and CSS variants in
  place of client state. The same content is fetchable as the `ssrRule` guideline (`akan guideline show ssrRule`,
  `get_guideline`) and mirrored into `.cursor/rules/ssr-first.mdc`.

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

- 5f53462: The page shows what the agent is doing to it

  An in-page agent's work used to be legible only in the transcript, and the transcript is behind a panel that is
  closed as often as it is open. A form that fills itself, a tab that switches, a route that changes — each arrived
  with nothing anywhere attributing it. Now the page itself says so, from the one signal that knows a call is
  running rather than from a store action, which cannot tell the agent's write from the user's.

  Two effects, both on by default. **The control a call was published from is ringed** where it stands, scrolled to
  first when it is off screen — no app code, because the same `onChange={st.do.setTitleOnTask}` reference that earns
  `data-akan-action` is what makes the control findable. And **a pointer travels to it and presses it**: the ring
  answers _where_, the pointer answers _who_. It glides only when the hop is far enough to be worth following,
  presses on arrival rather than on departure, and fades when the batch is over.

  A call that reaches no control draws nothing, `navigate` included — the router is not an element.

  The form patch fans out: `fill<Model>Form` rings one control per field it named, resolved through the same
  `data-akan-state` the setter annotates, capped at five — a patch of twenty is a form being filled, not twenty
  events.

  `visual` on `Agent.Chat` and `Agent.Zone` turns it off (`false`) or turns one effect off
  (`visual={{ cursor: false }}`). Nothing is ever waited on: a call starts the moment its event is handed over.

  A tool a name several rows answer to rings nothing rather than guessing a row, a call an approval or a guard
  turned back is never drawn, and a batch past four calls stops scrolling and keeps ringing.

  `ToolRunner` gained an `activity` host channel and `AgentSession` an `onActivity` option, both carrying
  `ToolActivity`. They are separate from `progress`, which only ever fires for a tool that chose to report — and a
  tool that says nothing about itself is exactly the one whose effect arrives unexplained.

  **`highlight` now waits for its scroll.** `ScreenFlash` — the extracted reveal-and-ring both effects share — fixes
  a settle loop seeded with `NaN`, which made every first-frame comparison false and put the ring on at the moment
  the smooth scroll _started_. On a long page it had already faded by the time the user's eye arrived.

- ccf2ae2: The volume plugin reads and sets Android's media volume

  On Android, `volume` from `akanjs/client/native` drives the media volume (STREAM_MUSIC), the one the volume keys move
  while the app plays: `getVolume()`, `setVolume({ level })`, `setMuted({ muted })` and the `change` event behave as on
  the desktop. Setting the level keeps the mute as it was (Android unmutes a stream whose volume changes), and a device
  with a fixed volume answers `settable: false`. iOS still answers `UNSUPPORTED`.

- ccf2ae2: `trustedDependencies` in `akan.config.ts` names the packages whose install scripts run where the app is installed

  `bun install --production` skips every dependency's install and postinstall scripts unless the package is trusted, so
  a native addon that builds itself at install time (one that ships no prebuilds) reached the image unbuilt and failed
  at its first call. An app or a lib now lists those packages in `trustedDependencies`; the built `package.json`
  carries the list, and both the image and a desktop app's server run their scripts. A lib's list reaches every app.

- ccf2ae2: `usePurchase` sells through the native in-app purchase plugin: StoreKit 2 on iOS, Play Billing on Android.

  - `usePurchase({ platform, productInfo, url, onPay, onSubscribe })` answers `{ isLoading, products,
purchaseProduct, restorePurchases }`. `purchaseProduct(product | id, offerToken?)` resolves `"purchased"`,
    `"pending"`, `"cancelled"` or `"unverified"`; a shell on a platform the app does not sell in asks the store
    nothing, and the web sells nothing.
  - A transaction is verified by `POST <url>/billing/verifyBilling` with `{ data }`, handed to `onPay` or
    `onSubscribe`, and only then finished (a consumable consumed, anything else acknowledged). A refused
    verification or a failing callback leaves it unfinished, so the store hands it over again; what the last launch
    left unfinished is settled at mount, and one transaction is never credited twice.

  **Breaking.** The hook's options and answer changed, and `cordova-plugin-purchase` is no longer a peer. iOS sends
  the transaction's JWS alone as `receipt` (no app receipt, no `accountId`), so the verification server has to accept
  the App Store Server API form in the same release.

- 5f53462: Web push has one owner, and it draws once

  `/firebase-messaging-sw.js` was a framework route that built the worker in memory from `env.client.ts` on every
  request. It matched ahead of the static fallback, so an app's own `public/firebase-messaging-sw.js` was never
  served and there was no way to turn it off — including the one the push plugin's `syncAssets` had already written
  there, which meant editing that file changed nothing a browser ever saw. The route is gone. The plugin owns the
  worker, `akan sync` writes it, and the static fallback serves it.

  Because the plugin writes a file rather than answering a request, it now rewrites a worker whose body has changed
  instead of skipping any file that exists — otherwise a fix here would never reach an app that had synced once. The
  file opens with a banner; remove that line and sync leaves the file alone, which is how an app takes the worker
  over.

  The worker itself had four bugs, all of them the kind that only show up with a real device in hand:

  - **It never activated on time.** With no `install`/`activate` handlers a visitor who already had a worker got the
    new one on the visit _after_ their next one. It now calls `skipWaiting()` and `clients.claim()`.
  - **One push arrived as two notifications.** firebase-js-sdk draws a payload carrying a `notification` block
    itself and _then_ calls `onBackgroundMessage`, so drawing there unconditionally doubled it — visible as a
    duplicate without a `tag`, and as a re-alert with one. The handler is now data-only.
  - **Every click opened a new tab**, and a full reload rather than a route change. It now focuses an open window
    and hands the path over; `openWindow` is the fallback, not the default.
  - **A badge count in `data.badgeCount` went nowhere.** The worker applies it through `setAppBadge`, guarded —
    Firefox and desktop Safari ship no such method and an unguarded call is a synchronous `TypeError`.

  `AkanSyncContext` gained `readFile`, the pair of the `fileExists`/`writeFile` it already had, so a plugin can tell
  what it is about to overwrite.

  The app-side half ships in `libs/util`, which is where the worker and the hook now live. FCM hands a payload to
  the page instead of the worker whenever a visible window client exists, and `usePushNotification` listened only in
  the worker — so a push sent while the app was on screen was dropped outright, with FCM reporting the send as
  delivered, which is what makes that one expensive to diagnose. The hook now installs `onMessage` and draws through
  the worker's registration, receives the worker's click handover, and routes it through `router.enterDeepLink`.

- ccf2ae2: A Windows desktop release is signed with Authenticode

  With `AKAN_NATIVE_WINDOWS_CERTIFICATE` + `_CERTIFICATE_PASSWORD` (a `.pfx`), `AKAN_NATIVE_WINDOWS_THUMBPRINT` (a
  certificate in the store) or `AKAN_NATIVE_WINDOWS_SIGN_COMMAND` (a JSON array run once per file with `{file}`, for Azure
  Trusted Signing or a cloud HSM), `akan build-desktop` signs every PE file of the app — the executable, its DLL, the
  server's addons and `bin` — SHA-256 with an RFC 3161 timestamp (`AKAN_NATIVE_WINDOWS_TIMESTAMP_URL`), and verifies them.
  `--installer` signs the setup program and, through makensis's `!uninstfinalize`, the uninstaller it writes; the
  settings reach the signer through the environment only. `publish-update` signs a Windows release the same way, and an
  unsigned release build warns that SmartScreen flags a downloaded copy.

### Patch Changes

- ccf2ae2: A CSR page or layout whose async render throws says so, a cached page whose layout redirected renders again, and a
  dev client module that imports a macro builds.

  - An async render that rejected used to leave its layer blank with nothing in the console, since the promise's
    failure was dropped. It is now logged with the stack and the layer it belongs to (`render of page 2 of
/:lang/home failed: …`).
  - `akan:debug:frame` takes `memory` besides `1`: the frame trace goes to `window.__AKAN_FRAME_TRACE__` (the last
    2000 events) instead of the console. A native dev build mirrors each console call over the bridge, which slows the
    frame enough to hide a timing bug; `memory` does not. Async page and layout renders add `layer.render`,
    `layer.settle` and `layer.fail` events.
  - A cached page whose layout redirected renders that layout again when it is back on screen. Signed out, a
    layout that sends the person to the sign-in page kept its empty result, so the page stayed blank after the sign-in
    brought them back (a native app opens its home first, so it always did). A render that issued a redirect while it
    ran is now rerun the next time its page becomes current; `router.redirectCount()` is what it compares.
  - `window.__AKAN_DUMP_FRAME__()` reports the frame's location, stack and phase and every recent async page and
    layout render: settled or pending, still awaited, drawn. It records only the latest state, so it does not change
    the timing a trace would.
  - `akan start` no longer fails a dev client build with `ReferenceError: __akanMeta is not defined` when a file
    imports a macro (`useClient.ts`'s `with { type: "macro" }`) whose modules read `import.meta` at the top level.
    Bun applied the dev build's `import.meta` rewrite to the macro's modules too, and ran them where nothing declared
    the rewritten name; such a file now has its macros run by a build of its own first.

- ccf2ae2: A native dev build's API calls and sockets go through the dev gateway, so a phone on the same network — or the
  simulator, the emulator and a desktop app — reaches `akan start` without a reversed port.

  - A page the gateway served calls its own origin: `getEnv().serverHttpUri` is `<page origin><api prefix>` and the
    websocket follows it, unless `AKAN_PUBLIC_SERVER_URL` names a server. A release build is unchanged.
  - The iOS, Android and desktop hosts carry the method, the body and the request headers, `authorization`
    included, to the gateway; the gateway relays the app's `<prefix><websocketPrefix>` socket. Android hands the
    host no request body, so a call that carries one goes to the gateway's `http://localhost` origin directly and
    the server answers its CORS.
  - A desktop dev build opens the target's start page instead of `/`, and builds when the web root has no
    `index.html` yet.
  - `NativeWebDir` lists the web root in `/`-separated paths on Windows too.

- 5f53462: A relation field renders the value it holds

  `Field.Parent` / `ParentId` / `Children` / `ChildrenId` built their options out of the slice list alone, and that
  list is loaded when the dropdown opens. A form filled by `edit<Model>` therefore rendered an empty control over a
  value it was holding — and opening the dropdown did not always fix it, because a slice list is one `limit`-sized
  window and the row the value points at can sit outside it.

  `Select` was the immediate cause: a selected value with no matching option rendered nothing at all, `renderSelected`
  included, so no amount of care in the caller could have painted it. It now renders the value it is given, which is
  what a controlled component owes its parent — an enum that lost a member shows the stale value rather than a blank
  field.

  The four controls now merge what they hold into their options. A `Light`-valued control already carries the row, so
  it needs no request and the value is right in the server render. An id-valued control carries no row at all, so a
  missing one is read through the generated `light<Model>` endpoint and cached per `refName:id` — deliberately beside
  the store rather than in it, because a model store is a singleton and resolving into it would overwrite whatever
  listing of the same model the screen is already showing. A row that cannot be read — removed, or behind narrower
  `get` guards than the slice the control lists from — is remembered as unreadable rather than retried, and the
  control shows the id.

  Four things came with it, all of them the same bug seen from another side:

  - Opening the dropdown no longer invalidates the slice list. It refreshed on every open, replacing the rows any
    `Load.Units` on the same page had put on screen; it now reuses what the store already loaded.
  - `Field.ParentId` offered its options as bare ids, so `searchable` matched on the hex id while the option on
    screen read as a name. Every control now labels its options — from `renderOption` when that returns a string,
    otherwise from the model's own `labelOf`.
  - `sortOption` was accepted by all four and applied by none.
  - `Select` takes `loading`, and the controls pass the slice's loading flag, so an opened dropdown says it is
    fetching instead of claiming there is nothing to pick.

- ccf2ae2: fix: a gateway's replica takes the websocket relay on 127.0.0.1, from the gateway only

  Behind the gateway a replica listens for relayed sockets on a TCP port of its own, and its ready message names
  127.0.0.1, where the gateway dials. It bound that port on every interface; it now binds 127.0.0.1 only, whatever
  `AKAN_LISTEN_HOST` names, and answers only the Host the gateway's hop carries, so a page on a name rebound to
  127.0.0.1 is refused there too.

- ccf2ae2: fix: a server whose parent dies while it boots exits instead of serving on

  A replica (and a desktop app's carried server) listened for its parent's IPC channel closing only after its `init`
  finished, and Bun drops that event for a listener added after a `message` listener, which the single-mode queue and
  pub/sub add during `init`: a gateway or shell killed during boot left the server running, holding its port and its
  database, with its cron jobs. It now listens before `init`, treats a channel already closed or a `ready` it could not
  send as a parent gone, and ends its process group the same way it does after boot.

- 5f53462: fix: a navigation to a route that is not there leaves the page alone

  The RSC route answers a target that resolves to nothing with `0:null` under a 404 — a Flight payload whose root is
  literally `null`. `fetchRscNavigationResponse` read the redirect and patch headers but never the status, so that
  payload was decoded like any other and committed: the client replaced the whole document with an empty tree. Since
  the tree is mounted by `hydrateRoot(document, …)`, everything went with it — the root layout, and whatever it holds,
  an in-page agent's chat session included. A full document load never showed this, because that path renders a real
  not-found page instead; only client navigation reached the empty one, so the same bad href behaved completely
  differently depending on how it was followed.

  The status is now read before the body reaches the decoder, and a not-found navigation is **refused rather than
  committed**: nothing is rendered, history is never touched, and the page stays exactly where it was. It is
  deliberately not converted into a document navigation either — that would land on the 404 this refusal exists to
  avoid. `Router.navigation()` is the new report: it answers the navigation `push` / `replace` last started and
  rejects when the route refused to move, which `push` itself cannot do because it returns before the payload for the
  new route has even been asked for. `popstate` is the one exception and goes the other way — the address bar has
  already moved, so refusing would leave the tree and the URL describing different pages, and a document navigation
  there renders the real not-found page.

  The in-page agent's `navigate` reads that report and answers the model with the miss instead of a move that did not
  happen, so a guessed path costs one tool error on the screen the agent is still on rather than the session.

- ccf2ae2: fix: a file `getBlob` serves never runs as a page of the API's origin

  `libs/util`'s `getBlob` (`/api/localFile/getBlob/*`) sets no Content-Type of its own: Bun types the body by its
  stored name and answers a Range with a 206, and the response goes out the way Bun sends a file, neither buffered nor
  compressed. Every answer but a PDF's carries `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline';
sandbox` and `X-Content-Type-Options: nosniff`, so an uploaded `.html` or `.svg` opened from its URL runs no script on
  the API's origin, which is also the origin of a desktop app's carried server. An `<img>` or `<video>` showing the file
  is unaffected; a PDF is left out because a browser's viewer refuses a sandboxed document.

- 69f7178: fix: make the admin panel's own controls work, and give the data surface a look

  `Model.AdminPanel` is the one component an app mounts to get a model's whole admin surface, and most of what it
  put on screen did nothing.

  **The dashboard crashed the panel on every app that has no `summary` state.** `AdminPanel` always passed a
  `renderDashboard`, and `ListContainer` read the tiles it needs through `st.use.summary()` — an app-level store key,
  not a generated one — so the accessor was `undefined` and calling it took the route down. It now reads the key off
  the state through `st.sel`, which is one hook whether or not the key exists, and `AdminPanel` defaults a dashboard
  only when `summaryColumns` names something to put in it.

  **A summary tile never rendered even where the state existed.** `AdminPanel` declared a `queryMap` prop and passed
  `{}` in its place, and `Dashboard` skipped every column the map did not name. The map is forwarded, and it now
  decides whether a tile _links_ to its filtered listing rather than whether the tile exists at all. The tile is also
  no longer an `<a>` inside a `<button>`.

  **The sort selector was permanently empty.** It read `fetch.<model>SortKeys`, which nothing defines, and labelled
  the options with a dictionary key one level short of the real one. Sort keys now travel with the serialized signal
  (`FetchSerializer` emits `filter.sortKeys`, which `FetchClient` already knew how to merge and register), the
  selector reads `fetch.sortKeyMap`, and a label that misses the dictionary falls back to the humanized key instead of
  printing `user.latest` at the reader.

  **`query`, `init`, and `sort` were dead props.** The init effect called `init<Model>()` with no arguments at all.
  It now fills every slice argument before the init form, which is the only order the generated action reads
  correctly — passing the form into an unfilled positional slot made it the query.

  Also: an `Export CSV` that emitted tab-separated JSX (`[object Object]` for any column with a renderer) is real,
  escaped, BOM-prefixed CSV read from the column's `value`; a card column with no `.length` — every number, every
  date — renders instead of silently vanishing; a table header with no dictionary entry reads `Created At` instead of
  `user.createdAt`; an empty card list says so instead of rendering nothing; a table keeps its rows while refreshing
  instead of flashing its empty state; and the toolbar, tiles, and cards are rebuilt on the semantic tokens with a
  card/table toggle, so the panel looks like the rest of the framework.

- 69f7178: feat!: `setAgentAccess` takes guard classes, not a policy function

  Who may spend the LLM key through the `runAgentTurn` relay is an authorization decision, and this codebase spells
  those as guard classes everywhere else. `AgentRelayAccess` now forwards to the guards an app names instead of
  calling a bespoke `(context) => boolean` — so the relay reuses the same `srvkit/guards.ts` classes an endpoint's
  own `guards: [...]` array takes, rather than making the app restate `!!context.get("account")` in a shape nothing
  else in the framework understands.

  ```ts
  // before
  option.setAgentAccess((context) => !!context.get("account"));
  // after
  option.setAgentAccess(SignedIn);
  option.setAgentAccess([SignedIn, NotBanned]); // ANDed, as an endpoint's own array is
  ```

  `null` still clears what a library set, and with nothing named the call is still refused like `None`. The
  `AgentRelayPolicy` type is gone. `AgentRelayAccess.scope` became a getter reporting whatever its delegates need,
  so a resource-scoped guard cannot be evaluated argument-free by a catalogue that believed the old static
  `"account"`. Guard instances are now cached by `guardOf` in `signal/guard.ts`, which `SignalContext` uses too —
  one instance per class, built on first use rather than at registration.

- 69f7178: feat: the in-page agent can ask the user instead of guessing

  `askUser` is a fourth built-in on every turn, and the **session** owns it rather than the surface: the answer comes
  from the conversation, not the screen, so it needs no declaration from the page and a zone agent asks inside its own
  transcript. `AgentSession` parks the loop on `pendingQuestion` exactly as it parks on `pendingApproval`, and
  `Agent.Chat` renders the question card above the composer — which is closed anyway while a turn runs, so the card is
  the only way in.

  `choices` offers a pick (`multiple` for several) and omitting them asks for free text. The card keeps a free-text row
  either way, because the model wrote the options and only the user knows whether the right answer is among them.
  Dismissing is the tool's **error** result rather than a silent empty answer, so a model that asked cannot read a
  skipped question as consent; an aborted turn settles the same way. A question with no text is refused without ever
  reaching the screen, and choices are trimmed and deduped because the answer is the option's own text — two identical
  options cannot be told apart.

  A settled ask renders as the exchange it was, question then answer, instead of as a `askUser` tool row: while the
  question is pending only the card holds it, so the text is never on screen twice. A hook tool named `askUser` shadows
  the built-in like any other, and the relay needed no change — the tool rides the same wire the surface's own do.

- 5f53462: An attachment carrying both bytes and an address is read from the bytes

  Both vision adaptors picked `url` over `data` — `AnthropicLlm.sourceOf` and the OpenAI dialect's image part — so a
  host could not send an address for the screen and bytes for the model in one attachment. Sending both got the
  address, and when that address was private the model answered about a picture nothing had fetched, with no error
  anywhere. That is the one attachment failure that reports nothing, and the framework's own default storage backend
  serves exactly such a path.

  The order is now bytes first in both. Choosing the address does save the provider hop what the bytes weigh, so this
  is not free — but a host that has a publicly reachable URL has no reason to also inline the bytes, while a host
  that uploaded to private storage has every reason to send both. Being wrong the new way costs a larger request;
  being wrong the old way cost a confident answer about nothing. A provider-reachable URL should still travel alone.

- 5f53462: An attachment can carry the host's own handle on the file, and the composer's ceilings are the app's

  `MessageAttachment.ref` is opaque to the framework, which only moves it — a file id, a storage key, whatever turns
  the attachment back into something a tool can be handed. Without one, a host that stores its uploads keeps a map
  beside the transcript keyed on name and size, which is the guess `Attachment.same` has to make and the one that is
  wrong for two crops of one export; when both sides carry a `ref`, that is now the answer instead.

  The per-file ceiling is measured on what `attach` produced rather than on the file that was picked, so a reader
  that uploads and answers a `url` is no longer refused for a cost it does not incur. All three ceilings become
  defaults behind `<Agent.Chat attachLimits={{ perFileBytes, perMessageBytes, perMessageCount }} />`, since what one
  request can carry belongs to the configured provider.

  A `url` the reader answers is handed to the provider as the address it will fetch, which is now documented on
  `attach`: the default storage backend serves a path only the app can resolve, and a model given one answers about
  a picture it never saw with nothing anywhere reporting a failure. Answer `data` when the provider cannot reach it.

- 5f53462: An attachment an app built itself cannot kill the turn

  `session.send([{ role: "user", text, attachments }])` lets a host assemble attachments directly, and until now
  `MessageAttachment` was not exported from `akanjs/ui` — so the one path where the app writes the object was the one
  path with no type to write it against, while the composer's own reader was typed. It is exported now.

  Two places trusted that object's declared shape. `AgentService.isReadable` dereferenced `mimeType` unguarded, so a
  missing one threw out of the relay and took the whole turn — every other attachment of the message with it — under
  a `TypeError` that named nothing; it is now unreadable like any other type the provider cannot take, which routes
  it through the note that names the file. The attachment chip did the same on the preview branch, where the throw
  took the transcript's render down. Both now cost that one attachment and nothing else.

  `field.hidden` is documented as the trap behind this: it is stripped from every endpoint response and hydration
  writes `null` over the key, while the generated type still declares the field — so a client holds a deliberate
  `null` behind a type that promises a value, and only `??` / `== null` catch it.

- 5f53462: feat: the in-page agent issues independent tool calls in one turn instead of one per turn

  A turn has always been able to carry several tool calls — the session collects every `toolCall` event, runs them in
  order and posts them back as one `tool` message — but nothing asked the model to use it. A screen that needed ten
  calls got ten turns, each paying a full model round trip and a resend of the whole transcript, and the turn cap
  then parked the run on a "keep going?" card halfway through.

  - `AgentService.preamble` is the framework's own half of the system prompt, ahead of whatever the app declared. It
    asks for the batch — every call that does not need another call's result goes in the same turn, and a tool that
    does the whole job in one call (a form's fill tool) beats one call per field — and it asks the model not to read
    the screen back to confirm work it has just done, since the change report it was handed already says so. Both
    sentences were measured against the provider: "approve these eight" went from 1.5 turns (with three runs in eight
    doing nothing at all) to one turn in every run, and "read the screen, then approve what is pending" from 3.0
    turns to its floor of 2.0 in every run. The read a fresh route needs after `navigate` is acquisition rather than
    confirmation, and survived in every run of that scenario. It is composed in the service rather than in an adaptor
    for the reason `explained` is — an adaptor that has to remember it is one that forgets.
  - The turn cap defaults to 12 assistant turns instead of 8. A chain of ten calls could not finish under the old
    default without the user answering a question first.
  - `readState` and `highlight` declare `settle: false`, as `readScreen` already did. A settle is 120ms of DOM quiet
    at the very least, and neither of them changes anything a resource holds, so ten reads paid a second and a bit
    for a change report that is empty by construction.

- 5f53462: feat: a tool the user answers, rendered in the chat by the app that declared it

  `st.tool("collectContact").desc("…").card(({ submit, cancel }) => <Contact.Form …/>)` is a second way a tool chain
  ends. Where `.exec()` runs a function, a card parks the call in the chat and renders the app's own component there;
  what the form submits is the call's result, and cancelling is the error the model reads instead. A name and a phone
  number, a date somebody has to look up, a signature — those are answers a model must not invent, and until now the
  only surfaces a chat could park on were the approval gate and `askUser`'s question, neither of which carries a
  shape.

  `AgentSession` holds it as `pendingCard` beside `pendingApproval` and `pendingQuestion`, and `Agent.Chat` renders it
  in the same place; `AgentToolCard` is an `_overrides.tsx` slot like the other two. The frame draws its own way out
  even when the app's component does not, so a turn can never park on something the user cannot dismiss.

  The call waits **outside** the tool queue, for the reason an approval does: a form parked in front of somebody is
  not work, and holding the execution lock across it would freeze every other agent on the page behind one unanswered
  card. The declared arguments are checked before the card is parked rather than while it renders — a throw inside the
  host's tree would take the chat down, where a verdict reaches the model as something it can correct — and `confirm`
  is not read for a card at all, because the card is already the asking. The screen is still snapshotted around the
  wait, so a card that writes what it collected into a store reports what moved like any other call.

- f882bbc: feat: the in-page chat is customizable per part, opens from the app's own control, and composes multi-line

  **Eight slots replace what the chat renders, so a skin no longer means replacing the panel.** `AgentLauncher`,
  `AgentBubble`, `AgentComposer`, `AgentApproval`, `AgentQuestion`, `AgentMenu`, `AgentMarkdown` and `AgentCode`
  each bind in `_overrides.tsx` beside the existing `AgentChat`, and `akanjs/ui` exports every default next to them
  (`DefaultBubble`, `DefaultComposer`, …) so a replacement composes the one it is replacing instead of
  re-implementing the loop, the slash commands and the approval gate. `AgentCode` is the seam a highlighter binds
  to — the markdown scanner now keeps the fence's language, which it used to drop. A component bound to
  `AgentBubble` carries its own `memo`: the transcript re-renders on every streamed delta.

  **The panel takes a controlled `open`/`onOpenChange` pair, so an app opens the chat from its own control.**
  Conditional mounting was not a substitute — unmounting aborts the session and discards the conversation.
  `launcher={false}` draws no launcher for an app that has its own entry point, `launcherClassName` /
  `panelClassName` reach one surface each where `className` reaches both, `intro` replaces the empty-state line
  (where starter questions go) and `header` adds controls beside the built-in clear and close.

  **The composer is a textarea**: Enter sends, Shift+Enter writes a newline, and it grows to a few lines before it
  scrolls. The vertical arrows still walk what was sent, but only from the first or last line — anywhere else the
  caret belongs to the textarea. It resolves its field shell through the `input` recipe slot, so a recipe swap
  reaches it like every other field.

  **On a phone the panel is the whole screen**, a card from `sm:` up, and it lifts above the on-screen keyboard —
  only `visualViewport` reports that inset, and a full-screen chat whose composer sits under the keyboard is one
  nobody can type into.

  `SessionContext`, `useAgent`, `agentSessionOf`, `ChatCommands` and the parts' prop types are exported too: an app
  may not import `use-agentic`, and without them a replacement could not see the session an `Agent.Zone` handed down.

- 5f53462: The in-page chat takes the next message while a turn is still running.

  - Enter (or the Queue button that appears beside Stop) during a turn parks the message and sends it the moment the
    turn ends, instead of doing nothing. One slot: a second send joins the first on a new line, so the model is
    handed one user message. Staged files ride along, under the same per-message ceilings.
  - The parked message shows on a card above the composer with two ways out — take it back into the composer to
    change it, ahead of whatever was typed since, or drop it. The card is the `AgentQueued` slot, with `DefaultQueued`
    and the `QueuedMessage` type exported beside the other chat parts.
  - Stop hands a parked message back to the composer rather than opening the next turn with it, so Stop means stop.
    `/new` drops it along with the conversation, the way it drops staged files. A `/prompt` parks like text; the
    built-in commands never park, and a pending question still takes the composer as its answer.
  - A spoken ask parked behind a turn is still the one answered out loud — and a second voice ask no longer re-reads
    the previous answer while the new one is on its way, which it did whenever the transcript already held one.

- 69f7178: feat: the agent chat answers slash commands of its own, and the composer remembers what was sent

  **Five commands join the `/` menu the app's `prompt()` endpoints already appear in**: `/new` (`/clear`) starts a
  new conversation, `/retry` sends the last message again, `/copy` puts the transcript on the clipboard, `/help`
  lists the commands, and `/tools` lists what this screen published. An app writes none of them and cannot add one —
  the extension point for a product's own command is a `prompt()` endpoint, which is guarded and server-side.

  **A built-in wins a name collision with a prompt of the same name**, and a shadowed prompt is dropped from the menu
  rather than listed twice. That is the mirror image of the tool rule, deliberately: a component's `st.tool` shadows a
  built-in it means to replace, but no library's prompt may take `/new` away from the user who typed it. `/new` and
  `/copy` are also dispatched ahead of the is-a-turn-running check, because mid-turn is exactly when they are reached
  for — so `AgentSession.reset` now ends the turn it is clearing and waits for it to wind down. It used to return
  silently while one was running, and clearing before the abort lands leaves the dying turn appending onto an empty
  transcript.

  **A command's output is a `local` message: rendered in the transcript, withheld from the wire.** The transcript
  _is_ the model's history, so `/help` text appended plainly would come back on the next turn as something the
  assistant believes it said. `session.note(text)` writes one, `session.report(error)` stays what a host-side failure
  lands in, and `local` messages are left out of a `/copy` export — they are the chat talking to itself.

  **`/copy` exists because nothing else keeps the transcript.** The relay is stateless and the conversation lives only
  in that browser, so an export is the one path a wrong answer has to whoever could fix it; it carries the route and
  the timestamp for that reason. **`session.retry()`** replays only the trailing user message and leaves everything
  before it in place, so a prompt's own preamble is not sent twice.

  **↑ and ↓ in the composer walk what was sent.** A single-line input has nothing of its own on the vertical arrows,
  and the half-written draft they were walked away from comes back at the bottom of the walk — the other half of why
  a turn that fails for a reason unrelated to the ask no longer means retyping it.

- 5f53462: The composer says a file is being read

  `useChatAttachments` now reports how many files are in the reader, and the composer draws a chip for each. The
  built-in readers resolve in a tick and nothing was missing before; an `attach` that uploads takes seconds, and
  since the per-file ceiling moved behind the reader that is now the shape an app is meant to write — so a large
  photo was seconds of a panel that looked like it had dropped the file.

- f882bbc: feat!: `st.tool`, `st.expose` and `st.useState` become one chain, and a declaration's type is its mask

  **Breaking.** The three declarations an app writes for the in-page agent had three different shapes and two
  options that did not carry their weight. They are now one shape — `<entry>(name, …) → .desc(text) → <terminal>`,
  where the terminal call is the hook — and every option left is one the runtime reads. Migration guide:
  `local/tool-migration.md`.

  ```ts
  st.tool("removeTask", { confirm: true })
    .desc("Remove one task.")
    .arg("taskId", ID)
    .opt("force", Boolean)
    .exec(fn);
  st.expose("openNote", cnst.LightNote).desc("The note on screen.").value(note);
  const [tab, setTab] = st
    .useState("tab", String, { set: true })
    .desc("Which tab.")
    .init("all");
  ```

  **`.desc()` is required, and it is now load-bearing twice.** A model picks a tool by that sentence and by nothing
  else, so a tool without one was a tool an agent could only guess at. It also replaces `shared: true`: a row
  component registering fifty `removeTask` is fifty copies of one name _and one description_, which the surface now
  reads as one declaration, while a second description arriving under a name already taken is two components that
  collided and still warns. `shared` was an unverified claim whose only effect was suppressing that warning — a flag
  that said "trust me" where the description already says the same thing, checkably.

  **`effect` becomes `settle`, because only one of its three values ever did anything.** `"query"` skipped the wait
  for the screen to settle before the call's effect was reported; `"state"` and `"mutation"` were indistinguishable
  at runtime, were dropped before reaching the model, and coloured a badge. What is left is the fact the session
  actually needs: `{ settle: false }` is a read that returns what is already there, and everything else is waited
  out because a write may still be landing when `exec` resolves. `effect` also leaves `PublishedTool`, the relay
  wire (`AgentWireTool`, `WIRE.md`) and the `/tools` dock badge.

  **`.arg()` is required and `.opt()` is optional**, matching the filter builder's vocabulary, so an optional
  argument is a different call rather than an options bag — and the `exec` parameter widens to `| null` only for
  `.opt`.

  **A readable value declares its type, and the type is the mask.** `st.expose(name, Type)` and
  `st.useState(name, Type)` take a scalar, an enum, a model class, a one-level array of those, or `Any`. The type
  typechecks what the component hands over — a model resolves to its state object, so a hydrated document and a
  plain copy of one are equally accepted — and it decides how the value reads: a model strips its own `hidden`,
  `secret` and `visual` fields by the model that was _named_ rather than by whatever class the value still carries,
  and a `Date` leaves as an ISO string. That subsumes `mask:` and `serialize:`, both of which are gone; `Any` is the
  escape hatch and passes the value untouched. A type nothing can read is reported on the console and left
  unpublished rather than thrown, the same degradation an undescribable `.arg` already had. `.value()` also takes a
  thunk, read when the agent reads, for a value assembled out of a ref the children fill in after the render.
  `st.useState`'s `set` is now a boolean, since the write schema comes from the same type.

- 5f53462: A stopped turn leaves no bubble that is still writing

  `AgentSession` opens an assistant draft before the first token arrives, and Stop caught before that token left the
  draft in the transcript forever. `Transcript` already drops an empty assistant message, so the wire and the
  persisted history were both correct and the rendered array was the one place it survived — which is exactly the
  array a bubble reads to decide it is still being written, so the pulsing dot never stopped. The turn's own settle
  now drops it, using the predicate `Transcript` already applies. A turn a provider ends without saying anything
  leaves nothing behind either, for the same reason.

- 5f53462: An upload control reaches an agent, the way a relation picker already does

  `useFileFieldTool(onChange, { read, label, max, min })` is the counterpart to `useRelationFieldTool` for the other
  half of _"a relation is picked or uploaded"_: the control hands the files it is holding and gets
  `load<Field>OptionsOn<Model>` — the name the relation picker already publishes, so one spelling serves a form that
  draws both — plus the field's own `set<Field>On<Model>`, with `add`/`sub` besides on an array field. Before this an
  agent could see an attached picture and read the form, and had no way to put one in the other.

  The array pair is not the convenience it is for a list of ids elsewhere. A picker's candidates are the whole
  resolvable set, so rewriting the array is always expressible; an upload control's are what this conversation
  brought, and a field that already holds older files cannot be rewritten without ids the guard has never heard of.
  `max` / `min` are passed rather than derived, since `arrDepth` says a value is a list and not how long a legal one
  is, and they reach the description as well as the guard — a cap an agent can only learn by tripping the server is
  the round trip the listing tool exists to spare it. `read` omitted publishes nothing, so a shared control can
  forward an optional tray without every call site growing a tool that refuses every id.

- f882bbc: Back a zone's transcript from a mounted `<Agent.History />` instead of a `persist` prop, so the zone can be
  assembled by a server component.

  A `SessionHistory` is functions, and a function cannot cross the server/client boundary as a prop — so
  `persist={myStore}` made every ancestor up to whoever builds the session a client component, which for a zone is
  the whole subtree. `<Agent.History load save clear onCompact />` is a leaf that attaches the store to the
  enclosing session, in the shape `Agent.Guide` already uses, and renders nothing. `Agent.Zone`'s other props were
  already serializable, so the zone and the chat inside it can now be server-rendered.

  Restoring follows the rule an async `load` already followed: it lands only while nothing has happened to the
  conversation yet. Mounting with the zone restores; mounting later saves from there on, and the store is never
  asked for a transcript that would be discarded. `AgentSession.setHistory` / `setOnCompact` back it, for a session
  an app built itself.

  `setHistory` and `setOnCompact` return a detach that clears the slot only while their own value is still in it,
  so a remount's cleanup cannot silently stop the saving of whoever attached after it. The store lives exactly as
  long as the component; a host that wants it to outlive the view attaches it on the session itself.

  Also documents that `open` without `onOpenChange` draws no close button — a fixed panel with nowhere to close to,
  and the shape that keeps a controlled chat free of function props.

- f882bbc: Hide `Agent.Dock` and `Agent.Context` in production.

  Both are a developer inspector — they list every published tool, can run one by hand, and preview the turn snapshot. A layout that mounts them would have shown that to every visitor on `AKAN_PUBLIC_ENV=main`. They still render on local, debug, develop, and testing.

- 5f53462: feat: the composer draws a pointer as the name it points at

  Picking a row off the `@` menu used to leave `@[이번엔, 진짜입니다](mention:videoCut/6aae…)` sitting in the
  composer — the token is what carries the reference onto the message, so it had to be in the text, and the text is
  what a textarea draws. It is now drawn by a Lexical editor instead, where each pointer is one atomic node whose
  label is what the person reads and whose `getTextContent()` is the token. The draft string the chat reasons about
  is unchanged, pointers and all: `Reference.parse`, the `@` query, the chips, the wire and the server's own framing
  all see exactly what they saw before, and the editor is one way of drawing it.

  A pointer deletes in one backspace rather than a character of a label that would then name nothing, and every
  offset the chat hands over — the caret a `session.refer` inserts at, the line a recall arrow belongs to — stays an
  offset into that string.

  It costs nothing where it is not used: the editor is its own chunk behind the chat's own, and `Agent.Chat` only
  draws it where `reference` sources were declared. `mentions={false}` keeps the plain textarea, for an app that
  overrides the composer or would rather see the tokens it is sending.

  Lexical rather than a contenteditable of our own, because a Korean or Japanese IME composing into a contenteditable
  that React also re-renders is the bug class the library exists to own.

- 69f7178: feat: derive an agent surface from the store, annotate the DOM with it, and add a read-only insight query

  The server half of agent support is the signal registry; this is the client half plus the layer-bypassing read. All
  of it is derived — an app writes no declaration for any of it.

  **`SerializedStore` and `StoreCatalogue`** describe one built store the way `SerializedSignal` describes a signal
  registry: every key on `st.use` and every action on `st.do`, with argument schemas. Flat rather than grouped by
  model, because that is what the store is — one namespace, where a key means the same thing to every reader.

  The exposure default is the opposite of the MCP catalogue's, and deliberately: a key on `st.do` is the same call the
  user's own click makes, under their own credential, with them watching, so an agent driving it cannot reach past what
  the UI already permits. Every key is published unless something about it cannot be described, and each of those is
  recorded as a refusal with the reason — a `hidden`/`secret` field setter (the masking boundary facing the other way),
  a `Map` or relation field, a `FileList` upload, `selectModel` (it stores the list item it was handed, so an id would
  leave a stub), and any action that declares arguments no endpoint or field describes.

  Nothing re-derives a name rule. An action's arguments come from the endpoint it is named after — which is not luck
  but the house rule that makes `st.do.X` read the same as `fetch.X` — or from the field metadata the setter was
  generated from, or from the role the store recorded while it built the slice. Two things had to be added to make that
  possible: arity is captured in `#mergeActions` (the `st.do` wrapper takes rest arguments, so `Function.length` is
  zero for everything by the time anyone can ask), and `ACTION_OWNER_META` records which module declared each action,
  which is what names the dictionary node its words are read from.

  **`AgentBridge`** turns that into tools with JSON schemas, checks each argument against what it declared, dispatches
  through `st.do`, masks reads, and keeps a transcript. It holds no model, provider, or key — an app wires whichever
  agent it uses to `tools` / `call` / `read`. `Agent.Dock` in `akanjs/ui` renders the catalogue, the refusals and the
  transcript, and can run a tool by hand; it is how you see what a page actually publishes.

  Reads are masked because they have to be: `<model>Form` holds what the user just typed, credentials included, and an
  in-page agent ships what it reads to a remote model. The mask is by the declared model rather than by the value's
  class, since `immerify` copies a form into a plain object and the class is gone by then. `Msg.mask` moved to
  `constant/mask.ts` so both audiences use one implementation.

  **`data-akan-action` / `data-akan-state`** are emitted by the framework's own interactive primitives, with no app
  code at all. `onChange={st.do.setNameOnUser}` — the house form for every model field — already carries everything an
  annotation needs; it just had no way to be read off a function, and now it does. `Input` (every variant plus
  `Checkbox`), `Select`, `Switch`, `Button`, and the `Field.*` fields all carry it. An inline arrow gets nothing,
  because a closure the caller wrote says nothing about what it does. Accessibility trees, E2E selectors, and external
  browser agents get the same names for free.

  **`InsightQuery`** is one read-only SQL statement, for a question the domain endpoints cannot express. Read-only is
  enforced four ways — the statement is wrapped as a derived table, where nothing but a query is legal in either
  dialect; a pre-execution check runs on the statement with comments and string literals removed; forbidden keywords
  are rejected rather than trusting that Postgres refuses a data-modifying CTE inside a subquery; and the `_doc` column
  never crosses the boundary, since that is where every maskable field lives and an arbitrary SELECT names no model to
  mask by. Rows are capped at 1000, which no caller can raise. The timeout bounds the wait, not the query —
  `bun:sqlite` is synchronous and holds the loop, so the ceiling is what limits that case.

  What the insight query costs is worth stating: it answers "how many, since when, grouped how" over base columns and
  the search mirror, and it cannot read a domain field. Field-level reads go through the domain tools, which mask.

  `libs/shared` exposes it as `runAdminSql` on the admin signal, guarded by `SuperAdmin` and returning the new
  `insightRows` scalar. It is a `mutation` despite not being able to write, because a `query` is a GET that never sends
  a body — the statement would have to travel in the URL, where it lands in every access log and hits the length limit
  — and because a query's response is memoized per URL, which is wrong for an ad-hoc statement. It is not MCP-exposed:
  the catalogue is built once at boot rather than per caller, so publishing it would tell every client that can reach
  `/mcp` that an arbitrary-SQL tool exists.

- 5f53462: `readScreen` names every image, and can carry its address

  An `<img>` with no `alt` contributed nothing at all, so a card rendering a picture read exactly like a card
  rendering nothing — and "this page shows no image" is the one answer the screen could not support. Every image now
  stands as `[image: <alt>]` or `[image]`, and `readScreen({ images: true })` appends `(<src>)` for handing one to a
  tool that takes a picture. It is off by default because a gallery is one long URL per thumbnail, and a `data:` URL
  is never printed: that is the bytes themselves rather than somewhere to fetch them.

- 69f7178: fix: refuse `runAgentTurn` until the app names an `AgentRelayAccess` guard

  The relay used to allow every caller and warn at boot until an app decided. With no guard it now answers like
  `None` — `Access denied by guard: AgentRelayAccess` — and boot is silent. Name one with
  `option.setAgentAccess(...)` (or `AgentRelayAccess.use`) before the chat can spend the LLM key.

- f882bbc: Open the in-page agent's session to the host: a custom transcript store, a narrowed built-in tool set, and the
  types a replacement transport needs.

  - `persist` now takes a `SessionHistory` (`{ load, save, clear }`) as well as the web-storage option, and all
    three methods may answer asynchronously — a transcript can live on a server. A `load` still in flight when the
    user sends the first message is dropped rather than merged, and saves are chained so a slow store cannot land
    an older transcript last. `session.isRestoring` reports the in-flight load — a host that opens with a prompt of
    its own waits for it, since sending on mount is a race the restore loses.
  - `builtins` on `Agent.Chat` and `Agent.Zone` picks which of the runtime's own tools a session gets (`false` for
    none, an array for exactly those). A withheld name answers the same "unknown tool" an unregistered one does.
    This is the only way to drop `navigate` inside a zone, where a same-named hook tool is registered under its
    scope prefix and never shadows the built-in.
  - `Agent.Zone` takes a `session` the app built (and then does not abort it on unmount) and reports it through
    `onSession`. `Agent.Chat` takes `chrome={false}` to drop the header bar and `defaultDraft` to open with text
    in the composer; a panel controlled without an `onOpenChange` draws no close button instead of an inert one.
  - `onCompact(replaced, summary)` reports a compaction's cut, for a host keeping its own summary watermark.
  - `akanjs/ui` now exports `httpRunner`, `fetchRunner`, `AgentSession`, `AgentProvider` and the `AgentRunner` /
    `RunnerRequest` / `RunnerEvent` / `ChatMessage` / `SessionHistory` / `PublishedTool` / `ContextBlock` types.

- 5f53462: Two providers that read a picture ship, and `accepts` is answered per model

  Everything the framework carries for an attachment ended at a text-only provider: one chat-completions
  `LlmAdaptor` shipped and declared no `accepts`, so an image reached the model as a note saying it could not
  be read, and any app wanting vision wrote the provider mapping itself — role alternation, tool-call placement,
  streaming reassembly, SSE framing, none of it app-specific work.

  `OpenaiLlm` speaks the chat-completions dialect against `https://api.openai.com/v1` and declares `{ image: true }`,
  sending an image as a content part from either carrier. `AnthropicLlm` is the Messages API and declares
  `{ image: true, document: true }`. That dialect now lives in `OpenaiDialect`, so a
  protocol fix lands once; Anthropic shares nothing but the wire it maps from, its system prompt being a field
  rather than a message, its tool calls and results content blocks, its results a _user_ turn, its roles strictly
  alternating, and its `max_tokens` required. Both new adaptors require `model`: a default would age into a 404 and
  would decide the vision claim on the app's behalf.

  `option.setLlm({ accepts })` overrides what the configured model reads. An adaptor answers for an API and one API
  serves models that differ, so the answer rides beside the `model` it is a fact about rather than in a capability
  table the framework keeps — a table is a claim about models that ship after it, and a provider handed bytes it
  cannot decode either refuses the turn or accepts it having seen nothing.

  `option.setLlm({ maxTokens })` is the answer ceiling for an API that requires one. A fixed default is a hazard on
  a model that reasons before it writes: the budget goes on thinking, the turn comes back empty with a length stop,
  and that reads as the model refusing — so an empty answer is also named in the log with the current number.
  Sampling knobs are deliberately absent from `LlmOption`, because `temperature` is a 400 rather than an ignored
  field on some models and the role would have to guess its legality per model.

  A mangled SSE frame now costs that frame instead of the whole answer, in both stream readers: throwing lost the
  text already streamed over one unreadable line of a protocol the caller cannot fix.

  Both match an exact image-type set (`jpeg`, `png`, `gif`, `webp`) rather than an `image/*` prefix, and name the
  rest in the text. `accepts.image` is one boolean, so `AgentService.readable` passes every `image/*` through and the
  composer's built-in reader base64s every `image/*` — an `AttachReader` answering `null` means "not mine" and falls
  through to it — so an app cannot gate one either. An unsupported type is not one unread attachment: it is a block
  the API refuses, so the whole turn dies on a vendor 400, and `image/heic` is the iPhone camera default.

  `OpenaiLlm` is the default. Swap with `option.applyAdaptor(LlmAdaptorRole, AnthropicLlm)`.

- 5f53462: An attached image shows up, and survives a reload with its handle

  The attachment chip only drew a thumbnail for an inlined `data` attachment, so an image attached by `url` — the
  shape the per-file ceiling exists to encourage, and the only shape a deployed app produces — rendered as a bare
  name in the composer and in every bubble. It draws either carrier now.

  `sessionHistory` dropped `ref` on the way to storage. The reason content is stripped is that web storage is a few
  megabytes and a failed save is silent; an id is not content, and it is the one thing a restored conversation has
  left to find the file again — without it a host is back to guessing from name and size, which is the guess `ref`
  was added to retire.

  `Chips` is exported as `AgentAttachments`, so a replaced `AgentBubble` draws the attachment row with the framework's
  rule rather than a copy of it. And a compacted attachment now says its content is gone instead of only naming
  itself, on the same principle as every other note here: a model told only `[attached photo.png]` answers about the
  picture from its filename.

- 69f7178: feat: akanjs/ui drives itself for an in-page agent

  The framework's own components now publish the controls they draw, so an app gets a working agent surface for
  list management, tabs, paging, forms, dialogs, and the app shell without writing a line. Names are the store
  action's wherever one exists (`setSortOfTaskInOrg`, `removeTask`), so the tool an agent calls and the action the
  button dispatches read the same.

  - **`Data.ListContainer`**, and so every `Model.AdminPanel`: view mode, sort, page size, refresh, create, the two
    exports, and the row and modal verbs — `edit`/`view`/`remove` by id, plus `submit`, `cancelEditOf`,
    `closeViewOf`. It also opens a `<slice>.items` resource, which is where the id for a row verb comes from.
  - **`Tab`**, **`Dialog`**, **`ScreenNavigator`** take a `namespace` prop and publish under it. Without one they
    publish nothing: two tabs on one screen would otherwise answer to a single name, and the first to mount would
    lose. `Tab`'s menu registry became a `Map` of menu to disabled, which also stopped the disabled-tab fallback
    from landing on another disabled tab.
  - **Paging** is one shared `usePageTool`, spoken by all three components that draw a pager.
  - **`Layout.Sider`**, **`System.SelectLanguage`**, **`Link.Back`** publish the shell controls.

  **Forms fill themselves, from two sides.** An app writes no `st.tool` for a form.

  A form control handed its setter **by reference** — `onChange={st.do.setTitleOnTask}` — publishes
  `setTitleOnTask` while it is on screen. That is the same reference that already earned `data-akan-action`, so the
  agent's tool and the person's control are one function, and an inline arrow still publishes nothing. Scoping
  publication to the control rather than to the model is what keeps an agent out of a field the template draws
  nothing for.

  `st.use.taskForm()` adds one more: `fillTaskForm(patch)`. It takes several fields in a single call, and it is the
  only way to reach a list, a map, or an embedded object — their rows are written through
  `writeOnTask("payments.3.name", value)`, an inline call that can carry no annotation. It is a patch, so a field
  left out keeps what the person typed. Its schema is every writable field, because a declaration is mount-static;
  the **guard** is where the screen gets its say, refusing a plain field whose control is not on screen and naming
  the ones that are. A composite is let through, because nothing can see whether its rows rendered — the one place
  left where an agent reaches a field the screen may not draw, and server guards still apply.

  Neither side touches a relation (picked or uploaded, never typed), a base document field, or a `hidden`/`secret`
  one **at any depth**: a read of those is masked, so publishing a writer would open the door its reader is barred
  from. A rejected third shape is worth naming — a single `writeOnTask(path, value)` tool — because its `value`
  could only be `Any`, which this framework's own MCP layer refuses for telling a model nothing, and a mistyped
  `path` writes a new key into the form that ships on the next submit.

  Nothing publishes a lever the screen does not have. A model with fewer than two sort keys draws no sort control
  and has no `setSortOf<Model>`; a panel with no template draws no create button and has no `new<Model>`; a list
  that fits on one page has no pager and no `setPageOf<Model>`. Callables go to the controls by reference, so
  `data-akan-action` lands on them and `readScreen` names each control with the word its tool has.

  Three gaps in the surface had to close first, all of them consequences of the surface being declaration-only.

  **A conditional surface had no legal shape.** `.exec()` is a hook, so a component can never skip the declaration —
  which left no way to publish a tool only when the screen renders its control. A falsy name now declares the tool
  and publishes nothing: the callable still drives the click a person makes, and the agent never learns it exists.
  `st.useState` and `st.expose` take a falsy name the same way. An unpublished callable carries no
  `data-akan-action`, because that attribute names a tool an agent can reach and this one cannot. This is what lets
  a list toolbar publish `setSortOfTask` only when it actually draws the sort control, instead of paying for the
  tool in every turn's prompt on every screen.

  **A value set only the render knows had no way in.** An `enumOf` class was already a complete argument type —
  `.arg("mode", TaskStatus)` publishes the values, refuses anything off them, and narrows the `.exec` parameter to
  the union — but a component cannot build one, because `enumOf` registers globally. A slice's sort keys or the
  options a prop carried could only be described in prose and hoped for. `.arg(name, type, { oneOf })` takes the
  list the render has and publishes and enforces it the same way. Neither reaches a set that fills in _after_ the
  first render, since a declaration is mount-static; that belongs in the tool's `guard`, which is re-read per call
  and can name the current values in its refusal — which is what `Tab` and the pagers do.

  **A list inside an `Agent.Zone` was invisible to that zone's own agent.** `useScreenScope` opened its scope at the
  root rather than under the scope it is mounted in, so `Load.Units` inside a zone registered `<slice>.items` at the
  top. A zone view only sees keys in its own subtree, so the root agent could read the list and the zone agent
  looking straight at it could not.

- 69f7178: fix: an undescribable `st.tool` argument withdraws the tool instead of throwing during render

  `.arg(name, type)` validated the type where it was written and threw for anything that was not a scalar or an
  enum. That check runs during render, so a model class passed to one argument of one component tool aborted the
  server render of the whole route — React fell back to client rendering with `st.tool takes scalar and enum
arguments only.`, a message naming neither the tool, nor the argument, nor the type.

  It now withdraws the tool the way a falsy name does — nothing is published, the callable still drives the click a
  person makes, and the page renders — and reports it as
  `st.tool("editProject") is not published: its "info" argument is the type PortfolioInfo, and st.tool takes scalar
and enum arguments only.` `st.useState`'s `set` degrades to read-only on the same terms. This matches what the
  surface already did everywhere else: `FormFields` drops a field it cannot describe, and MCP refuses an endpoint
  and names it in the boot log. An agent-tooling concern should not be able to cost a route its server rendering.

  Note that form fields were never able to trigger this: `useFormTools` and `useFieldTool` build their schemas from
  an effect, which does not run during SSR. A regression test now server-renders a form over a model carrying an
  embedded-scalar array field to keep it that way.

- 5f53462: `st.tool` describes one array level of a scalar or an enum

  `.arg("bodies", [String])` and `.opt("modes", [TaskStatus])` publish `{ type: "array", items }` and check every
  element, with `oneOf` narrowing the elements rather than the list. It is the schema `fill<Model>Form` already
  built for an array field, so the same shape reaching an agent through a form and not through a component tool was
  an oversight — a tool that could not say "a list of these" taught the format in prose, and the app then owned a
  parser for it.

- 69f7178: fix!: publish only what a component declared to the in-page agent

  This supersedes the store-derived in-page surface described in the earlier entries of this release: the store
  catalogue keeps its state half, and its action half is gone.

  An in-page agent stands in for the person looking at the screen, so what it may do is what that screen offers them
  and nothing else. Deriving its tools from the store missed that by one level: liveness was per _store_, so a single
  `st.use.me()` in a gating component published every method the admin module had ever declared — `setAdminPassword`
  among them — and `readState` reached every key of that store rather than the keys the screen reads. Levers the
  screen does not have are not reach, they are noise the model pays for on every turn.

  **`st.tool` is the only way an action reaches an agent.** The store catalogue's whole action half is gone: endpoint
  argument borrowing, generated form setters, slice actions, no-argument custom actions, the arity check against the
  same-named endpoint, the JSON-schema build, the argument checking, `AgentBridge.call`, and its transcript. A store
  method reaches an agent by being wired into one — `.exec((id) => st.do.removeX(id))` — which is also the shape that
  hands the same callable to `onClick`, so the person and the agent press one handler. `remove*` still confirms by
  default; the gate moved to `StToolBuilder` with everything else.

  **Reading is per key, not per store.** `AgentBridge.read` gates on the key being subscribed in that view, so a
  component reading `userList` says the screen shows a list and says nothing about the `userForm` beside it in the
  same store. The catalogue keeps its state half, because a read has to be masked and only the store declares which
  model masks it.

  **`static agent` is gone.** It existed to trim an exposure nothing derives any more, so a store class now says
  nothing about agents at all — which is the same rule as the tools. `st.use.x({ agent: false })` is how the
  component that subscribes a value keeps it off the surface, and it is the component's call because the component
  is what put the value on screen. Delete any `static agent` declaration; there is no replacement to write.

  Base-store plumbing follows the same rule as any other key: `st.use.path({ agent: false })` and
  `st.use.tryJwt({ agent: false })` keep routing and the caller's credential off the surface at the call site. The
  route block still carries pathname, params, and searchParams. A screen that wants an agent to read a base key
  opts it in — ThemeToggle subscribes `theme` without the opt-out.

  **`Agent.Dock` reads the surface** rather than the store, so its tool list is what the page declared, and
  `AgenticSurface` keeps the last 200 calls so the transcript now covers every tool instead of the store's own.

- 5f53462: A turn the provider cut off says so, instead of passing as a finished one

  `LlmTurnAnswer.stop` gains `"length"` — `finish_reason: "length"`, `stop_reason: "max_tokens"` — and it rides the
  wire and the `AgentStop` enum to the browser. It is not one provider's quirk: every adaptor here reports it,
  including the default, and only the shape of the union was hiding that.

  Without it a truncated answer arrived as `stop: "end"` and the user read half a sentence as the whole reply. Worse
  on an agent surface: a turn cut off mid tool call carries no complete call, so it ended the loop looking exactly
  like a model that had decided it was done — a hang the transcript explained as a choice. The session now records
  the turn as incomplete on the assistant message the user is reading, and closes any call the turn did make rather
  than running it, since a batch the model was interrupted inside is half an intention.

  The ceiling wins over the calls that did arrive, in both adaptors and on both the streamed and whole paths.

- f882bbc: fix: `st.expose` / `st.useState` typed `String` or `Boolean` resolve to the scalar, not to a model state object

  `AgentValueOf` matched a declaration's `FIELD_META` before its `CLIENT_VALUE`, and `via.ts` augments the global
  `String`, `Boolean`, `Date` and `Map` constructors with `DatabaseConstantStatics` — which carries `FIELD_META`. So
  those constructors read as model classes: `st.useState("tab", String, { set: true }).desc("…").init("all")` handed
  back `GetStateObject<String>` instead of `string`, and the same for `Boolean`. `Date` escaped only because it is
  special-cased above, and `Int` / `Float` / `ID` / `Any` are declared classes rather than augmented globals.

  Only the value `st.useState` returns was wrong. `.value()` on `st.expose` kept accepting the literal, because a
  string is assignable to `GetStateObject<String>` — which is exactly why nothing caught it: the runtime, the
  schemas, and every `st.expose` call site were correct throughout.

  A scalar is now matched by `refName`, above the model branch. A model carries no `refName`, so nothing about the
  model path changes — a model still resolves to its state object and still takes a hydrated document or a plain
  copy of one. `AgentValueOf` is pinned branch by branch in `AgentValue.test.ts`, and `StStateBuilder.test.tsx`
  covers a `String` and a `Boolean` state end to end.

  Anyone on `3.0.0-alpha.53` who worked around this with `as unknown as string` / `as unknown as boolean` on an
  `st.useState` result can delete those casts.

- 69f7178: feat: the in-page agent waits for the screen, aims its reads, points at things, and says what it is doing

  **A tool that changes the screen now waits for the screen before it answers.** `router.push` returns while the RSC
  payload for the new route is still in flight, so `navigate` used to report success onto a page that had not
  rendered yet: the `readScreen` in the same turn read the page the user had just left, and the new route's tools were
  not registered. `ScreenSettle.wait()` waits for DOM quiescence — bounded, and quiescence rather than a framework
  signal because the client router hands its promise to nobody and a change may land in the store, in a refetch, or
  in a streamed Suspense boundary. `navigate` awaits it, and `AgentSession` awaits it after every non-`query` tool
  before taking the change report, so an optimistic action that commits a tick later is reported as what it did
  rather than as the moment before it. Tools and state from a fresh route are still only listed from the next turn —
  the catalogue is snapshotted when a turn starts — and the navigate result says so.

  **`goBack` joins `navigate` as a global built-in.** It was briefly declared by `Link.Back`, which made it exist
  only where a back link happened to be rendered — but history is not a control a page owns: every route has a
  previous page, the browser's own gesture is always there, and a page that draws no back link is not a page you may
  not leave. It refuses at call time when nothing is behind the current page instead of walking out of the app.

  **`readScreen` takes a `section` and there is a new `highlight(target)`.** Both resolve a name the agent has
  already seen rather than a selector it invented: a `data-akan-action` / `data-akan-state` annotation (the one
  `readScreen` prints beside a control), an `Agent.Zone` or `useScreenScope` container, an element id, or a heading
  by its own text — matched on letters and digits, so the slug an agent writes for a heading it read resolves. That
  tolerance stops at headings: a heading is a landmark and scrolling to the wrong one costs nothing, while two
  buttons reading "Save" are not the same control. Nothing hidden resolves at all, because a ring nobody can see
  reads as a broken tool rather than as a miss. A name that resolves to nothing is the caller's mistake, with a
  refusal that lists the sections actually on screen.

  **A screen is only aimable if its names are printed**, which is what the first version got wrong: a page of twenty
  `Scroll.Slide` sections answered "nothing on this screen carries a name", because `readScreen` printed the heading
  text without its anchor and the truncation note stopped at a character count. Headings now carry `(#anchor)` when
  they open an id'd or scoped container, and a truncated read ends with the headings below the cut — otherwise
  everything past the 8000-character limit is unreachable, since nothing names it. `highlight` flashes **after the
  scroll lands**: a smooth scroll across a long page outlasts a flash begun at the top, which is the same bug wearing
  a different hat. `useScreenScope` now hands
  back its scope path and `Load.Units` / `Load.View` / `Data.ListContainer` put it on the container they render, so
  every list and detail view on an akan screen is addressable with no app code. `highlight` scrolls its target into
  view and flashes it on the app's own primary token: it is the one built-in that exists for the _user's_ benefit,
  because showing where a control is beats writing directions to it.

  **A slow tool can say what it is doing.** `AgentProgress.report(message, { done, total })` is the browser twin of
  `McpProgress.report` — reached through a module slot rather than a parameter, so work several frames down (a store
  action, an upload loop, an adapter) reports without every signature growing a channel argument, and a no-op when
  nobody is rendering it. The chat shows the report on that call's row until the row resolves. A session runs tool
  calls one at a time, which is why the browser needs no `AsyncLocalStorage` to do this.

  **The turn cap is a question instead of a dead end.** At `maxTurns` the session asks whether to keep going through
  the same card `askUser` uses, and the answer rides as the user's own turn — so a steer typed instead of the
  keep-going choice reaches the model as guidance rather than being swallowed. A host that renders no
  `pendingQuestion` passes no `continueAsk` and keeps the old failure, because asking with nobody listening would
  hang.

- 69f7178: feat: the in-page agent waits out long work instead of polling it, and Stop reaches a tool that is still running

  **An agent that started something slow had one way to learn it finished: ask again.** Every look is a full model
  round trip, so a two-minute video generation burned the default eight-turn budget in about twenty seconds and read
  to the user as check → wait → check → wait, forever. Two things change.

  **A tool that awaits its own work now holds the turn, with no model round trip in between.** This always worked —
  the session awaits `#execute` and `AgenticSurface.call` awaits `entry.run` — but nothing said so and nothing made
  it safe, so apps wrote fire-and-forget tools and left the agent to poll. The shape is one `st.tool` whose `.exec`
  awaits the store action that finishes the job; the change report that follows carries whatever landed while it
  waited, so the model needs no second call to read the result.

  **Stop now ends a turn parked inside a tool.** `AgentSession` passed its abort signal to the approval and question
  cards and nowhere else, so a call that took two minutes held the loop for two minutes after the user pressed Stop,
  with the chat still showing a turn in flight. Latent until now, and a certainty the moment a tool is allowed to
  wait. The session races every call against the signal, and hands the signal to the tool through `AgentAbort` — the
  module slot `AgentProgress` already is, for the same reason: work several frames down reads it without every
  signature between here and there growing an argument, and a session runs tool calls one at a time. Honouring it is
  optional, since the race lands whatever the tool does; what it buys is the tool's own cleanup, such as a timer that
  would otherwise tick out its whole timeout with nobody left to answer. A tool that ignores it is left running
  rather than cancelled — the work is usually a job a server is already doing, and throwing away a result that is
  about to land helps nobody.

  **`AgentAbort` and `AgentProgress` are re-exported from `akanjs/store`.** `AgentProgress` had no export path an app
  could legally use, `use-agentic` being a third-party import from `apps/**` and `libs/**`, so the documented advice
  to report progress from a slow tool was not followable. A tool that can neither report progress nor honour Stop is
  exactly the tool this release exists to make writable.

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

- ccf2ae2: An app's or lib's typecheck no longer fails with TS7016 on `react-server-dom-webpack/client.node` once an install
  links the package into `akanjs`: the SSR renderer references the ambient declarations it needs itself.
- 5f53462: fix: scope the auth cookie and storage key to the app so two apps on one host stop clobbering each other

  Cookies carry no port (RFC 6265), so every app served from `localhost` shared one jar. Under the global `jwt`
  key each signin overwrote the neighbour's session, and the JWT's own `appName` check only turned the surviving
  cookie into a credential that fails every guard — the other app fell back to anonymous, guard failures, and a
  login wall.

  The key is now `jwt:<appName>`, written by `setAuth` to both the cookie and client storage and read by
  `getAccount`, `initAuth`, the SSR `fetchClient` credential, the websocket credential snapshot, and the CSR boot.
  `authTokenKey()` and `getAuthToken()` are exported from `akanjs/client` (and `authTokenKey`, `readAuthToken`,
  `isOwnAuthToken`, `isAuthTokenKey`, `cookieHeaderHasAuthToken`, `legacyAuthTokenKey` from `akanjs/common`) so an
  app's own middleware reads the same key instead of spelling it out. Read the cookie through `getAuthToken()`
  rather than `getCookie("jwt")`.

  `initAuth` now checks the token's `appName`/`environment` before handing it to `fetch.setJwt`, which it never
  did: a `?jwt=` for another app used to ride along on every request. A mismatch is ignored, and clears the cookie
  when it came from this app's own key.

  **Breaking, with a migration path.** Reads still fall back to a pre-scoping `jwt` cookie, but only when the
  token's payload names this app — so an existing session survives the upgrade and a neighbour's leftover is never
  adopted. Writes only ever use the scoped key and delete the legacy one. The fallback is temporary; once
  deployments have rotated past it, the legacy read goes away and a stale session needs one re-login.

- 69f7178: fix: a `Boolean` argument parses the text the wire actually carries

  A query string carries text, so `.search("archived", Boolean)` handed `Boolean._parse("true")` a string and threw
  `Invalid Boolean value: true` before the endpoint ran. The framework's own client sits on the other end of that —
  `HttpClient.makeUrl` writes `String(value)` — so no caller could reach such an endpoint, hand-written URL or not.
  `Int` and `Float` never had the problem because their `parseValue` is `Number(input)`, which absorbs a string;
  `Boolean` was the one primitive that compared against `true` / `1` and nothing else.

  The normalization lives on the primitive rather than in the search-arg branch, because text is what three separate
  paths deliver: `URLSearchParams.get`, a path `.param()`, and every field of a `fileUpload` mutation's `FormData`.
  One place to normalize is also one place to keep the accepted set from drifting apart.

  `true` / `false` / `1` / `0` are accepted, trimmed and case-insensitive — `str(True)` from a Python client is
  `"True"`, and a 500 is a poor answer to it. `""` and `"yes"` are still refused. An empty query value is a question
  about nullable search args in general rather than about booleans: `Int` reads `""` as `0` today and `String` reads
  it as a legitimate value, so answering it for one scalar alone makes the set less predictable, not more.

  `serializeValue` takes the same spellings, since the client serializes an argument before `makeUrl` stringifies it
  — a `<select>` value handed to a `Boolean` argument now normalizes on the way out instead of throwing.

- 2d8de1c: feat: helpers the code cleanup made public

  Consolidating duplicated helpers left a few new public names. Each is an addition; nothing was renamed or removed.

  - `akanjs/common`: `isRecord(value)` (a type guard for an object that is neither `null` nor an array),
    `round(value, digits = 3)` and `toError(reason)` (an `Error` as is, anything else wrapped in one).
  - `akanjs/document`: the `SaveEventListener<Doc>` type, the listener `listenPre` / `listenPost` take.
  - `akanjs/server`: `ProcessMetricsCollector.startReporting(report)`, which reports once and then on every memory-log
    interval and returns the timer.
  - Subpath exports `akanjs/server/artifact/routeSeedIndexStore` and `akanjs/server/artifact/routesManifestStore`, so a
    published `@akanjs/devkit` can read and write those artifacts without loading the whole server barrel.

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

- ccf2ae2: fix: the server compresses only whole, modest bodies

  `compressResponse` buffered and brotli- or gzip-compressed any body of a compressible type on the event loop, whatever
  its size, and answered a `Range` request with the whole body compressed. It now leaves alone a request with a `Range`,
  an answer that is partial (`206`, `Content-Range`) or not a success, and one whose `Content-Length` is over 4 MiB
  (compressing blocks the loop about 6 ms per MiB with brotli, 12 with gzip). The gateway keeps an upstream's
  `Content-Length` unless it had to drop the upstream's encoding, so the limit holds behind it too.

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

- 5f53462: fix(signal): the cross-site gate compares hosts, so a TLS-terminating proxy no longer refuses every mutation

  An app reached through a Cloudflare tunnel — or any edge that terminates TLS and forwards no
  `x-forwarded-proto` — answered `403 This request was not permitted.` to every mutation. The browser sends
  `Origin: https://app.example.com`; the request reaches the server over plain HTTP, so the origin it computed for
  itself was `http://app.example.com`, and the full-origin comparison made the app cross-site to itself.

  `CrossSiteGuard.assertOrigin` now compares the `Origin` header's **host** against the host the request arrived on
  (`x-forwarded-host`, else `Host`), which is the comparison `McpRouter` already made for the same reason. The CSRF
  property is unchanged: the host is written by the browser from the URL it was told to open, so a page on another
  site still arrives with this deployment's host and its own `Origin`. Only the scheme distinction is dropped — the
  one part of an origin a proxy routinely loses — and what that costs is a page served over plaintext on the same
  host, which is an attacker who already holds the name. An explicit `:443` in a forwarded host and its absence in
  `Origin` now compare equal too.

  A refusal logs the host it was measured against (`... (request host app.example.com)`), so a proxy misreporting
  the host reads differently from a missing `allowedOrigins` entry and from an attack.

- ccf2ae2: fix(dev): a CSR dev save reaches the open tabs before `app.js` is rewritten, and a tab opened in between boots once

  A dev CSR save used to rewrite the whole `app.js` before telling the open tabs about the patch, although only a tab
  that boots later needs it. The patch is now announced first and `app.js` follows. The manifest records which
  generation `app.js` holds (`appGeneration`), and the server holds a booting tab's `app.js?g=N` for up to two seconds
  until the file holds `N`, instead of booting it one generation behind and reloading it again. A build that died in
  that gap leaves `app.js` behind; the next update rewrites it even when nothing else changed.

- ccf2ae2: perf(dev): a CSR dev save is patched by the resident builder, without spawning a build worker

  - The dev builder keeps the CSR registry's graph, manifest and module factories in memory and compiles a save itself.
    A save no longer pays for a build worker's spawn and imports (about 130ms on minimal) or a pass over every module
    file, and `app.js` is rebuilt from memory after the patch is announced.
  - A save that needs a whole-app build still goes to a build worker, which exits and returns its memory: a first build,
    a config or signal/dictionary change, a new npm module, and an import no recorded resolution answers.
  - The builder works in two lanes. A save's codegen and CSR patch run in one, and the file watcher waits only for it;
    build workers, route builds and client-entry discovery run in the other, where a batch queued behind another folds
    into it. Consecutive saves no longer wait behind each other's pages and css builds, and css now builds before pages.
  - `AKAN_DEV_CSR_PATCHER=off` sends every CSR save to a build worker as before. A builder that dies mid-patch turns the
    patcher off until the dev server next replaces its builder and backend together (a config, signal or dictionary
    change), and says so.

- ccf2ae2: fix: a CSR page on another origin loads stored file URLs from the server

  A file row keeps its URL relative to the server that wrote it (`/api/localFile/getBlob/...` with blob storage). A
  native shell serves the page from `app://localhost` or `https://app.localhost`, so the relative URL resolved against
  the app and the image never loaded. `resolveServerUrl` (`akanjs/client`) resolves an API-prefixed relative URL
  against `serverHttpUri` when the page's origin is not the server's, and leaves every other URL alone. `CsrImage`
  (so `Image` in a CSR bundle), agent attachments, and `libs/shared`'s editor images, videos, mention avatars, file
  download links, file gallery and Excalidraw images use it; Excalidraw stores the URL relative again.

- ccf2ae2: A CSR page renders when the app's root layout sits in a route group, inside the layouts that wrap it

  - An app whose root layout is `page/(app)/_layout.tsx` rendered an empty `#root` on every CSR page — `?csr=true`,
    `/__csr` and native builds — with nothing in the console: the CSR route table left a route group's layout out of the
    root, so no route had a root layout, while the SSR route tree rendered the same pages fine.
  - The CSR route table and the SSR route tree now place layouts through one rule: the root layout is the first root
    boundary the page generator writes a `__root_layout` for, the one that carries `System.Provider`. Every layout below
    it — `(app)/(public)/_layout.tsx`, a nested boundary such as a `(tab)` group's — wraps the pages. In CSR that is what
    keeps a lock screen or a nav in `(public)/_layout.tsx` around the page instead of in the provider's hidden container.
    SSR renders the same element tree as before; those layouts' route segments are now keyed as layouts, not roots.
  - A route that still ends up with no root layout throws `[csr] no root layout for <path>` instead of rendering nothing.

- ccf2ae2: fix(csr): an entry of the same route shows its own content, the first page is cached, and a page nobody sees stops
  its effects

  - **Same route, new entry, new content.** `/item?id=1` → `/item?id=2` kept showing the first entry: `RenderLayer`
    resolved a route's async render once per mount. It now renders again when an argument the route declares with
    `.param()` / `.search()` changes, layouts included, and keeps the previous result on screen until the new one lands.
  - **The page a session opens on is cached** like any page reached later. The history it seeded never put it in
    `cachedLocationMap`, so it unmounted two steps away.
  - **Every page container but the current one is `inert` and `aria-hidden`,** frame slot targets included, so Tab focus,
    a screen reader and the agent's `readScreen` no longer reach the page under the current one.
  - **A page nobody sees keeps its state but stops its effects.** A cached page, and the page a transition-less switch
    left (tab to tab) once it settled, render inside React's `<Activity mode="hidden">`: DOM and state stay, intervals
    and subscriptions stop, and both come back with the page. The page under an animated transition stays live, since a
    swipe back shows it.
  - `idxMap` and `scrollMap` are keyed by the entry's `href` on both sides. `CSR.tsx` read them by pathname, so the page
    under a query-string entry lost its stacking order.

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

- ccf2ae2: fix(dev): dev documents skip the browser's HTTP cache, the HMR socket answers only its own origin, and superseded server bundles are removed during a session

  - Under `akan start`, SSR pages and the dev CSR shell are sent with `Cache-Control: no-store`, so going back to a
    page no longer replays a document rendered by a build the server has moved past. `akan build` output is unchanged.
  - `/_akan/hmr` refuses an upgrade from a page on another origin, by the rule mutations already follow (the serving
    host, the native shells, and `allowedOrigins`): its messages carry build errors and the names of the files being
    edited, which a `--share` visitor's page or another site open in the same browser could otherwise read.
  - A render error's overlay clears once the page renders again, instead of staying on every tab until it reconnects.
    The HMR socket's reconnect backoff starts over at the server's hello rather than when the socket opens, so a
    gateway whose upstream keeps failing is no longer asked every 250ms.
  - A pages build that changes server output no longer leaves the bundle before it in `.akan/artifact/server` for the
    rest of the session (8MB on minimal, 21MB on apps/akan): each time the RSC worker takes a new bundle, the ones it
    has moved past that are over a minute old are removed, so a burst of saves leaves its bundles only until the next
    server-side save after it. A CSS change removes the stylesheets no tab can still link to the same way.
  - `getAkanHmrPhase()` and `isAkanHmrApplying()` from `akanjs/common` are deprecated: nothing sets the phase any more,
    so they always answer `null` and `false`.

- ccf2ae2: fix: a dev build of the iOS, Android or desktop app waits for a page the dev server is still building

  The native dev gateway served with Bun's default 10 s idle timeout, so the first request for a page the dev server
  was still building (27 s for a small app on a Windows VM) was closed under the app, which then fell back to its
  bundled files: a dev build carries none, and the window stayed blank until the next reload. The gateway now keeps
  the request open until the dev server answers.

- ccf2ae2: feat(dev): a dev save now says where its HMR latency went

  - Each save carries epoch-ms marks from the file watcher to the page: the first fs event and the watcher's flush,
    the builder picking the batch up, the build worker's spawn, start and imports, the update on disk, the send, the
    backend's broadcast, and the page receiving and applying it. The page keeps the last 64 in `__AKAN_HMR_TRACES__`.
  - `AKAN_DEV_WATCH_DEBOUNCE_MS` sets how long the watcher collects changes before it hands a batch over.

- 69f7178: fix(dev): `akan start` is the dev server even when the environment says `NODE_ENV=production`

  An ambient `NODE_ENV=production` turned every route of the dev server into a 500:

  ```
  [SSR] render failed scope=/en/: [SSR] route /:lang missing from production artifact — rebuild with `akan build` to include it
  ```

  `WebRouter` picked its mode from `NODE_ENV` alone, so it installed the production route cache — the one whose
  `buildRoute` throws because `akan build` was supposed to have written a routes manifest already. A dev artifact
  never has one, so nothing could render, and the same ambient value also sent the gateway's runtime directory to
  `<workspace>/runtime` and baked production React into the dev bundles.

  The value does not have to be exported to arrive: Bun auto-loads the workspace `.env`, so a `NODE_ENV=production`
  line in a downloaded env file reaches the CLI while `env | grep NODE_ENV` in the shell stays empty. A CI image
  default or a container base image does the same.

  **The command now outranks the environment.** `akan start` pins `NODE_ENV=development` for the processes it
  spawns and for the in-process builder that bakes the value into dev bundles; `AkanApp` resolves a child's
  `NODE_ENV` from `AKAN_COMMAND_TYPE` before falling back to the inherited value; and `WebRouter` refuses the
  production branch outright while dev-hosted, warning once that it did rather than failing every request. Running
  a built artifact (`bun main.js`, Docker) is untouched — it carries no command type and keeps honouring
  `NODE_ENV`.

- 69f7178: fix(server): refuse the boot when two owners claim one `use` key or adaptor `refName`

  Both registries were plain last-write-wins. A `use` key two libs both declared, or an adaptor `refName` two
  classes both carried, silently kept the second: the first value was gone and the replaced adaptor's `onInit`
  never ran. Neither left a trace, and an app whose `option.ts` shadowed a lib's key looked like it worked.

  Registering either twice now fails `DiLifecycle` construction, naming the key and both claimants:

  ```
  [DI:adaptor] 1 duplicate registration(s):
    • "imageStorage" is registered by service "article" and by service "gallery"
  ```

  The check is per key, not per registration. One adaptor class reached from two services is one adaptor and
  passes; a predefined role rebound with `applyAdaptor` is one class and passes. Only two _different_ classes under
  one `refName` clash — which is the case that used to defeat an override silently, because the collected class won
  the map while the role kept pointing at the other one.

  `AkanOption.getUses(env)` returns `[key, value][]` instead of a merged record, so a key declared twice inside one
  option is caught the same way as one declared across two libs. Nothing outside the framework calls it.

- 69f7178: fix(dictionary): restore the translate keys an extending dictionary inherits from the lib it extends

  `ModelDictInfo` briefly carried an extra generic parameter, placed before `ErrorKey` and `EtcKey`. The three
  positional lists that merge two dictionaries — `AnyModelDictInfo`, and both halves of `MergeTwoModelDicts` — were
  not extended with it. Every parameter has a default, so supplying one too few is legal TypeScript: inference
  shifted by one slot and the last parameter fell off the end into its default.

  For an app dictionary built as `modelDictionary(["en", "ko"], ...setting.dictionaries)`, that meant:

  - `EtcKey` (the `.translate()` keys) became `never` — `l("setting.updateSuccessMsg")` for a key the _lib_
    declared stopped typechecking, in an app whose own source had not changed
  - `ErrorKey` was read one slot early, so `${refName}.error.${ErrorKey}` was built from the translate keys instead

  Only the types were wrong. `modelDictionary` returns the base instance and the extending chain mutates it, so
  every entry was still there at runtime — which is why the failure surfaced only as a typecheck error in
  downstream workspaces, and why re-declaring the key in the app (the obvious workaround) silenced it while
  duplicating a translation the lib already owned.

  Both a runtime test (an extending dictionary keeps the base's `translate`/`error` entries) and type assertions
  over the merged `EtcKey` now cover it, and the positional lists carry a note that adding a parameter means adding
  it in all three places.

- f882bbc: Resolve a dictionary key whose enum value contains a dot, so `l("llmModel.gpt-5.6-terra")` returns its label
  instead of the key itself.

  Enum entries are stored under the value verbatim — `llmModel["gpt-5.6-terra"]` is one object key — but every
  reader went through `pathGet`, which splits the whole key on `.` unconditionally. A value carrying a dot was read
  as `llmModel → gpt-5 → 6-terra`, so it missed: `l()` and `l._()` rendered the raw key on screen (enum labels in
  `Field` selects, the constant and signal doc pages), and `DictionaryLookup` returned `undefined`, dropping the
  description from the MCP catalogue and the OpenAPI document. `<value>.desc` missed the same way. Nothing warned,
  because `TransMessage` builds the key union as `` `${refName}.${value}` `` and typechecks it fine.

  The three readers now use `pathGetLoose`, a new `akanjs/common` export that tries joined prefixes when a plain
  segment walk finds nothing. It tries the shortest prefix first, so every key that resolved before resolves to the
  same node — only keys that used to fall through to the fallback are newly found.

- 2d8de1c: fix(ui): a disabled `Link` renders its `div` without the link-only props

  With `disabled` (or no `href`), `Link` spread every remaining prop onto the `div` it renders, so `scrollToTop`,
  `replace`, `activeClassName`, `activeExact` and `noCache` reached the DOM and React warned about each. They are now
  dropped there; the caller's own attributes (`aria-*`, handlers, `data-*`) still reach the `div`.

- 69f7178: feat(akan): serve the framework documentation over MCP from the docs app

  `apps/akan` now exposes its own generated documentation corpus as MCP tools, so an agent working in an Akan
  workspace can read the framework's docs instead of guessing at its APIs. Three tools, all `[Public]` — the same
  markdown is already served anonymously at `/llms/pages`, so a guard there would protect nothing while making the
  tools unusable to the agents they exist for:

  - `listDocPages` — the whole index, optionally narrowed to one of the four sections.
  - `searchDocPages` — every given word must match, ranked with title hits ahead of body mentions.
  - `readDocPage` — one page in full as markdown, code examples included.

  This is also the first app in the repo to serve a live `/mcp` catalogue, which is what makes the MCP boot log,
  the wire, and the refusal paths exercised by something other than a test.

  The corpus under `public/llms/pages` is stale relative to the docs routes — regenerate with
  `bun apps/akan/script/generateLlms.ts` to pick up the MCP cheatsheet page and the mobile cheatsheets.

- 5f53462: The recovered-form banner is the app's to size and to skin.

  - `Model.EditModal` takes `draftBarClassName`, so a dense screen — an editor sitting right under its own header —
    can trim the banner's padding and type without forking the shell.
  - `DraftBar` is an override slot, bound like any other in a `page/**/_overrides.tsx` manifest. The shell keeps the
    draft state and keeps publishing the restore and discard tools, so a replacement takes `state`, `savedAt`,
    `onRestore` and `onDiscard` as props instead of reaching into the store under string keys.
  - A draft the record has caught up with is dropped rather than offered back. A form that saves itself as the user
    types moves `updatedAt` with its own save, so every reopen read as a conflict and asked the user to settle a
    difference that was not there.
  - `Model.Edit` forwards `draft` the way `Model.New` already did, so a form opened through it can turn recovery off
    at all.

- 22aa04f: fix(ui): keep a Modal opened from a Dropdown menu alive

  `Dropdown` dismissed on any `mousedown` outside its own DOM subtree, but `Dialog/Modal` leaves that subtree
  through `createPortal(document.body)`. A `Model.Edit` (or any Modal) rendered as a menu item therefore read
  every click inside itself as an outside click: the menu closed, its content unmounted, and the modal it had
  opened went with it — without an animation, and without running `onCancel`. Because `EditModal` derives its
  openness from the store rather than local state, the `<model>Modal === "edit"` left behind then re-opened
  the editor by itself the next time the menu mounted its content.

  React context reaches through a portal where the DOM does not, so ownership is now explicit rather than
  inferred from the DOM: `Dropdown` hands its content a scope, and a `Modal` stamps whichever scope rendered
  it onto the roots it portals out (`data-akan-overlay`). A dismiss check then recognises the overlays it
  owns — including ones opened by a nested scope — and ignores clicks inside them, while an overlay it does
  not own dismisses it as any other outside click would.

  Four changes:

  - Dismiss checks ignore clicks inside an overlay the dismissing scope owns. A dropdown rendered _inside_ a
    modal is unaffected, since that modal is not its own — it still dismisses on an ordinary click in it.
  - The menu is hidden rather than unmounted once it has been opened, so an overlay a menu item opened
    survives the menu closing.
  - `EditModal` resets the modal it owns when it unmounts while open, whatever tore it down. The reset is
    deferred one microtask so a remount in the same commit (a re-keyed list row) claims the modal back instead.
  - A menu item marked `data-dropdown-keep-open` no longer closes the menu, so a switch or copy button inside
    a menu stays usable.

  Both `Data.ListContainer` and `Data.Item` put action lists straight into a `Dropdown`, so list and item
  toolbars were affected the same way. An app-authored overlay that portals itself can join the same
  bookkeeping by spreading `useOverlayLayerProps()` onto its portal roots.

- 69f7178: fix(package): embed `use-agentic` into the akanjs build instead of depending on it

  `use-agentic` is a workspace package, not a registry entry — it is not in `publishableAkanPackages` and
  `release:build-packages` never builds it — so the `"use-agentic": "0.1.0"` line the dependency scanner wrote into
  `pkgs/akanjs/package.json` pointed every consumer at something `bun install` cannot resolve.

  The akanjs build now copies its source into `vendor/use-agentic` inside the dist and rewrites every
  `from "use-agentic"` specifier to the relative path, in the shipped `.ts` sources and in the emitted `.d.ts` tree
  alike — declarations for the embedded package are emitted into `types/vendor/use-agentic` by a second program, so
  the published types resolve without the package existing anywhere. `PackageRunner` treats it as a bundled runtime
  dependency the way `@akanjs/cli` already treats `@akanjs/devkit`, which keeps it out of both the dist and the
  source `package.json` on every rebuild.

  `@happy-dom/global-registrator` moved to an optional peer dependency alongside `@playwright/test` and `chance`,
  the shape every other package the `test/` facet reaches already has. `test/registerDom.ts` is a value import, so
  the scanner had promoted a test-only DOM shim into the runtime dependencies of every app that installs akanjs.

  Nothing changes inside the monorepo: framework source keeps importing `"use-agentic"` and keeps resolving it
  through the workspace. `GuideProps`, `ZoneProps`, and `AgentScopeProps` are now exported, because the `Agent`
  namespace object cannot have its declaration emitted while the props it infers cannot be named (TS4023) — that
  error had been failing `build-package akanjs` outright, since the release build runs the declaration emit with
  `AKAN_BUILD_DECLARATION_DIAGNOSTICS=error`.

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

- 2d8de1c: fix(ui): component, client and projection fixes from the framework bug sweep

  - **A server-rendered `Link` to a `#hash` keeps the caller's props** — `target`, `onClick`, `aria-*`, `data-*` —
    like every other `Link`.
  - **`Input.TextArea` attaches `inputRef` to the textarea** instead of spreading it onto the DOM, where React warned
    and the ref stayed empty.
  - **`System.Reconnect` removes the disconnect listener it added**, so remounts no longer stack listeners that each
    ping on every disconnect.
  - **`Agent.Context` renders on every environment except `AKAN_PUBLIC_ENV=main`**, like `Agent.Dock`; a
    shell-exported `NODE_ENV=develop` no longer hides it.
  - **The `LoadingArea` override slot takes `Loading.Area`'s props**, so `<Loading.Area className>` typechecks and an
    override can type its props.
  - **`System.Root` is flagged as deprecated where it is used**, not only on its props type.
  - **`useCodepush` no longer interrupts every release check with a debug `window.alert`.**
  - **`storage.removeItem` falls back to `localStorage` when the native Preferences call rejects**, as `getItem` and
    `setItem` already did.
  - **A projected read of a row written before a field existed gets that field's default the way a full read does**:
    an array gets its own fresh copy (pushing into it used to rewrite the model's default for every later document),
    and a required nested scalar gets its default instead of `null`.
  - **`logger.raw(msg)` writes the text as given**, like the static `Logger.raw`; it used to append a newline.

- 2d8de1c: fix(server): a replica keeps a pubsub room while any of its sockets is still in it

  With two or more replicas (or under `akan start`), the gateway forwards a room's publishes to every replica that
  holds a socket in it. It tracked that membership per replica but applied each socket's unsubscribe to the whole
  replica, so when one of several sockets on a replica left a room, every other socket there stopped receiving
  publishes from the other replicas until the 30-second membership snapshot restored it. The gateway now removes a
  replica from a room only when the last of its sockets in that room leaves, and a snapshot keeps what it knows about
  the sockets of the rooms it confirms. A single-process deployment was never affected.

- 2d8de1c: fix(server): the gateway's `sockets` metric stops counting sockets whose room a snapshot dropped

  The `sockets` count on `/_akan/app/metrics` is the number of sockets the gateway knows to be in at least one pubsub
  room. When a socket's unsubscribe never reached the gateway, the 30-second membership snapshot took the room away
  from the replica but left the socket counted, and every such socket stayed in the metric until that replica
  restarted. A room the snapshot no longer confirms now takes the sockets recorded in it along; a socket still in
  another room stays counted. Delivery never read this count, and the metric's name and shape are unchanged.

- f882bbc: Enforce `field(..., { immutable: true })` on the document write path instead of carrying it as decoration.

  The option survived the v2 migration as metadata and nothing else. v1 handed it to mongoose, which enforced it;
  the SQL document layer that replaced mongoose never picked it up, so the only readers left were the schema doc's
  `immutable` pill and the devtools serializer. A field declared immutable was freely overwritten by
  `doc.set(...).save()`, by `srv.update(id, patch)`, and by every query-level write — while `akan`'s own docs
  promised "생성 후 수정할 수 없습니다".

  `writeUpdatedDocument` is now the single gate: it compares each immutable field's prepared value against the row
  it loaded and throws when they differ. That one choke point covers the whole document path — `.set()` then
  `.save()`, a chain method assigning the field directly, and `update(id, patch)` — because all three land there.
  `.set()` itself stays a plain in-memory assign, so the throw arrives at `save()`, where the write actually
  happens; gating `.set()` too would have missed direct property assignment and gone silent on documents loaded
  through a read query, which carry no snapshot to compare against.

  The check runs before the save hooks, so the message names the field the caller changed rather than one a
  `_preUpdate` derived from it, and it omits the values — an immutable field may also be `field.secret`.

  Query-level writes are deliberately left open, mirroring the way mongoose exempts `bulkWrite`:
  `updateOneByQuery` / `updateManyByQuery`, the generated `update<Filter>` / `remove<Filter>`, and
  `updateById` / `removeById` compile straight to one SQL statement, fire no hooks, and read no existing row to
  compare against. A caller reaching for that path has already stepped outside document semantics. `create` and an
  upsert's insert are untouched, which is where an immutable field is meant to be set.

  Re-saving an unchanged immutable field is not a change and does not throw, so `doc.save()` after editing anything
  else keeps working — including on a row written before the field was declared, which reads back as the field's
  default on both sides of the comparison.

- 69f7178: feat: component-level in-page agent — a chat that reads the rendered screen and drives it

  The agent surface work so far described what an app _can_ do (the store catalogue, the MCP catalogue); this ships
  the half that knows what the _screen_ is doing and lets a user hand it the wheel. One mount —
  `<Agent.Chat />` in a layout — is the whole integration.

  **`use-agentic`** is the new framework-independent core: a mount-lifetime surface
  (`registerTool`/`registerResource`/`openScope`/`registerGuide`, name stacks where the newest registration wins and
  unregistering restores what it shadowed), hooks (`useAgentState`/`useAgentTool`/`useAgentResource`/`useAgentGuide`,
  declarations mount-static and behavior always-latest), and `AgentSession` — the client-side conversation loop:
  send → model turn → tool calls → approval gate → execute → report resource diffs → next turn. The loop lives in the
  browser because the tools do; the server is one stateless turn relay that never executes anything. Failures land in
  the transcript rather than being thrown past it. The wire is documented in `WIRE.md` so any backend can serve it.

  **The screen context is derived, not declared — and it follows the rendered screen, not the bundle.**
  `Load.Units`/`Load.View` register scopes and curated item lists as they mount (labels come from the `text: "title"`
  search role), `StoreInstance` counts which state keys the mounted components are reading — `st.use`, `st.sel`, and
  `st.ref` all count, the selector-based pair by running the selector once over a recording proxy — and a store's
  catalogued actions and state are published only while one of its keys is live. `AgentContext` assembles route +
  screen + live-state blocks per turn — primitives inline, everything else one masked `readState(key)` call away.
  `remove*` names default to a confirm gate, and the framework adds two built-ins beside `readState`: `navigate`
  (internal paths only, the same router `Link` rides) and `readScreen`, which serializes the rendered DOM into
  compact text — headings, links, control values with their `data-akan-*` annotations — so "what does this page
  say?" is answerable; the chat's own UI is skipped via `data-agent-ui` and a password value is never read.

  **Exposure is the store author's to trim.** `static agent = false` keeps a whole store off the surface — the
  framework's base store declares it, which also stops `readState` from reaching the `tryJwt` credential — and
  `static agent = { exclude: [...] }` withholds named actions and state keys; `st.use.x({ agent: false })`
  subscribes without counting toward liveness. Generated `set<Key>` conveniences are no longer published at all:
  they carried no schema, so they listed as zero-argument levers that wrote `undefined`.

  **`Agent.Chat`** is the user-facing half: launcher, transcript, composer, and the inline approval card, behind an
  `ssr: false` lazy boundary so none of it touches the server HTML, and re-skinnable through the `AgentChat`
  `_overrides.tsx` slot. Its default runner posts the wire to the app's own `runAgentTurn` route through
  `httpRunner`, which negotiates streaming via `accept`: the relay answers `text/event-stream` — one `RunnerEvent`
  per SSE `data:` line, assistant text arriving as it is generated — and a server that does not stream answers the
  same JSON turn. The endpoint reads the request with `.with(Req)` and returns a raw `Response` for the SSE half;
  `LlmAdaptor.chat` gained an optional `onDelta`, and an adapter that ignores it still answers whole. An app that
  mounts no relay degrades to a transcript message. `ThemeToggle` now publishes the current `theme` and a
  `setTheme` tool, so "switch to dark mode" works out of the box wherever it is mounted.
  A tool call is **one row** that resolves in place — pending, then `✓`/`✕` with the result's error or change count
  — rather than a badge on the assistant message and a second row for its result: the model needs both wire
  messages, but the user watched one thing happen, and the name appearing twice read as a doubled call. The row
  carries the call's arguments, because two searches are otherwise the same row twice.
  `<Agent.Guide instructions="..." />` layers route-scoped guidance by render position: nested Guides concatenate,
  navigation withdraws them. `prompt()` endpoints double as the chat's slash commands with no listing endpoint —
  the client reads its own serialized signals, and the prompt's GET enforces its guards at call time.

  **The relay is framework-embedded.** `runAgentTurn`, the `agentTurn` scalar, `AgentTurnStream`, and the
  `AgentRelayAccess` guard ship with `akanjs` itself, registered the way the `base` module is — every app serves the
  relay with no lib to mount, `AKAN_AGENT=false` takes it off, and a lib that still carries its own `agent` module
  wins the refName so older workspaces keep working. `OpenaiLlm` (chat-completions REST, zero SDK dependencies)
  is the predefined default behind a new `LlmAdaptorRole`; an app swaps providers in its `option.ts` with
  `applyAdaptor(LlmAdaptorRole, OwnLlm)` — the same builder family as `applyMiddleware`, and the override mechanism
  works for every predefined adaptor role. The endpoint stays outside MCP — its `Any` bodies are refused from the
  catalogue — and `AgentRelayAccess` defaults to allow but now **warns at boot while no policy is registered**; a
  policy that throws fails closed.

  **An app configures its server in `lib/option.ts`, not through the environment and not in `main.ts`.** `AkanOption`
  gained three setters, each read from every lib in mount order with the app's own last, so an app tightens what a
  library declared without restating it. `setLlm({ apiKey, model, host })` — or `setLlm((options) => …)` to take the
  key out of the app's own gitignored env object — reaches whichever adaptor holds `LlmAdaptorRole` as the
  `llmOption` use, replacing the per-provider environment names; the settings belong to the role
  rather than to one provider, so they survive a swap. `setAgentAccess(SignedIn)` names the guards
  `AgentRelayAccess` forwards to, which `AgentRelayAccess.use` takes at boot. `setMcp({ … })` carries the MCP server
  settings that `new AkanApp("./server", { mcp })` used to spell as child environment variables — the gateway there
  only spawns children, while `option.ts` is already handed to the process that mounts `/mcp`, so `AkanAppOptions.mcp`
  is gone. Every `AKAN_MCP_*` env spelling still works for a deployment configuring what the source does not, and an
  option written in code still wins over the env of the same name.

  **`<Agent.Zone id="comments">` runs a second agent over one section, in parallel with the root.** Zones are views
  of the same surface, never walls: everything mounted inside — `st.use` subscriptions (liveness is now tagged with
  the ambient scope), hook tools, guides — belongs to the zone's own conversation _and_ stays visible to the root
  agent, so wrapping a section costs the root nothing. An `Agent.Chat` inside binds to the zone session
  automatically, a zone's `readScreen` reads only its own `data-agent-zone` container, and guides follow the layout
  cascade — ancestors and own, never a sibling's. The core grew `surface.view(path)` (`SurfaceView`), and
  `AgentSession` now runs over any view.

  **`persist` keeps the transcript across reloads.** Off by default; `<Agent.Chat persist />` stores settled
  messages in sessionStorage (per-tab, gone when the tab closes), `{ storage: "local" }` outlives it, and each
  `Agent.Zone persist` keys its own entry by scope path. Restores drop the assistant draft a reload cut short,
  saves are debounced against streaming deltas, a versioned envelope discards stale wire shapes, only the newest 50
  messages are kept, and a full or blocked storage never breaks the chat. The chat header gained a clear button
  that empties both the transcript and the stored copy.

- f882bbc: Intern the in-page agent's React contexts on `globalThis`, so a zone's tools reach the zone's session.

  An akan build inlines `use-agentic` into every client bundle that reaches it — four of them in this repo's own
  docs app — and a React context is identified by object identity. `AgenticSurface.shared` already survives that on
  a `Symbol.for` key; `SurfaceContext`, `ScopeContext` and `SessionContext` did not. So the `ScopeContext.Provider`
  an `Agent.Zone` rendered from one copy was invisible to the `st.tool` / `st.expose` / form tools reading it from
  another: `useScopePath()` fell back to `[]`, every declared tool registered at the root scope, and the zone
  session then filtered out all of them as belonging to a different view. The model was handed the built-ins and
  answered `Unknown tool` for tools the screen had published — with nothing thrown and nothing logged.

  All three now go through one `sharedContext` helper, and a test fails if any module in the package makes a
  context the plain way: the plain call works in the monorepo, where there is one copy, and breaks only once
  bundled, so using the feature cannot catch it.

- f882bbc: Intern every framework React context on `globalThis`, so an override or a provider value cannot be lost to bundle
  chunking.

  An akan build inlines each reachable module into every client chunk that reaches it — `client/sharedContext.ts`
  itself lands in two chunks of this repo's docs app — and a React context is identified by object identity. A
  Provider mounted from one copy is invisible to a consumer holding another, which reads the context default
  instead, silently.

  `UiOverrideContext` was a plain `createContext`, so a route's `_overrides.tsx` bound its slots in the chunk
  holding the generated provider while overridable components in other chunks kept rendering the framework default.
  Nothing threw, and only _some_ slots were affected — which reads like a bug in the app's own component, not in
  the framework. The same shape had already cost a zone agent every tool its screen declared.

  All ten of the framework's contexts now go through `sharedContext`, which is exported from `akanjs/client` so an
  app or lib can make its own the same way. A test fails if anything under `client/` or `ui/` calls `createContext`
  directly: the plain call works in the monorepo, where there is one copy of every module, and breaks only once
  bundled — so using the feature cannot catch it.

- 5f53462: perf: hydrate a model from one compiled plan per class, and build a Date field's dayjs on first read

  `new cnst.X(raw)` and `set()` used to re-read the field map, resolve `getProps()` and dispatch on the field kind
  per field per instance, evaluated every default thunk before overwriting it, and wrapped every Date in a dayjs
  object — ~300 bytes and eight getter calls each — whether or not anything read it. A 1000-row listing paid 3.5ms
  and 1.7MB over the parsed JSON for that; it now pays 0.9ms and lands under the raw parse, because `HydrationPlan`
  compiles the field map once per class and a Date field keeps a native `Date` under a symbol slot, with the `Dayjs`
  its type promises built on first read and memoized per `Date`.

  The accessors are on the prototype, so `Object.keys(model)` and `{ ...model }` no longer include Date fields.
  `"createdAt" in model`, `for...in`, `JSON.stringify` (via `toJSON`), `plainFieldsOf` (`akanjs/common`),
  `immerify` and `deepObjectify` all still do; copy a model with `new cnst.X().set(model)`. immer invokes the setter on
  the draft, so store writes stay copy-on-write.

  Two hydration passes that never produced anything are gone as well: the browser no longer `structuredClone`s
  every query response — the request memo that copy protected exists only inside a request store — and
  `fetch.initX` builds its `xList` / `xInsight` instances only for a caller that reads them, which a route passing
  `xInit` down never did.

- 22aa04f: fix(ui): stop a Model chunk from repainting the page it opened over

  `lazy()` returned the React lazy component with no boundary of its own, so a chunk that resolved after
  first paint suspended past it to the nearest boundary — the route. Opening a ticket modal or a `⋮` menu
  therefore replaced the whole page with the route's loading fallback, once per fresh load, until the chunk
  was cached. Portalling to `document.body` did not help: the React ancestor chain is unchanged.

  `lazy()` takes `suspense?: boolean`, and only a flagged call site gets a `<Suspense>` of its own. The flag
  is opt-in because a boundary also changes server rendering: under the default `renderMode: "stream"` its
  subtree leaves the shell as `loading` and arrives later in the stream, which is right for an interaction
  shell and wrong for a page body that SEO snapshots, prerendering and pre-hydration E2E read out of the
  shell. Every existing call site keeps its exact code path.

  The `Model` barrel turns it on for all fifteen exports, and gives `View` and `AdminPanel` a plain block
  to hold their height while the chunk loads. Those two are the only ones that occupy space of their own:
  the triggers wrap the caller's children, so a fixed block would put a slab where a small button belongs,
  and the modals render `null` until opened, so a block would appear where nothing ever shows.

  The fallback is a host element and has to be. The barrel carries no `"use client"`, so a client component
  referenced from it resolves to `undefined` inside the thunk and the render throws "Element type is
  invalid", taking the whole page segment under the layout with it. Marking the barrel `"use client"` is
  worse still: `Model.*` becomes a real server→client boundary and apps that pass crystalized model
  instances as props fail serialization at boot. Plain markup crosses neither line.

  `LazyOption.loading` also starts working on the default path, having been reachable only through
  `ssr: false` before.

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

- 2d8de1c: fix(ui): mark `Link`'s `noCache` deprecated — it has never done anything

  Neither renderer reads it: the server-rendered and CSR links navigate the same way with or without it, and
  `router.push` / `replace` take no cache option to hand it to. The prop is still accepted, so nothing breaks, but
  `<Link noCache>` now shows as deprecated in the editor. Drop it; to fetch a page fresh after a change, clear the
  route cache with `clearRscNavigationCache()` from `akanjs/client`.

- 5f53462: The LLM seam names a wire, not a vendor

  Three provider classes shipped where there are only two wires, and the framework's own vocabulary had grown a
  per-vendor shape that nothing outside the framework could extend: `agent.error.deepseekRequestFailed`,
  `openaiRequestFailed` and `anthropicRequestFailed` were three dictionary keys an app-authored adaptor could never
  add a fourth to, and `LlmOption` was a closed bag, so an adaptor needing a region or a project id had to open a
  second config channel beside `setLlm`. `LlmAdaptorRole` and `applyAdaptor` were already the whole contract; what
  was wrong was how much the framework claimed to know about who fills it.

  **`DeepseekLlm` is gone and `OpenaiLlm` is the default.** They spoke the same wire through the same
  `OpenaiDialect` and differed only in a host, a model name and a vision claim, so one host-pointed class covers
  DeepSeek, Groq, Together, OpenRouter, Ollama and a self-hosted vLLM as well as OpenAI. **An app relying on the
  old default must now name `model` and `host`** — `option.setLlm({ apiKey, model: "deepseek-v4-flash", host:
"https://api.deepseek.com" })`. There is no default model, for the reason there never was one on `OpenaiLlm`: a
  model name ages out of a catalogue into a 404 at the first turn.

  **`OpenaiLlm` claims vision for its default host and nothing else.** OpenAI's own endpoint takes image parts, so
  that is what it answers with no `host` set; a host the app named is a gateway the class knows nothing about, and
  it is text-only until `option.setLlm({ accepts })` says otherwise. Handing bytes to a model that cannot decode
  them kills the whole turn on a 400, where text-only degrades them to a note the model can repeat back — so the
  safe direction is the default and the claim is declared, not guessed.

  **One refusal key, `agent.error.llmRequestFailed`, carrying `{ provider, status, reason }`.** `provider` is the
  hostname that refused rather than a brand name, because an adaptor pointed at a gateway would otherwise credit
  OpenAI for that gateway's answer. An adaptor an app wrote reports through the same translated sentence the
  shipped ones do.

  **`setLlm` is generic, so `LlmOption` is a floor rather than the whole shape.** Whatever else it is handed
  travels to the role untouched: an adaptor declares its own interface extending `LlmOption`, reads it back with
  `use<MyLlmOption>()`, and its provider-specific settings ride the channel the built-in ones do.

  Step-by-step migration: `akan guideline show workspaceRecipes` (or `get_guideline workspaceRecipes`),
  Recipe 8.

- 5f53462: A server-side loopback fetch follows the port the process was actually run with, so a container started with
  `PORT=80` renders instead of failing every page with `base.error.serverUnreachable`.

  - `getEnv().serverPort` fell back to a literal `8282` on the server side, and only `akan start` ever set
    `AKAN_PUBLIC_SERVER_PORT`. A production image overriding the Dockerfile's `ENV PORT=8282` therefore bound one
    port and pointed the RSC worker's `fetch.*` at another; the SSR render failed on every route, with no other
    symptom than the transport error. When the origin resolves to `localhost` — the self-call — the port now comes
    from `PORT`. A `SERVER_HOST` naming another host is not a self-call and keeps the explicit port, and
    `AKAN_PUBLIC_SERVER_PORT` still outranks both.
  - `AkanApp` publishes the port it resolved as `PORT` to the replica it runs in-process and to every child it
    spawns, so `new AkanApp({ port })` reaches the tree the same way the env var does. In solo mode that is also
    what makes the option bind: `AkanServer` reads `PORT`, so an explicitly configured port was previously ignored.
  - `akan build` no longer publishes `AKAN_PUBLIC_CLIENT_PORT` / `AKAN_PUBLIC_SERVER_PORT` into the build process's
    own env. Bundling `define`s every `AKAN_PUBLIC_*` into a literal, so with `PORT_OFFSET` set the builder's dev
    port was baked into the artifact, where no deployment env could override it.

- f882bbc: fix: a masked field carrying a `text` role is a compile error, not a failed boot

  **`field.secret`, `field.hidden` and `resolve()` no longer accept a `text` role in their options.** The role puts a
  plaintext copy of the value in the search mirror, so pairing it with masking publishes exactly what the masking
  hides — the class build has always refused it. But the refusal fired during module evaluation, which means the
  first sign of it was a backend that would not boot: three failed boots and then every route answering 503, with
  typecheck and lint silent the whole time, because the option type was the same one plain `field` takes.

  Removing `text` from those three option types moves the refusal to the call site, where the fix is obvious and the
  editor shows it. The option type is a union, so the exclusion is distributive — a plain `Omit` over it would
  collapse to the keys its members share.

  **The class-build throw stays as the backstop** and now names the way out ("Drop the text role, or make the field
  plain") instead of only what is wrong. It is still the only check that can catch the cross-file case, where a
  scalar's own field carries a role and a parent in another file masks it — the excess-property check cannot see
  an option object built elsewhere either.

- 5f53462: fix(mcp): `AKAN_MCP=false` keeps `/mcp` off whatever an `option.ts` configures

  `setMcp()` with an object read a missing `enabled` as `true`, so any `option.ts` that only configured the surface
  switched it back on. `libs/shared` hands over its OAuth settings exactly that way, so every app mounting it served
  `/mcp` under `AKAN_MCP=false`. An object without `enabled` now leaves the switch where it was, and the env switch only
  ever narrows: `AKAN_MCP=false` (or `AKAN_PUBLIC_MCP=false`) turns the surface off even over an explicit `enabled: true`.

- 5f53462: fix(service): a `memory(...)` value that is a scalar or model class round-trips on both caches

  `memory(Map, { of: SomeScalarInput })` typechecked and serialized through the constant, then handed the
  resulting object to a cache that holds a string, a number or a Buffer. The sqlite-backed `SolidCache` happens to
  JSON anything else on its own, so it worked there; Redis passes the value to `hset`, which coerces it to
  `"[object Object]"`. The same declaration meant two different things per deployment, and the failure only
  surfaced on read — so apps hand-encoded JSON into a `String` memory to get a structured value back.

  A value whose declared type is not a primitive scalar now travels as JSON text in both directions, decided by
  the declaration rather than by the runtime value, so both adaptors store and return the same thing. A value that
  arrives already parsed — a row written before this change, or `SolidCache`'s own `json` type — is still read
  correctly.

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

- 5f53462: fix(service): a required nested scalar fills from its own field defaults instead of failing the write

  `field(Coordinate)` on a model whose scalar carries a default for every one of its own fields still had to be
  written `field(Coordinate, { default: () => new Coordinate() })`, or `create({ name })` threw
  `Missing required field: location`. Every other layer already disagreed: `getDefault` recurses into a nested
  scalar, `HydrationPlan` constructs one, and `sampleOf` fills one — only the SQL write path treated an absent
  scalar as a missing value rather than a constructible one.

  `prepareDocument` now applies the same rule `getDefault` does, in the same order — a parent-level `default`
  first, then `nullable` (an optional nested scalar stays absent), then the scalar's own defaults. A **relation**
  is unchanged and still fails closed: only the caller knows which row it names.

  The read path had the matching hole. A row written before the field was declared carries no value for it, and a
  scalar has no primitive `DEFAULT_VALUE` to fall back on, so `decodeDocumentPayload` handed back `null` — which
  the next `save()` of that row rejected as `Field is not nullable`. It now constructs the same defaults, so an
  existing row migrates by being saved.

  Array defaults are copied per document rather than shared. A field with no declared default is given `[]` at the
  class build, and both the store and `getDefault` handed that one array to every document filled from the model,
  so a `doc.tags.push(...)` landed in the field default and in every document created after it. The constant layer
  was already safe — `crystalize` copies an array on the way into an instance — and the document path now is too.

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

- 2d8de1c: fix(oauth): read a Basic client credential whatever the scheme's case

  `/oauth/token` and `/oauth/revoke` recognized HTTP Basic client authentication only when the scheme was spelled
  `Basic`. RFC 7235 makes an auth scheme case-insensitive, so a client sending `basic` or `BASIC` was read as sending
  no credential at all, and a confidential client was then refused. The scheme's case is the only thing that
  loosened: the single space after it, the decoding of the two halves and the one-channel rule are unchanged, so a
  lowercase `basic` header beside a `client_secret` in the body is now refused like a `Basic` one.

- ccf2ae2: `akan start` replaces its backend one restart at a time, so saves in quick succession can no longer leave a second
  gateway holding the port.

  - A save whose restart came due while the previous one still waited for the old backend to exit used to signal the
    same process again and then spawn a second backend beside the first. The host kept the one that lost the port,
    restarted it on every save, and the untracked one went on answering. A restart that comes due now runs after the
    one in flight, and a config or metadata recycle and `akan start`'s shutdown wait for it too.
  - A gateway that cannot bind its port no longer reports itself ready while it waits for its replicas to exit.

- 22aa04f: fix(ui): give Escape to the topmost overlay, and size the Select panel to its options

  `Modal` was the only overlay that closed on Escape, and it listened on `window` per instance — so two
  stacked dialogs both heard the same key and went down together. Escape now runs through one shared stack
  (`useEscapeKey`) that hands the key to the surface opened last, and `BottomSheet` and `Popconfirm` are on
  it too. A confirm popover inside a modal closes itself and leaves the modal standing.

  `Select`'s open panel was a fixed `h-[270px]`, because `height` cannot ease to `auto` and the open/close
  transition needed something to animate. A three-option list therefore rendered with ~100px of dead space
  below it. The transition moves to `max-height`, which animates just as well and lets the panel end where
  its options do, and the always-on scrollbar becomes `overflow-y-auto`.

  Also: the dialog surface takes `outline-none`. Focus moves onto it when the dialog opens so the tab order
  starts inside, but Chrome treats that programmatic focus as keyboard focus whenever the last interaction
  was a key — or a click on a non-button trigger — and drew a ring around the whole surface. Controls inside
  keep their own focus rings.

  And `Tooltip`'s wrapper takes `w-fit`: `inline-flex` alone still stretches when the trigger is an item of a
  column flex container, and the bubble's `left-1/2` then centred on that full width, far from the trigger.

  `Dropdown`'s panel loses the `gap-2` between rows and the stray `pr-3`, which together padded a three-item
  menu out to 132px of mostly empty space; rows now sit `gap-0.5` apart inside symmetric padding.

- f882bbc: fix: a `_overrides.tsx` manifest reaches what the root layout renders, and what an overlay host renders for it

  **The override provider was mounted inside the root-layout stream, so the two most common positions a component
  is rendered from were beyond every manifest's reach.** Route rendering composes
  `[...renderRootLayouts, ...renderLayouts]`, and the override render rode the second stream — so a root-boundary
  layout wrapped the provider instead of sitting inside it. Anything such a layout renders beside `{children}` (an
  agent chat, a dock, a shell control) resolved every slot to its framework default, and so did anything drawn
  through the overlay host that layout mounts, which is where a portalled `Modal` renders. Both failed silently:
  the provider was mounted, with the right slot map, one level too deep.

  Root boundaries are `/`, `/:lang` and `/:lang/<basePath>`, and a route **group adds no path segment**, so
  `page/_layout.tsx` and `page/(group)/_layout.tsx` are both root layouts — which is exactly where the framework's
  own guidance says to mount `<Agent.Chat />`.

  **Overrides now wrap the whole stack, root layouts included.** `renderRootLayouts` is composed as
  `[...overrideRenders, ...rootLayoutStack]` and the CSR/mobile builder mirrors it. Nested manifests still stack in
  node order, so the closest declaration wins; the recursion carries the override-free root-layout array, because
  the root-boundary test counts its length. No route type or segment-identity change: overrides ride the stream the
  client already labels `"root-layout"`.

  The regression tests assert the **resolved output** of a route whose root layout — and, separately, whose
  route-group layout — renders a slot-bound component. Asserting that the provider is an ancestor would not have
  caught this: it was.

- 2d8de1c: fix(release): the published packages no longer carry test-run files from `local/`

  `akanjs` 3.0.0-beta.19 shipped 65 files (SQLite databases and logs, 820 KB) and `@akanjs/devkit` 2 from the
  gitignored `local/` directory the test suites write into, because both builds copied the package directory whole.
  `build-package` and `akanjs`'s own build now leave `local/` out, and `verify-akan-publish-packages` refuses a package
  whose pack list still contains it.

- 5f53462: `pathGet` reads every path `pathSet` can write

  The two halves of the dotted-path vocabulary had drifted apart, and only the reading half was short. `pathSet`
  parsed segments with `/[^.[\]]+/g` and read containers through a `Map` branch; `pathGet` did `path.split(".")` and
  a bare property access. So `cutFrames[2].content` — the bracket spelling a form field hands `writeOn<Model>` — was
  three segments to a write and one to a read, and a `field(Map, …)` entry could be written and never read back. The
  failure is silent in both cases: `pathGet` answers with its fallback, which is `null`.

  Both now share one definition, `toPathSegments`, so a path that writes and a path that reads cannot disagree about
  what its segments are, and `pathGet` reads a `Map` entry the way `pathSet` writes one. A caller that named its own
  separator keeps the plain split it has always had — under any separator but `.`, a `[0]` is part of a key rather
  than an index.

  The argument order is left alone and remains the trap it was: `pathGet(path, obj)` against `pathSet(obj, path,
value)`. Flipping it would be caught by the typechecker rather than silently, and there are only two callers — but
  `pathGetLoose` takes the same `(path, obj)` order as `pathGet`, so flipping one of the pair would replace a trap
  between get and set with a trap between get and get. The reference documentation's own example had the arguments
  backwards and is fixed here, which is the evidence that this one is worth deciding rather than leaving implicit.

- c45ac6c: perf(build): precompress the CSS bundle, and serve brotli sidecars ahead of gzip

  The compiled stylesheet went out uncompressed in production. `precompressArtifacts` only walked
  `.akan/artifact/client`, so every JS chunk got a `.gz` sidecar while the CSS — written to
  `.akan/artifact/styles` — got none, and `#fileResponse` fell through to streaming the raw file. Nothing was
  wrong on the serving side: `#isCompressible` already accepts `text/css` and the sidecar lookup already ran.
  The file simply was not there. On one deployed app that was 319KB on the wire per cold load, against 45KB
  gzipped. The CSS is and always was minified — Lightning CSS runs in `prepareCssAsset` — so this is purely the
  transfer encoding.

  Sidecars are now written for `styles/` too, and a `.br` sidecar is written alongside every `.gz`.

  Brotli is tried first and gzip remains the fallback, because browsers only advertise `br` on secure origins.
  Quality is 11 for CSS and 9 for everything else: there is one CSS asset per basePath and it is the largest
  single file an app ships, worth ~20% over gzip for ~0.2s, while spending 11 on several hundred JS chunks costs
  ~12s of build time for a few hundred KB. Measured on `apps/akan`: 371 files, 14.5MB raw, 4.2MB gzip, 3.9MB
  brotli, and the CSS bundle 103KB raw → 16.2KB gzip → 13.0KB brotli. The compress phase went from ~0.3s to
  ~0.64s. Gzip sidecars moved to level 9, which is free at build time and was previously left at the default.

  Encoding negotiation moved out of `WebRouter` and `AkanApp` into `resolveEncodedSidecar`. Both classes carried
  their own copy of the gzip lookup plus `#acceptsGzip` / `#isCompressible`, and a gateway that disagrees with
  its child about which encoding a request accepts serves a body the caller cannot decode. The shared version
  also honours `q=0` as the refusal it is, and no longer treats a token merely starting with `br` as brotli.

  **Anything caching in front of the app must pass `Vary: Accept-Encoding` through.** The header was already
  set, but it only mattered when one encoding was on offer; with two, a proxy that drops or ignores it will
  hand a brotli body to a client that asked for gzip. Artifacts now carry both sidecars, so a build's static
  output grows by roughly the brotli total (3.9MB for `apps/akan`).

- f882bbc: Keep a projected field at its declared type instead of guessing it from the value.

  Reading with a `select` — which is also every read of a model that carries a `field.secret`, since those force the
  projection path — decoded each column by looking at the string it came back as: a value starting with `{` or `[`
  was `JSON.parse`d, everything else passed through. That is a guess about the field's type made from its data, so
  the same `field(String)` answered as a string most of the time and as an object whenever a caller happened to
  store JSON in it. `genImage.prompt` is `field.secret(String)`, so an agent-written prompt that was valid JSON
  came back as an object and went out to the provider as one.

  The cause is `json_extract`, which unwraps a JSON scalar into a SQL value and so erases the difference between
  the string `'{"a":1}'` and the object it spells — and returns `0`/`1` for a boolean, which the same path handed
  back as a number. Projection now selects with `->`, whose result is the value's JSON _text_, and parses that: the
  type comes from what was stored rather than from what it looks like. Postgres already returned typed jsonb and is
  left alone; only the heuristic that ran after it is gone.

  The non-projection read path was never affected — it decodes against `FIELD_META` — so this only changes reads
  that named a `select` or touched a model with a hidden or secret field.

- 2d8de1c: fix(ui): `Refresh` handles pull-to-refresh itself, and `react-simple-pull-to-refresh` is no longer a peer

  `Refresh` loaded `react-simple-pull-to-refresh` through a dynamic import, which the bundler resolves at build time,
  so the optional peer was in fact required: a workspace that had not installed it failed its CSR build with
  `Could not resolve: "react-simple-pull-to-refresh"`. `Refresh` now tracks the touch gesture itself — same props,
  same spinner, refresh past 67px of pull, capped at 95px — and the package is gone from `akanjs`'s peer
  dependencies. An app that installed it only for `Refresh` can remove it.

- 2d8de1c: fix(signal): a `query` endpoint that declares a `.body()` argument is named in a warning at declaration

  `fetch` sends a query as `GET` with its `.param` and `.search` arguments in the URL and no body, so a `.body()`
  argument on a query never arrives over HTTP — a required one fails every call, an optional one is always `null` —
  while an MCP call does deliver it. Behaviour is unchanged; `endpoint()` now logs one warning per such argument naming
  the endpoint and the argument, and pointing at `.search()` or a mutation.

- f882bbc: feat: `RecentTime` accepts a `relative` prop for customizing relative labels

  Default `fromNow` is unchanged (`하루 전`). `"auto"` / `"always"` switch to `Intl.RelativeTimeFormat` (`어제` vs `1일 전`), and a function replaces the relative label entirely — `breakUnit` still decides when the absolute date takes over.

- ccf2ae2: fix(dev): a page loaded while a save's pages build lands no longer renders without the client components it names

  - `akan start` drops a route's client build when a save invalidates it mid-build. The request that was waiting for
    that build rendered anyway, from a manifest missing the rows the build would have added, so the RSC payload carried
    an error row and the page came up blank. The route now builds again at the new generation before it renders.

- 2d8de1c: fix(server): run a route's head once per render, and not at all for a cached replay

  The RSC worker resolved every matched route's head before deciding how to render, although only a partial-commit
  patch decision ever reads it. A full render therefore ran the head twice, and a replay from the RSC result cache
  ran it once, backend queries included. The head now runs for that decision only when partial commit is on, the
  navigation is a patch candidate and the page declares `rscPatchHeadSafe`; otherwise it runs once, inside the
  render. A replayed cached page runs no head at all, the same as its body: a head that would now throw `notFound()`
  or `redirect()` no longer pre-empts a cached replay until the entry expires or is invalidated.

- 5f53462: The API and websocket prefixes are configurable, and the browser follows them.

  - `new AkanApp({ prefix, websocketPrefix })` in `main.ts` moves the replica's route table, the gateway's websocket
    upgrade, `robots.txt`, the locale redirect's API bypass and the OpenAPI `servers` URL — and, through the SSR
    bootstrap script, the `fetchClient` in every tab the server renders. `AkanApp` also accepts its options as the
    sole argument now, so the server path no longer has to be spelled out to pass one.
  - `api: { prefix, websocketPrefix }` in `akan.config.ts` is the build's answer, for the bundles a server never
    gets to correct: a prebuilt CSR shell and a Capacitor bundle carry it inlined, and the generated Dockerfile
    writes it as the image default.
  - Resolution order is `globalThis.__AKAN_PREFIX__`, then `AKAN_API_PREFIX` / `AKAN_WS_PREFIX`, then
    `AKAN_PUBLIC_API_PREFIX` / `AKAN_PUBLIC_WS_PREFIX`, then `/api` and `/ws`. `getApiPrefix()` / `getWsPrefix()`
    from `akanjs/base` are the readers; `getEnv()` gains `apiPrefix` and `wsPrefix` beside them.
  - A prefix is a path segment: a blank value or a bare `/` is refused, and so is one whose first segment is a
    declared basePath, because either would silently trade the API's routes for the page routes or the reverse.
    `setPrefix` / `setWebsocketPrefix` now throw after `init()`, where the route table is built, instead of being
    quietly ignored.
  - `BlobStorage` derives its default URL prefix from the same value. Blob URLs written before a move stay pointing
    where they were written — they live on the rows that reference them.

- 5f53462: fix: runtime defects the reference audit turned up

  - `imageOptimizer` re-encodes only JPEG, PNG, WebP and AVIF; a static GIF (or TIFF) that no accepted format beats is
    served as its own bytes instead of JPEG bytes labelled `image/gif`.
  - `DataList.sort()` sorts a copy, so the list it was called on keeps a consistent id lookup.
  - `fetch.view<Model>` exists whenever the model's `get` does, and `edit<Model>` when a create/update/remove endpoint
    does too; a read-only model used to have neither, and one without `get` had a `view` that always threw.
    `merge<Model>` still follows `update` alone.
  - Path parameters are `encodeURIComponent`-ed, so a `/` or `?` in a value no longer reroutes the request.
  - `ConstantRegistry.serialize` / `deserialize` handle a `Map` of a declared value type instead of throwing.
  - `BlobStorage` takes `appName` from the deployment env; the server env it was reading has none, so local blobs
    landed under `local/undefined/`.
  - UI: `Field.Switch` no longer marks itself optional; `Field.TextList` checks each entry against
    `minTextlength` / `maxTextlength` and caps the list at `maxlength`; `CsrLink` forwards its props and the caller's
    `onClick`; `CsrImage` / `Image` pass `alt` through; `useBottomUpTrans` measures height; the safe-area colour falls
    back to the default page state; `DataColumn.responsive` shows the column from `md` up.
  - webkit: `useFetch` follows the promise it is handed now rather than only the first one — pass a stable promise, or
    use `useFetchFn` — and `useCamera` no longer leaves an unhandled rejection in a browser without Capacitor.
  - `Constant.Doc` and its diagram are translated.

- 2d8de1c: fix(server): request, render and live-sync fixes from the server bug sweep

  - **A multi-hop `x-forwarded-host` / `x-forwarded-proto` is read by its first value** wherever the server builds a
    public URL — the host→basePath map, the locale redirect and the rendered alternates. `pub, lb:8080` used to be
    taken whole, so the map never matched and redirects fell back to the internal origin.
  - **A client-side navigation renders with the locale and public path a page load of the same URL gets**, so on a
    sub-route host `usePage().path` no longer reads the internal basePath after a navigation.
  - **Gateway-served immutable assets carry `X-Content-Type-Options: nosniff` and `Referrer-Policy`**, like every
    response the web router sends. The gateway answers `/_akan/client|styles|fonts/*` itself under `akan start` and
    with two or more replicas.
  - **A respawned RSC worker whose init fails is replaced** instead of leaving every render queued behind it until
    the process restarts.
  - **A multi-field query loader keys each document unambiguously.** Values that concatenated alike (`x` + `yz` and
    `xy` + `z`) shared a key, and both callers in the batch got the later document.
  - **A live-sync room counts one join per socket.** A stray unsubscribe no longer drops a room other sockets are
    still in, and a socket that subscribed to the same room twice no longer leaves it behind when it closes.
  - **`/mcp` reads the bearer scheme case-insensitively and past repeated spaces** (RFC 7235, RFC 6750), so
    `bearer <token>` is judged like `Bearer <token>` instead of passing as no credential.

- 2d8de1c: fix(client): `router.push` / `replace` on the server warn that they do nothing, and name `router.redirect()`

  Called during a server render, both only wrote an `info` line and returned — no navigation, no redirect — so a page
  that meant to send the visitor elsewhere rendered in place with nothing louder than a log line at the default level.
  They now log a warning that names `router.redirect()`, the call that answers a server render with a redirect. They
  still do not throw, so a page that renders today keeps rendering.

- 2d8de1c: fix(server): a backend finishes its shutdown and delivers its last log lines before it exits

  - **The last log batch reaches the parent before a backend exits.** A message sent over IPC right before
    `process.exit` is lost from 8 KB on, so in `AKAN_LOG_FORMAT=ndjson` the shutdown lines and any final error stack
    never reached stdout. A backend now waits, up to one second, until that batch is delivered.
  - **A second `stop()` waits for the shutdown already under way.** It used to return at once, so its caller exited
    while the first shutdown was still closing services and the log transport — a second SIGINT, or every Ctrl-C
    under a gateway, where the terminal's signal and the gateway's `shutdown` message arrive together.
  - The ops snapshot route's 400 now states the id pattern it actually enforces (the first character must be a
    letter or digit).
  - An `AKAN_SUB_ROUTE_HOSTS` basePath that is ignored is warned about once per process instead of twice.
  - The builder-ready log line no longer prints `buildId=undefined`.

- f882bbc: Declare `client/sharedContext.ts` a client module, fixing a boot failure in 3.0.0-alpha.58.

  Under the `react-server` exports condition `react` resolves to `react.react-server.js`, which exports no
  `createContext` and no stateful hook. The new helper was the one module in `client/` and `ui/` calling
  `createContext` without `"use client"`, so a server component importing anything from `akanjs/client` pulled it
  into the react-server graph and the app died at boot with `Export named 'createContext' not found`. Neither
  typecheck nor build reports it: both resolve `react` the ordinary way.

  A test now fails if any module under `client/` or `ui/` imports a react binding the react-server condition does
  not provide — `createContext`, `useState`, `useEffect`, `useLayoutEffect`, `useContext`, `useRef`, `useReducer`,
  `useSyncExternalStore`, `useImperativeHandle` — without declaring the directive. `useMemo`, `useCallback`,
  `useId`, `createElement` and `Fragment` are provided there and stay unflagged, so a server component keeps using
  them.

- f882bbc: Render a `Map` field in the API explorer instead of crashing the page.

  A Map field's `modelRef` is the `Map` constructor itself — it belongs to no registry, and the value type lives in
  `of`. `Signal.Object.Detail` handed that constructor to `ConstantRegistry.getModelName`, which threw
  `No ref name for modelRef: function Map()`, so every model carrying one took down `<Signal.Doc.Zone />` on render.
  It now labels the column `Map` and leaves the existing `⇒ <value type>` beside it.

  The request and response examples had the same blind spot one layer down: they walked `Map[FIELD_META]`, which is
  `undefined`, so an endpoint whose body or return carried a Map threw before the sample JSON was built. A Map now
  serializes into the example as the string-keyed object it is on the wire — `{ "key": <value example> }`.

- 2d8de1c: fix(signal): mark a slice's `.body()` deprecated — `fetch` never sends its argument

  A slice is served as GET queries (its list and insight reads), and a GET carries no body: `fetch.*` sends only a
  slice's `.param` and `.search` arguments. A required `.body` argument therefore failed every call with a
  missing-value error, and an optional one always arrived as `null`. `.body()` still declares the argument exactly as
  before, so nothing changes at runtime; the editor now shows it as deprecated. Declare the argument with `.search`
  (or `.param`) instead.

- 5f53462: fix: `Load.Units` rehydrates when a route change swaps its `init` for one with different query args

  A slice's store is one global bucket keyed by the slice name, so `ticketListInProject` is shared by every project.
  `Load.Units` latched hydration on a mount-scoped `useRef(false)` with `[]` effect deps, so the first `init` it saw
  was the only one it ever read. Navigating between two routes that render the same slice with different args — a
  project switch, an org switch, any `[id]` change under a shared tab layout — reuses the mounted instance, and the
  latch made it keep rendering the previous route's rows: the page fetched the right data on the server and threw it
  away on the client.

  Hydration identity is now the init payload's `queryArgs`, matching what `Load.View` already does with the model
  id: `loaded` is true only while the hydrated args still equal the ones `init` carries, and the memo and both
  effects key off the same signature. Same args arriving again — a `router.refresh()`, a re-render — still hydrate
  once, so client-side page, sort, and filter state is not clobbered.

- 5f53462: A solo replica logs its boot at `info`, so a production container that runs the one traffic replica prints a line
  instead of leaving stdout empty until something goes wrong.

  `b42b7246` demoted that line to `debug` while trimming dev boot output. In a gateway deployment it costs nothing —
  `AkanApp gateway is running on port …` is `info`, and `akan start` never takes the solo path — but
  `AKAN_REPLICA=0,0,1`, which is what the chart deploys, has no gateway, and every other line a solo boot passes
  through is `verbose`. With the image's `AKAN_LOG_TO_FILE=0` and canonical request lines off by default, a healthy
  pod logged nothing at all: `kubectl logs` on a running container came back empty, and a crash looked the same as a
  quiet boot.

- 5f53462: `Loading.Spin` takes the color and the size the caller gives it, instead of pinning both to the icon

  The spinner hard-coded `text-primary/70` and `text-xl` **on the icon**, while `className` landed on the wrapper
  around it. So every `text-*` and every `size-*` a caller passed was a silent no-op — `cn` merged it into a class
  list the icon never read — and the worst case was a filled surface: a `<Badge variant="info">` renders
  `text-info-foreground`, the spinner inside it stayed `text-primary/70`, and green-on-cyan at L 70% against L 74%
  is a 1.10:1 contrast that leaves the badge's text legible and the spinner invisible.

  Both now sit on the wrapper. The icon is drawn at `1em` in `currentColor`, so color and size cascade into it, and
  `className` — merged last — wins over either. `tone="current"` names no color at all, which is what a filled
  surface needs: the spinner inherits whatever foreground the badge or the button already set. `tone` defaults to
  `"primary"`, so nothing that exists renders differently, and `"muted"` is there for a secondary surface.

  `size` also takes a number now, drawn as that many pixels, because the named steps were the only vocabulary and a
  caller reaching past them wrote `size-[50px]` — a 50px empty box around a 20px icon. A custom `indicator` is left
  alone by `tone` exactly as before: it carries its own color, and the rotation is the wrapper's.

- ccf2ae2: feat(dev): SSR pages load their client code from a dev module registry

  - Under `akan start`, an SSR page's `"use client"` code now comes from a module registry under
    `.akan/artifact/ssr-dev`, the same machinery the dev CSR registry uses, instead of the route chunks. React and the
    akanjs vendor facets stay the import map's, so the page keeps one React and one store registry. The route chunks and
    the `client-refresh` that re-imported all of them are gone from dev; `akan build` is unchanged.
  - A save patches the changed module in place with React Fast Refresh: state stays, and on minimal a component edit
    shows in about 110ms instead of 900ms. Undoing an edit now shows too; with chunks the browser kept the module it had
    already imported for that URL. A client module the RSC payload names that also exports constants re-runs in place.
  - A save that changes nothing the server renders (a `"use client"` module that keeps its export names, or a module only
    client code imports) keeps the page's build id and refetches no RSC payload. One that does — a component both sides
    render, a constant — holds its client patch until that save's pages build lands, then sends the patch and the RSC
    refresh together, so the page never runs new client code against old server props. A constant edit that reloads
    waits for that build too, and a backend restarted by a server-only save renders from the latest pages build.
  - The registry builds once in a build worker after the dev server boots, beside the builder's slow lane, and each route
    build adds the entries its page names that the registry lacks; a page served before the registry exists waits for
    it in the browser, in short holds. Route builds no longer bundle browser chunks in dev, which took about 240MB off
    the builder's peak on apps/akan.
  - Most saves are patched in the resident builder: a new file, a new import from a package something already resolved,
    a moved or renamed file (a case-only rename, `Foo.tsx` to `Foo/index.tsx`, a file created beside a folder an import
    resolved to), a deleted module brought back. A whole build in a build worker is left for a new npm package, a signal
    save (its metadata is inlined into the client runtime; a dictionary save does not rebuild the SSR registry, which
    inlines none), and a registry whose last whole build was cut short. A save that does not compile — a typo in an
    import included — is reported by the builder at once, and the save that fixes it patches in about 120ms.
  - A failed build keeps the registry the tabs and the next save read. Its error stays on the overlay, is shown to a tab
    opened while it stands, and clears with the save that fixes it — for a route that failed on a shared module too,
    which is built again once a newer build goes green. A broken file no page imports any more stops failing saves.
  - A client module whose top level threw, or a store that throws at startup, recovers with the save that fixes it, and
    the dev server's error page carries the HMR client, so it reloads once the fix lands. A pages bundle that builds but
    throws while it loads shows its error while the RSC worker keeps serving the bundle it had.
  - A tab that reconnects after a backend restart loads the patches it missed and refetches its payload instead of
    reloading; one that reconnects to a new dev session (a new `akan start`, a config restart) reloads onto its registry.
    A tab that booted beside the vendor file of the build before loads the newer one, so a new npm import in a leaf
    component works without a manual refresh.
  - A build worker exits with the builder that spawned it, and a boot build whose worker was killed is retried after 10
    seconds. On Windows, registry writes retry a rename refused while a reader holds the file, and a build worker hashes
    the same bundle config as the builder, so saves are not all handed to whole builds.

- 2d8de1c: fix(server): a client-side navigation on a sub-route host stays inside that host's basePath

  On a host mapped to a basePath (`subRoutes` or `AKAN_SUB_ROUTE_HOSTS`), a page load rewrites every path into that
  basePath, so a path only another basePath serves is a 404 there. A client-side navigation (`<Link>`,
  `router.push`) also tried the other basePaths and rendered their pages under the mapped host's domain: on the
  `soft` host, `/en/admin` and `/en/office/admin` both showed `office`'s admin page. The navigation now resolves its
  target exactly as a page load on that host does, so the two answer the same page, or both a 404. A host with no
  basePath of its own (a debug host, `akan start` on localhost) still finds the basePath whose route matches.

- 69f7178: fix(service): let `onInit` and `onDestroy` be declared sync

  `Adaptor` and `Service` both declared the pair as `onInit(): Promise<void>`, so a hook with nothing to await was a
  type error even though every call site already awaited it:

  ```
  Property 'onInit' in type 'SyncAdaptor' is not assignable to the same property in base type '… & Adaptor'.
  ```

  Both hooks — and the interceptor's pair, which is the same shape — now return `Promise<void> | void`, the same
  spelling `_preRemove` and the DI's own `onDestroy` probe already use. `override async onInit()` is unchanged.

  ```ts
  export class Cursor extends adapt("cursor" as const, () => ({})) {
    override onInit() {
      this.watcher = watch(this.root);
    }
    override onDestroy() {
      this.watcher?.close();
    }
  }
  ```

  The default no-op bodies stopped being `async` as part of the same change: `serve()`'s implementation returns the
  raw class, and TypeScript checks each overload's return type against it in one direction or the other, so widening
  the interface while the base stayed `async` left neither direction assignable and broke `serve` itself with TS2394.
  The one observable consequence is that an un-overridden `onInit()` returns `undefined` rather than a resolved
  promise — `await` reads both the same, but `.then()` on it does not.

  `_libsOnInit` / `_libsOnDestroy` now wrap each hook call. A sync hook that throws used to escape the `.map` before
  `Promise.all` was ever reached, stranding the promises the async hooks beside it had already started; the throw
  now arrives as a rejection with every sibling still attached.

- 5f53462: feat: the agent's pointer lives for the turn, and waits out the model's own thinking

  The pointer's life was measured in the gap between **calls** — 1.4 seconds of quiet and it faded. But a model's
  calls arrive with its own writing between them, which takes several seconds, so a turn of four calls was four
  pointers: each one appeared, pressed, and vanished before the next arrived. The unit was wrong.

  `AgentSession` now reports the boundary that matters. `onTurn(running)` fires once when a turn starts and once
  when it settles, and only the conversation loop reports there: `compact` runs under the same internal flag and
  drives nothing on screen, so a host drawing the agent at work would otherwise draw it for a summary nobody asked
  to watch. Between the calls of one turn the pointer stays where it last landed and turns into a spinner, because a
  pointer sitting perfectly still for four seconds reads as stuck rather than as waiting.

  It still appears only at the first control it presses, and **a turn that drove no control draws no pointer at
  all** — parking one in a corner for a turn that only answered a question would be the screen claiming something
  that did not happen.

  While a reveal scrolls the page to the next control, the pointer holds still the way a person's does and carries a
  chevron pointing the way the view is travelling — stillness over a sliding page otherwise reads as a pointer that
  has come loose rather than as the one doing the scrolling. The scroll budget is now spent per turn as well, instead
  of per quiet second, which is what it was always guessing at.

  **`navigate` draws again, but only on an element.** The link a navigation is going to, when exactly one visible
  link goes there, is pressed before the route moves — which needs the call to wait, so `ToolRunner` now awaits the
  `start` activity and `AgentSession.onActivity` may answer a promise. `AgentVisual` returns one for that call alone
  and caps it at 600ms; everything else still draws while the call is already running. An off-screen link is left
  alone, because scrolling to a link and then leaving the page it is on is two motions for one act. **Link presence
  decides what is drawn, never what is allowed**: the agent may still navigate anywhere the user could type, and a
  zone that must stay on one screen drops `navigate` through `builtins` as before.

  `Router.routeOf(pathname)` is what compares the two addresses — the locale and base-path segments live on the
  `<a href>` and never on the tool argument. It is `getPath` without the browser guard, which `getPath` only needs
  for its own default argument.

  **The pointer clears the control before it waits.** A spinner parked on the button it just pressed reads as one
  stuck to it, and it covers the very change the press caused — a person clicks and takes the hand away. It drifts
  just past the control's box, down and to the right unless the viewport edge is there, and spins from that spot.

  **A control the screen is not actually showing is not pointed at, and the pointer goes rather than travelling to
  it.** `checkVisibility` answers about an element alone, so one under a modal's backdrop, inside a drawer that has
  slid off, or faded to nothing all pass it while being invisible to the user — and a pointer sent there lands on a
  blank patch of overlay, which reads as the effect being broken rather than as the agent acting. The test is
  `elementFromPoint` at the control's own centre, taken after the reveal has settled, with an ancestor counting as a
  hit so a `<label>` wrapping its input is not mistaken for an occlusion.

  **`agentAttrs(handler, key)` tells namesakes apart.** One tool serves a whole tab strip or a whole list, so every
  control carrying it was interchangeable in the DOM and the no-guessing rule turned that into drawing nothing.
  A key — in the same vocabulary the call's argument uses — lets the pointer pick the one the call named; short of
  exactly one answer nothing is still drawn. `Tab.Menu` now passes its own `menu` key, so switching a tab is drawn
  on the menu that was switched to.

  `reveal` and `cursor` are now independent, as their names always claimed: `visual={{ reveal: false }}` keeps the
  pointer and drops the ring, where before it dropped both.

- 2d8de1c: fix(tunnel): a shared app keeps answering after its websockets close

  A finished websocket stream closed its data socket, but the tunnel agent kept counting that socket as idle, so it
  never opened a replacement. Every page reload closes its HMR socket, so an `akan start --share` tunnel with the
  default four idle sockets stopped answering after about five reloads, until the control link reconnected. A
  finished stream now retires its socket and the pool refills it.

  A raw TCP stream also ended in a stack overflow (the stream and its socket closed each other in a loop), and it
  forwarded a fast origin's output without waiting for the tunnel socket to drain. Neither path is opened by the
  current wire protocol; both are fixed ahead of it.

- 2d8de1c: fix(tunnel): a websocket stream the gateway resets gives its data socket back

  When the gateway reset a tunnelled websocket, the agent closed the local websocket but left the data socket that
  carried it open. The wire contract never returns a raw stream's socket to the pool, so the gateway could not use it
  again, while the agent counted it as idle and opened no replacement: every reset shrank the working pool by one.
  The agent now closes that data socket, as it already did when a websocket or TCP stream ends on its own side or the
  gateway resets a TCP stream, and opens a fresh one in its place.

- 2d8de1c: fix(tunnel): a tunnelled TCP stream half-closes instead of hanging up

  The wire contract ends each direction of a stream on its own, but the agent's raw TCP stream treated the
  gateway's `end` as the end of everything. It closed the connection to the local port outright, so whatever the
  origin answered after the caller's end of input was lost, and bytes the caller sent after the origin finished its
  own side were dropped too. The agent now shuts down only the direction that ended: the origin sees end of input and
  can still answer, and the caller can keep sending after the origin's end. The data socket goes back once both
  directions are done or the stream is reset. The local connection is dialled through `node:net`, because
  `Bun.connect` stops reading once its write side is shut down (Bun 1.4). Wire version 1 opens no TCP stream yet, so
  no running tunnel behaves differently today.

- 2d8de1c: fix(tunnel): a tunnelled websocket stream's `run()` finishes however the stream ends

  `TunnelWebsocketStream.run()` (`akanjs/server/tunnel`) resolved only when the local websocket closed or failed on
  its own. When the stream was reset instead — by the gateway, by the gateway dropping the data socket under it, or by
  the agent stopping — the promise never settled, unlike the http and tcp streams. It now resolves once on every path,
  and a reset that arrives after the stream has already ended releases the data socket no second time. The agent
  itself never awaited it, so a tunnel behaves the same.

- 5f53462: fix: every store write marks the slice payloads stale, and `Load.View` refetches a replayed one

  A write patches the lists and the model the store holds, but the RSC payload each of them was hydrated from still
  carries the pre-write rows — and `rscCache` replays that payload verbatim when the user navigates back to a route
  they already visited. So changing a ticket's status in one project, switching projects, and coming back showed the
  status the page was first rendered with.

  `staleAtOfOtherSlices` was the only guard against this and it was half-wired: it ran on `create<Model>` /
  `create<Model>InForm` only, and it excluded the slice that issued the write. `update<Model>`,
  `update<Model>InForm`, `merge<Model>`, `remove<Model>` and `set<Model>` — the last of which is where every custom
  mutation endpoint commits its result — stamped nothing at all.

  It is now `staleAtOfSlices`, stamped by all seven writes across every slice including the issuing one. The
  exclusion bought nothing: the stamp starts no fetch, because `Load.Units` only re-checks staleness when a list
  re-hydrates, and the slice that took the optimistic patch is exactly as far behind in its payload as its siblings.

  `Load.View` had the same hole with no guard at all — view a model, edit it, view another, come back — and now
  refetches through `view<Model>` when the payload it is re-hydrating from predates the last local write. It reads
  `<refName>StaleAt`, the root slice's stamp, and does nothing on a model whose signal declares no slice.

  Both checks compare a server-generated `initAt`/`viewAt` against a client-generated `staleAt`, so a badly skewed
  client clock costs an extra refetch per navigation (clock ahead) or misses one (clock behind). That trade is
  unchanged from the create path this generalizes.

- f882bbc: Rename a zone's scope-prefixed tools onto what a provider's function-calling wire accepts.

  A zone publishes `<id>.<name>`, which is legal for MCP but rejected by every OpenAI-compatible and Anthropic
  function schema — those allow `[A-Za-z0-9_-]` only, up to 64 characters. The name went to the provider verbatim.
  A validating provider answers 400; DeepSeek did not, and what happened instead was harder to find: the model
  normalized the illegal name itself, called the bare tool, and the browser answered `Unknown tool` for a tool that
  was published all along, spending a turn.

  `AgentService.runTurn` now renames every tool name in the request — the published tools and the calls the
  transcript still carries — and reads the answer back under the name the surface registered. A request whose names
  already fit is handed on as the same object, so the root agent's turn is unchanged. `Agent.Context`'s Assemble
  now lists the published tool names, which is where a prefix mismatch is visible in one glance.

## 2.4.2

### Minor Changes

- 11aa655: feat(constant): remove a relation's target with its owner via `cascade: "remove"`

  A relation field can now take its target down with it: `image: field(File, { cascade: "remove" })`, arrays
  included. The removal runs through the **target's service**, so the target's own `_postRemove` runs with it —
  that is how removing a model also deletes the file's stored blob or object, with no extra wiring in the owning
  module.

  Only a relation accepts the option. A `String`, an `ID`, a scalar, and a nested array each fail while the class
  is being built, naming the field: none of them points at a document the framework could remove.

  Target services resolve lazily, at removal time, so a cascade adds no boot-order edge between two services and a
  cascade cycle cannot fail the boot. They resolve _before_ the parent is touched, so a model cascading into a
  module the app never mounted fails with nothing half-removed.

  Two limits worth knowing. Nothing checks whether another document still references the same target, so declaring
  `cascade` asserts that the field owns its target exclusively. And query-level removal (`deleteManyByQuery` /
  `updateManyByQuery`) stamps `removedAt` in one atomic update that fires no hooks and therefore no cascade —
  remove documents one at a time when they cascade.

- 11aa655: feat(store): invalidate sibling slices on create and refetch them in `Load.Units`

  A model with more than one parent is listed by more than one slice, and a create could only ever be spliced
  into the slice it was issued from. Creating a `bizDoc` from `bizDocInOrg` left `bizDocListInProject` without
  it, and an RSC navigation back to that page replayed a cached payload whose server-stamped
  `bizDocInitAtInProject` still satisfied `Load.Units`' cache check — so the new document stayed invisible until
  a full reload.

  `create<Model>` and `create<Model>InForm` now stamp a new per-slice `<model>StaleAt<Suffix>` on every slice
  _except_ the one named by `sliceName`. Whether the new document belongs to a sibling slice is a server-side
  filter decision, so the siblings are marked for revalidation rather than patched optimistically. `Load.Units`
  refetches through `refresh<Model><Suffix>` when its slice's `StaleAt` is newer than its `InitAt`, and a
  completed refresh restamps `InitAt` past `StaleAt` to end the stale state. The refetch is skipped while the
  list is already loading, which also dedups several `Load.Units` mounted on one slice.

  `Load.Units` also takes a `staleTime` prop, in milliseconds, for age-based revalidation independent of any
  create: `staleTime={0}` always refetches on mount, `staleTime={30_000}` refetches only when the cached data is
  older than 30s. Omitting it leaves the component purely invalidation-driven.

  Update and remove are unchanged — they already walk every slice, because a document they touch is one the
  cached lists can be searched for by id.

- 11aa655: feat(server): add subRoute hosts at runtime with `AKAN_SUB_ROUTE_HOSTS`

  An app resolved a request Host to a basePath through a map fixed at build time — the domains written into
  `akan.config.ts` plus the generated `<basePath>-<branch>.<serveDomain>`. A platform that mints its hostnames when
  a project is created cannot write either one into the repo, so its subRoute hosts fell through to the root app.

  `AKAN_SUB_ROUTE_HOSTS` adds to that map at boot, in the same spirit as `AKAN_PUBLIC_BASE_PATHS`:

  ```
  AKAN_SUB_ROUTE_HOSTS="soft=soft-abc.try.akanjs.com,soft.acme.com;office=office-abc.try.akanjs.com"
  ```

  Hosts are matched lowercased and without a port, exactly as the built-in ones are. The env mapping is a union with
  the built one, never a replacement, so a tenant's own domains keep working and removing the env restores the
  previous behaviour byte for byte.

  A basePath the build does not serve is dropped with a warning rather than honoured — the route tree is a build
  output, so accepting one would answer every request under it with a 404 and nothing to explain why. A malformed
  entry is skipped the same way: the value is rendered by a deployment platform, and one bad character must not turn
  into a boot loop across every pod.

  `x-base-path` is now checked against the basePaths the build serves before it is trusted, matching the check
  `getBasePathFromPathname` already applied to it. An unrecognised value falls through to host matching instead of
  selecting a basePath that resolves to nothing.

- 25d5b15: feat(devkit): sync lib `page` trees into apps and honor `pageConfig.devOnly`

  Apps can opt in with `syncPageLibs` (`true` / lib list) so `akan sync` links each lib's routes under
  `page/(libs)/(<lib>)` — once per basePath when the app has subRoutes. The link is generated and
  gitignored; the lib source stays the edit target. Collision on the resolved route pattern is a
  sync-time error.

  `pageConfig.devOnly: true` (literal only) keeps a route out of `akan build` while `akan start` still
  serves it. On a `_layout` it excludes the whole subtree. Symlink-aware file ops avoid wiping a synced
  lib when cleaning an app link, and dangling lib links no longer break `getApps`.

- 25d5b15: feat(signal): refresh websocket credentials in-session and re-check pubsub rooms

  Handshake credentials now live on `AppWsData` (headers/cookies only). Clients that hold the token in
  memory send it with `fetch.setJwt(...)`, which forwards an `__auth` frame; the server swaps the
  snapshot synchronously and re-runs each subscribed room's guards, unsubscribing the ones that fail.

  Guards should read the caller with `context.get("account")` instead of branching on HTTP vs websocket
  transport. Slice-level guards still only wrap generated query/mutation endpoints — a pubsub endpoint
  needs its own `guards` if the room itself must be protected.

### Patch Changes

- 6d58c7e: add search feature for sqlit database with fts5
- 25d5b15: fix(ui): refresh EditModal when the hydrated edit payload is stale

  RSC navigation can replay a cached page tree, and an edit shell hydrated from that payload can show
  arbitrarily old form data. EditModal now treats a cache replay (or a `modelViewAt` older than 60s) as
  stale and refetches via `edit<Model>` while keeping the modal open on the last known id.

- 42cf7a2: Normalize unsendable relayed WebSocket close codes to 1001 so Bun's global client WebSocket.close no longer throws InvalidAccessError at the gateway's client-to-upstream relay when a peer disappears without a close frame (code 1006). The upstream-to-client relay applies the same normalization defensively.
- 04cb46d: Allow the documented wsConnect export during source validation for root layouts, including base-path and grouped root boundaries, while continuing to reject it on nested layouts.

## 2.4.1

### Patch Changes

- 473be34: fix(devkit): restart the backend for server code saved while the builder was away

  Nothing watches the source tree between a builder leaving and its replacement being ready: the idle
  suspend stops its own watcher before the wake's boot build, a recycle or crash takes the builder's
  watcher with it, and a fresh builder primes its mtime index from whatever it finds on disk — so a save
  that lands in that window is _baseline_ to it and produces no event anywhere. The client half of such a
  save is rescued by the boot build reading the new file; the backend half was not. A `.service.ts` saved
  in that window left the server running the code it replaced, with nothing on screen to say so.

  The dev host now stamps `(mtime, size)` for every file in the backend import graph when the builder goes
  away — at suspend, at a recycle request, at a crash exit — and compares them when a builder is ready
  again, restarting the backend for anything that moved. Comparing stamps rather than waiting for events
  also covers the watcher dropping one, which Bun's recursive `fs.watch` does.

  A config change while suspended is exempt, because it replaces the backend along with the builder on its
  own. Where the backend graph scan has never succeeded — path-role fallback rules — there is nothing to
  stamp, and the host says so rather than staying quiet about it.

- f5bfa27: perf(devkit): stop parsing every source file to find barrel imports

  `rewriteBarrelImports` ran a full TypeScript parse of every file it was given, to find import
  statements it then discarded for all but the barrel ones. It runs on every source file of every dev
  rebuild, which made it the single most expensive thing in one.

  - **63% of files import no barrel at all.** A static import cannot name a specifier without that
    specifier appearing literally in the source, so a substring test skips them before the parser is
    involved — 4ms for 1189 files. The bundler plugin already did this privately; it now lives in
    `rewriteBarrelImports` so the CSS and client-entry walks get it too.
  - **`setParentNodes: true` was paid for no reader.** Nothing reads `node.parent`; every position comes
    from `getStart(sourceFile)`, which takes the file explicitly.

  Measured across 1189 files: 299ms and 161MB of RSS become 88ms and 5MB. End to end on `apps/akan`,
  `CssCompiler.discoverCssAndSources` drops from 262ms to 190ms and the client-entry discovery walk from
  242ms to 176ms, retaining 107MB instead of 128MB. Verified output-identical on 1535 files: same import
  statements from the parser, and no file the pre-filter skips would have been rewritten.

  `CssCompiler` also memoises import resolution for the life of one rebuild, where a miss cost up to 13
  sequential `exists()` calls repeated per importer (a further 216ms → 190ms).

- 473be34: fix(devkit): bound the `ps` fallback that reads another process's memory

  Where there is no `/proc` (macOS), the dev host reads a process's RSS by shelling out to `ps`, with no
  timeout. An absent `ps` was already handled — it answers `null`, which callers read as "no new
  information" — but a stuck one was not, and its only caller awaits it at the end of a 20s settle before
  committing a builder recycle. A hang there meant the recycle silently never happened.

  Now spawned directly with a 2s kill timer, which is the same treatment the dev-stability harness already
  needed after `ps` hung under load.

- 068158b: feat(devkit): bound dev-server memory and stop losing watch events

  Two dev-server problems that compounded each other.

  - The builder grew without bound because `Bun.build` retains native bundler arenas that
    `Bun.gc(true)` never reclaims. It is now recycled once its RSS passes a ceiling derived
    from the container's cgroup limit, draining in flight work first.
  - Bun's recursive `fs.watch` reports roughly one path per coalescing window and discards
    the rest, so concurrent saves went unbuilt. Changes are now resolved against a
    `SourceMtimeIndex` baseline and events only decide _when_ to look.

- 46a1a4a: fix(devkit): flush all builder ipc through BuilderChannel and isolate the boot build

  `BuilderReply` only covered request responses, so recycle `process.exit` could still
  drop unflushed events like `css-updated` and leave the backend on a stale bundle. The
  boot `SsrBaseArtifactBuilder` also stayed in the long-lived watcher and retained most of
  its idle RSS.

  - Replace `BuilderReply` with `BuilderChannel` (`send` / `emit` / `drain`) so every
    builder→host message awaits ipc flush before recycle exit.
  - Run the boot base artifact build in the disposable `buildBatch` worker (`needs: ["base"]`)
    and keep only the serializable artifact/fonts in the watcher.
  - Split the idle resource-budget assertion so host+backend stays tight while the builder
    can swing within its RSS recycle ceiling.

- 90c6597: fix(devkit): answer in-flight builder requests on recycle and flush replies before exit

  Builder RSS recycle (and unexpected exits) left mid-flight `build-route` /
  `build-csr` promises hanging: the host never tracked correlation ids, and even a
  clean drain could lose a large `build-route-res` when `process.exit` truncated an
  unflushed ipc write past the pipe buffer.

  - Track in-flight ids on the host and fail them with a reloadable error when the
    builder recycles, crashes, or is stopped.
  - Send replies through `BuilderReply`, which awaits the ipc flush (with a timeout)
    so recycle drain means "answered", not "truncated".

- aca901d: fix(devkit): keep builder replies matched to the backend that asked for them

  `BuilderRpc` numbers its requests from 1 in each backend _process_, while the builder it
  talks to outlives the backend. After a restart the two generations collided on id 1: the
  builder answered the departed backend's request, the dev host relayed it, and the new
  backend settled its own id 1 with another route's manifest delta — a page rendered against
  client modules that were never built for it. The answer it was actually waiting for then
  arrived to an empty pending map and was dropped, discarding the correct build too.

  `BuilderRequestRouter` renumbers ids host-side, so neither the backend nor the builder
  learns anything changed and a reply whose generation is gone is discarded rather than
  misdelivered.

- 068158b: fix(cli): make `bun run akan <cmd>` concurrency-safe

  `bun run akan` rebuilds the CLI into a shared `dist/` before every command, so two
  commands started at once could read a half-written bundle.

- cb895b7: fix(devkit): find created directories on a filesystem with a coarse mtime clock

  `SourceMtimeIndex` finds new files by noticing their directory's mtime moved, which Linux
  stamps from a coarse clock: 400 back-to-back `mkdir`s left the parent's mtime unmoved 319
  times on overlayfs and 324 times on ext4, smallest observable step 1ms. macOS APFS
  (0.042ms) missed none, which is why this only ever showed up on Linux.

  A directory mutated in the same millisecond as the recorded value — but after the walk that
  recorded it — therefore left no trace, and because its files were never tracked, later edits
  to them went unreported for the life of the process. Directories whose mtime was still fresh
  when it was read are now re-walked on the next scan (`dirSettleMs`, 20ms default), and
  `HmrWatcher` schedules one more scan while any remain unsettled.

- f8a9bc5: perf(devkit): cache tailwind candidate tokens across builds

  The CSS rebuild read the full text of every source file on every save. Phase 2 moved css
  compilation into a per-generation batch worker, so an in-memory cache is discarded before
  the next save can use it — the cache goes to disk instead, the same way font subsetting
  does, which also survives a builder recycle and a dev-host restart.

  Measured on `apps/akan` (556 sources, 26800 candidates): the candidate scan drops from
  58-60ms to 13-19ms. Note that this is a smaller share of the rebuild than expected — the
  full CSS rebuild is ~380ms, so the scan was never the dominant cost. Nothing is written
  when nothing was re-read.

- d973712: perf(cli): keep heavy dependencies out of the long-lived dev processes

  `akan start` holds the CLI entry and the builder watcher for the whole dev session, so an
  eagerly imported dependency is resident for the whole session too.

  - The dev host reached `@inquirer/prompts` (~24MB) because `runCommands` shares a module
    with the interactive argument fallbacks. Those now load the prompt stack on first use,
    which for `akan start` is never.
  - The builder watcher reached `tailwindcss` and `@tailwindcss/node` (~40MB) through the
    `frontendBuild` barrel, which re-exports `cssCompiler` and `ssrBaseArtifactBuilder`. That
    has been dead weight since css compilation moved into the batch worker; the watcher now
    imports by module path.

  `entryModuleGraph.test.ts` guards both by walking each built entry's chunk closure. The
  previous check grepped the entry file alone, which cannot see a dependency reached through
  a shared chunk and so reported both of these as absent.

- 068158b: fix(devkit): pin the dev port and bound the waits that could hang forever

  - `AKAN_DEV_PORT` pins the dev port. It used to derive from an app's index in the `apps/`
    listing, so adding an app moved a running dev server's port at its next restart.
  - `BuilderRpc` created request promises with no timeout, and nothing else answers a lost
    request. Since the builder is recycled routinely, a page request that landed mid
    route-build left the SSR promise pending forever with nothing to retry. Now bounded by
    `AKAN_BUILDER_RPC_TIMEOUT_MS` (120s default) with a message naming the likely cause.

- cc3dd40: feat: expose local-dev metadata endpoints for devtools visualization

  Add four JSON endpoints, registered only when `AKAN_PUBLIC_ENV=local` (override with `AKAN_DEVTOOLS`),
  that describe the running system for an external developer-tools UI:

  - `GET /_akan/constant` — every model's Input/Object/Full/Light/Insight view, scalars, enums, filter
    query/sort, and derived relation edges.
  - `GET /_akan/signal` — declared and framework-generated endpoints, slices, internals, and a flattened
    route table with fully resolved HTTP/WS paths.
  - `GET /_akan/dictionary` — the merged i18n tree, module kinds, and flattened dotted keys (`?lang=` narrows it).
  - `GET /_akan/deps` — the DI graph: services, adaptors, signals, uses, middleware, env, roles, and the
    topological init stages.

  They live in `AkanServer.#createBuiltinRoutes()` next to `/openapi.json`, so they stay off the `/api` prefix
  and never enter the `serializedSignal` payload shipped to clients. Outside `local` the routes are not
  registered at all and fall through to the SSR catch-all.

  Supporting changes:

  - `DictionaryRegistry` collects each `makeTrans` root, which was previously closure-private and unreachable
    from the server.
  - `DiLifecycle` gains a read-only `modules` accessor and retains disabled-module reasons that were only logged.
  - `SignalResolver.getScheduleSkipReason` is now public so the reported schedule placement cannot drift from
    the scheduler's own rules.

  Secrets discipline: secret constant fields report name and type but no `default`/`example`, `env` carries
  values for `AKAN_PUBLIC_*` only and every other key by name alone, and `uses` are reported as key plus class
  name — never the instance. `env` inject keys are extracted by scanning the factory source, never by running it.

- 8a2b795: perf(devkit): stop retaining source text in client-entry discovery, and expire its misses

  `GraphClientEntryDiscovery` is created once per builder process, so its caches live for the
  whole dev session in the watcher.

  - It kept the full text of every file the walk had touched plus a barrel-rewritten copy of
    each, when the walk only ever asks two things of a file — is it a client entry, and what
    does it import — both of which were already cached separately under the same key. Those
    three caches collapse into one holding just the derived facts: measured on `apps/akan`,
    retention after a full walk drops from 135-142MB to 125-127MB.
  - `invalidate()` never cleared the file-existence and resolution caches. They are keyed by
    extension-less path and by `dir\0specifier`, neither of which maps back to a file that was
    just created, so a negative recorded before a module existed was permanent: adding a new
    module and importing it left the import unresolved until the next config change or builder
    recycle. Negative answers are now dropped on any invalidate; positive ones are keyed by a
    real path and are left alone.

- 068158b: perf(devkit): cache font subsetting across dev-server boots

  `FontOptimizer.optimize()` re-subset every font file on each builder boot even though it
  already computed a config hash and wrote hashed outputs. It now skips the
  `fonteditor-core` / `subset-font` work when the expected outputs are present, which also
  keeps those two packages out of the common path entirely.

- 473be34: fix(devkit): hold page requests during the recycle drain, not only after the builder exits

  A builder asked to recycle drains first — it stays alive finishing its queued work and refuses
  everything new — and throughout that window the dev host still reported it as `ready`. So a route or CSR
  request that arrived during the drain was sent, refused by the departing builder, and relayed to the
  backend as a failure: the same dev error page the request-holding fix was written to remove, in the half
  of the window it never covered. The hold was unreachable there, because it only runs when the send
  itself fails.

  The builder host now reports `recycling` for the drain, which `send()` refuses on and which the hold
  decision treats like a restart. `ready` — the field `onExit` reads to tell a planned exit from a builder
  that never came up — is deliberately unchanged.

- e5fde3b: fix(devkit): hold page requests while the builder restarts instead of failing them

  A route or CSR request that arrived while the builder was recycling or restarting was answered
  immediately with `builder is restarting; reload after the builder is ready`. Nothing retried, so the
  browser tab showed an error for a builder that was seconds from being back — and the builder is recycled
  routinely, whenever its RSS passes the ceiling.

  Those requests are now held and replayed when the builder reports ready, which is what the idle-suspend
  path already did for exactly this reason. `BuilderRpc`'s own timeout still bounds the wait, the queue is
  capped so a builder that never returns cannot grow it, and anything still held when the builder is
  stopped for good is failed rather than left silent.

- 473be34: fix(devkit): say when a build worker was killed rather than crashed

  The disposable build worker holds the largest transient in the dev tree (~548MB on a mid-size app, over
  1GB on a large one), so on a small sandbox it is the process the kernel reaches for first. A worker the
  OOM killer takes exits with code `null` and `SIGKILL`, and the build was reported as `build worker exited
with code null before reporting a result` — indistinguishable from an ordinary crash, though the two have
  opposite fixes: find the build error, or raise the memory limit.

  The failure path is unchanged and still safe (that generation goes red, the last-good artifact keeps
  serving); the message now names the signal, and calls out `SIGKILL` as most often the OOM killer.

- f28466f: fix(server): stop closing the database out from under its own schema setup

  `getStore()` returns a store synchronously while `ensure()` goes on creating tables and indexes, so a
  shutdown could close the connection mid-setup. The rejection was unhandled — `void store.ensure()` —
  and surfaced as `RangeError: Cannot use a closed database` blamed on whatever ran next, which read as a
  flaky test rather than a race at shutdown. Reproduced at 3 failures in 8 runs of the akanjs suite, 0 in
  10 after the fix.

  All three SQL adaptors (bun:sqlite, libsql, Postgres) now track those setups and let them finish before
  closing. Every statement `ensure()` runs is `IF NOT EXISTS`, so one cut short is simply redone next boot.

- 51851fa: perf: cut idle/dev-save memory with phase-1 quick wins

  Apply the phase-1 resource plan without architecture changes:

  - Self-arming CSR rebuild — skip the dead CSR artifact until `/__csr` or `?csr=true` first needs it
    (keeps mobile live-reload working once armed).
  - Bound RSC worker reload accumulation with threshold/RSS recycle instead of retaining every pages
    bundle generation.
  - Split `@akanjs/devkit` into subpath exports and move route/overrides AST validation out of the
    resident `executors` graph so `typescript` is not pulled into long-lived start processes.
  - Lazy-load CLI command modules via a command manifest so unused command graphs stay cold.

  Also await async endpoint guards (including in parallel) so `canPass` promises are honored.

- 1c3436f: perf: bound builder memory with RSS recycle and disposable batch workers

  Apply the phase-2 bounded-builder plan so Bun.build retention no longer grows without
  bound across a long `akan start` session:

  - Report builder RSS after each work item and recycle the builder process when it crosses
    a ceiling (`AKAN_BUILDER_MAX_RSS_MB`, else cgroup × 0.35, else 1200 MB), only when no
    build is in flight and the generation is green.
  - Extract shared `memoryLimit` helpers (also used by the RSC worker) and announce recovered
    pages/css state after a recycle-triggered boot so a live backend picks up the new
    `base-artifact.json`.
  - Move pages/css/csr `Bun.build` work into a disposable `buildBatch` worker that exits per
    generation (optional `AKAN_BUILD_WORKER_REUSE_COUNT`), keeping the watcher process thin.

- 128e9a3: fix(devkit): survive a container image with no `ps`

  `DevStabilityHarness` shells out to `ps` to find leftover dev processes, and slim images such as
  `oven/bun` ship without procps, so the spawn threw. It now returns the same `null` it already
  returns for a `ps` that does not answer in time — "could not look", not "nothing is running".
  Fixture liveness never depended on it (`process.kill(pid, 0)`), so sweeping still works.

- a5d4a8a: fix: register and correctly invoke `internal(... { process })` queue workers

  `process` internals accepted jobs but never ran them. Three defects:

  - `buildInternal.process` was the only scheduled factory that did not default `enabled: true`, so
    `SignalResolver.resolveSchedule` skipped it and no worker was ever registered. Placement is now governed by
    `serverMode`/`operationMode` alone, matching the existing `serverMode: "all"` default.
  - Registered workers were called with the `AkanJob` rather than the declared `msg` arguments. The job payload is
    now spread onto the declared args and deserialized against their declared types, so the `exec` signature
    `(...msgArgs, job)` holds at runtime.
  - `BullQueue` scoped its worker to queue `<prefix>:<key>` while enqueueing onto queue `<prefix>`, so cluster mode
    never consumed jobs. Producer and consumer now share one queue per process key.

  `resolveSchedule` also logs when a `process` internal gets no worker on the current server, since the producer is
  installed regardless of placement.

- 473be34: fix(devkit): stop turning the builder's memory ceiling off on the first page load

  The dev host stops enforcing the builder's RSS ceiling when recycling evidently cannot meet it. The
  evidence it used was "two over-ceiling reports within 30s of a recycle" — but a builder reports after
  every build, and one page load builds a route per navigation. On a container-derived ceiling (a 1.2GB
  sandbox gives the builder ~420MB, against ~247MB per route build) the first page load after a recycle
  switched the ceiling off for the rest of the session, leaving the builder unbounded on exactly the
  deployment shape the ceiling exists for.

  It now measures what it always claimed to: when a replacement builder becomes ready, before it has built
  anything on demand, the host reads its RSS from the OS. That is the floor every future replacement lands
  on, so a floor already over the ceiling means recycling cannot help — and only that stops enforcement,
  with the message naming `AKAN_BUILDER_MAX_RSS_MB`. Otherwise the ceiling stands and the existing 30s
  minimum interval bounds what it costs, now with a one-off warning when the builder keeps crossing back
  inside that interval.

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

## 2.3.11

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

## 2.3.10

### Patch Changes

- b92003a: fix: cross-platform path handling using path.resolve/path.join/path.sep

## 2.3.9

### Patch Changes

- f518afd: Improve dictionary type inference and lint coverage for generated workspaces.
- f518afd: Add expiration options to remote memory cache writes.

## 2.3.6

### Patch Changes

- 0a4815a: Improve `akan start` stability for incremental dev changes.

## 2.3.5

### Patch Changes

- Fix Akan document and service type regressions for extended constant, document, signal, and store models.

## 2.3.2

### Minor Changes

- 1a48756: Add rich sample workspace template with full Akan.js module examples (task, noti, workHistory scalar) to help AI agents and developers bootstrap faster. Templates include database modules, service modules, scalars, UI components, server/client helpers, and comprehensive AGENTS.md with workflow recipes and auto-generated API reference.

### Patch Changes

- 940d6db: Optimize generated fetch client type inference while preserving ordered signal override semantics.
- d6db24d: Fix dev runtime refresh for client components, dictionaries, and signal metadata while keeping regenerated server page bundles aligned with live app signal definitions.
- dc60773: apply hidden and secret type safety on server side
- ffe68ec: Fix fetch client type inference for composed app signals while preserving direct signal navigation.
- 1a48756: Add the internal route cache tag boundary for SSR/RSC result caches, including cache tag collection and scoped tag/path invalidation across host and worker caches.
- 1a48756: Fix intermittent SSR/RSC navigation stalls by upgrading React and patching React DOM to preserve pinged lanes during mid-render Suspense retries.
- 1a48756: Add RSC partial navigation patch handling and supporting SSR build updates, plus benchmark harness improvements for validating production behavior.
- 1a48756: Separate `field.secret` from `field.hidden` so secret fields are excluded from default server reads and only returned through explicit projections.
- 4fc2673: Fix SSR hydration path seeding so route-aware links render consistently between server and client.

## 2.2.12

### Patch Changes

- 666e46c: Improve SSR hydration payload handling, redirect status propagation, and restore dev HMR incremental refresh behavior.
- 666e46c: Align RSC not-found responses with HTTP 404 semantics and add request-scoped policy tracking for future cache decisions.

## 2.2.11

### Patch Changes

- 8190632: Add Akan server console support with CLI/build integration and documentation for console-oriented workflows.
- 4bce7f9: Add initial LLM discovery docs and stabilize Akan client/runtime behavior.

  - Add `/llms.txt` documentation discovery for Akan docs.
  - Add `wsConnect` support for automatic WebSocket connections.
  - Delay client bootstrap module execution until the SSR fizz stream is ready.
  - Improve route tree, HMR, fetch, store, and SSR/client runtime stability.

## 2.2.7

### Patch Changes

- bf51564: fix: base dictionary translation failed in some cases
- bf51564: fix: file upload contract workaround on shared Field.Img component

## 2.2.5

### Patch Changes

- d636456: add rich Map methods on memory() helper service
- a1ee4e8: fill nested constant defaults for arrays on document save and load, normalize date fields to a consistent epoch representation on store (accepting legacy ISO-string values on read), and correct falsy defaults in getDefault
- 5cdb05e: reverse dependency of file upload api
- a7da50e: remove dependency from radix dialog

## 2.2.3

### Patch Changes

- 587cc68: fix dictionary loading
- 587cc68: fix fetchClient for setting origin with clone or fetchPolicy

## 2.2.0

### Minor Changes

- cb5b07a: enable custom not found and error render on \_layout.tsx files
- 258284e: initial js bundle size is optimized as single language dictionary on ssr
