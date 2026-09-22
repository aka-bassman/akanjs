import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="service-store" title="service.store.ts">
        <Docs.Title>service.store.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Four of the eight service modules in this workspace have a store, and two of those four are empty. That ratio is the first thing to know about this file: it is the only one in the folder you are expected not to need.",
              ko: "이 워크스페이스의 service module 여덟 중 넷에 store가 있고, 그 넷 중 둘은 비어 있습니다. 이 파일에 대해 가장 먼저 알아야 할 것이 그 비율입니다. 이 folder에서 필요 없을 것으로 기대되는 유일한 파일입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A model store is generated: declare a slice and you get list state, form state, pagination and the CRUD actions without writing any of them. A service store is bound to a name rather than a model, so none of that arrives. What you declare is what exists.",
              ko: "model store는 생성됩니다. slice를 선언하면 list state, form state, pagination, CRUD action이 아무것도 쓰지 않아도 생깁니다. service store는 model이 아니라 이름에 묶이므로 그중 무엇도 오지 않습니다. 선언한 것이 있는 것의 전부입니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/minimal/lib/_minimal/minimal.store.ts"
            code={`import { store } from "akanjs/store";

export class MinimalStore extends store("minimal" as const, () => ({
  // state
})) {
  // action
}`}
          />
          <div>
            {l.trans({
              en: "Two comments, and they stay. They are the empty scaffold marking where each half goes — state inside the factory, actions in the class body — and deleting them costs the next reader the one thing the file was telling them.",
              ko: "주석 두 줄이고, 그대로 둡니다. 각 절반이 어디로 가는지 표시하는 빈 스캐폴드입니다. state는 factory 안, action은 class 본문입니다. 지우면 이 파일이 다음 읽는 사람에게 해 주던 유일한 말을 없애는 셈입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="state" title={l.trans({ en: "State The Screen Shares", ko: "화면이 공유하는 상태" })}>
        <Docs.Title>{l.trans({ en: "State The Screen Shares", ko: "화면이 공유하는 상태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The state that earns a place here is the state more than one component reads. A map's viewport is the clearest case: the map draws it, a control panel edits it, a list filters by it, and none of them owns it.",
              ko: "여기에 자리를 얻는 state는 component 둘 이상이 읽는 state입니다. 지도의 viewport가 가장 분명한 예입니다. 지도가 그것을 그리고, 컨트롤 패널이 그것을 바꾸고, 목록이 그것으로 거르지만, 어느 것도 그것을 소유하지 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_util/util.store.ts"
            code={`import { store } from "akanjs/store";

import * as cnst from "../cnst";

export class UtilStore extends store("util" as const, () => ({
  notiPermission: "default" as NotificationPermission,
  mapCenter: { type: "Point", coordinates: [127.0016985, 37.5642135] } as cnst.Coordinate,
  mapZoom: 8,
  mapBounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
  mapPanControl: true,
})) {
  fitToScreenByCoordinate(...coordinates: cnst.Coordinate[]) {
    this.set({ mapBounds: cnst.Coordinate.getBounds(...coordinates) });
  }
}`}
          />
          <div>
            {l.trans({
              en: "Every key in the factory becomes a subscription: st.use.mapZoom() in a client component re-renders it when the value changes, and nothing else does. The derived work is a static on the scalar — Coordinate.getBounds lives on the constant, where the server can call it too, and the store only decides when to run it.",
              ko: "factory의 모든 key는 구독이 됩니다. client component의 st.use.mapZoom()은 값이 바뀔 때 다시 그려지고, 그 밖의 무엇으로도 다시 그려지지 않습니다. 파생 계산은 scalar의 static입니다. Coordinate.getBounds는 constant에 있어서 server에서도 호출할 수 있고, store는 그것을 언제 돌릴지만 정합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="actions"
        title={l.trans({ en: "An Action Returns Nothing", ko: "Action은 아무것도 돌려주지 않는다" })}
      >
        <Docs.Title>{l.trans({ en: "An Action Returns Nothing", ko: "Action은 아무것도 돌려주지 않는다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Every method on a store class is dispatched through st.do.<action>(), and that dispatch is typed void. A value you return is not narrowed, not wrapped, and not delivered — it is unreachable. Write it into state with this.set({ ... }) instead; a lint rule refuses the return, and a bare return; guard clause stays fine.",
              ko: "store class의 모든 method는 st.do.<action>()으로 dispatch되고, 그 dispatch는 void로 타입이 정해져 있습니다. 돌려준 값은 좁혀지지도, 감싸이지도, 전달되지도 않습니다. 닿을 수 없습니다. 대신 this.set({ ... })으로 state에 씁니다. lint 규칙이 return을 거부하며, 조건 탈출용 맨 return;은 그대로 괜찮습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="A service store action"
            code={`async refreshNotiPermission() {
  const notiPermission = await requestNotiPermission();
  this.set({ notiPermission }); // [!code ++]
  return notiPermission; // [!code --]
}

fitToScreenThroughCenterAndZoom(locations: cnst.Coordinate[], explicitZoom?: number) {
  const result = cnst.Coordinate.computeCenterAndZoomFromLocations(locations);
  if (!result) return;
  this.set({ mapCenter: result.center, mapZoom: explicitZoom ?? result.zoom });
}`}
          />
          <div className="my-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary">📥</span>
              <div>
                <strong>this.set({"{ ... }"})</strong>:{" "}
                {l.trans({
                  en: "the only way a value leaves an action. Partial — name the keys that changed",
                  ko: "값이 action 밖으로 나가는 유일한 방법입니다. 부분 갱신이므로 바뀐 key만 적습니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">📤</span>
              <div>
                <strong>this.get()</strong>:{" "}
                {l.trans({
                  en: "reads current state when the value may be missing. this.pick(key) when it must exist",
                  ko: "값이 없을 수도 있을 때 현재 state를 읽습니다. 반드시 있어야 하면 this.pick(key)입니다",
                })}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">🚪</span>
              <div>
                <strong>{"return;"}</strong>:{" "}
                {l.trans({
                  en: "a bare guard clause, a return inside a nested callback, a getter and a static helper are all still legal",
                  ko: "맨 조건 탈출, 중첩 callback 안의 return, getter, static helper는 전부 그대로 허용됩니다",
                })}
              </div>
            </div>
          </div>
          <div>
            {l.trans({
              en: 'An action does not try/catch either. A fetch that throws an Err is already a toast the framework raises with the dictionary\'s own wording, and a catch that swallows it replaces a translated message with silence. Client-side validation failure is msg.error("<key>") plus an early return, never a throw.',
              ko: 'action은 try/catch도 하지 않습니다. Err를 던진 fetch는 이미 framework가 dictionary의 문구로 띄우는 toast이고, 그것을 삼키는 catch는 번역된 메시지를 침묵으로 바꿉니다. 클라이언트 쪽 검증 실패는 msg.error("<key>")와 이른 return이지 throw가 아닙니다.',
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="fetch" title={l.trans({ en: "Calling The Endpoint", ko: "Endpoint 호출하기" })}>
        <Docs.Title>{l.trans({ en: "Calling The Endpoint", ko: "Endpoint 호출하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A store is the one client file that calls fetch.*. A component never does: it reads with st.use.* and writes with st.do.*, and the round trip in between belongs here so that two components clicking the same button cannot disagree about what happens.",
              ko: "store는 fetch.*를 호출하는 유일한 client 파일입니다. component는 호출하지 않습니다. st.use.*로 읽고 st.do.*로 쓰며, 그 사이의 왕복은 여기에 둡니다. 그래야 같은 버튼을 누른 component 둘이 무슨 일이 일어나는지에 대해 다르게 말하지 않습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_shared/shared.store.ts"
            code={`import { router, setAuth } from "akanjs/client";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import { fetch } from "../useClient";

export class SharedStore extends store("shared" as const, () => ({
  // state
})) {
  async logout() {
    const { jwt } = await fetch.signoutUser();
    setAuth({ jwt });
    this.set({ me: new cnst.Admin(), self: new cnst.User() });
    router.refresh();
  }
}`}
          />
          <div>
            {l.trans({
              en: "Three lines and a navigation: call the endpoint, write the result into state, tell the router. That is the whole shape of a store action, and a body much longer than this one is usually a decision the service should have made.",
              ko: "세 줄과 이동 하나입니다. endpoint를 호출하고, 결과를 state에 쓰고, router에 알립니다. 그것이 store action의 전체 모양이고, 이보다 훨씬 긴 본문은 보통 service가 내렸어야 할 결정입니다.",
            })}
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  Never write <code>import type &#123; RootStore &#125; from "../st"</code> and cast <code>this</code>{" "}
                  through it to reach another module's state. It crashes <code>akan build</code> with a Bun SSR
                  segfault. The two service stores in <code>libs/</code> still do it — they are the wart the rule was
                  written about, not the pattern to copy. Reach another module's state from the component, by reading
                  both stores.
                </span>
              ),
              ko: (
                <span>
                  <code>import type &#123; RootStore &#125; from "../st"</code>를 적고 <code>this</code>를 그 타입으로
                  캐스팅해 다른 module의 state에 닿으려 하지 마세요. <code>akan build</code>가 Bun SSR segfault로
                  죽습니다. <code>libs/</code>의 service store 둘이 아직 그렇게 하고 있는데, 복사할 패턴이 아니라 이
                  규칙이 쓰이게 된 원인입니다. 다른 module의 state는 component에서 store 둘을 함께 읽어 닿습니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <div>
            {l.trans({
              en: "One more boundary: a store is a client file, so it may not import a service, a signal, a document, a dictionary, or anything under srvkit/. It reaches the server only through the generated fetch, and it may not call fetch.init* at all — that one is a hydration snapshot the route resolves before the first byte.",
              ko: "경계가 하나 더 있습니다. store는 client 파일이므로 service, signal, document, dictionary, srvkit/ 아래의 무엇도 import할 수 없습니다. 서버에는 생성된 fetch로만 닿고, fetch.init*은 아예 호출할 수 없습니다. 그것은 route가 첫 바이트 이전에 해소하는 hydration 스냅샷입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
