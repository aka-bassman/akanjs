import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, ExternalLink, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return (
    <Scroll>
      <Scroll.Slide id="deep-link-setup" title={l.trans({ en: "Deep Link Setup", ko: "Deep Link Setup" })}>
        <Docs.Title>{l.trans({ en: "Deep Link Setup", ko: "Deep Link Setup" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Deep links open a CSR route from outside the app. Use schemes for app-only URLs and domains for verified HTTPS links. Push notification clicks use the same routing path through data.url.",
              ko: "Deep link는 앱 바깥에서 CSR route를 여는 기능입니다. 앱 전용 URL은 schemes를 쓰고, 검증된 HTTPS 링크는 domains를 씁니다. Push notification 클릭도 data.url을 통해 같은 라우팅 경로를 사용합니다.",
            })}
          </div>
          <Docs.Alert type="info">
            {l.trans({
              en: "Think of deep link as the feature, and schemes/domains as the two common ways to implement it. Scheme links such as shop://orders/1 are easy to test and app-only. Domain links such as https://shop.example.com/orders/1 require iOS/Android verification, but they behave like normal web links and are better for sharing, emails, and push notification URLs.",
              ko: "Deep link는 기능 이름이고, scheme과 domain은 그 기능을 구현하는 대표적인 두 방식입니다. shop://orders/1 같은 scheme link는 테스트가 쉽고 앱 전용입니다. https://shop.example.com/orders/1 같은 domain link는 iOS/Android 검증 설정이 필요하지만 일반 웹 링크처럼 동작하므로 공유, 이메일, push notification URL에 더 적합합니다.",
            })}
          </Docs.Alert>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/akan.config.ts"
            code={`const config: AppConfig = {
  mobile: {
    targets: {
      default: {
        deepLinks: {
          schemes: ["shop"],
          domains: ["shop.example.com"],
          ios: {
            teamId: "TEAMID",
          },
          android: {
            sha256CertFingerprints: [
              "AA:BB:CC:DD:...",
            ],
          },
        },
      },
    },
  },
};`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="deep-link-fields" title={l.trans({ en: "The deepLinks Block", ko: "deepLinks 블록" })}>
        <Docs.Title>{l.trans({ en: "The deepLinks Block", ko: "deepLinks 블록" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every field is optional, and each platform reads only the half it needs. Declare the ones the link style you chose actually requires:",
              ko: "모든 필드는 optional이고, 플랫폼은 자기에게 필요한 절반만 읽습니다. 고른 link 방식이 실제로 요구하는 것만 적으면 됩니다:",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "schemes",
                type: "string[]",
                desc: l.trans({
                  en: "Custom app-only URLs such as shop://orders/1. Easy to test, but not domain-verified.",
                  ko: "shop://orders/1 같은 앱 전용 URL입니다. 테스트하기 쉽지만 도메인 검증 링크는 아닙니다.",
                }),
              },
              {
                key: "domains",
                type: "string[]",
                desc: l.trans({
                  en: "Verified HTTPS links such as https://shop.example.com/orders/1. iOS uses apple-app-site-association; Android uses assetlinks.json.",
                  ko: "https://shop.example.com/orders/1 같은 검증된 HTTPS 링크입니다. iOS는 apple-app-site-association, Android는 assetlinks.json을 사용합니다.",
                }),
              },
              {
                key: "ios.teamId",
                type: "string",
                desc: l.trans({
                  en: "Apple Developer Team ID used for universal link association files.",
                  ko: "universal link association file에 사용하는 Apple Developer Team ID입니다.",
                }),
              },
              {
                key: "android.sha256CertFingerprints",
                type: "string[]",
                desc: l.trans({
                  en: "Signing certificate fingerprints used by Android app links. Debug builds and release builds usually have different fingerprints, so list both.",
                  ko: "Android app link 검증에 사용하는 서명 인증서 fingerprint입니다. Debug build와 release build는 보통 fingerprint가 다르므로 둘 다 적습니다.",
                }),
              },
            ]}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Platform verification docs:", ko: "플랫폼 검증 문서:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({ en: "iOS — Universal Links", ko: "iOS — Universal Links" })}
                <ExternalLink
                  href="https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app"
                  label="Open Apple Universal Links docs"
                />
              </li>
              <li>
                {l.trans({ en: "Android — App Links", ko: "Android — App Links" })}
                <ExternalLink
                  href="https://developer.android.com/training/app-links"
                  label="Open Android App Links docs"
                />
              </li>
            </ul>
          </div>
          <div>
            {l.trans({
              en: "Read the Android debug fingerprint out of the debug keystore every machine already has, then add the release one from whatever keystore Play signing uses:",
              ko: "Android debug fingerprint는 어느 기기에나 있는 debug keystore에서 읽고, release fingerprint는 Play signing이 쓰는 keystore에서 따로 가져와 함께 적습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Android debug SHA-256"
            language="bash"
            code={`keytool -list -v \\
  -keystore ~/.android/debug.keystore \\
  -alias androiddebugkey \\
  -storepass android \\
  -keypass android`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
