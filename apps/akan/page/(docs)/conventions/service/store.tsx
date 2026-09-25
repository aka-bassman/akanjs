import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const termRows: IntroItem[] = [
    {
      name: "state",
      desc: l.trans({
        en: "A value the store holds. A component that reads a key re-renders when that key changes.",
        ko: "store가 들고 있는 값입니다. key를 읽는 컴포넌트는 그 key가 바뀌면 다시 렌더링됩니다.",
      }),
    },
    {
      name: "action",
      desc: l.trans({
        en: "A method of the store class. Components call it as `st.do.<action>()`.",
        ko: "store 클래스의 method입니다. 컴포넌트는 `st.do.<action>()`으로 호출합니다.",
      }),
    },
    {
      name: ["st.use", "st.do"],
      desc: l.trans({
        en: "How a client component reads a key (`st.use.<key>()`) and runs an action (`st.do.<action>()`).",
        ko: "클라이언트 컴포넌트가 key를 읽고(`st.use.<key>()`) 액션을 실행하는(`st.do.<action>()`) 통로입니다.",
      }),
    },
    {
      name: "model store",
      desc: l.trans({
        en: "A store bound to a model's signal, `store(sig.<model>, …)`. Lists, forms and CRUD are generated.",
        ko: "model의 signal에 묶인 store, `store(sig.<model>, …)`입니다. 목록, 폼, CRUD가 자동으로 생깁니다.",
      }),
    },
    {
      name: "service store",
      desc: l.trans({
        en: 'A store bound to a plain name, `store("<name>" as const, …)`. Nothing is generated from a model.',
        ko: '이름 하나에 묶인 store, `store("<name>" as const, …)`입니다. model에서 생성되는 것이 없습니다.',
      }),
    },
  ];

  const workspaceRows: IntroItem[] = [
    {
      name: "libs/util/lib/_util",
      desc: l.trans({
        en: "The map viewport and the notification permission, plus two map actions.",
        ko: "지도 viewport와 알림 권한, 그리고 지도 액션 두 개입니다.",
      }),
    },
    {
      name: "libs/shared/lib/_shared",
      desc: l.trans({
        en: "No state. Only the `login` and `logout` actions.",
        ko: "상태는 없고, `login`과 `logout` 액션만 있습니다.",
      }),
    },
    {
      name: "apps/akan/lib/_akan",
      desc: l.trans({ en: "The empty scaffold.", ko: "빈 스캐폴드 그대로입니다." }),
    },
    {
      name: "apps/minimal/lib/_minimal",
      desc: l.trans({ en: "The empty scaffold.", ko: "빈 스캐폴드 그대로입니다." }),
    },
  ];

  const storeKindColumns = [
    { key: "model", label: "model store", caption: "store(sig.<model>, …)" },
    { key: "service", label: "service store", caption: 'store("<name>" as const, …)' },
  ];
  const modelOnly = { model: true, service: false };
  const both = { model: true, service: true };
  const storeKindGroups = [
    {
      label: l.trans({ en: "Generated from the model's slices", ko: "model의 slice에서 생성됨" }),
      rows: [
        {
          name: "<model>List · <model>Insight",
          desc: l.trans({
            en: "A list and its insight for every slice.",
            ko: "slice마다 목록과 insight가 하나씩 생깁니다.",
          }),
          marks: modelOnly,
        },
        {
          name: "pageOf<Model> · limitOf<Model>",
          desc: l.trans({ en: "Pagination state for every slice.", ko: "slice마다 페이지네이션 상태가 생깁니다." }),
          marks: modelOnly,
        },
        {
          name: "<model>Form · set<Field>On<Model>",
          desc: l.trans({
            en: "The edit form, with one setter per field.",
            ko: "편집 폼과, 필드마다 setter 하나가 생깁니다.",
          }),
          marks: modelOnly,
        },
        {
          name: "create<Model> · remove<Model>",
          desc: l.trans({
            en: "CRUD actions that call the generated endpoints.",
            ko: "자동 생성된 endpoint를 부르는 CRUD 액션입니다.",
          }),
          marks: modelOnly,
        },
      ],
    },
    {
      label: l.trans({ en: "Comes with every key you declare", ko: "선언한 key마다 따라옴" }),
      rows: [
        {
          name: "st.use.<key>()",
          desc: l.trans({
            en: "Subscribes a component to that one key.",
            ko: "컴포넌트를 그 key 하나에 구독시킵니다.",
          }),
          marks: both,
        },
        {
          name: "st.do.set<Key>(value)",
          desc: l.trans({
            en: "A setter for the key, unless the key is `search`/`computed` or an action has that name.",
            ko: "그 key의 setter입니다. `search`·`computed` key이거나 같은 이름의 액션이 있으면 생기지 않습니다.",
          }),
          marks: both,
        },
      ],
    },
    {
      label: l.trans({ en: "Written by you", ko: "직접 작성" }),
      rows: [
        {
          name: "<action>()",
          desc: l.trans({
            en: "Methods in the class body. Besides the key setters, a service store has no other actions.",
            ko: "class 본문의 method입니다. service store에는 key setter 말고는 이것이 액션의 전부입니다.",
          }),
          marks: both,
        },
      ],
    },
  ];

  const stateMethods: IntroItem[] = [
    {
      name: "this.set(state)",
      desc: l.trans({
        en: "The only way a value leaves an action. An object merges shallowly; a function edits an immer draft.",
        ko: "값이 액션 밖으로 나가는 유일한 길입니다. 객체를 넘기면 얕게 병합하고, 함수를 넘기면 immer draft를 고칩니다.",
      }),
      example: "this.set({ mapZoom: 8 });",
    },
    {
      name: "this.get()",
      desc: l.trans({
        en: "Returns the current state. Use it when a value may be missing.",
        ko: "현재 상태를 돌려줍니다. 값이 없을 수도 있을 때 씁니다.",
      }),
      example: "const { mapZoom } = this.get();",
    },
    {
      name: "this.pick(...keys)",
      desc: l.trans({
        en: 'Returns keys that must exist, and throws if one is `null`, `undefined` or `""`.',
        ko: '반드시 있어야 하는 key를 돌려줍니다. `null`, `undefined`, `""`이면 에러를 던집니다.',
      }),
      example: 'const { mapCenter } = this.pick("mapCenter");',
    },
  ];

  const returnColumns = [
    { key: "ok", label: l.trans({ en: "Allowed", ko: "허용" }) },
    { key: "lint", label: l.trans({ en: "Lint error", ko: "린트 에러" }) },
  ];
  const returnGroups = [
    {
      label: l.trans({ en: "Inside a store class", ko: "store 클래스 안에서" }),
      rows: [
        {
          name: "return value;",
          desc: l.trans({
            en: "A value returned from an action. No caller can ever read it.",
            ko: "액션이 돌려주는 값입니다. 어떤 호출자도 읽을 수 없습니다.",
          }),
          marks: { ok: false, lint: true },
        },
        {
          name: "return;",
          desc: l.trans({
            en: "A bare guard clause that ends the action early.",
            ko: "액션을 일찍 끝내는 값 없는 조건 탈출입니다.",
          }),
          marks: { ok: true, lint: false },
        },
        {
          name: "(x) => { return … }",
          desc: l.trans({
            en: "A return that belongs to a nested callback.",
            ko: "안쪽 callback에 속한 return입니다.",
          }),
          marks: { ok: true, lint: false },
        },
        {
          name: "get total() { … }",
          desc: l.trans({ en: "A getter is not an action.", ko: "getter는 액션이 아닙니다." }),
          marks: { ok: true, lint: false },
        },
        {
          name: "static helper() { … }",
          desc: l.trans({ en: "A static method is not an action either.", ko: "static method도 액션이 아닙니다." }),
          marks: { ok: true, lint: false },
        },
      ],
    },
  ];

  const boundaryColumns = [
    { key: "ok", label: l.trans({ en: "Allowed", ko: "허용" }) },
    { key: "lint", label: l.trans({ en: "Lint error", ko: "린트 에러" }) },
  ];
  const allowed = { ok: true, lint: false };
  const banned = { ok: false, lint: true };
  const boundaryGroups = [
    {
      label: l.trans({ en: "Client-safe", ko: "클라이언트에서 안전한 것" }),
      rows: [
        {
          name: "fetch.<endpoint>()",
          desc: l.trans({
            en: 'The generated client from `"../useClient"`, and the store\'s only way to the server.',
            ko: '`"../useClient"`의 생성된 client입니다. store가 서버에 닿는 유일한 길입니다.',
          }),
          marks: allowed,
        },
        {
          name: "../cnst · akanjs/client",
          desc: l.trans({
            en: "Model classes, `router`, `setAuth` and other browser-side helpers.",
            ko: "model 클래스와 `router`, `setAuth` 같은 브라우저 쪽 도구입니다.",
          }),
          marks: allowed,
        },
        {
          name: "import type { … }",
          desc: l.trans({
            en: "Erased before bundling, so a type from a server file is fine.",
            ko: "번들링 전에 지워지므로, 서버 파일의 타입이라도 괜찮습니다.",
          }),
          marks: allowed,
        },
      ],
    },
    {
      label: l.trans({ en: "Server-side or route-only", ko: "서버 전용이거나 route 전용인 것" }),
      rows: [
        {
          name: "*.service · *.signal · *.document · *.dictionary",
          desc: l.trans({
            en: "Server modules. One value import drags their whole graph into the browser bundle.",
            ko: "서버 module입니다. 값 import 하나로 그 의존성 전체가 브라우저 번들에 끌려옵니다.",
          }),
          marks: banned,
        },
        {
          name: "srvkit/ · ../srv · ../db · ../sig · ../dict",
          desc: l.trans({
            en: "Server-only folders and barrels, plus `option`, `useServer` and any `server` entrypoint.",
            ko: "서버 전용 폴더와 barrel, 그리고 `option`, `useServer`, 모든 `server` 진입점입니다.",
          }),
          marks: banned,
        },
        {
          name: "fetch.init<Model><Suffix>()",
          desc: l.trans({
            en: "Loaded by the route before the first byte. The client reloads via `st.do.init<Model><Suffix>()`.",
            ko: "route가 첫 바이트 전에 불러오는 초기 데이터입니다. 클라이언트는 `st.do.init<Model><Suffix>()`로 다시 불러옵니다.",
          }),
          marks: banned,
        },
      ],
    },
  ];

  const relatedLinks = [
    {
      href: "/conventions/module/store#writable-derived-state",
      title: "model.store.ts",
      desc: l.trans({
        en: "The `persist`, `session`, `search` and `computed` builders, and the state a model store generates.",
        ko: "`persist`, `session`, `search`, `computed` 빌더와 model store가 자동 생성하는 상태를 다룹니다.",
      }),
    },
    {
      href: "/conventions/service/signal",
      title: "service.signal.ts",
      desc: l.trans({
        en: "Declares the endpoints that `fetch.*` calls.",
        ko: "`fetch.*`가 부르는 endpoint를 선언합니다.",
      }),
    },
    {
      href: "/conventions/service/zone",
      title: "Service.Zone.tsx",
      desc: l.trans({
        en: "The client component that reads this store's keys.",
        ko: "이 store의 key를 읽는 클라이언트 컴포넌트입니다.",
      }),
    },
    {
      href: "/conventions/service/util",
      title: "Service.Util.tsx",
      desc: l.trans({
        en: "The control that runs one of this store's actions.",
        ko: "이 store의 액션 하나를 실행하는 컨트롤입니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="service-store" title="service.store.ts">
        <Docs.Title>service.store.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>{"<service>.store.ts"}</code> holds the client state and actions of a service module. Most
                  service modules never fill it, so it is the one file in the folder you will probably not need.
                </span>
              ),
              ko: (
                <span>
                  <code>{"<service>.store.ts"}</code>는 service module의 클라이언트 상태와 액션을 담습니다. 대부분의
                  service module은 이 파일을 비워 두므로, 폴더에서 가장 손댈 일이 적은 파일입니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "Fill it only when several components share a value, or a screen needs an action that calls the module's endpoint.",
              ko: "여러 컴포넌트가 같은 값을 함께 쓰거나, 화면에 module의 endpoint를 부르는 액션이 필요할 때만 채웁니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

          <Docs.SubSubTitle>
            {l.trans({ en: "How many service modules have one", ko: "store를 가진 service module은 몇 개인가" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Four of the eight service modules in this workspace have a store, and two of those four are still the empty scaffold:",
              ko: "이 워크스페이스의 service module 여덟 개 중 store가 있는 것은 넷이고, 그중 둘은 아직 빈 스캐폴드입니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Service module", ko: "service module" })}
            descLabel={l.trans({ en: "What its store holds", ko: "store에 든 것" })}
            items={workspaceRows}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  The other four — <code>_doc</code>, <code>_localFile</code>, <code>_security</code> and{" "}
                  <code>_oauth</code> — have no store file at all.
                </span>
              ),
              ko: (
                <span>
                  나머지 넷인 <code>_doc</code>, <code>_localFile</code>, <code>_security</code>, <code>_oauth</code>
                  에는 store 파일이 아예 없습니다.
                </span>
              ),
            })}
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "What a service store does not get", ko: "service store에 없는 것" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A model store is built from its signal's slices, so list, form and CRUD state arrive without code. A service store is bound to a name instead of a model, so it has only what you declare, plus a reader and a setter for each key.",
              ko: "model store는 signal의 slice로 만들어지므로 목록, 폼, CRUD 상태가 코드 없이 생깁니다. service store는 model이 아니라 이름에 묶이므로, 직접 선언한 것과 key마다 따라오는 읽기 함수와 setter만 있습니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "What exists", ko: "생기는 것" })}
            columns={storeKindColumns}
            groups={storeKindGroups}
            markLabel={l.trans({ en: "Exists", ko: "있음" })}
            emptyLabel={l.trans({ en: "Not there", ko: "없음" })}
          />

          <Docs.SubSubTitle>{l.trans({ en: "The skeleton", ko: "기본 뼈대" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>{"akan create-service <name>"}</code> writes the store empty, exactly like this one:
                </span>
              ),
              ko: (
                <span>
                  <code>{"akan create-service <name>"}</code>은 store를 이 파일과 똑같이 빈 채로 만듭니다:
                </span>
              ),
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
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The two comments stay.</strong> State goes inside the factory and actions go in the class
                    body. An empty file tells the next reader nothing else, so deleting them removes its only hint.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>주석 두 줄은 남깁니다.</strong> 상태는 factory 안에, 액션은 class 본문에 둡니다. 빈 파일이
                    다음 사람에게 주는 단서는 이 두 줄뿐이라, 지우면 아무것도 남지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>It is bound to a name.</strong> The first argument is the module name{" "}
                    <code>{'"minimal" as const'}</code>, where a model store passes <code>{"sig.<model>"}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>이름에 묶입니다.</strong> 첫 인자는 module 이름 <code>{'"minimal" as const'}</code>입니다.
                    model store라면 이 자리에 <code>{"sig.<model>"}</code>이 옵니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="state" title={l.trans({ en: "State The Screen Shares", ko: "화면이 함께 쓰는 상태" })}>
        <Docs.Title>{l.trans({ en: "State The Screen Shares", ko: "화면이 함께 쓰는 상태" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A key earns a place here when more than one component reads it. A map's viewport is the clearest case: the map draws it, a control panel edits it, a list filters by it, and none of them owns it.",
              ko: "여기에 둘 만한 상태는 컴포넌트 둘 이상이 읽는 값입니다. 지도의 viewport가 가장 좋은 예입니다. 지도는 그 값을 그리고, 컨트롤 패널은 바꾸고, 목록은 그 값으로 거르지만, 어느 컴포넌트도 주인이 아닙니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The util library keeps its viewport in its service store:",
              ko: "util 라이브러리는 지도 viewport를 service store에 둡니다:",
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
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Each key is its own subscription.</strong> A client component that calls{" "}
                    <code>st.use.mapZoom()</code> re-renders when <code>mapZoom</code> changes, and for nothing else.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>key마다 따로 구독합니다.</strong> <code>st.use.mapZoom()</code>을 부른 클라이언트 컴포넌트는{" "}
                    <code>mapZoom</code>이 바뀔 때만 다시 렌더링됩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Each key also gets a setter.</strong> The map writes back with{" "}
                    <code>st.do.setMapZoom(zoom)</code>, so a plain write needs no action.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>key마다 setter도 생깁니다.</strong> 지도는 <code>st.do.setMapZoom(zoom)</code>으로 값을
                    되돌려 씁니다. 값을 그대로 쓰는 데는 액션이 필요 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Derived work lives on the scalar.</strong> <code>Coordinate.getBounds</code> is a static on
                    the constant, so the server can call it too. The store only decides when to run it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파생 계산은 scalar에 둡니다.</strong> <code>Coordinate.getBounds</code>는 constant의
                    static이라 서버에서도 부를 수 있습니다. store는 언제 실행할지만 정합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The model store's state builders work here too.</strong> <code>persist</code>,{" "}
                    <code>session</code>, <code>search</code> and <code>computed</code> behave exactly as in a model
                    store. model.store.ts, linked at the bottom of this page, covers them.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>model store의 상태 빌더도 그대로 씁니다.</strong> <code>persist</code>, <code>session</code>
                    , <code>search</code>, <code>computed</code>는 model store에서와 똑같이 동작합니다. 자세한 내용은
                    페이지 맨 아래에 링크한 model.store.ts에 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="actions"
        title={l.trans({ en: "An Action Returns Nothing", ko: "액션은 값을 돌려주지 않습니다" })}
      >
        <Docs.Title>{l.trans({ en: "An Action Returns Nothing", ko: "액션은 값을 돌려주지 않습니다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Every method of a store class is called as <code>{"st.do.<action>()"}</code>, typed <code>void</code>{" "}
                  or <code>{"Promise<void>"}</code>. A value you return never reaches the caller, so write it into state
                  with <code>this.set()</code> instead.
                </span>
              ),
              ko: (
                <span>
                  store 클래스의 method는 모두 <code>{"st.do.<action>()"}</code>으로 호출되고, 타입은 <code>void</code>
                  나 <code>{"Promise<void>"}</code>입니다. return한 값은 호출한 쪽에 닿지 않으므로, 대신{" "}
                  <code>this.set()</code>으로 상태에 씁니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "The first action below shows the mistake and its fix. The second is a real action from the same store:",
              ko: "아래 첫 번째 액션은 흔한 실수와 그 수정이고, 두 번째는 같은 store의 실제 액션입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/util/lib/_util/util.store.ts"
            code={`async refreshNotiPermission() {
  const notiPermission = await Notification.requestPermission();
  this.set({ notiPermission }); // [!code ++]
  return notiPermission; // [!code --]
}

fitToScreenThroughCenterAndZoom(locations: cnst.Coordinate[], explicitZoom?: number) {
  const result = cnst.Coordinate.computeCenterAndZoomFromLocations(locations);
  if (!result) return;
  this.set({ mapCenter: result.center, mapZoom: explicitZoom ?? result.zoom });
}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Write, do not return.</strong> The component that needs <code>notiPermission</code> reads it
                    with <code>st.use.notiPermission()</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>돌려주지 말고 상태에 씁니다.</strong> <code>notiPermission</code>이 필요한 컴포넌트는{" "}
                    <code>st.use.notiPermission()</code>으로 읽습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A bare guard is fine.</strong> <code>if (!result) return;</code> ends the action early
                    without a value, which the lint rule allows.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>값 없는 조건 탈출은 괜찮습니다.</strong> <code>if (!result) return;</code>은 값 없이 액션을
                    일찍 끝내므로 린트 규칙이 허용합니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>
            {l.trans({ en: "Reading and writing inside an action", ko: "액션 안에서 읽고 쓰기" })}
          </Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Method", ko: "메서드" })} items={stateMethods} />

          <Docs.SubSubTitle>{l.trans({ en: "Which returns are allowed", ko: "허용되는 return" })}</Docs.SubSubTitle>
          <Docs.Matrix
            type={l.trans({ en: "Return", ko: "return 형태" })}
            columns={returnColumns}
            groups={returnGroups}
            markLabel={l.trans({ en: "Applies", ko: "해당" })}
            emptyLabel={l.trans({ en: "Does not apply", ko: "해당 없음" })}
          />

          <Docs.SubSubTitle>
            {l.trans({ en: "Errors: let the framework show them", ko: "에러는 프레임워크에 맡깁니다" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  An action never wraps its body in <code>try/catch</code>. A failure is one of two kinds, and each has
                  one fixed response:
                </span>
              ),
              ko: (
                <span>
                  액션은 본문을 <code>try/catch</code>로 감싸지 않습니다. 실패는 두 종류이고, 각각 대응이 정해져
                  있습니다:
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "The server refused", ko: "서버가 거절했을 때" })}
              </div>
              <div className="mt-1 text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      An <code>Err</code> the server throws comes back through <code>fetch</code> and already shows as a
                      toast in the dictionary's wording. A <code>catch</code> that swallows it turns that message into
                      silence.
                    </span>
                  ),
                  ko: (
                    <span>
                      서버가 던진 <code>Err</code>는 <code>fetch</code>를 거쳐 이미 dictionary 문구의 toast로 뜹니다.
                      그것을 삼키는 <code>catch</code>는 번역된 메시지를 지워 버립니다.
                    </span>
                  ),
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "A client check failed", ko: "클라이언트 검증이 실패했을 때" })}
              </div>
              <code className={chip}>{'msg.error("<key>"); return;'}</code>
              <div className="mt-2 text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      Show the dictionary key with <code>msg.error</code> and return early. Never <code>throw</code>.
                    </span>
                  ),
                  ko: (
                    <span>
                      <code>msg.error</code>로 dictionary key의 문구를 띄우고 바로 return합니다. <code>throw</code>는
                      하지 않습니다.
                    </span>
                  ),
                })}
              </div>
            </div>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="fetch" title={l.trans({ en: "Calling The Endpoint", ko: "endpoint 호출하기" })}>
        <Docs.Title>{l.trans({ en: "Calling The Endpoint", ko: "endpoint 호출하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A store is the one client file that calls <code>fetch.*</code>. Components read with{" "}
                  <code>st.use.*</code> and write with <code>st.do.*</code>, so two buttons that run the same action
                  cannot disagree about what it does.
                </span>
              ),
              ko: (
                <span>
                  store는 <code>fetch.*</code>를 부르는 유일한 클라이언트 파일입니다. 컴포넌트는 <code>st.use.*</code>로
                  읽고 <code>st.do.*</code>로 쓰므로, 같은 액션을 부르는 버튼 두 개가 서로 다르게 동작할 수 없습니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "The shared library's logout action is the whole shape:",
              ko: "shared 라이브러리의 logout 액션 하나에 그 모양이 다 들어 있습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="libs/shared/lib/_shared/shared.store.ts"
            code={`import { router, setAuth } from "akanjs/client";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import type { RootStore } from "../st";
import { fetch } from "../useClient";

export class SharedStore extends store("shared" as const, () => ({
  // state
})) {
  async logout() {
    const { jwt } = await fetch.signoutUser();
    setAuth({ jwt });
    (this as unknown as RootStore).set({ me: new cnst.Admin(), self: new cnst.User() });
    void (this as unknown as RootStore).getSelf({ jwt });
    router.refresh();
  }
}`}
          />
          <div>
            {l.trans({
              en: "Almost every store action follows the same three steps:",
              ko: "store 액션은 거의 모두 같은 세 단계를 따릅니다:",
            })}
          </div>
          <ol className="my-4 list-decimal space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Call the endpoint</strong> with <code>{"await fetch.<endpoint>(…)"}</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>{"await fetch.<endpoint>(…)"}</code>로 <strong>endpoint를 부릅니다</strong>.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Keep the result</strong> with <code>{"this.set({ … })"}</code>. Logout keeps a token, so it
                    calls <code>setAuth</code> instead.
                  </span>
                ),
                ko: (
                  <span>
                    <code>{"this.set({ … })"}</code>으로 <strong>결과를 저장합니다</strong>. logout은 토큰을 저장하므로
                    대신 <code>setAuth</code>를 부릅니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Tell the user or the router</strong>, with <code>{'msg.success("<key>")'}</code> or{" "}
                    <code>router.refresh()</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <code>{'msg.success("<key>")'}</code>나 <code>router.refresh()</code>로{" "}
                    <strong>사용자나 router에 알립니다</strong>.
                  </span>
                ),
              })}
            </li>
          </ol>
          <div>
            {l.trans({
              en: "A body much longer than this is usually a decision the service should have made.",
              ko: "이보다 훨씬 긴 본문은 대개 service가 내렸어야 할 결정입니다.",
            })}
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "What a store may reach", ko: "store가 닿을 수 있는 것" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  A store is a client file, so it ships in the browser bundle. It reaches the server only through the
                  generated <code>fetch</code>:
                </span>
              ),
              ko: (
                <span>
                  store는 클라이언트 파일이라 브라우저 번들에 들어갑니다. 서버에는 생성된 <code>fetch</code>로만
                  닿습니다:
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Import or call", ko: "import·호출" })}
            columns={boundaryColumns}
            groups={boundaryGroups}
            markLabel={l.trans({ en: "Applies", ko: "해당" })}
            emptyLabel={l.trans({ en: "Does not apply", ko: "해당 없음" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Reach another module's store through <code>RootStore</code>.
                    </strong>{" "}
                    Write <code>{'import type { RootStore } from "../st"'}</code>, then call its actions or{" "}
                    <code>{".set({ … })"}</code> its state through <code>(this as unknown as RootStore)</code>, as the
                    logout above does.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      다른 module의 store에는 <code>RootStore</code>로 닿습니다.
                    </strong>{" "}
                    <code>{'import type { RootStore } from "../st"'}</code>를 적은 뒤, 위의 logout처럼{" "}
                    <code>(this as unknown as RootStore)</code>로 그 액션을 부르거나 <code>{".set({ … })"}</code>로
                    상태를 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Keep it <code>import type</code>.
                    </strong>{" "}
                    Every store is mixed into one root at runtime, so the cast only tells the type what{" "}
                    <code>this</code> already is; a value import from <code>st.ts</code> would be a cycle.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>import type</code>으로만 가져옵니다.
                    </strong>{" "}
                    실행 중에는 모든 store가 하나의 root로 합쳐지므로 캐스팅은 <code>this</code>가 이미 무엇인지 타입에
                    알려 줄 뿐입니다. <code>st.ts</code>를 값으로 import하면 순환이 생깁니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>{l.trans({ en: "Related pages", ko: "함께 볼 페이지" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={relatedLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
