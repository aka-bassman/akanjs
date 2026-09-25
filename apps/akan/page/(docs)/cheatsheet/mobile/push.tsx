import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, ExternalLink, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();
  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const stepList = "my-4 list-decimal space-y-2 pl-5";

  const termRows = [
    {
      name: "FCM",
      desc: l.trans({
        en: "Firebase Cloud Messaging. Akan sends to web, Android and iOS through it.",
        ko: "Firebase Cloud Messaging입니다. Akan은 웹, Android, iOS 모두 이것으로 보냅니다.",
      }),
    },
    {
      name: "APNs",
      desc: l.trans({
        en: "Apple's push service. FCM hands iOS messages to it, so Firebase needs an Apple key.",
        ko: "Apple의 푸시 서비스입니다. FCM이 iOS 메시지를 여기로 넘기므로 Firebase에 Apple 키가 필요합니다.",
      }),
    },
    {
      name: l.trans({ en: "push token", ko: "푸시 토큰" }),
      desc: l.trans({
        en: "The address of one app install. `register()` returns it, and the server sends to it.",
        ko: "앱 설치 하나의 주소입니다. `register()`가 돌려주고, 서버는 이 주소로 보냅니다.",
      }),
    },
    {
      name: l.trans({ en: "VAPID key", ko: "VAPID 키" }),
      desc: l.trans({
        en: "The web push key pair. Its public half goes in the client env as `vapidKey`.",
        ko: "웹 푸시용 키 쌍입니다. 공개 키를 client env의 `vapidKey`에 넣습니다.",
      }),
    },
    {
      name: l.trans({ en: "service account", ko: "서비스 계정" }),
      desc: l.trans({
        en: "The Firebase Admin credential the server sends with. It never reaches the client.",
        ko: "서버가 발송할 때 쓰는 Firebase Admin 인증 정보입니다. 클라이언트로 가지 않습니다.",
      }),
    },
    {
      name: "aps-environment",
      desc: l.trans({
        en: "The iOS entitlement that picks the APNs development or production path.",
        ko: "APNs development와 production 중 어느 경로를 쓸지 정하는 iOS entitlement입니다.",
      }),
    },
  ];

  const platformColumns = [
    { key: "web", label: l.trans({ en: "Web", ko: "웹" }) },
    { key: "android", label: "Android" },
    { key: "ios", label: "iOS" },
  ];

  const prepareGroups = [
    {
      label: l.trans({ en: "In the consoles", ko: "콘솔에서" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Firebase app", ko: "Firebase 앱" })}</span>,
          desc: l.trans({
            en: "One Firebase project, with a web, Android or iOS app registered in it.",
            ko: "Firebase 프로젝트 하나에 웹, Android, iOS 앱을 각각 등록합니다.",
          }),
          marks: { web: true, android: true, ios: true },
        },
        {
          name: <span className="font-sans">{l.trans({ en: "VAPID key", ko: "VAPID 키" })}</span>,
          desc: l.trans({
            en: "A Web Push certificate key pair, generated in Firebase's Cloud Messaging settings.",
            ko: "Firebase의 Cloud Messaging 설정에서 만드는 Web Push 인증서 키 쌍입니다.",
          }),
          marks: { web: true },
        },
        {
          name: <span className="font-sans">{l.trans({ en: "APNs auth key (.p8)", ko: "APNs 인증 키 (.p8)" })}</span>,
          desc: l.trans({
            en: "Created in Apple Developer, then uploaded to Firebase for development and production.",
            ko: "Apple Developer에서 만들어 Firebase에 development용과 production용으로 올립니다.",
          }),
          marks: { ios: true },
        },
      ],
    },
    {
      label: l.trans({ en: "In the app folder", ko: "앱 폴더에" }),
      rows: [
        {
          name: "env.client.*",
          desc: l.trans({
            en: "The public Firebase web config and `vapidKey`, under `firebase`.",
            ko: "`firebase` 아래에 공개 Firebase 웹 설정과 `vapidKey`를 넣습니다.",
          }),
          marks: { web: true },
        },
        {
          name: "google-services.json",
          desc: l.trans({
            en: "The Android Firebase config, copied into the native project by `mobile.files`.",
            ko: "Android용 Firebase 설정 파일이며, `mobile.files`로 네이티브 프로젝트에 복사됩니다.",
          }),
          marks: { android: true },
        },
        {
          name: "GoogleService-Info.plist",
          desc: l.trans({
            en: "The iOS Firebase config, copied the same way.",
            ko: "iOS용 Firebase 설정 파일이며, 같은 방식으로 복사됩니다.",
          }),
          marks: { ios: true },
        },
        {
          name: "package.json",
          desc: l.trans({
            en: "`@capacitor/push-notifications` and `@capacitor-community/fcm` as app dependencies.",
            ko: "`@capacitor/push-notifications`와 `@capacitor-community/fcm`을 앱 의존성으로 둡니다.",
          }),
          marks: { android: true, ios: true },
        },
        {
          name: 'permissions: ["push"]',
          desc: l.trans({
            en: "Turns on native push for the mobile target in `akan.config.ts`.",
            ko: "`akan.config.ts`의 모바일 타깃에서 네이티브 푸시를 켭니다.",
          }),
          marks: { android: true, ios: true },
        },
      ],
    },
    {
      label: l.trans({ en: "On the server", ko: "서버에" }),
      rows: [
        {
          name: "env.server.*",
          desc: l.trans({
            en: "`pushNoti.firebase`: the service account the server sends with, for every platform.",
            ko: "`pushNoti.firebase`: 서버가 모든 플랫폼에 발송할 때 쓰는 서비스 계정입니다.",
          }),
          marks: { web: true, android: true, ios: true },
        },
      ],
    },
  ];

  const pluginCards = [
    {
      title: "@capacitor/push-notifications",
      chip: "PushNotifications.requestPermissions()",
      desc: l.trans({
        en: "The OS push bridge: permission, native registration, click and action listeners, delivered notifications and Android channels.",
        ko: "OS 푸시 브리지입니다. 알림 권한, 네이티브 등록, 알림 클릭·액션 리스너, 표시된 알림, Android 채널을 맡습니다.",
      }),
    },
    {
      title: "@capacitor-community/fcm",
      chip: "FCM.getToken()",
      desc: l.trans({
        en: "Firebase token access. It keeps Android and iOS on the same Firebase Admin send({ token }) contract.",
        ko: "Firebase 토큰 접근을 맡습니다. 덕분에 Android와 iOS 발송이 같은 Firebase Admin send({ token }) 계약을 따릅니다.",
      }),
    },
  ];

  const webNotes = [
    l.trans({
      en: (
        <>
          <strong>Only public values go here.</strong> <code>env.client.*</code> ships to the browser; the server's
          service account belongs in <code>env.server.*</code>.
        </>
      ),
      ko: (
        <>
          <strong>공개해도 되는 값만 넣습니다.</strong> <code>env.client.*</code>는 브라우저로 전달됩니다. 서버의 서비스
          계정은 <code>env.server.*</code>에 둡니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Four fields are required.</strong> Without <code>apiKey</code>, <code>projectId</code>,{" "}
          <code>messagingSenderId</code> or <code>appId</code>, <code>register()</code> returns <code>undefined</code>{" "}
          on the web.
        </>
      ),
      ko: (
        <>
          <strong>필수 필드는 네 개입니다.</strong> <code>apiKey</code>, <code>projectId</code>,{" "}
          <code>messagingSenderId</code>, <code>appId</code> 중 하나라도 없으면 웹에서 <code>register()</code>가{" "}
          <code>undefined</code>를 돌려줍니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>One file per environment.</strong> <code>env.client.ts</code> picks{" "}
          <code>{"env.client.<env>.ts"}</code> by <code>AKAN_PUBLIC_ENV</code>, so fill in every environment you deploy.
        </>
      ),
      ko: (
        <>
          <strong>환경마다 파일이 하나씩 있습니다.</strong> <code>env.client.ts</code>가 <code>AKAN_PUBLIC_ENV</code>에
          따라 <code>{"env.client.<env>.ts"}</code>를 고르므로, 배포하는 모든 환경에 채워 둡니다.
        </>
      ),
    }),
  ];

  const androidFileNotes = [
    l.trans({
      en: (
        <>
          <strong>The key is the destination, the value the source.</strong> The key is a path inside the generated{" "}
          <code>android/</code> project, and the value a path inside the app folder.
        </>
      ),
      ko: (
        <>
          <strong>키가 목적지, 값이 원본입니다.</strong> 키는 생성된 <code>android/</code> 프로젝트 안의 경로이고, 값은
          앱 폴더 안의 경로입니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>secrets/</code>, not <code>public/</code>.
          </strong>{" "}
          Everything in <code>public/</code> is served to every visitor. <code>secrets</code> keeps the file out of git
          and carries it with <code>akan upload-env</code> and <code>akan download-env</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>public/</code>이 아니라 <code>secrets/</code>에 둡니다.
          </strong>{" "}
          <code>public/</code>의 파일은 모든 방문자에게 그대로 제공됩니다. <code>secrets</code>에 등록한 파일은 git에서
          빠지고, <code>akan upload-env</code>와 <code>akan download-env</code>로 함께 옮겨집니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>permissions: ["push"]</code>
          </strong>{" "}
          turns on native push for this target.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>permissions: ["push"]</code>
          </strong>
          가 이 타깃의 네이티브 푸시를 켭니다.
        </>
      ),
    }),
  ];

  const androidDisplayNotes = [
    l.trans({
      en: (
        <>
          <strong>Channels.</strong> Create one per stable category, such as order updates or chat messages.
        </>
      ),
      ko: (
        <>
          <strong>채널.</strong> 주문 업데이트나 채팅 메시지처럼 고정된 카테고리마다 하나씩 만듭니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Icon and color.</strong> Set a default in the native project when the launcher icon does not suit a
          notification.
        </>
      ),
      ko: (
        <>
          <strong>아이콘과 색.</strong> 런처 아이콘이 알림 아이콘으로 맞지 않으면 네이티브 프로젝트에서 기본값을
          설정합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Foreground.</strong> Decide in app code how a notification shows while the app is open.
        </>
      ),
      ko: (
        <>
          <strong>포그라운드.</strong> 앱이 열려 있을 때 알림을 어떻게 보여 줄지는 앱 코드에서 정합니다.
        </>
      ),
    }),
  ];

  const iosNotes = [
    l.trans({
      en: (
        <>
          <strong>
            The key is relative to <code>ios/</code>.
          </strong>{" "}
          <code>App/App/</code> is the App target folder, next to <code>Info.plist</code>; a file copied to{" "}
          <code>ios/App/</code> is never bundled.
        </>
      ),
      ko: (
        <>
          <strong>
            키는 <code>ios/</code> 기준 경로입니다.
          </strong>{" "}
          <code>App/App/</code>가 <code>Info.plist</code>가 있는 App 타깃 폴더이고, <code>ios/App/</code>에 복사된
          파일은 앱에 포함되지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Add the plist to the App target once in Xcode.</strong> The Xcode project is committed, so the
          membership stays; afterwards <code>mobile.files</code> only refreshes the file.
        </>
      ),
      ko: (
        <>
          <strong>Xcode에서 plist를 App 타깃에 한 번 추가합니다.</strong> Xcode 프로젝트는 커밋되므로 이 설정은
          유지되고, 이후에는 <code>mobile.files</code>가 파일 내용만 갱신합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Keep the plist in the app folder</strong> and let <code>mobile.files</code> copy it. The native
          project can be regenerated, and anything placed there by hand goes with it.
        </>
      ),
      ko: (
        <>
          <strong>plist는 앱 폴더에 두고</strong> <code>mobile.files</code>로 복사합니다. 네이티브 프로젝트는 다시
          생성될 수 있고, 그 안에 손으로 넣은 파일은 함께 사라집니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>simctl push</code> arrives but a Firebase send does not?
          </strong>{" "}
          Check the APNs credential that matches the built <code>aps-environment</code>, covered in the next section.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>simctl push</code>는 오는데 Firebase 발송은 안 온다면
          </strong>{" "}
          빌드된 <code>aps-environment</code>에 맞는 APNs 인증 정보를 확인하세요. 다음 섹션에서 다룹니다.
        </>
      ),
    }),
  ];

  const apnsNotes = [
    l.trans({
      en: (
        <>
          <strong>A mismatch fails silently.</strong> A build signed for one environment and sent through the other's
          credential fails on Apple's side, with nothing on yours.
        </>
      ),
      ko: (
        <>
          <strong>어긋나면 조용히 실패합니다.</strong> 한쪽 환경으로 서명된 빌드에 다른 쪽 인증 정보로 보내면 Apple
          쪽에서 실패하고, 내 쪽에는 아무 흔적도 남지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Upload both credentials.</strong> The same project serves a simulator run and a TestFlight build, and
          the two reach Apple through different doors.
        </>
      ),
      ko: (
        <>
          <strong>두 인증 정보를 모두 올립니다.</strong> 같은 프로젝트가 시뮬레이터 실행과 TestFlight 빌드를 함께
          감당하고, 둘은 서로 다른 문으로 Apple에 닿습니다.
        </>
      ),
    }),
  ];

  const hookRows = [
    {
      name: "register()",
      desc: l.trans({
        en: "Asks for permission when needed and returns a `PushToken`, or `undefined`.",
        ko: "필요하면 권한을 요청하고 `PushToken`을 돌려줍니다. 받지 못하면 `undefined`입니다.",
      }),
    },
    {
      name: "getToken()",
      desc: l.trans({
        en: "Returns the current token without asking for permission.",
        ko: "권한을 묻지 않고 현재 토큰을 돌려줍니다.",
      }),
    },
    {
      name: "getPermission()",
      desc: l.trans({
        en: "Reads the current permission state.",
        ko: "현재 권한 상태를 읽습니다.",
      }),
    },
    {
      name: "requestPermission()",
      desc: l.trans({
        en: "Shows the permission prompt and returns the answer.",
        ko: "권한 요청 창을 띄우고 결과를 돌려줍니다.",
      }),
    },
    {
      name: "isSupported()",
      desc: l.trans({
        en: "Tells whether push can work in this runtime.",
        ko: "지금 런타임에서 푸시를 쓸 수 있는지 알려 줍니다.",
      }),
    },
    {
      name: "initClickBridge()",
      desc: l.trans({
        en: "Routes notification clicks. The hook already runs it on mount.",
        ko: "알림 클릭을 라우팅합니다. 훅이 마운트될 때 이미 실행합니다.",
      }),
    },
  ];

  const registerNotes = [
    l.trans({
      en: (
        <>
          <strong>PushToken</strong> holds <code>token</code>, <code>platform</code> (<code>web</code> |{" "}
          <code>android</code> | <code>ios</code>), <code>provider</code> (<code>fcm</code>) and an optional{" "}
          <code>deviceId</code>.
        </>
      ),
      ko: (
        <>
          <strong>PushToken</strong>에는 <code>token</code>, <code>platform</code>(<code>web</code> |{" "}
          <code>android</code> | <code>ios</code>), <code>provider</code>(<code>fcm</code>), 그리고 선택값{" "}
          <code>deviceId</code>가 들어 있습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>App storage.</strong> Store the token through an app-level user/device API. Akan does not decide where
          your user domain keeps device tokens.
        </>
      ),
      ko: (
        <>
          <strong>앱의 저장소.</strong> 토큰은 앱 레벨의 user/device API로 저장합니다. user 도메인이 기기 토큰을 어디에
          둘지는 Akan이 대신 정하지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Click routing.</strong> Send a <code>url</code> from the server and it arrives as{" "}
          <code>data.url</code>. A click opens that path through the CSR router instead of reloading the app.
        </>
      ),
      ko: (
        <>
          <strong>클릭 라우팅.</strong> 서버에서 <code>url</code>을 보내면 <code>data.url</code>로 도착합니다. 알림을
          누르면 앱을 새로 불러오지 않고 CSR router로 그 경로를 엽니다.
        </>
      ),
    }),
  ];

  const constantNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>UserDeviceInput</code> mirrors <code>PushToken</code>,
          </strong>{" "}
          so the value <code>register()</code> returned goes to the endpoint unchanged.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>UserDeviceInput</code>은 <code>PushToken</code>과 모양이 같습니다.
          </strong>{" "}
          그래서 <code>register()</code>가 돌려준 값을 그대로 엔드포인트에 넘깁니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>userId</code> and <code>disabledAt</code> are the server's.
          </strong>{" "}
          The owner comes from the signed-in account, and <code>disabledAt</code> retires a token FCM rejected.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>userId</code>와 <code>disabledAt</code>은 서버가 채웁니다.
          </strong>{" "}
          소유자는 로그인한 계정에서 오고, <code>disabledAt</code>은 FCM이 거절한 토큰을 비활성화한 시각입니다.
        </>
      ),
    }),
  ];

  const documentNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>byToken</code>
          </strong>{" "}
          gives the service <code>findByToken</code> and <code>updateByToken</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>byToken</code>
          </strong>
          으로 서비스에서 <code>findByToken</code>과 <code>updateByToken</code>을 쓸 수 있습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>ofUser</code>
          </strong>{" "}
          gives <code>listOfUser</code>, which skips retired tokens through <code>q.empty("disabledAt")</code>.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>ofUser</code>
          </strong>
          로 <code>listOfUser</code>를 쓸 수 있고, <code>q.empty("disabledAt")</code>로 비활성화된 토큰은 건너뜁니다.
        </>
      ),
    }),
  ];

  const signalNotes = [
    l.trans({
      en: (
        <>
          <strong>
            <code>User</code> registers, <code>Admin</code> retires.
          </strong>{" "}
          Every custom endpoint names its own guards.
        </>
      ),
      ko: (
        <>
          <strong>
            등록은 <code>User</code>, 비활성화는 <code>Admin</code>입니다.
          </strong>{" "}
          커스텀 엔드포인트는 모두 자기 가드를 직접 적습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>Self</code> supplies the owner,
          </strong>{" "}
          so a client cannot register a token under someone else's account.
        </>
      ),
      ko: (
        <>
          <strong>
            소유자는 <code>Self</code>가 넘겨줍니다.
          </strong>{" "}
          그래서 클라이언트가 다른 사람 계정으로 토큰을 등록할 수 없습니다.
        </>
      ),
    }),
  ];

  const credentialNotes = [
    l.trans({
      en: (
        <>
          <strong>Get it from Firebase Console</strong> under Project settings, then Service accounts. Copy the five
          fields above from the downloaded JSON.
        </>
      ),
      ko: (
        <>
          <strong>Firebase Console</strong>의 프로젝트 설정 → 서비스 계정에서 받습니다. 내려받은 JSON에서 위 다섯 필드를
          옮겨 적습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            It is not <code>google-services.json</code>.
          </strong>{" "}
          That file is the native app's config; this one signs every send.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>google-services.json</code>과는 다른 파일입니다.
          </strong>{" "}
          그 파일은 네이티브 앱 설정이고, 이것은 모든 발송에 서명합니다.
        </>
      ),
    }),
  ];

  const serviceNotes = [
    l.trans({
      en: (
        <>
          <strong>Why retire.</strong> FCM answers a token the device no longer holds with{" "}
          <code>messaging/registration-token-not-registered</code>, and keeps answering it forever. A send loop that
          never retires the token keeps a permanent share of guaranteed failures.
        </>
      ),
      ko: (
        <>
          <strong>왜 정리하나.</strong> 기기가 더 이상 갖고 있지 않은 토큰에 FCM은{" "}
          <code>messaging/registration-token-not-registered</code>로 답하고, 이 답을 영원히 반복합니다. 토큰을 정리하지
          않는 발송 루프는 실패가 확정된 몫을 계속 안고 갑니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Other errors still throw.</strong> Only that one code becomes a retirement; everything else reaches
          the caller.
        </>
      ),
      ko: (
        <>
          <strong>다른 오류는 그대로 던집니다.</strong> 그 코드 하나만 토큰 비활성화로 바꾸고, 나머지는 호출한 쪽으로
          전달됩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>notifyUser</code> sends only to live devices,
          </strong>{" "}
          because <code>listOfUser</code> already skips retired tokens.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>notifyUser</code>는 살아 있는 기기에만 보냅니다.
          </strong>{" "}
          <code>listOfUser</code>가 이미 비활성화된 토큰을 건너뛰기 때문입니다.
        </>
      ),
    }),
  ];

  const sendOptionRows = [
    {
      key: "title",
      type: "string",
      tags: [l.trans({ en: "required", ko: "필수" })],
      desc: l.trans({ en: "The notification title.", ko: "알림 제목입니다." }),
    },
    {
      key: "body",
      type: "string",
      tags: [l.trans({ en: "required", ko: "필수" })],
      desc: l.trans({ en: "The notification body.", ko: "알림 본문입니다." }),
    },
    {
      key: "token",
      type: "string",
      desc: l.trans({
        en: "One device's push token. Send either `token` or `topic`.",
        ko: "기기 하나의 푸시 토큰입니다. `token`과 `topic` 중 하나를 보냅니다.",
      }),
    },
    {
      key: "topic",
      type: "string",
      desc: l.trans({
        en: "An FCM topic. Every device subscribed to it receives the message.",
        ko: "FCM 토픽입니다. 이 토픽을 구독한 모든 기기가 받습니다.",
      }),
    },
    {
      key: "url",
      type: "string",
      desc: l.trans({
        en: "Where a click lands. It arrives in the message as `data.url`.",
        ko: "알림을 눌렀을 때 열 경로입니다. 메시지에는 `data.url`로 실립니다.",
      }),
    },
    {
      key: "imageUrl",
      type: "string",
      desc: l.trans({ en: "An image shown in the notification.", ko: "알림에 보여 줄 이미지입니다." }),
    },
    {
      key: "data",
      type: "Record<string, string>",
      desc: l.trans({
        en: "Extra key-value pairs delivered with the message.",
        ko: "메시지와 함께 전달할 추가 키-값입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="push-setup" title={l.trans({ en: "Push Setup", ko: "푸시 설정" })}>
        <Docs.Title>{l.trans({ en: "Push Setup", ko: "푸시 설정" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The browser prompt appears, a token comes back, and the server logs a successful send. Nothing arrives on the phone.",
              ko: "브라우저 권한 창이 뜨고, 토큰이 돌아오고, 서버 로그에는 발송 성공이 찍힙니다. 그런데 폰에는 아무것도 오지 않습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Push is one client API, <code>usePushNotification()</code>, backed by three separate setups: web,
                  Android and iOS. A send against the wrong credential looks exactly like one that worked, so prepare
                  every row that applies to you.
                </span>
              ),
              ko: (
                <span>
                  푸시는 클라이언트 API <code>usePushNotification()</code> 하나 뒤에 웹, Android, iOS 설정이 따로 붙어
                  있습니다. 잘못된 인증 정보로 보낸 발송도 정상 발송과 똑같아 보이니, 아래 표에서 해당하는 줄을 빠짐없이
                  준비하세요.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>{l.trans({ en: "What you prepare", ko: "준비할 것" })}</Docs.SubSubTitle>
          <Docs.Matrix
            type={l.trans({ en: "Item", ko: "항목" })}
            columns={platformColumns}
            groups={prepareGroups}
            markLabel={l.trans({ en: "Needed", ko: "필요" })}
            emptyLabel={l.trans({ en: "Not needed", ko: "필요 없음" })}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="push-plugins" title={l.trans({ en: "Why Two Plugins", ko: "플러그인이 두 개인 이유" })}>
        <Docs.Title>{l.trans({ en: "Why Two Plugins", ko: "플러그인이 두 개인 이유" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Akan uses FCM as its push provider, so a native app needs two Capacitor plugins: one for the OS push bridge and one for the FCM token.",
              ko: "Akan은 FCM을 푸시 제공자로 쓰기 때문에, 네이티브 앱에는 Capacitor 플러그인이 두 개 필요합니다. 하나는 OS 푸시 브리지용, 하나는 FCM 토큰용입니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            {pluginCards.map(({ title, chip, desc }) => (
              <div key={title} className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
                <div className="wrap-anywhere mb-1 font-mono font-semibold text-primary">{title}</div>
                <div className="text-foreground/70 text-sm">{desc}</div>
                <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs">
                  {chip}
                </code>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Declare both in <code>apps/myapp/package.json</code>, not only in the workspace root: Capacitor links
                  native plugins from the app package. The dependency block itself is on{" "}
                  <Link href="/cheatsheet/mobile/setup#capacitor-plugins" className="text-primary">
                    Setup
                  </Link>
                  .
                </span>
              ),
              ko: (
                <span>
                  둘 다 워크스페이스 루트가 아니라 <code>apps/myapp/package.json</code>에 선언합니다. Capacitor는 앱
                  패키지에 선언된 네이티브 플러그인을 링크하기 때문입니다. 의존성 블록 자체는{" "}
                  <Link href="/cheatsheet/mobile/setup#capacitor-plugins" className="text-primary">
                    설정
                  </Link>{" "}
                  문서에서 다룹니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="web-push" title={l.trans({ en: "Web Push", ko: "웹 푸시" })}>
        <Docs.Title>{l.trans({ en: "Web Push", ko: "웹 푸시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Web push needs no native project at all. Register a Firebase web app and copy its public config into the client env.",
              ko: "웹 푸시에는 네이티브 프로젝트가 전혀 필요 없습니다. Firebase 웹 앱을 등록하고, 공개 설정값을 client env에 옮기면 됩니다.",
            })}
          </div>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: "Create or open a web app in Firebase Console.",
                ko: "Firebase Console에서 웹 앱을 만들거나 기존 웹 앱을 엽니다.",
              })}
              <ExternalLink
                href="https://console.firebase.google.com/"
                label={l.trans({ en: "Open Firebase Console", ko: "Firebase Console 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Copy its public config into <code>env.client.*</code>, under <code>firebase</code>.
                  </span>
                ),
                ko: (
                  <span>
                    공개 설정값을 <code>env.client.*</code>의 <code>firebase</code> 아래에 넣습니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/web/setup#config-object"
                label={l.trans({ en: "Open Firebase web config docs", ko: "Firebase 웹 설정 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Generate a Web Push certificate key pair and put its public key in <code>vapidKey</code>.
                  </span>
                ),
                ko: (
                  <span>
                    Web Push 인증서 키 쌍을 만들고, 공개 키를 <code>vapidKey</code>에 넣습니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/cloud-messaging/js/client#configure_web_credentials_in_your_app"
                label={l.trans({
                  en: "Open Firebase web push credentials docs",
                  ko: "Firebase 웹 푸시 인증 정보 문서 열기",
                })}
              />
            </li>
          </ol>
          <div>
            {l.trans({
              en: "The client env file then looks like this:",
              ko: "그러면 client env 파일은 이렇게 됩니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/env/env.client.local.ts"
          code={`export const env = {
  firebase: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    vapidKey: "...",
  },
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {webNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="android-push" title={l.trans({ en: "Android Push", ko: "Android 푸시" })}>
        <Docs.Title>{l.trans({ en: "Android Push", ko: "Android 푸시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Android push is a Firebase Android app whose package name matches <code>mobile.appId</code> exactly,
                  plus one config file copied into the generated native project.
                </span>
              ),
              ko: (
                <span>
                  Android 푸시는 패키지 이름이 <code>mobile.appId</code>와 정확히 같은 Firebase Android 앱 등록, 그리고
                  생성된 네이티브 프로젝트로 복사되는 설정 파일 하나로 끝납니다.
                </span>
              ),
            })}
          </div>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: "Open Firebase Console and select the project.",
                ko: "Firebase Console에서 프로젝트를 엽니다.",
              })}
              <ExternalLink
                href="https://console.firebase.google.com/"
                label={l.trans({ en: "Open Firebase Console", ko: "Firebase Console 열기" })}
              />
            </li>
            <li>
              {l.trans({ en: "Add an Android app.", ko: "Android 앱을 추가합니다." })}
              <ExternalLink
                href="https://firebase.google.com/docs/android/setup"
                label={l.trans({ en: "Open Firebase Android setup docs", ko: "Firebase Android 설정 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Enter the same package name as <code>mobile.appId</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>mobile.appId</code>와 같은 패키지 이름을 입력합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Download <code>google-services.json</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>google-services.json</code>을 내려받습니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/android/setup#add-config-file"
                label={l.trans({ en: "Open google-services.json docs", ko: "google-services.json 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Place it at <code>apps/myapp/secrets/google-services.json</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>apps/myapp/secrets/google-services.json</code>에 둡니다.
                  </span>
                ),
              })}
            </li>
          </ol>
          <div>
            {l.trans({
              en: (
                <span>
                  Then copy it into the native project from <code>akan.config.ts</code>:
                </span>
              ),
              ko: (
                <span>
                  그리고 <code>akan.config.ts</code>에서 네이티브 프로젝트로 복사합니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/akan.config.ts"
          code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  secrets: ["secrets/**"],
  mobile: {
    appId: "com.myapp.app",
    targets: {
      default: {
        permissions: ["push"],
        files: {
          android: {
            "app/google-services.json": "secrets/google-services.json",
          },
        },
      },
    },
  },
};

export default config;`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {androidFileNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    <code>google-services.json</code> is not the server credential.
                  </strong>{" "}
                  It is the client/native Firebase config, not the Firebase Admin service account JSON. The server
                  credential goes in <code>env.server.*</code>, as the last section shows.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>google-services.json</code>은 서버 인증 정보가 아닙니다.
                  </strong>{" "}
                  클라이언트·네이티브 앱용 Firebase 설정 파일이지, Firebase Admin 서비스 계정 JSON이 아닙니다. 서버 인증
                  정보는 마지막 섹션처럼 <code>env.server.*</code>에 둡니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.SubSubTitle>
            {l.trans({ en: "Android Notification Details", ko: "Android 알림 표시 설정" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Android can need display settings beyond token registration. Three of them are yours to decide:",
              ko: "Android는 토큰 등록과 별개로 알림 표시 설정이 더 필요할 수 있습니다. 다음 세 가지는 직접 정합니다:",
            })}
            <ExternalLink
              href="https://capacitorjs.com/docs/apis/push-notifications#push-notification-channel"
              label={l.trans({
                en: "Open Capacitor push notification channel docs",
                ko: "Capacitor 푸시 알림 채널 문서 열기",
              })}
            />
          </div>
          <ul className={bulletList}>
            {androidDisplayNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="ios-push" title={l.trans({ en: "iOS Push", ko: "iOS 푸시" })}>
        <Docs.Title>{l.trans({ en: "iOS Push", ko: "iOS 푸시" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "iOS push is the same Firebase registration plus an Apple credential, and it is where most silent failures live. What you own is which APNs credential Firebase holds.",
              ko: "iOS 푸시는 같은 Firebase 등록에 Apple 인증 정보가 하나 더 붙는 구조이고, 조용한 실패가 가장 많이 생기는 곳입니다. 직접 챙길 부분은 Firebase에 어떤 APNs 인증 정보가 올라가 있느냐입니다.",
            })}
          </div>
          <ol className={stepList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    Register an iOS app in Firebase with the same bundle ID as <code>mobile.appId</code>.
                  </span>
                ),
                ko: (
                  <span>
                    Firebase에서 <code>mobile.appId</code>와 같은 bundle ID로 iOS 앱을 등록합니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/ios/setup"
                label={l.trans({ en: "Open Firebase iOS setup docs", ko: "Firebase iOS 설정 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Download <code>GoogleService-Info.plist</code> into <code>apps/myapp/secrets/</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>GoogleService-Info.plist</code>를 <code>apps/myapp/secrets/</code>에 내려받습니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/ios/setup#add-config-file"
                label={l.trans({ en: "Open GoogleService-Info.plist docs", ko: "GoogleService-Info.plist 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: "Copy it into the generated App target and confirm its target membership in Xcode.",
                ko: "생성된 App 타깃에 복사하고, Xcode에서 Target Membership을 확인합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Add <code>permissions: ["push"]</code> to the mobile target.
                  </span>
                ),
                ko: (
                  <span>
                    모바일 타깃에 <code>permissions: ["push"]</code>를 추가합니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns"
                label={l.trans({
                  en: "Open Apple push notification registration docs",
                  ko: "Apple 푸시 알림 등록 문서 열기",
                })}
              />
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    Create an APNs auth key under Keys in Apple Developer, and upload the <code>.p8</code> in Firebase
                    Console → Cloud Messaging. Prefer this; a Certificates page offering only Apple Push Notification
                    service SSL is the older certificate-based setup.
                  </span>
                ),
                ko: (
                  <span>
                    Apple Developer의 Keys에서 APNs 인증 키를 만들어 Firebase Console → Cloud Messaging에{" "}
                    <code>.p8</code> 키를 올립니다(권장). Certificates에 Apple Push Notification service SSL만 보인다면
                    예전 방식인 인증서 기반 설정입니다.
                  </span>
                ),
              })}
              <ExternalLink
                href="https://firebase.google.com/docs/cloud-messaging/ios/certs"
                label={l.trans({ en: "Open Firebase APNs certificate docs", ko: "Firebase APNs 인증서 문서 열기" })}
              />
            </li>
            <li>
              {l.trans({
                en: "Upload APNs credentials for both development and production. Development serves simulator and debug builds; production serves TestFlight and the App Store.",
                ko: "development와 production APNs 인증 정보를 모두 올립니다. 시뮬레이터와 디버그 빌드는 development로, TestFlight와 App Store 빌드는 production으로 받습니다.",
              })}
            </li>
          </ol>
          <div>
            {l.trans({
              en: "Copy the plist the same way Android copies its file:",
              ko: "plist도 Android 파일과 같은 방식으로 복사합니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/akan.config.ts"
          code={`import type { AppConfig } from "akanjs";

const config: AppConfig = {
  secrets: ["secrets/**"],
  mobile: {
    targets: {
      default: {
        permissions: ["push"],
        files: {
          ios: {
            "App/App/GoogleService-Info.plist": "secrets/GoogleService-Info.plist",
          },
        },
      },
    },
  },
};

export default config;`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {iosNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Do not add firebase-ios-sdk in Xcode yourself.</strong> With{" "}
                  <code>@capacitor-community/fcm</code>, a Firebase Swift Package product added directly can conflict
                  with the Firebase version the plugin requires.
                </span>
              ),
              ko: (
                <span>
                  <strong>Xcode에 firebase-ios-sdk를 직접 추가하지 마세요.</strong>{" "}
                  <code>@capacitor-community/fcm</code>을 쓰는 동안 직접 추가한 Firebase Swift Package product는
                  플러그인이 요구하는 Firebase 버전과 충돌할 수 있습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="apns-environment"
        title={l.trans({ en: "Which APNs Environment You Built", ko: "빌드한 APNs 환경 확인하기" })}
      >
        <Docs.Title>{l.trans({ en: "Which APNs Environment You Built", ko: "빌드한 APNs 환경 확인하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  You never write <code>aps-environment</code>: Akan sets it in the entitlement from the command that
                  produced the build. That one string decides which of the two APNs credentials in Firebase can reach
                  the device.
                </span>
              ),
              ko: (
                <span>
                  <code>aps-environment</code>는 직접 쓰지 않습니다. 빌드를 만든 명령에 따라 Akan이 entitlement에 써
                  넣습니다. 이 문자열 하나가 Firebase에 올린 두 APNs 인증 정보 중 어느 쪽이 기기에 닿을지를 정합니다.
                </span>
              ),
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "command", label: l.trans({ en: "Command", ko: "명령" }), code: true },
              { key: "env", label: "aps-environment", code: true },
              { key: "desc", label: l.trans({ en: "Used for", ko: "용도" }) },
            ]}
            rows={[
              {
                command: "akan start-ios",
                env: "development",
                desc: l.trans({
                  en: "Local simulator and device runs, through the APNs sandbox.",
                  ko: "로컬 시뮬레이터·기기 실행이며, APNs 샌드박스 경로를 씁니다.",
                }),
              },
              {
                command: "akan start-ios --release",
                env: "production",
                desc: l.trans({
                  en: "A local run in release mode.",
                  ko: "릴리스 모드로 하는 로컬 실행입니다.",
                }),
              },
              {
                command: "akan build-ios",
                env: "production",
                desc: l.trans({ en: "Release build generation.", ko: "릴리스 빌드 생성입니다." }),
              },
              {
                command: "akan release-ios",
                env: "production",
                desc: l.trans({ en: "Store and TestFlight releases.", ko: "스토어·TestFlight 릴리스입니다." }),
              },
            ]}
          />
          <ul className={bulletList}>
            {apnsNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="client-registration" title={l.trans({ en: "Client Registration", ko: "클라이언트 등록" })}>
        <Docs.Title>{l.trans({ en: "Client Registration", ko: "클라이언트 등록" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Call <code>register()</code> from a user action, such as a settings toggle or an enable-notifications
                  button, because it may ask for permission. Pass the <code>PushToken</code> it returns straight to your
                  app's storage API:
                </span>
              ),
              ko: (
                <span>
                  <code>register()</code>는 권한을 요청할 수 있으므로, 설정 토글이나 알림 켜기 버튼처럼 사용자가 이해할
                  수 있는 동작에서 호출합니다. 돌려받은 <code>PushToken</code>은 바로 앱의 저장 API로 넘깁니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/UserDevice.Util.tsx"
          code={`"use client";
import { st, usePage } from "@apps/myapp/client";
import { usePushNotification } from "@libs/util/webkit";
import { buttonRecipe } from "akanjs/ui";

interface RegisterPushTokenProps {
  className?: string;
}
export const RegisterPushToken = ({ className }: RegisterPushTokenProps) => {
  const { l } = usePage();
  const push = usePushNotification();
  return (
    <button
      className={buttonRecipe({ variant: "primary" }, className)}
      onClick={async () => {
        const pushToken = await push.register();
        if (pushToken) await st.do.registerPushToken(pushToken);
      }}
      type="button"
    >
      {l("userDevice.signal.registerPushToken")}
    </button>
  );
};`}
        />
        <Docs.Description>
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <strong>
                    <code>registerPushToken</code> is not an Akan built-in.
                  </strong>{" "}
                  It is the app-level API built in the next two sections. Name and shape it to match your own
                  user/device domain.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>registerPushToken</code>은 Akan 내장 API가 아닙니다.
                  </strong>{" "}
                  다음 두 섹션에서 만드는 앱 레벨 API 예시입니다. 실제 앱의 user/device 도메인에 맞게 이름과 구조를
                  정하세요.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.SubSubTitle>
            {l.trans({ en: "What usePushNotification() returns", ko: "usePushNotification()이 돌려주는 것" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Import it from <code>@libs/util/webkit</code>. Most screens need only <code>register()</code>.
                </span>
              ),
              ko: (
                <span>
                  <code>@libs/util/webkit</code>에서 가져옵니다. 대부분의 화면은 <code>register()</code>만 있으면
                  됩니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Method", ko: "메서드" })} items={hookRows} />
          <ul className={bulletList}>
            {registerNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="token-store" title={l.trans({ en: "Store The Token", ko: "토큰 저장하기" })}>
        <Docs.Title>{l.trans({ en: "Store The Token", ko: "토큰 저장하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Each device's token is yours to keep, not Akan's. This section shows one way to store tokens in the database and send only to active ones; shape yours to fit your app.",
              ko: "기기별 토큰은 Akan이 아니라 앱이 관리합니다. 이 섹션은 토큰을 데이터베이스에 저장하고 활성 토큰에만 보내는 한 가지 예시이니, 앱 구조에 맞게 바꿔 쓰세요.",
            })}
          </div>
          <Docs.Flow
            title={l.trans({ en: "Push token lifecycle", ko: "푸시 토큰 생명주기" })}
            direction="TB"
            nodes={{
              register: { label: l.trans({ en: "Client: register()", ko: "클라이언트: register()" }) },
              serverRegister: {
                label: l.trans({ en: "Server: registerPushToken", ko: "서버: registerPushToken" }),
              },
              db: { label: "DB: UserDevice", tone: "muted" },
              load: { label: l.trans({ en: "Server: load active tokens", ko: "서버: 활성 토큰 로드" }) },
              send: { label: l.trans({ en: "Server: send(token)", ko: "서버: send(token)" }) },
              fcm: { label: "FCM" },
              device: { label: l.trans({ en: "User device", ko: "사용자 기기" }) },
              invalid: { label: l.trans({ en: "Invalid?", ko: "유효하지 않은가?" }), tone: "info" },
              cleanup: {
                label: l.trans({ en: "Server: retire the token", ko: "서버: 토큰 비활성화" }),
                tone: "muted",
              },
            }}
            edges={[
              ["register", "serverRegister"],
              ["serverRegister", "db"],
              ["db", "load"],
              ["load", "send"],
              ["send", "fcm"],
              ["fcm", "device"],
              ["send", "invalid"],
              ["invalid", "cleanup", { label: l.trans({ en: "yes", ko: "예" }) }],
              ["cleanup", "db", { dashed: true }],
            ]}
          />
          <Docs.SubSubTitle>userDevice.constant.ts</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The model holds what <code>register()</code> returned, plus the owner and a retirement date:
                </span>
              ),
              ko: (
                <span>
                  모델에는 <code>register()</code>가 돌려준 값과, 소유자와 비활성화 시각을 담습니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/userDevice.constant.ts"
          code={`import { enumOf, ID } from "akanjs/base";
import { via } from "akanjs/constant";

export class PushProvider extends enumOf("pushProvider", ["fcm"] as const) {}
export class PushPlatform extends enumOf(
  "pushPlatform",
  ["web", "android", "ios"] as const,
) {}

export class UserDeviceInput extends via((field) => ({
  token: field(String),
  platform: field(PushPlatform),
  provider: field(PushProvider),
  deviceId: field(String).optional(),
})) {}

export class UserDeviceObject extends via(UserDeviceInput, (field) => ({
  userId: field(ID, { ref: "user" }),
  disabledAt: field(Date).optional(), // set when FCM rejects the token
})) {}

export class LightUserDevice extends via(
  UserDeviceObject,
  ["platform", "disabledAt"] as const,
  (resolve) => ({}),
) {}

export class UserDevice extends via(
  UserDeviceObject,
  LightUserDevice,
  (resolve) => ({}),
) {}

export class UserDeviceInsight extends via(UserDevice, (field) => ({})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {constantNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>userDevice.document.ts</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Two filters find one token and a user's live devices:",
              ko: "필터 두 개로 토큰 하나와, 사용자의 살아 있는 기기를 찾습니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/userDevice.document.ts"
          code={`import { ID } from "akanjs/base";
import { by, from, into } from "akanjs/document";
import * as cnst from "../cnst";

export class UserDeviceFilter extends from(cnst.UserDevice, (filter) => ({
  query: {
    byToken: filter()
      .arg("token", String)
      .query((token) => ({ token })),
    ofUser: filter()
      .arg("userId", ID)
      .query((userId, q) => q.all({ userId }, q.empty("disabledAt"))),
  },
  sort: {},
})) {}

export class UserDevice extends by(cnst.UserDevice) {}

export class UserDeviceModel extends into(
  UserDevice,
  UserDeviceFilter,
  cnst.userDevice,
  () => ({}),
) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {documentNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>userDevice.signal.ts</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The endpoint takes the owner from <code>Self</code>, never from the body:
                </span>
              ),
              ko: (
                <span>
                  엔드포인트는 소유자를 body가 아니라 <code>Self</code>에서 받습니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/userDevice.signal.ts"
          code={`import { Admin, Self, User } from "@libs/shared/srvkit";
import { endpoint, internal, slice } from "akanjs/signal";
import * as cnst from "../cnst";
import * as srv from "../srv";

export class UserDeviceInternal extends internal(srv.userDevice, () => ({})) {}

export class UserDeviceSlice extends slice(
  srv.userDevice,
  { guards: { root: Admin, get: Admin, cru: Admin } },
  () => ({}),
) {}

export class UserDeviceEndpoint extends endpoint(
  srv.userDevice,
  ({ mutation }) => ({
    registerPushToken: mutation(Boolean, { guards: [User] })
      .body("pushToken", cnst.UserDeviceInput)
      .with(Self)
      .exec(async function (pushToken, self) {
        await this.userDeviceService.registerPushToken(self.id, pushToken);
        return true;
      }),
    invalidatePushToken: mutation(Boolean, { guards: [Admin] })
      .body("token", String)
      .exec(async function (token) {
        await this.userDeviceService.invalidatePushToken(token);
        return true;
      }),
  }),
) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {signalNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>userDevice.store.ts</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The store action is the ordinary one: call the endpoint, then toast. Nothing here is push-specific; the token is just an argument.",
              ko: "스토어 액션은 평범합니다. 엔드포인트를 부르고 토스트를 띄웁니다. 푸시만의 특별한 점은 없고, 토큰은 인자 하나일 뿐입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/userDevice.store.ts"
          code={`import { msg } from "@apps/myapp/client";
import type { PushToken } from "@libs/util/webkit";
import { store } from "akanjs/store";
import { fetch, sig } from "../useClient";

export class UserDeviceStore extends store(sig.userDevice, () => ({
  // state
})) {
  // action
  async registerPushToken(pushToken: PushToken) {
    await fetch.registerPushToken(pushToken);
    msg.success("userDevice.pushTokenRegistered");
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="token-lifecycle"
        title={l.trans({ en: "Send And Retire Dead Tokens", ko: "발송과 죽은 토큰 정리" })}
      >
        <Docs.Title>{l.trans({ en: "Send And Retire Dead Tokens", ko: "발송과 죽은 토큰 정리" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The server sends through <code>PushNotificationServer</code> from <code>@libs/util/srvkit</code>. It
                  needs a Firebase Admin credential, and the service that calls it is where a device that uninstalled
                  the app gets cleaned up.
                </span>
              ),
              ko: (
                <span>
                  서버는 <code>@libs/util/srvkit</code>의 <code>PushNotificationServer</code>로 보냅니다. 여기에는
                  Firebase Admin 인증 정보가 필요하고, 앱을 지운 기기의 토큰을 정리하는 곳도 이것을 부르는 서비스입니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Server credential", ko: "서버 인증 정보" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Put the service account under <code>pushNoti.firebase</code> in each server env file:
                </span>
              ),
              ko: (
                <span>
                  서비스 계정을 각 서버 env 파일의 <code>pushNoti.firebase</code> 아래에 넣습니다:
                </span>
              ),
            })}
            <ExternalLink
              href="https://firebase.google.com/docs/admin/setup"
              label={l.trans({ en: "Open Firebase Admin setup docs", ko: "Firebase Admin 설정 문서 열기" })}
            />
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/env/env.server.local.ts"
          code={`import type { ModulesOptions } from "../lib/option";
import { libEnv } from "./env.server.type";

export const env: ModulesOptions = {
  ...libEnv,
  pushNoti: {
    firebase: {
      type: "service_account",
      project_id: "...",
      private_key_id: "...",
      private_key: "...",
      client_email: "...",
    },
  },
};`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {credentialNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>
                    Without <code>pushNoti.firebase</code>, <code>send()</code> sends nothing and throws nothing.
                  </strong>{" "}
                  It returns <code>undefined</code>, which a caller easily mistakes for success.
                </span>
              ),
              ko: (
                <span>
                  <strong>
                    <code>pushNoti.firebase</code>가 없으면 <code>send()</code>는 아무것도 보내지 않고, 오류도 던지지
                    않습니다.
                  </strong>{" "}
                  <code>undefined</code>만 돌려주므로 호출한 쪽에서 성공으로 착각하기 쉽습니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.SubSubTitle>userDevice.service.ts</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "The service registers, retires and sends, and turns FCM's dead-token answer into a retirement:",
              ko: "서비스는 토큰을 등록하고, 비활성화하고, 발송합니다. FCM이 죽은 토큰이라고 답하면 그 토큰을 비활성화합니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/userDevice/userDevice.service.ts"
          code={`import { PushNotificationServer } from "@libs/util/srvkit";
import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";
import * as db from "../db";

interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

export class UserDeviceService extends serve(db.userDevice, ({ plug }) => ({
  pushNotificationServer: plug(PushNotificationServer),
})) {
  async registerPushToken(userId: string, pushToken: db.UserDeviceInput) {
    const { token } = pushToken;
    const userDevice = await this.userDeviceModel.findByToken(token);
    if (userDevice) return await userDevice.set({ userId }).save();
    return await this.userDeviceModel.createUserDevice({
      ...pushToken,
      userId,
    });
  }
  async invalidatePushToken(token: string) {
    await this.userDeviceModel
      .updateByToken(token)
      .set({ disabledAt: dayjs() });
  }
  async notifyUser(userId: string, message: PushMessage) {
    const userDevices = await this.userDeviceModel.listOfUser(userId);
    return await Promise.all(
      userDevices.map((userDevice) => this.notify(userDevice.token, message)),
    );
  }
  async notify(token: string, message: PushMessage) {
    try {
      return await this.pushNotificationServer.send({ token, ...message });
    } catch (error) {
      // FCM answers a token the device dropped with this code, forever.
      const { code } = error as { code?: string };
      if (code !== "messaging/registration-token-not-registered") throw error;
      await this.invalidatePushToken(token);
      return null;
    }
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            {serviceNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "What send() takes", ko: "send()가 받는 값" })}</Docs.SubSubTitle>
          <Docs.OptionTable items={sendOptionRows} />
          <div>
            {l.trans({
              en: (
                <span>
                  <strong>Topics instead of stored tokens.</strong> <code>subscribeToTopic(token, topic)</code> and{" "}
                  <code>unsubscribeFromTopic(token, topic)</code> put a device on a topic, and{" "}
                  <code>{"send({ topic })"}</code> reaches every device on it. The <code>notification</code> module in{" "}
                  <code>libs/shared</code> uses <code>{"user-<userId>"}</code> and <code>all_users</code> this way.
                </span>
              ),
              ko: (
                <span>
                  <strong>토큰을 저장하는 대신 토픽을 쓸 수도 있습니다.</strong>{" "}
                  <code>subscribeToTopic(token, topic)</code>과 <code>unsubscribeFromTopic(token, topic)</code>으로
                  기기를 토픽에 넣고 빼며, <code>{"send({ topic })"}</code>는 그 토픽의 모든 기기에 닿습니다.{" "}
                  <code>libs/shared</code>의 <code>notification</code> 모듈이 <code>{"user-<userId>"}</code>와{" "}
                  <code>all_users</code> 토픽을 이렇게 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
