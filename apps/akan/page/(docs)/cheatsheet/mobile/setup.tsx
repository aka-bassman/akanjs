import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, ExternalLink, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const stepList = "my-4 list-decimal space-y-2 pl-5";
  const inlineLink = "text-primary underline underline-offset-4 hover:no-underline";

  const termRows = [
    {
      name: "Capacitor",
      desc: l.trans({
        en: "The native shell that runs your web app in a WebView and reaches device APIs through plugins.",
        ko: "웹 앱을 WebView 안에서 실행하고, 플러그인으로 기기 기능을 쓰게 해 주는 네이티브 셸입니다.",
      }),
    },
    {
      name: l.trans({ en: "CSR bundle", ko: "CSR 번들" }),
      desc: l.trans({
        en: "The single-page build of your app. The native app ships it, so keep `web.csr` on.",
        ko: "앱을 한 페이지짜리 웹 앱으로 빌드한 결과물입니다. 네이티브 앱에 이 번들이 들어가므로 `web.csr`을 끄면 안 됩니다.",
      }),
    },
    {
      name: "target",
      desc: l.trans({
        en: "One native app built from your Akan app. Its key in `mobile.targets` is the `--target` value.",
        ko: "Akan 앱 하나에서 만드는 네이티브 앱 하나입니다. `mobile.targets`의 키가 곧 `--target`에 넘기는 값입니다.",
      }),
    },
    {
      name: "appId",
      desc: l.trans({
        en: "The app's permanent ID: the package name on Android and the bundle ID on iOS.",
        ko: "앱의 고정 ID입니다. Android에서는 package name, iOS에서는 bundle ID가 됩니다.",
      }),
    },
    {
      name: ["android/", "ios/"],
      desc: l.trans({
        en: "The Android Studio and Xcode projects, created inside the app folder on the first run.",
        ko: "첫 실행 때 앱 폴더 안에 만들어지는 Android Studio 프로젝트와 Xcode 프로젝트입니다.",
      }),
    },
    {
      name: l.trans({ en: "plugin", ko: "플러그인" }),
      desc: l.trans({
        en: "A native module such as camera or push. It works only when the app's `package.json` lists it.",
        ko: "카메라, 푸시 같은 네이티브 모듈입니다. 앱의 `package.json`에 적혀 있어야 동작합니다.",
      }),
    },
  ];

  const flowCards = [
    {
      title: l.trans({ en: "1. Mobile config", ko: "1. mobile 설정" }),
      desc: l.trans({
        en: (
          <span>
            Name the app, fix its <code>appId</code>, and choose targets and permissions in <code>akan.config.ts</code>.
          </span>
        ),
        ko: (
          <span>
            <code>akan.config.ts</code>에서 앱 이름과 <code>appId</code>를 정하고, target과 권한을 고릅니다.
          </span>
        ),
      }),
    },
    {
      title: l.trans({ en: "2. Capacitor plugins", ko: "2. Capacitor 플러그인" }),
      desc: l.trans({
        en: (
          <span>
            List the native plugins the app uses in its own <code>package.json</code>.
          </span>
        ),
        ko: (
          <span>
            앱이 쓰는 네이티브 플러그인을 앱의 <code>package.json</code>에 적습니다.
          </span>
        ),
      }),
    },
    {
      title: "3. Android · iOS",
      desc: l.trans({
        en: "Install the toolchains, run the app on a device, then set up signing and store builds.",
        ko: "개발 도구를 설치하고 기기에서 앱을 띄운 뒤, 서명과 스토어 빌드를 준비합니다.",
      }),
    },
    {
      title: l.trans({ en: "4. Verify", ko: "4. 확인" }),
      desc: l.trans({
        en: "Check each feature on a real device instead of stopping at a green build.",
        ko: "빌드 성공에서 멈추지 말고, 실제 기기에서 기능을 하나씩 확인합니다.",
      }),
    },
  ];

  const mobileFields = [
    {
      key: "appName",
      type: "string",
      default: l.trans({ en: "app name", ko: "앱 이름" }),
      desc: l.trans({
        en: "Name under the home-screen icon. A store listing may show a different name.",
        ko: "홈 화면 아이콘 아래에 보이는 이름입니다. 스토어 목록에는 다른 이름이 보일 수 있습니다.",
      }),
    },
    {
      key: "appId",
      type: "string",
      default: "com.<repo>.<app>",
      desc: l.trans({
        en: "Android package name and iOS bundle ID. Console and Firebase registrations must match it.",
        ko: "Android package name이자 iOS bundle ID입니다. 스토어 콘솔과 Firebase에 등록할 때도 똑같이 씁니다.",
      }),
    },
    {
      key: "version",
      type: "string",
      default: "0.0.1",
      desc: l.trans({
        en: "The version users see: Android `versionName` and iOS `MARKETING_VERSION`.",
        ko: "사용자에게 보이는 버전입니다. Android `versionName`과 iOS `MARKETING_VERSION`에 들어갑니다.",
      }),
    },
    {
      key: "buildNum",
      type: "number",
      default: "1",
      desc: l.trans({
        en: "Store build number: Android `versionCode`, iOS build. Raise it for every store upload.",
        ko: "스토어 빌드 번호입니다. Android `versionCode`와 iOS build에 들어가며, 스토어에 올릴 때마다 올립니다.",
      }),
    },
    {
      key: "targets",
      type: "Record<string, Target>",
      default: "{ default: {} }",
      desc: l.trans({
        en: "One entry per native app. The key is the name `--target` takes.",
        ko: "네이티브 앱마다 항목 하나입니다. 키가 곧 `--target`에 넘기는 이름입니다.",
      }),
    },
    {
      key: "targets.*.permissions",
      type: "MobilePermission[]",
      desc: l.trans({
        en: "Device features to prepare. Only `camera`, `contacts`, `location`, `push` and `speech` exist.",
        ko: "준비할 기기 기능입니다. `camera`, `contacts`, `location`, `push`, `speech` 다섯 가지뿐입니다.",
      }),
    },
    {
      key: "targets.*.indexPath",
      type: "string",
      default: "/",
      desc: l.trans({
        en: "Home route. A deep link opens on top of it, and Android back returns to it before exiting.",
        ko: "앱의 홈 route입니다. 딥링크는 그 위에 열리고, Android 뒤로 가기는 앱을 닫기 전에 여기로 돌아옵니다.",
      }),
    },
    {
      key: "targets.*.basePath",
      type: "string",
      desc: l.trans({
        en: "The client to open in a multi-client app. It must be a `basePath` declared in `routes`.",
        ko: "다중 클라이언트 앱에서 열 클라이언트입니다. `routes`에 선언한 `basePath`여야 합니다.",
      }),
    },
    {
      key: "targets.*.files",
      type: "{ ios?, android? }",
      desc: l.trans({
        en: "Copies app files into the native project. Key: a path in `ios/` or `android/`. Value: the source.",
        ko: "앱 파일을 네이티브 프로젝트로 복사합니다. 키는 `ios/`·`android/` 안의 경로, 값은 원본 경로입니다.",
      }),
    },
    {
      key: "targets.*.appId",
      type: "string",
      desc: l.trans({
        en: "Per-target override, like `appName`, `version`, `buildNum`. A different `appId` is a separate app.",
        ko: "`appName`, `version`, `buildNum`처럼 target별로 루트 값을 덮어씁니다. `appId`가 다르면 별개의 앱입니다.",
      }),
    },
  ];

  const permissionRows = [
    {
      permission: "camera",
      ios: l.trans({ en: "Camera and photo library usage text", ko: "카메라·사진 보관함 사용 안내 문구" }),
      android: l.trans({
        en: "`READ_MEDIA_IMAGES`, storage read and write",
        ko: "`READ_MEDIA_IMAGES`, 저장소 읽기·쓰기",
      }),
    },
    {
      permission: "contacts",
      ios: l.trans({ en: "Contacts usage text", ko: "연락처 사용 안내 문구" }),
      android: "`READ_CONTACTS`, `WRITE_CONTACTS`",
    },
    {
      permission: "location",
      ios: l.trans({
        en: "Location usage text, for always and while in use",
        ko: "위치 사용 안내 문구 (항상 / 사용 중)",
      }),
      android: "`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, GPS",
    },
    {
      permission: "push",
      ios: l.trans({
        en: "Remote-notification background mode, `aps-environment`, Firebase in `AppDelegate`",
        ko: "원격 알림 백그라운드 모드, `aps-environment`, `AppDelegate`의 Firebase 연결",
      }),
      android: "`POST_NOTIFICATIONS`",
    },
    {
      permission: "speech",
      ios: l.trans({ en: "Speech recognition and microphone usage text", ko: "음성 인식·마이크 사용 안내 문구" }),
      android: "`RECORD_AUDIO`",
    },
  ];

  const configPitfalls = [
    l.trans({
      en: (
        <>
          <strong>Pick a real appId.</strong> IDs with a segment like <code>example</code>, <code>myapp</code> or{" "}
          <code>test</code> are usually taken on Apple's portal, so phone signing fails. <code>akan doctor --ios</code>{" "}
          flags them.
        </>
      ),
      ko: (
        <>
          <strong>실제 appId를 쓰세요.</strong> <code>example</code>, <code>myapp</code>, <code>test</code> 같은 단어가
          들어간 ID는 Apple 포털에서 대개 이미 쓰이고 있어 실기기 서명이 실패합니다. <code>akan doctor --ios</code>가
          이런 ID를 짚어 줍니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Keep the CSR bundle on.</strong> The native app ships it, so <code>{"web: { csr: false }"}</code>{" "}
          cannot sit next to a <code>mobile</code> block.
        </>
      ),
      ko: (
        <>
          <strong>CSR 번들을 켜 두세요.</strong> 네이티브 앱에 이 번들이 들어가므로 <code>{"web: { csr: false }"}</code>
          와 <code>mobile</code> 블록은 함께 쓸 수 없습니다.
        </>
      ),
    }),
  ];

  const pluginColumns = [
    { key: "auto", label: l.trans({ en: "Added for you", ko: "자동 추가" }), caption: "start-*" },
    { key: "manual", label: l.trans({ en: "Add by hand", ko: "직접 추가" }) },
  ];
  const auto = { auto: true, manual: false };
  const manual = { auto: false, manual: true };

  const pluginGroups = [
    {
      label: l.trans({ en: "Used by the app shell itself", ko: "앱 셸이 직접 쓰는 것" }),
      rows: [
        {
          name: "@capacitor/core",
          desc: l.trans({ en: "The Capacitor runtime itself.", ko: "Capacitor 런타임 자체입니다." }),
          marks: auto,
        },
        {
          name: "@capacitor/app",
          desc: l.trans({
            en: "Android back button, deep-link events and app exit.",
            ko: "Android 뒤로 가기, 딥링크 이벤트, 앱 종료를 다룹니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/device",
          desc: l.trans({
            en: "Reads the platform and device language at startup.",
            ko: "시작할 때 플랫폼과 기기 언어를 읽습니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/keyboard",
          desc: l.trans({
            en: "Reports the keyboard height so the screen can move with it.",
            ko: "키보드 높이를 알려 주어 화면이 따라 움직이게 합니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/haptics",
          desc: l.trans({ en: "Haptic feedback, loaded at startup.", ko: "진동 피드백이며, 시작할 때 불러옵니다." }),
          marks: auto,
        },
        {
          name: "capacitor-plugin-safe-area",
          desc: l.trans({
            en: "Reads the notch and home-indicator insets at startup.",
            ko: "시작할 때 노치와 홈 인디케이터 영역을 읽습니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/preferences",
          desc: l.trans({
            en: "On-device storage, where the sign-in token is kept.",
            ko: "기기 저장소이며, 로그인 토큰을 여기에 둡니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/browser",
          desc: l.trans({
            en: "Opens an external `Link` in the system browser.",
            ko: "`Link`의 외부 주소를 시스템 브라우저로 엽니다.",
          }),
          marks: auto,
        },
      ],
    },
    {
      label: l.trans({ en: "Per feature", ko: "기능별" }),
      rows: [
        {
          name: "@capacitor/camera",
          desc: l.trans({
            en: "Camera and photo picker. Pair with `camera`.",
            ko: "카메라와 사진 선택입니다. `camera`와 짝입니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/geolocation",
          desc: l.trans({
            en: "Current location. Pair with `location`.",
            ko: "현재 위치입니다. `location`과 짝입니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/push-notifications",
          desc: l.trans({
            en: "The OS push bridge. Pair with `push`.",
            ko: "OS 푸시 브리지입니다. `push`와 짝입니다.",
          }),
          marks: auto,
        },
        {
          name: "@capacitor/inappbrowser",
          desc: l.trans({ en: "Shows web pages inside the app.", ko: "앱 안에서 웹 페이지를 띄웁니다." }),
          marks: auto,
        },
        {
          name: "@capacitor-community/fcm",
          desc: l.trans({
            en: "The FCM token for native push. Pair with `push`.",
            ko: "네이티브 푸시용 FCM 토큰입니다. `push`와 짝입니다.",
          }),
          marks: manual,
        },
        {
          name: "@capacitor-community/contacts",
          desc: l.trans({
            en: "Address book access. Pair with `contacts`.",
            ko: "연락처 접근입니다. `contacts`와 짝입니다.",
          }),
          marks: manual,
        },
        {
          name: "@capacitor-community/speech-recognition",
          desc: l.trans({ en: "Voice input. Pair with `speech`.", ko: "음성 입력입니다. `speech`와 짝입니다." }),
          marks: manual,
        },
        {
          name: "@capacitor-community/text-to-speech",
          desc: l.trans({ en: "Spoken output. Pair with `speech`.", ko: "음성 출력입니다. `speech`와 짝입니다." }),
          marks: manual,
        },
      ],
    },
  ];

  const pluginNotes = [
    l.trans({
      en: (
        <>
          <strong>
            Why <code>*</code>.
          </strong>{" "}
          The app declares only that it uses a plugin. The workspace root and its lockfile pin the version.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>*</code>를 쓰는 이유.
          </strong>{" "}
          앱은 플러그인을 쓴다는 사실만 선언합니다. 실제 버전은 워크스페이스 루트와 lockfile이 정합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Small bridges need nothing else.</strong> Plugins such as haptics or device work once listed and
          synced.
        </>
      ),
      ko: (
        <>
          <strong>작은 브리지는 이것으로 끝입니다.</strong> haptics, device 같은 플러그인은 적고 sync하면 바로
          동작합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Device features need native settings too.</strong> Camera, contacts, location, push and speech take
          their <code>permissions</code> entry. Background work, file access or sign-in SDKs may need Info.plist,
          AndroidManifest, Xcode capability, Gradle or console credentials, per the plugin's docs.
        </>
      ),
      ko: (
        <>
          <strong>기기 기능은 네이티브 설정도 필요합니다.</strong> 카메라, 연락처, 위치, 푸시, 음성은{" "}
          <code>permissions</code>에 이름을 적습니다. 백그라운드 작업, 파일 접근, 로그인 SDK는 플러그인 문서에 따라
          Info.plist, AndroidManifest, Xcode capability, Gradle, 콘솔 인증 정보가 필요할 수 있습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Rerun after a change.</strong> After adding or removing a plugin, run <code>start-ios</code>,{" "}
          <code>start-android</code> or a build command again so Capacitor relinks it.
        </>
      ),
      ko: (
        <>
          <strong>바꾼 뒤에는 다시 실행하세요.</strong> 플러그인을 추가하거나 뺀 뒤에는 <code>start-ios</code>,{" "}
          <code>start-android</code>, 빌드 명령 중 하나를 다시 실행해야 Capacitor가 다시 링크합니다.
        </>
      ),
    }),
  ];

  const androidCommandRows = [
    {
      command: "start-android",
      env: "local",
      result: l.trans({
        en: "Runs on an emulator or phone. `--release` ships the web build instead of the dev server.",
        ko: "에뮬레이터나 폰에서 실행합니다. `--release`를 주면 개발 서버 대신 웹 빌드를 넣습니다.",
      }),
    },
    {
      command: "build-android",
      env: "debug",
      result: l.trans({
        en: "A release APK, to check that the project builds.",
        ko: "프로젝트가 빌드되는지 확인하는 릴리스 APK를 만듭니다.",
      }),
    },
    {
      command: "release-android",
      env: "main",
      result: l.trans({
        en: "An APK or an AAB (`--assemble-type`) for the Play Store.",
        ko: "Play Store용 APK나 AAB(`--assemble-type`)를 만듭니다.",
      }),
    },
  ];

  const iosCommandRows = [
    {
      command: "start-ios",
      env: "local",
      result: l.trans({
        en: "Runs on a simulator or phone. `--release` ships the web build instead of the dev server.",
        ko: "시뮬레이터나 폰에서 실행합니다. `--release`를 주면 개발 서버 대신 웹 빌드를 넣습니다.",
      }),
    },
    {
      command: "build-ios",
      env: "debug",
      result: l.trans({
        en: "Builds the iOS app with Capacitor, to check that the project builds.",
        ko: "Capacitor로 iOS 앱을 빌드해, 프로젝트가 빌드되는지 확인합니다.",
      }),
    },
    {
      command: "release-ios",
      env: "main",
      result: l.trans({
        en: "The same build against the `main` backend, for an App Store release.",
        ko: "같은 빌드를 `main` 백엔드로 만들어 App Store에 냅니다.",
      }),
    },
  ];

  const commandColumns = [
    { key: "command", label: l.trans({ en: "Command", ko: "명령" }), code: true },
    { key: "env", label: l.trans({ en: "Default --env", ko: "기본 --env" }), code: true },
    { key: "result", label: l.trans({ en: "What you get", ko: "결과" }) },
  ];

  const commandFlags = [
    {
      key: "--target",
      type: "string",
      desc: l.trans({
        en: "A key of `mobile.targets`, or `all`. With a single target it is picked for you.",
        ko: "`mobile.targets`의 키나 `all`입니다. target이 하나뿐이면 자동으로 고릅니다.",
      }),
    },
    {
      key: "--env",
      type: "local | debug | develop | main",
      desc: l.trans({
        en: "The backend the app talks to. The default differs per command, as in the table above.",
        ko: "앱이 연결할 백엔드 환경입니다. 기본값은 위 표처럼 명령마다 다릅니다.",
      }),
    },
    {
      key: "--release",
      type: "boolean",
      default: "false",
      tags: ["start-*"],
      desc: l.trans({
        en: "Run a bundled web build, so no dev server is needed.",
        ko: "웹 빌드를 앱에 넣어 실행하므로 개발 서버가 필요 없습니다.",
      }),
    },
    {
      key: "--open",
      type: "boolean",
      default: "false",
      tags: ["start-*"],
      desc: l.trans({
        en: "Also open the native project in Android Studio or Xcode.",
        ko: "네이티브 프로젝트를 Android Studio나 Xcode로도 엽니다.",
      }),
    },
    {
      key: "-g, --regenerate",
      type: "boolean",
      default: "false",
      desc: l.trans({
        en: "Delete and recreate the native project. Hand edits in `android/` or `ios/` are lost.",
        ko: "네이티브 프로젝트를 지우고 다시 만듭니다. `android/`·`ios/`에서 직접 고친 내용은 사라집니다.",
      }),
    },
    {
      key: "--assemble-type",
      type: "apk | aab",
      default: "apk",
      tags: ["release-android"],
      desc: l.trans({
        en: "`aab` for a Play Store upload, `apk` to install the file directly.",
        ko: "`aab`는 Play Store 업로드용, `apk`는 파일을 직접 설치할 때 씁니다.",
      }),
    },
    {
      key: "-l, --allow-local-release",
      type: "boolean",
      default: "false",
      tags: ["release-*"],
      desc: l.trans({
        en: "Allow `--env local` in a release build. For local testing only.",
        ko: "릴리스 빌드에서 `--env local`을 허용합니다. 로컬 테스트용입니다.",
      }),
    },
  ];

  const signingNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>MYAPP_RELEASE_STORE_FILE</code> is relative to <code>android/app</code>.
          </strong>{" "}
          Keep the keystore itself out of <code>public/</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>MYAPP_RELEASE_STORE_FILE</code>은 <code>android/app</code> 기준 경로입니다.
          </strong>{" "}
          keystore 파일은 <code>public/</code>에 두지 마세요.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Keep passwords out of git.</strong> In CI, set the same four names as environment variables with the{" "}
          <code>ORG_GRADLE_PROJECT_</code> prefix instead.
        </>
      ),
      ko: (
        <>
          <strong>비밀번호는 git에 올리지 마세요.</strong> CI에서는 같은 네 이름 앞에 <code>ORG_GRADLE_PROJECT_</code>를
          붙여 환경 변수로 넣습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Where the file lands.</strong> <code>apps/myapp/android/app/build/outputs/apk/release</code> or{" "}
          <code>…/bundle/release</code>. <code>release-android</code> prints the path.
        </>
      ),
      ko: (
        <>
          <strong>결과물 위치.</strong> <code>apps/myapp/android/app/build/outputs/apk/release</code>나{" "}
          <code>…/bundle/release</code>에 생기며, <code>release-android</code>가 경로를 출력합니다.
        </>
      ),
    }),
  ];

  const xcodeChecks = [
    l.trans({
      en: (
        <>
          Open the generated project, <code>apps/myapp/ios/App</code>, after the first run (or pass <code>--open</code>
          ).
        </>
      ),
      ko: (
        <>
          첫 실행 뒤 생성된 프로젝트 <code>apps/myapp/ios/App</code>을 엽니다. <code>--open</code>을 줘도 됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          Check that the Bundle Identifier matches <code>mobile.appId</code>.
        </>
      ),
      ko: (
        <>
          Bundle Identifier가 <code>mobile.appId</code>와 같은지 확인합니다.
        </>
      ),
    }),
    l.trans({
      en: "For a phone, pick your team under Signing & Capabilities and check provisioning.",
      ko: "폰에서 실행한다면 Signing & Capabilities에서 팀을 고르고 provisioning을 확인합니다.",
    }),
    l.trans({
      en: "Run on a simulator first, then move to a phone for device-only features.",
      ko: "먼저 시뮬레이터에서 실행하고, 기기 전용 기능은 폰으로 옮겨 확인합니다.",
    }),
  ];

  const iosNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>--device</code> skips the question.
          </strong>{" "}
          It takes a UDID, a device name, or a runtime such as <code>iOS 18</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>--device</code>를 주면 묻지 않습니다.
          </strong>{" "}
          UDID, 기기 이름, <code>iOS 18</code> 같은 런타임을 받습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Xcode makes the profile for you.</strong> A phone run passes <code>-allowProvisioningUpdates</code>,
          so once a team is set, Xcode creates the provisioning profile.
        </>
      ),
      ko: (
        <>
          <strong>프로필은 Xcode가 만듭니다.</strong> 폰 실행에는 <code>-allowProvisioningUpdates</code>가 붙으므로,
          팀만 정하면 Xcode가 provisioning profile을 만듭니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>"cannot be registered to your development team".</strong> Someone already owns that bundle ID. Change{" "}
          <code>mobile.appId</code> to a unique one.
        </>
      ),
      ko: (
        <>
          <strong>"cannot be registered to your development team".</strong> 그 bundle ID를 이미 누군가 쓰고 있다는
          뜻입니다. <code>mobile.appId</code>를 고유한 값으로 바꿉니다.
        </>
      ),
    }),
  ];

  const symptomRows = [
    {
      symptom: '`Capacitor plugin "Camera" is not available.`',
      check: l.trans({
        en: "Add the plugin to `apps/myapp/package.json`, then rerun `start-ios` or `start-android`.",
        ko: "`apps/myapp/package.json`에 플러그인을 적고 `start-ios`나 `start-android`를 다시 실행합니다.",
      }),
    },
    {
      symptom: l.trans({ en: "Blank screen on a phone", ko: "폰에서 빈 화면만 보임" }),
      check: l.trans({
        en: "The phone cannot reach your dev server. Use the same Wi-Fi, or set `AKAN_PUBLIC_CLIENT_HOST=<ip>`.",
        ko: "폰이 개발 서버에 닿지 못합니다. 같은 Wi-Fi를 쓰거나 `AKAN_PUBLIC_CLIENT_HOST=<ip>`를 지정합니다.",
      }),
    },
    {
      symptom: l.trans({
        en: "No permission prompt, or an iOS crash on first use",
        ko: "권한 창이 뜨지 않거나, iOS에서 처음 쓸 때 앱이 꺼짐",
      }),
      check: l.trans({
        en: "Add the feature to `permissions` and rerun, so the native entries are written.",
        ko: "`permissions`에 기능을 적고 다시 실행해, 네이티브 설정이 들어가게 합니다.",
      }),
    },
    {
      symptom: l.trans({ en: "A native file is missing", ko: "네이티브 파일이 없음" }),
      check: l.trans({
        en: "A `files` key is a path inside `android/` or `ios/`, not inside the app folder.",
        ko: "`files`의 키는 앱 폴더가 아니라 `android/`·`ios/` 안의 경로입니다.",
      }),
    },
    {
      symptom: l.trans({ en: "A notification tap opens the wrong screen", ko: "알림을 누르면 엉뚱한 화면이 열림" }),
      check: l.trans({
        en: 'Send `url: "/some/path"` in the data and check that the tap opens that CSR route.',
        ko: '데이터에 `url: "/some/path"`를 넣어 보내고, 누르면 그 CSR route가 열리는지 확인합니다.',
      }),
    },
  ];

  const pushChecks = [
    {
      title: l.trans({ en: "Android push", ko: "Android 푸시" }),
      items: [
        l.trans({
          en: "The package name matches the Android app registered in Firebase.",
          ko: "package name이 Firebase에 등록한 Android 앱과 같습니다.",
        }),
        l.trans({
          en: (
            <>
              <code>app/google-services.json</code> exists: the Google Services Gradle plugin applies only then.
            </>
          ),
          ko: (
            <>
              <code>app/google-services.json</code>이 있습니다. Google Services Gradle 플러그인은 이 파일이 있을 때만
              적용됩니다.
            </>
          ),
        }),
        l.trans({
          en: "The notification permission is granted on the phone.",
          ko: "폰에서 알림 권한을 허용했습니다.",
        }),
        l.trans({
          en: "The Firebase project is the one the server sends with.",
          ko: "Firebase 프로젝트가 서버가 발송에 쓰는 프로젝트와 같습니다.",
        }),
      ],
    },
    {
      title: l.trans({ en: "iOS push", ko: "iOS 푸시" }),
      items: [
        l.trans({ en: "You test on a real device.", ko: "실기기에서 테스트합니다." }),
        l.trans({
          en: (
            <>
              <code>aps-environment</code> is <code>development</code> on a dev-server run, and <code>production</code>{" "}
              with <code>--release</code> or a build command.
            </>
          ),
          ko: (
            <>
              <code>aps-environment</code>가 개발 서버 실행에서는 <code>development</code>, <code>--release</code>나
              빌드 명령에서는 <code>production</code>입니다.
            </>
          ),
        }),
        l.trans({
          en: "The APNs key is uploaded to Firebase, and the provisioning profile allows push.",
          ko: "APNs 키를 Firebase에 올렸고, provisioning profile이 푸시를 허용합니다.",
        }),
        l.trans({
          en: (
            <>
              <code>GoogleService-Info.plist</code> is a member of the App target.
            </>
          ),
          ko: (
            <>
              <code>GoogleService-Info.plist</code>가 App 타깃에 포함되어 있습니다.
            </>
          ),
        }),
      ],
    },
  ];

  const nextLinks = [
    {
      href: "/cheatsheet/mobile/push",
      title: l.trans({ en: "Push Notifications", ko: "푸시 알림" }),
      desc: l.trans({
        en: "Firebase, APNs and the client API, per platform.",
        ko: "플랫폼별 Firebase, APNs 설정과 클라이언트 API입니다.",
      }),
    },
    {
      href: "/cheatsheet/mobile/links",
      title: l.trans({ en: "Deep Links", ko: "딥링크" }),
      desc: l.trans({
        en: "Custom URL schemes and verified HTTPS app links.",
        ko: "커스텀 URL scheme과 검증된 HTTPS 앱 링크입니다.",
      }),
    },
    {
      href: "/docs/core/config#mobile",
      title: l.trans({ en: "Every Mobile Field", ko: "mobile 필드 전체" }),
      desc: l.trans({
        en: "Icons, splash images and passthrough Capacitor config.",
        ko: "아이콘, 스플래시 이미지, Capacitor 설정 전달까지 모두 봅니다.",
      }),
    },
    {
      href: "/references/cli/application",
      title: l.trans({ en: "CLI Reference", ko: "CLI 레퍼런스" }),
      desc: l.trans({
        en: "Every flag of the mobile commands.",
        ko: "모바일 명령의 모든 플래그입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Mobile Setup Flow", ko: "모바일 설정 흐름" })}>
        <Docs.Title>{l.trans({ en: "Mobile Setup Flow", ko: "모바일 설정 흐름" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "An Akan mobile app is your CSR web app running inside a Capacitor shell for Android and iOS. The web app owns the pages and business logic. The shell owns the package ID, device permissions, plugin linking, native files, signing and store builds.",
              ko: "Akan 모바일 앱은 CSR 웹 앱을 Android·iOS용 Capacitor 셸 안에서 실행한 것입니다. 페이지와 비즈니스 로직은 웹 앱이 맡습니다. 패키지 ID, 기기 권한, 플러그인 연결, 네이티브 파일, 서명, 스토어 빌드는 셸이 맡습니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>{l.trans({ en: "Four steps", ko: "네 단계" })}</Docs.SubSubTitle>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {flowCards.map(({ title, desc }, idx) => (
              <div key={idx} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{title}</div>
                <div className="mt-1 text-foreground/70 text-sm">{desc}</div>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "Push notifications and deep links are optional. Set them up after this page, and only if the app needs them.",
              ko: "푸시 알림과 딥링크는 선택 기능입니다. 이 페이지를 끝낸 뒤, 앱에 필요할 때만 설정하세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="mobile-config" title={l.trans({ en: "Mobile Config", ko: "mobile 설정" })}>
        <Docs.Title>{l.trans({ en: "Mobile Config", ko: "mobile 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The <code>mobile</code> block in <code>akan.config.ts</code> describes the native app: its name, ID,
                  version and targets. Values at the <code>mobile</code> root apply to every target, and a target
                  overrides the ones it sets.
                </span>
              ),
              ko: (
                <span>
                  <code>akan.config.ts</code>의 <code>mobile</code> 블록이 네이티브 앱의 이름, ID, 버전, target을
                  정합니다. <code>mobile</code> 루트의 값은 모든 target의 기본값이고, target이 직접 적은 값이 그 위를
                  덮습니다.
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/akan.config.ts"
            code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  mobile: {
    appName: "Acme Shop",
    appId: "com.acme.shop",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      default: {
        permissions: ["camera"],
      },
    },
  },
};

export default config;`}
          />
          <Docs.OptionTable items={mobileFields} />
          <div>
            {l.trans({
              en: (
                <span>
                  Icons, splash images and deep links are also target fields; see{" "}
                  <Link href="/docs/core/config#mobile" className={inlineLink}>
                    Config
                  </Link>{" "}
                  and{" "}
                  <Link href="/cheatsheet/mobile/links" className={inlineLink}>
                    Deep Links
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  아이콘, 스플래시 이미지, 딥링크도 target 필드입니다.{" "}
                  <Link href="/docs/core/config#mobile" className={inlineLink}>
                    설정
                  </Link>
                  과{" "}
                  <Link href="/cheatsheet/mobile/links" className={inlineLink}>
                    딥링크
                  </Link>{" "}
                  문서를 보세요.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "What each permission adds", ko: "권한마다 들어가는 네이티브 설정" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A permission writes that feature's native settings on the next run. It does not install the plugin; that is the next section.",
              ko: "권한을 적으면 다음 실행 때 그 기능의 네이티브 설정이 들어갑니다. 플러그인은 따로 설치하며, 다음 섹션에서 다룹니다.",
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "permission", label: l.trans({ en: "Permission", ko: "권한" }), code: true },
              { key: "android", label: "Android" },
              { key: "ios", label: "iOS" },
            ]}
            rows={permissionRows}
          />

          <Docs.SubSubTitle>
            {l.trans({ en: "Several native apps from one app", ko: "앱 하나로 네이티브 앱 여러 개 만들기" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  When one repo ships separate customer, admin or partner apps, split the clients with{" "}
                  <code>basePath</code> and give each its own target. A target that sets its own <code>appId</code> is a
                  separate store app:
                </span>
              ),
              ko: (
                <span>
                  한 저장소에서 고객용, 관리자용, 파트너용 앱을 따로 낸다면 <code>basePath</code>로 클라이언트를 나누고
                  target도 하나씩 둡니다. <code>appId</code>를 따로 정한 target은 별개의 스토어 앱이 됩니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/akan.config.ts"
            code={`const config: AppConfig = {
  routes: [
    { basePath: "shop", domains: { main: ["shop.acme.com"] } },
    { basePath: "partner", domains: { main: ["partner.acme.com"] } },
  ],
  mobile: {
    appName: "Acme Shop",
    appId: "com.acme.shop",
    version: "1.0.0",
    buildNum: 1,
    targets: {
      shop: { basePath: "shop" },
      partner: {
        basePath: "partner",
        appName: "Acme Partner",
        appId: "com.acme.partner",
      },
    },
  },
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <>
                    <strong>
                      <code>basePath</code> must exist in <code>routes</code>.
                    </strong>{" "}
                    Declare the client first; the{" "}
                    <Link href="/docs/core/multi-client" className={inlineLink}>
                      Multi Client
                    </Link>{" "}
                    page shows how.
                  </>
                ),
                ko: (
                  <>
                    <strong>
                      <code>basePath</code>는 <code>routes</code>에 있어야 합니다.
                    </strong>{" "}
                    클라이언트를 먼저 선언하세요. 방법은{" "}
                    <Link href="/docs/core/multi-client" className={inlineLink}>
                      다중 클라이언트
                    </Link>{" "}
                    문서에 있습니다.
                  </>
                ),
              })}
            </li>
            {configPitfalls.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Never change appId after release.</strong> Android and iOS treat a different{" "}
                  <code>appId</code> as a different app.
                </span>
              ),
              ko: (
                <span>
                  <strong>출시한 뒤에는 appId를 바꾸지 마세요.</strong> Android와 iOS는 <code>appId</code>가 다르면
                  완전히 다른 앱으로 봅니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="capacitor-plugins" title={l.trans({ en: "Capacitor Plugins", ko: "Capacitor 플러그인" })}>
        <Docs.Title>{l.trans({ en: "Capacitor Plugins", ko: "Capacitor 플러그인" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Capacitor links a native plugin only when <code>apps/myapp/package.json</code> lists it; a dependency
                  at the workspace root is not enough. <code>akan start-ios</code> and <code>akan start-android</code>{" "}
                  add the default set for you, and offer to install the Capacitor toolchain at the workspace root.
                </span>
              ),
              ko: (
                <span>
                  Capacitor는 <code>apps/myapp/package.json</code>에 적힌 네이티브 플러그인만 링크합니다. 워크스페이스
                  루트에만 있으면 부족합니다. <code>akan start-ios</code>와 <code>akan start-android</code>가 기본
                  플러그인을 알아서 채우고, 워크스페이스 루트에 Capacitor 도구가 없으면 설치할지 묻습니다.
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Package", ko: "패키지" })}
            columns={pluginColumns}
            groups={pluginGroups}
            markLabel={l.trans({ en: "Yes", ko: "해당" })}
            emptyLabel={l.trans({ en: "No", ko: "해당 없음" })}
          />
          <div>
            {l.trans({
              en: "Beyond the default set, add only the plugins the app actually calls. Native push, for example, needs the FCM plugin next to the push plugin:",
              ko: "기본 묶음 밖의 플러그인은 앱이 실제로 호출하는 것만 넣습니다. 예를 들어 네이티브 푸시에는 푸시 플러그인 옆에 FCM 플러그인이 필요합니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/package.json"
            language="json"
            code={`{
  "dependencies": {
    "@capacitor/push-notifications": "*",
    "@capacitor-community/fcm": "*"
  }
}`}
          />
          <ul className={bulletList}>
            {pluginNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Only start-ios and start-android fill in the default set.</strong> <code>build-*</code> and{" "}
                  <code>release-*</code> add nothing, so commit the <code>package.json</code> change before a CI machine
                  builds the app.
                </span>
              ),
              ko: (
                <span>
                  <strong>기본 묶음은 start-ios와 start-android만 채웁니다.</strong> <code>build-*</code>와{" "}
                  <code>release-*</code>는 아무것도 추가하지 않으므로, CI가 빌드하기 전에 바뀐 <code>package.json</code>
                  을 커밋해 두세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="android-setup" title={l.trans({ en: "Android Setup", ko: "Android 설정" })}>
        <Docs.Title>{l.trans({ en: "Android Setup", ko: "Android 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  This gets the generated Android project running on an emulator or a phone. Keep one value consistent:{" "}
                  <code>mobile.appId</code> becomes the Android <code>applicationId</code>.
                </span>
              ),
              ko: (
                <span>
                  생성된 Android 프로젝트를 에뮬레이터나 폰에서 띄우는 과정입니다. 꼭 맞춰야 할 값은 하나입니다.{" "}
                  <code>mobile.appId</code>가 Android의 <code>applicationId</code>가 됩니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Prerequisites", ko: "준비물" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({ en: "Android Studio with the Android SDK.", ko: "Android SDK가 설치된 Android Studio." })}
              <ExternalLink
                href="https://developer.android.com/studio"
                label={l.trans({ en: "Open the Android Studio download", ko: "Android Studio 다운로드 열기" })}
              />
            </li>
            <li>
              {l.trans({ en: "JDK 21, reachable from your shell.", ko: "터미널에서 쓸 수 있는 JDK 21." })}
              <ExternalLink
                href="https://formulae.brew.sh/formula/openjdk@21"
                label={l.trans({ en: "Open Homebrew openjdk@21", ko: "Homebrew openjdk@21 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    A stable <code>mobile.appId</code> such as <code>com.acme.shop</code>.
                  </>
                ),
                ko: (
                  <>
                    <code>com.acme.shop</code>처럼 바뀌지 않을 <code>mobile.appId</code>.
                  </>
                ),
              })}
              <ExternalLink
                href="https://developer.android.com/build/configure-app-module#set-application-id"
                label={l.trans({ en: "Open the Android application ID docs", ko: "Android application ID 문서 열기" })}
              />
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Run on a device", ko: "기기에서 실행하기" })}</Docs.SubSubTitle>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: "Point your shell at JDK 21 and the Android SDK:",
                ko: "터미널이 JDK 21과 Android SDK를 쓰도록 설정합니다:",
              })}
              <Code.Snippet
                className="w-full"
                title="Terminal"
                language="bash"
                code={`brew install openjdk@21
JDK_PREFIX="$(brew --prefix openjdk@21)"
export JAVA_HOME="$JDK_PREFIX/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"`}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    Check that <code>mobile.appId</code> is final (see Mobile Config above), then start the dev server.
                    Without <code>--release</code>, the app loads its screens from it:
                  </>
                ),
                ko: (
                  <>
                    <code>mobile.appId</code>가 확정됐는지 확인하고(위 mobile 설정 참고) 개발 서버를 켭니다.{" "}
                    <code>--release</code> 없이 실행하면 앱이 이 서버에서 화면을 불러옵니다:
                  </>
                ),
              })}
              <Code.Snippet className="w-full" title="Terminal" language="bash" code="akan start myapp" />
            </li>
            <li>
              {l.trans({
                en: "In a second terminal, run the app on an emulator or a connected phone:",
                ko: "두 번째 터미널에서 에뮬레이터나 연결한 폰으로 앱을 실행합니다:",
              })}
              <Code.Snippet className="w-full" title="Terminal" language="bash" code="akan start-android myapp" />
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    Success looks like this: the app opens, and the generated <code>applicationId</code> matches{" "}
                    <code>mobile.appId</code>.
                  </>
                ),
                ko: (
                  <>
                    앱이 열리고, 생성된 <code>applicationId</code>가 <code>mobile.appId</code>와 같으면 성공입니다.
                  </>
                ),
              })}
            </li>
          </ol>

          <Docs.SubSubTitle>{l.trans({ en: "Commands and store builds", ko: "명령과 스토어 빌드" })}</Docs.SubSubTitle>
          <Docs.Table columns={commandColumns} rows={androidCommandRows} stacked />
          <div>
            {l.trans({
              en: (
                <span>
                  Check that the project builds, then make the Play Store AAB against the <code>main</code> backend:
                </span>
              ),
              ko: (
                <span>
                  프로젝트가 빌드되는지 확인한 뒤, Play Store에 올릴 AAB를 <code>main</code> 백엔드로 만듭니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`akan build-android myapp --target default
akan release-android myapp --target default --env main --assemble-type aab`}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  Both commands build the release variant, so they need your upload key. Put four values in{" "}
                  <code>apps/myapp/android/gradle.properties</code>:
                </span>
              ),
              ko: (
                <span>
                  두 명령 모두 릴리스 빌드를 만들므로 업로드 키가 있어야 합니다.{" "}
                  <code>apps/myapp/android/gradle.properties</code>에 값 네 개를 넣습니다:
                </span>
              ),
            })}
            <ExternalLink
              href="https://developer.android.com/studio/publish/app-signing"
              label={l.trans({ en: "Open the Android app signing docs", ko: "Android 앱 서명 문서 열기" })}
            />
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/android/gradle.properties"
            language="yaml"
            code={`MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_STORE_PASSWORD=<store password>
MYAPP_RELEASE_KEY_ALIAS=upload
MYAPP_RELEASE_KEY_PASSWORD=<key password>`}
          />
          <ul className={bulletList}>
            {signingNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Mobile command flags", ko: "모바일 명령 플래그" })}</Docs.SubSubTitle>
          <Docs.OptionTable items={commandFlags} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="ios-setup" title={l.trans({ en: "iOS Setup", ko: "iOS 설정" })}>
        <Docs.Title>{l.trans({ en: "iOS Setup", ko: "iOS 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "This prepares the Xcode project: bundle ID, signing, simulator runs and store builds. Run on a simulator first, then on a phone for device-only features.",
              ko: "Xcode 프로젝트의 bundle ID, 서명, 시뮬레이터 실행, 스토어 빌드를 준비하는 과정입니다. 먼저 시뮬레이터에서 실행하고, 기기 전용 기능은 폰에서 확인합니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Prerequisites", ko: "준비물" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({ en: "Xcode.", ko: "Xcode." })}
              <ExternalLink
                href="https://developer.apple.com/xcode/"
                label={l.trans({ en: "Open the Xcode download", ko: "Xcode 다운로드 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <>
                    A stable <code>mobile.appId</code>, used as the bundle ID.
                  </>
                ),
                ko: (
                  <>
                    bundle ID로 쓸, 바뀌지 않을 <code>mobile.appId</code>.
                  </>
                ),
              })}
              <ExternalLink
                href="https://developer.apple.com/help/account/identifiers/register-an-app-id"
                label={l.trans({ en: "Open the Apple bundle ID docs", ko: "Apple bundle ID 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: "An Apple developer team, for phone runs and releases.",
                ko: "폰 실행과 출시에 쓸 Apple 개발자 팀.",
              })}
              <ExternalLink
                href="https://developer.apple.com/help/account/certificates/create-a-certificate-signing-request"
                label={l.trans({ en: "Open the Apple signing docs", ko: "Apple 서명 문서 열기" })}
              />
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Run on a device", ko: "기기에서 실행하기" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  With <code>akan start myapp</code> running, launch the app. Akan lists the simulators and connected
                  phones to pick from:
                </span>
              ),
              ko: (
                <span>
                  <code>akan start myapp</code>을 켜 둔 채 앱을 실행합니다. Akan이 시뮬레이터와 연결된 폰 목록을 보여
                  주고 고르게 합니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`akan start-ios myapp
akan start-ios myapp --device "iPhone 16"`}
          />
          <ul className={bulletList}>
            {iosNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Xcode checks", ko: "Xcode에서 확인할 것" })}</Docs.SubSubTitle>
          <ol className={stepList}>
            {xcodeChecks.map((check, idx) => (
              <li key={idx}>{check}</li>
            ))}
          </ol>

          <Docs.SubSubTitle>{l.trans({ en: "Commands and store builds", ko: "명령과 스토어 빌드" })}</Docs.SubSubTitle>
          <Docs.Table columns={commandColumns} rows={iosCommandRows} stacked />
          <div>
            {l.trans({
              en: (
                <span>
                  Check that the project builds, then make the App Store build against the <code>main</code> backend,
                  which <code>release-ios</code> uses by default:
                </span>
              ),
              ko: (
                <span>
                  프로젝트가 빌드되는지 확인한 뒤, App Store용 빌드를 <code>main</code> 백엔드로 만듭니다.{" "}
                  <code>release-ios</code>는 기본으로 <code>main</code>을 씁니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`akan build-ios myapp --target default
akan release-ios myapp --target default --env main`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="verify" title={l.trans({ en: "Verify Setup", ko: "설정 확인" })}>
        <Docs.Title>{l.trans({ en: "Verify Setup", ko: "설정 확인" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A green build is not the finish line. On a real device, check that plugins load, native files are in place, permission prompts appear, and push arrives and opens the right screen.",
              ko: "빌드 성공이 끝이 아닙니다. 실제 기기에서 플러그인이 불러와지는지, 네이티브 파일이 제자리에 있는지, 권한 창이 뜨는지, 푸시가 도착해 맞는 화면을 여는지 확인하세요.",
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "symptom", label: l.trans({ en: "Symptom", ko: "증상" }) },
              { key: "check", label: l.trans({ en: "What to check", ko: "확인할 것" }) },
            ]}
            rows={symptomRows}
            stacked
          />

          <Docs.SubSubTitle>{l.trans({ en: "Push on each platform", ko: "플랫폼별 푸시 점검" })}</Docs.SubSubTitle>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {pushChecks.map(({ title, items }, idx) => (
              <div key={idx} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="font-semibold text-primary">{title}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/70 text-sm">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Docs.SubSubTitle>{l.trans({ en: "Next", ko: "다음 단계" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={nextLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
