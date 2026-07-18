import { usePage } from "@apps/akan/client";
import { Code, Docs } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();
  const symbols = [
    {
      name: "lazy",
      desc: l.trans({
        en: "React lazy wrapper that supports `ssr: false`. It returns a fallback stub on the server and gates client rendering until mounted, which is useful for browser-only libraries such as maps, charts, and 3D scenes.",
        ko: "`ssr: false`를 지원하는 React lazy wrapper입니다. server에서는 fallback stub을 반환하고 mount될 때까지 client rendering을 막아 map, chart, 3D scene 같은 browser-only library에 유용합니다.",
      }),
      code: `import { lazy } from "akanjs/webkit";

const Globe = lazy(() => import("./Globe"), {
  ssr: false,
  loading: () => <div>Loading globe...</div>,
});`,
    },
    {
      name: "useDebounce",
      desc: l.trans({
        en: "Returns a debounced callback that delays execution until input quiets down. Search boxes, image editors, and expensive field updates use it to avoid repeated work while users type or drag.",
        ko: "input이 잠잠해질 때까지 실행을 지연하는 debounced callback을 반환합니다. search box, image editor, expensive field update에서 사용자가 입력하거나 drag하는 동안 반복 작업을 피할 때 사용합니다.",
      }),
      code: `import { useDebounce } from "akanjs/webkit";

const onSearch = useDebounce((query: string) => {
  void fetch.search(query);
}, [], 300);`,
    },
    {
      name: "useInterval",
      desc: l.trans({
        en: "Runs the latest callback on a fixed interval and clears the timer on unmount. Zone components use it for polling metrics, game state, build logs, and realtime-like dashboards.",
        ko: "latest callback을 fixed interval로 실행하고 unmount 시 timer를 정리합니다. Zone component는 metric, game state, build log, realtime-like dashboard polling에 사용합니다.",
      }),
      code: `import { useInterval } from "akanjs/webkit";

useInterval(async () => {
  await st.do.refresh();
}, 3000);`,
    },
    {
      name: "useThrottle",
      desc: l.trans({
        en: "Returns a throttled callback that runs immediately, then ignores calls until the delay passes. Use it for scroll, pointer, resize, or drag handlers that can fire too frequently.",
        ko: "즉시 실행된 뒤 delay가 지날 때까지 호출을 무시하는 throttled callback을 반환합니다. 너무 자주 실행될 수 있는 scroll, pointer, resize, drag handler에 사용합니다.",
      }),
      code: `import { useThrottle } from "akanjs/webkit";

const onMove = useThrottle((x: number, y: number) => {
  setPosition({ x, y });
}, 100);`,
    },
    {
      name: "useFetch / useFetchFn",
      desc: l.trans({
        en: "Client hook for promise-backed values. `useFetch` accepts a promise or immediate value, while `useFetchFn` memoizes a factory so re-renders do not duplicate network requests.",
        ko: "promise-backed value를 위한 client hook입니다. `useFetch`는 promise 또는 immediate value를 받고, `useFetchFn`은 re-render가 network request를 중복하지 않도록 factory를 memoize합니다.",
      }),
      code: `import { useFetchFn } from "akanjs/webkit";

const { fulfilled, value } = useFetchFn(() => fetch.user(userId), [userId]);`,
    },
    {
      name: "useLocation / useHistory",
      desc: l.trans({
        en: "CSR router hooks for translating hrefs into route state and tracking navigation history. They power cached page transitions, scroll restoration, and back/forward detection.",
        ko: "href를 route state로 변환하고 navigation history를 추적하는 CSR router hook입니다. cached page transition, scroll restoration, back/forward detection을 구동합니다.",
      }),
      code: `import { useHistory, useLocation } from "akanjs/webkit";

const { getLocation } = useLocation({ rootRouteGuide });
const history = useHistory([getLocation(location.href)]);`,
    },
    {
      name: "LoginForm",
      desc: l.trans({
        en: "Shared login form type used by auth stores and bridge UI. It describes target auth mode, redirect behavior, unauthorized path, and optional JWT handoff.",
        ko: "auth store와 bridge UI에서 사용하는 shared login form type입니다. target auth mode, redirect behavior, unauthorized path, optional JWT handoff를 설명합니다.",
      }),
      code: `import type { LoginForm } from "akanjs/webkit";

const form: LoginForm = {
  auth: "user",
  redirect: "/",
};`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-webkit" title="akanjs/webkit">
        <Docs.Title>akanjs/webkit</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/webkit` contains browser-only React helpers: lazy browser components, debounce/throttle/interval hooks, promise state, and CSR navigation state. Native Capacitor hooks (camera, contact, location, push) are not part of the framework core — they live in `@libs/util/webkit` and activate via the matching Akan plugins.",
              ko: "`akanjs/webkit`은 browser-only React helper를 제공합니다: lazy browser component, debounce/throttle/interval hook, promise state, CSR navigation state. 네이티브 Capacitor hook(camera, contact, location, push)은 프레임워크 코어가 아니라 `@libs/util/webkit`에 있으며 대응하는 Akan plugin으로 활성화됩니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <div className="divider" />
      {symbols.map((symbol) => (
        <Scroll.Slide key={symbol.name} id={symbol.name} title={symbol.name}>
          <Docs.Title>{symbol.name}</Docs.Title>
          <Docs.Description>
            <div>{symbol.desc}</div>
          </Docs.Description>
          <Code.Snippet title={l.trans({ en: "Usage", ko: "사용 예시" })} language="typescript" code={symbol.code} />
        </Scroll.Slide>
      ))}
      <Scroll.TitleNavigator className="fixed top-32 right-0 hidden w-[250px] flex-col gap-2 lg:flex" />
    </Scroll>
  );
}
