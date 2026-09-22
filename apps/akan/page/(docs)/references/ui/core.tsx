import { usePage } from "@apps/akan/client";
import { Divider, Docs, DocsToc, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const components: UiComponentReference[] = [
    {
      name: "Link",
      desc: l.trans({
        en: "Route-aware navigation component. It renders CSR or SSR navigation depending on the Akan render mode, and falls back to a non-clickable div when disabled or href is empty. Every other anchor attribute passes straight through, so `target`, `rel`, and `aria-*` work as they would on `<a>`.",
        ko: "Route-aware navigation component입니다. Akan render mode에 따라 CSR 또는 SSR navigation을 렌더링하고, disabled이거나 href가 비어 있으면 클릭할 수 없는 div로 대체합니다. 나머지 anchor 속성은 그대로 전달되므로 `target`, `rel`, `aria-*`가 `<a>`에서와 똑같이 동작합니다.",
      }),
      props: [
        {
          name: "href",
          type: "string | null",
          desc: l.trans({
            en: "Destination route. Empty values render children without navigation.",
            ko: "이동할 route입니다. 값이 비어 있으면 navigation 없이 children만 렌더링합니다.",
          }),
        },
        {
          name: "disabled",
          type: "boolean",
          desc: l.trans({
            en: "Prevents navigation while keeping the same visual layout.",
            ko: "같은 visual layout을 유지하면서 navigation을 막습니다.",
          }),
        },
        {
          name: "activeClassName / activeExact",
          type: "string / boolean",
          desc: l.trans({
            en: "Class applied when the current route matches the link. `activeExact` narrows the match to the exact path instead of a prefix.",
            ko: "현재 route가 link와 일치할 때 적용되는 class입니다. `activeExact`를 켜면 prefix가 아니라 정확히 일치할 때만 적용됩니다.",
          }),
        },
        {
          name: "scrollToTop",
          type: "boolean",
          desc: l.trans({
            en: "Scrolls to the top after client-side navigation.",
            ko: "client-side navigation 이후 화면을 상단으로 스크롤합니다.",
          }),
        },
        {
          name: "replace",
          type: "boolean",
          desc: l.trans({
            en: "Replaces the current history entry instead of pushing a new one.",
            ko: "새 history entry를 쌓지 않고 현재 entry를 대체합니다.",
          }),
        },
        {
          name: "noCache",
          type: "boolean",
          desc: l.trans({
            en: "Bypasses the route cache for client-side navigation when the renderer supports it.",
            ko: "renderer가 지원하는 경우 client-side navigation에서 route cache를 우회합니다.",
          }),
        },
        {
          name: "Link.Back",
          type: "{ className?, children? }",
          desc: l.trans({
            en: "Calls `router.back()` on click. It is a plain `<div>` with a pointer cursor, not a button — hand it whatever mark the design wants, like the chevron `Layout.Navbar` puts in it by default.",
            ko: "클릭하면 `router.back()`을 호출합니다. button이 아니라 포인터 커서를 가진 평범한 `<div>`이므로, 디자인이 원하는 mark를 그대로 넣습니다. `Layout.Navbar`가 기본으로 넣는 chevron이 그 예입니다.",
          }),
        },
        {
          name: "Link.Close",
          type: "{ className?, children? }",
          desc: l.trans({
            en: "Calls `window.close()` on click — for a route opened in its own tab or window, such as a print view or an OAuth popup.",
            ko: "클릭하면 `window.close()`를 호출합니다. 인쇄 화면이나 OAuth 팝업처럼 자기 탭/창에서 열린 route를 위한 것입니다.",
          }),
        },
        {
          name: "Link.Lang",
          type: `{ lang: "ko" | "en" | string, className?, children? }`,
          desc: l.trans({
            en: "Calls `router.setLang(lang)` on click, which swaps the locale segment of the current route rather than navigating to a new one.",
            ko: "클릭하면 `router.setLang(lang)`을 호출합니다. 새 route로 이동하는 것이 아니라 현재 route의 locale 구간만 바꿉니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Use `Link` for every internal route and a bare `<a>` only for `mailto:` and external destinations.",
          ko: "내부 route에는 전부 `Link`를 쓰고, `mailto:`와 외부 주소에만 맨 `<a>`를 씁니다.",
        }),
      ],
      code: `import { Link } from "akanjs/ui";

export const ProductUnit = ({ product }) => (
  <Link href={\`/products/\${product.id}\`} className="block rounded-xl border p-4" activeClassName="border-primary">
    {product.name}
  </Link>
);`,
    },
    {
      name: "Image",
      desc: l.trans({
        en: "Akan image component for `ProtoFile` objects and direct URLs. It can derive width, height, and blur data from file metadata and uses the Akan image optimizer in SSR mode.",
        ko: "`ProtoFile` 객체와 직접 URL을 모두 받는 Akan image component입니다. file metadata에서 width, height, blur data를 가져올 수 있고 SSR mode에서는 Akan image optimizer를 사용합니다.",
      }),
      props: [
        {
          name: "src",
          type: "string",
          desc: l.trans({
            en: "Direct image URL. Takes precedence over file metadata.",
            ko: "직접 지정하는 image URL입니다. file metadata보다 우선합니다.",
          }),
        },
        {
          name: "file",
          type: "ProtoFile | file-like",
          desc: l.trans({
            en: "File object with `url`, `imageSize`, and optional `abstractData`.",
            ko: "`url`, `imageSize`, optional `abstractData`를 가진 file 객체입니다.",
          }),
        },
        {
          name: "abstractData",
          type: "string",
          desc: l.trans({ en: "Blur/placeholder preview data.", ko: "blur/placeholder preview data입니다." }),
        },
        {
          name: "priority / preload",
          type: "boolean",
          desc: l.trans({
            en: "Marks the image as high-priority and eager-loaded.",
            ko: "image를 high-priority 및 eager-loaded 대상으로 표시합니다.",
          }),
        },
        {
          name: "unoptimized",
          type: "boolean",
          desc: l.trans({
            en: "Skips Akan image optimization.",
            ko: "Akan image optimization을 건너뜁니다.",
          }),
        },
      ],
      code: `import { Image } from "akanjs/ui";

export const Avatar = ({ user }) => (
  <Image file={user.profileImage} alt={user.nickname} width={48} height={48} className="rounded-full" />
);`,
    },
    {
      name: "Layout",
      desc: l.trans({
        en: "The page shell. Four of these are content containers you reach for inside a module (`Template`, `Unit`, `View`, `Zone`); the rest register a frame slot — a top inset, a bottom inset, a drawer — so the route knows how much chrome sits above and below the scrolling body. A slot-registering member reserves its space before it measures, which is what keeps a mobile route from reflowing once the navbar mounts.",
        ko: "page shell입니다. 이 중 넷(`Template`, `Unit`, `View`, `Zone`)은 module 안에서 쓰는 content container이고, 나머지는 frame slot을 등록합니다 — 위쪽 inset, 아래쪽 inset, drawer — 그래서 route가 스크롤 본문 위아래에 chrome이 얼마나 있는지 압니다. slot을 등록하는 member는 측정 전에 자리를 먼저 잡습니다. mobile route가 navbar 마운트 후에 다시 흐르지 않는 이유입니다.",
      }),
      props: [
        {
          name: "Layout.Template",
          type: "{ className?, children? }",
          desc: l.trans({
            en: "Vertical form container with the spacing a module `Template` expects.",
            ko: "module `Template`이 기대하는 간격을 가진 세로 form container입니다.",
          }),
        },
        {
          name: "Layout.Unit",
          type: "{ className?, children, href? }",
          desc: l.trans({
            en: "List/card item container. Given `href` the whole unit becomes one `Link`.",
            ko: "list/card item container입니다. `href`를 주면 unit 전체가 `Link` 하나가 됩니다.",
          }),
        },
        {
          name: "Layout.View",
          type: "{ className?, children }",
          desc: l.trans({
            en: "Width-constrained detail page container.",
            ko: "폭이 제한된 detail page container입니다.",
          }),
        },
        {
          name: "Layout.Zone",
          type: "{ className?, children }",
          desc: l.trans({
            en: "Section container for feature zones and page blocks.",
            ko: "feature zone과 page block을 위한 section container입니다.",
          }),
        },
        {
          name: "Layout.Navbar",
          type: "{ className?, children?, height?, back? }",
          desc: l.trans({
            en: "Portals its `children` into the route's top inset. `back` draws a back control in the top-left slot: `true` for the framework chevron — a close glyph instead when the route's transition is bottomUp, scaleOut, or fade — or a node of your own.",
            ko: "`children`을 route의 top inset으로 portal합니다. `back`은 좌상단 slot에 뒤로가기 control을 그립니다. `true`면 framework chevron이고, route transition이 bottomUp·scaleOut·fade일 때는 대신 닫기 glyph가 나옵니다. 직접 만든 node를 넘겨도 됩니다.",
          }),
        },
        {
          name: "Layout.Header",
          type: `{ className?, children?, height?, type? }`,
          desc: l.trans({
            en: 'Web-style sticky header. `type="hide"` (the default) slides it away as the user scrolls down and back on the way up; `"static"` keeps it put.',
            ko: 'web 스타일 sticky header입니다. 기본값 `type="hide"`는 아래로 스크롤하면 접히고 위로 올리면 돌아옵니다. `"static"`은 고정합니다.',
          }),
        },
        {
          name: "Layout.TopInset",
          type: "{ className?, children, estimatedHeight? }",
          desc: l.trans({
            en: "The top chrome slot itself, for content that is not a navbar. `estimatedHeight` is the space reserved before the real height is measured.",
            ko: "navbar가 아닌 내용을 위한 상단 chrome slot 자체입니다. `estimatedHeight`는 실제 높이를 재기 전에 잡아 두는 공간입니다.",
          }),
        },
        {
          name: "Layout.TopLeftAction",
          type: "{ className?, children }",
          desc: l.trans({
            en: "The top-left corner of the inset — where `Layout.Navbar`'s `back` lands. Use it directly for a corner control a navbar does not own.",
            ko: "inset의 좌상단 모서리입니다. `Layout.Navbar`의 `back`이 놓이는 자리이며, navbar가 소유하지 않는 모서리 control은 여기에 직접 넣습니다.",
          }),
        },
        {
          name: "Layout.BottomInset",
          type: "{ className?, children, keyboardSticky?, role?, estimatedHeight? }",
          desc: l.trans({
            en: "The bottom chrome slot. `keyboardSticky` rides above the on-screen keyboard, and `role` separates permanent bottom chrome from a keyboard accessory bar so the two can coexist.",
            ko: "하단 chrome slot입니다. `keyboardSticky`는 화면 키보드 위에 붙어 따라가고, `role`은 상시 하단 chrome과 키보드 액세서리 바를 구분해 둘이 함께 있을 수 있게 합니다.",
          }),
        },
        {
          name: "Layout.BottomTab",
          type: "{ className?, tabs, height?, renderTab? }",
          desc: l.trans({
            en: "The app's bottom tab bar. Each tab is `{ name, icon, activeIcon?, notiCount?, href }`; `renderTab` draws one tab's body while the link, the route match, and the badge placement stay the framework's.",
            ko: "앱의 하단 tab bar입니다. tab은 각각 `{ name, icon, activeIcon?, notiCount?, href }`이고, `renderTab`은 tab 하나의 본문만 그립니다. link, route 일치 판정, badge 위치는 framework가 유지합니다.",
          }),
        },
        {
          name: "Layout.Sider",
          type: "{ className?, bgClassName?, trigger?, header?, close?, children? }",
          desc: l.trans({
            en: "Self-contained drawer: it owns its open state and ships a hamburger `trigger` and a close row you can replace.",
            ko: "자체 완결형 drawer입니다. open 상태를 스스로 갖고, 교체 가능한 햄버거 `trigger`와 닫기 행을 함께 제공합니다.",
          }),
        },
        {
          name: "Layout.LeftSider",
          type: "{ open, onCancel, children, width?, close? }",
          desc: l.trans({
            en: "Controlled left drawer. `close={false}` draws no close control.",
            ko: "controlled 좌측 drawer입니다. `close={false}`면 닫기 control을 그리지 않습니다.",
          }),
        },
        {
          name: "Layout.RightSider",
          type: "{ open, onCancel, children, title?, width?, close? }",
          desc: l.trans({
            en: "Controlled right drawer, with a title slot the left one does not have.",
            ko: "controlled 우측 drawer이며, 좌측에는 없는 title slot이 있습니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`Layout.Navbar` also accepts `title`, `left`, and `right` in its prop type, but the component renders none of the three — only `children` and `back` reach the DOM. Compose the title and the trailing controls inside `children` until that changes.",
          ko: "`Layout.Navbar`의 prop 타입에는 `title`, `left`, `right`도 있지만 컴포넌트는 셋 다 렌더하지 않습니다. DOM에 닿는 것은 `children`과 `back`뿐이므로, 제목과 오른쪽 control은 이 상태가 바뀌기 전까지 `children` 안에서 조합하세요.",
        }),
      ],
      code: `import { Layout, Link } from "akanjs/ui";

export const OrderNavbar = ({ order }) => (
  <Layout.Navbar back>
    <div className="flex w-full items-center justify-between">
      <div className="font-bold">{order.name}</div>
      <Link href={\`/order/\${order.id}/edit\`}>Edit</Link>
    </div>
  </Layout.Navbar>
);

export const OrderUnit = ({ order }) => (
  <Layout.Unit href={\`/order/\${order.id}\`}>
    <div className="font-bold">{order.name}</div>
  </Layout.Unit>
);`,
    },
    {
      name: "Load",
      desc: l.trans({
        en: "The bridge between an Akan fetch result and React rendering. Every member takes a resolved value or a promise, and gives a pending promise a Suspense boundary of its own — so one slow section never holds the rest of the page, and the same call site works whether the route awaited the data or handed the promise across.",
        ko: "Akan fetch 결과와 React 렌더링을 잇는 다리입니다. 모든 member가 해소된 값과 promise를 모두 받고, 아직 pending인 promise에는 자체 Suspense boundary를 줍니다. 느린 section 하나가 나머지 페이지를 붙잡지 않으며, route가 데이터를 await했든 promise를 그대로 넘겼든 같은 호출부가 동작합니다.",
      }),
      props: [
        {
          name: "Load.Units",
          type: "{ init, renderItem?, renderList?, empty?, loading?, filter?, sort?, pagination?, staleTime? }",
          desc: l.trans({
            en: "Renders a slice's list and seeds the client store from it, so the generated pagination, query, sort, and refresh actions keep working after hydration. `from` / `to` window the rendered rows without refetching; `staleTime` is how old the seeded data may be before the client refetches on mount, and `0` always refetches.",
            ko: "slice의 목록을 렌더하고 그 데이터로 client store를 seed하므로, hydration 이후에도 generated pagination·query·sort·refresh action이 동작합니다. `from` / `to`는 다시 불러오지 않고 렌더할 행 범위만 자르고, `staleTime`은 마운트 시 다시 불러오기 전까지 seed된 데이터가 얼마나 오래되어도 되는지이며 `0`이면 항상 다시 불러옵니다.",
          }),
        },
        {
          name: "Load.View",
          type: "{ view, renderView, loading?, empty?, noDiv?, className? }",
          desc: l.trans({
            en: "Hydrates one full model and renders it through `renderView`. `noDiv` drops the default wrapper element.",
            ko: "full model 하나를 hydrate하고 `renderView`로 렌더합니다. `noDiv`를 켜면 기본 wrapper element를 그리지 않습니다.",
          }),
        },
        {
          name: "Load.Edit",
          type: "{ edit, slice, type?, modal?, loading?, draft?, renderSubmit?, submitText?, ... }",
          desc: l.trans({
            en: "The edit shell. `edit` takes the resolved payload, the `x<Model>Edit` promise, or a partial form seed for a new record; `type` picks `modal`, a plain `form`, or `empty` for a shell that renders only its children.",
            ko: "edit shell입니다. `edit`는 해소된 payload, `x<Model>Edit` promise, 새 레코드용 부분 form seed를 모두 받습니다. `type`은 `modal`, 평범한 `form`, children만 렌더하는 `empty` 중 하나를 고릅니다.",
          }),
        },
        {
          name: "Load.Pagination",
          type: "{ init, className?, scrollToTop? }",
          desc: l.trans({
            en: "The pager for a slice, taking the same `init` the list did. Use it when the list and its pager are not siblings — `Load.Units` draws its own when `pagination` is on. `scrollToTop` returns to the top of the list after a page change.",
            ko: "slice의 pager이며 목록과 같은 `init`을 받습니다. 목록과 pager가 형제가 아닐 때 씁니다 — `pagination`을 켠 `Load.Units`는 자기 pager를 직접 그립니다. `scrollToTop`은 페이지 이동 후 목록 맨 위로 돌아갑니다.",
          }),
        },
        {
          name: "Load.Page",
          type: "{ of, loader, render, loading?, noCache? }",
          desc: l.trans({
            en: "The SSR/CSR page loader wrapper. `of` is the route component the CSR wrapper mounts, `loader` the async fetch both modes share.",
            ko: "SSR/CSR 공용 page loader wrapper입니다. `of`는 CSR wrapper가 마운트할 route component이고, `loader`는 두 mode가 공유하는 async fetch입니다.",
          }),
        },
        {
          name: "Load.Stream",
          type: "{ of, fallback?, children }",
          desc: l.trans({
            en: "Awaits one promise behind its own Suspense boundary and calls `children` with the value — for data no other `Load.*` covers, such as a slice's `x<Model>List<Suffix>`. A resolved value renders in the shell with no boundary at all.",
            ko: "promise 하나를 자체 Suspense boundary 뒤에서 await하고 그 값을 `children`에 넘깁니다. 다른 `Load.*`가 다루지 않는 데이터 — 예를 들어 slice의 `x<Model>List<Suffix>` — 를 위한 것입니다. 이미 해소된 값은 boundary 없이 shell에 렌더됩니다.",
          }),
        },
        {
          name: "draft",
          type: "boolean | string",
          desc: l.trans({
            en: "Form recovery, on by default, on `Load.Edit` and every `Model` shell that opens a form. The shell saves the whole form as the user types and offers it back on the next open, scoped to the record id for an edit and to the seed plus the route for a new form, under the signed-in user. `false` turns it off; a string names the scope when the context is in neither the id nor the seed. `field.secret` and `field.hidden` values are never saved.",
            ko: "form 복구이며 기본으로 켜져 있습니다. `Load.Edit`과 form을 여는 모든 `Model` shell에 적용됩니다. 사용자가 입력하는 동안 form 전체를 저장했다가 다음에 열 때 돌려주며, scope는 edit이면 record id, new면 seed와 route이고 로그인한 사용자별로 분리됩니다. `false`면 끄고, 문자열이면 scope를 직접 지정합니다. `field.secret`과 `field.hidden` 값은 저장하지 않습니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Hand each promise across rather than the awaited value: `const { xInitInY, xListInY } = fetch.initXInY(id)` puts both queries in flight and gives each section its own boundary. `xListInY` and `xInsightInY` hold hydrated model instances that React Flight refuses as client props, so consume those in a server component, never as a `Zone` prop.",
          ko: "await한 값 대신 promise를 그대로 넘기세요. `const { xInitInY, xListInY } = fetch.initXInY(id)`는 두 query를 동시에 띄우고 section마다 자기 boundary를 줍니다. `xListInY`와 `xInsightInY`는 hydrate된 model instance를 담고 있어 React Flight가 client prop으로 거절하므로, server component에서 소비하고 `Zone` prop으로는 넘기지 마세요.",
        }),
        l.trans({
          en: "Never persist form values yourself. The old per-field `cache` / `cacheKey` props are deprecated and store nothing — they covered five control types, keyed on the translated label, and restored over server data. Draft recovery replaced them.",
          ko: "form 값을 직접 저장하지 마세요. 예전의 field별 `cache` / `cacheKey` prop은 deprecated이며 아무것도 저장하지 않습니다. control 다섯 종류만 다뤘고, 번역된 label을 key로 썼으며, 서버 데이터 위에 덮어썼습니다. draft 복구가 그 자리를 대신합니다.",
        }),
      ],
      code: `import { fetch, Product } from "@apps/shop/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load, Loading } from "akanjs/ui";

export default page()
  .param("shopId", ID)
  .param("productId", ID)
  .render(({ shopId, productId }) => {
    const { productView } = fetch.viewProduct(productId);
    const { productInitInShop, productListInShop } = fetch.initProductInShop(shopId);
    return (
      <>
        <Load.View view={productView} renderView={(product) => <Product.View.General product={product} />} />
        <Load.Units init={productInitInShop} renderItem={(product) => <Product.Unit.Card product={product} />} />
        <Load.Pagination init={productInitInShop} scrollToTop />
        <Load.Stream of={productListInShop} fallback={<Loading.Skeleton active />}>
          {(productList) => <Product.Unit.Total count={productList.length} />}
        </Load.Stream>
      </>
    );
  });`,
    },
    {
      name: "Model",
      desc: l.trans({
        en: "The CRUD shells for a generated model store. They come in three shapes: a one-line pairing of a trigger and its modal (`New`, `Edit`), a wrapper that turns whatever you put inside it into that trigger (`NewWrapper`, `EditWrapper`, `ViewWrapper`, `RemoveWrapper`), and a body that renders in place (`View`, `EditModal`, `AdminPanel`). Every export carries its own Suspense boundary, because these mount on interaction long after the page is painted.",
        ko: "generated model store를 위한 CRUD shell입니다. 세 가지 모양이 있습니다. trigger와 modal을 한 줄로 묶은 것(`New`, `Edit`), 안에 넣은 것을 그대로 trigger로 만드는 wrapper(`NewWrapper`, `EditWrapper`, `ViewWrapper`, `RemoveWrapper`), 그리고 제자리에 렌더하는 본문(`View`, `EditModal`, `AdminPanel`)입니다. 모든 export가 자기 Suspense boundary를 갖습니다. 페이지가 그려지고 한참 뒤 상호작용 시점에 마운트되기 때문입니다.",
      }),
      props: [
        {
          name: "Model.New",
          type: "{ slice, children, trigger?, partial?, renderTitle?, modal?, namespace?, draft? }",
          desc: l.trans({
            en: "A create trigger and its modal in one line. `children` is the form body the modal renders — the module's own `Template` — and `trigger` is the control that opens it, defaulting to the framework's `+ New` button. `partial` seeds the form; `namespace` suffixes the published tool, and only a second create trigger for the same slice needs one.",
            ko: "생성 trigger와 modal을 한 줄로 묶습니다. `children`은 modal이 렌더할 form 본문 — module 자신의 `Template` — 이고, `trigger`는 그것을 여는 control이며 기본값은 framework의 `+ New` 버튼입니다. `partial`이 form을 seed하고, `namespace`는 공개되는 tool 이름에 접미사를 붙입니다. 같은 slice의 두 번째 생성 trigger에만 필요합니다.",
          }),
        },
        {
          name: "Model.Edit",
          type: "{ slice, modelId, children, trigger?, renderTitle?, modal?, draft? }",
          desc: l.trans({
            en: "The same pairing for one record. `children` is the form body, `trigger` the control, defaulting to the framework's edit button.",
            ko: "레코드 하나에 대한 같은 묶음입니다. `children`이 form 본문이고 `trigger`가 control이며, 기본값은 framework의 수정 버튼입니다.",
          }),
        },
        {
          name: "Model.EditModal",
          type: "{ slice, edit?, children, type?, id?, renderTitle?, submitText?, renderSubmit?, onSubmit?, onCancel?, draft?, draftBarClassName? }",
          desc: l.trans({
            en: "The modal editing shell itself, without a trigger — for a route that opens the editor from its own state. `renderSubmit={false}` hides the default submit; `onSubmit` / `onCancel` take a store action name or a callback.",
            ko: "trigger 없는 modal 편집 shell 자체입니다. 자체 상태로 editor를 여는 route를 위한 것입니다. `renderSubmit={false}`면 기본 제출 버튼을 숨기고, `onSubmit` / `onCancel`은 store action 이름이나 callback을 받습니다.",
          }),
        },
        {
          name: "Model.NewWrapper",
          type: "{ slice, children, partial?, setDefault?, modal?, resets?, namespace?, draft? }",
          desc: l.trans({
            en: "Turns its children into a create trigger — a card, a row, an empty-state panel. `resets` names the store keys cleared when the form opens.",
            ko: "children을 생성 trigger로 만듭니다 — 카드, 행, 빈 상태 패널 등. `resets`는 form이 열릴 때 비울 store key를 지정합니다.",
          }),
        },
        {
          name: "Model.EditWrapper",
          type: "{ slice, modelId, children, modal?, disabled?, resets?, draft? }",
          desc: l.trans({ en: "The same, for editing one record.", ko: "같은 방식이며, 레코드 하나를 수정합니다." }),
        },
        {
          name: "Model.ViewWrapper",
          type: "{ slice, modelId, children, modal?, resets? }",
          desc: l.trans({
            en: "The same, opening the view modal.",
            ko: "같은 방식이며, 상세 보기 modal을 엽니다.",
          }),
        },
        {
          name: "Model.RemoveWrapper",
          type: "{ slice, modelId, name, children, modal? }",
          desc: l.trans({ en: "The same, opening the removal flow.", ko: "같은 방식이며, 삭제 흐름을 엽니다." }),
        },
        {
          name: "Model.View",
          type: "{ model, render, modelLoading?, loading?, empty?, loadingWrapper?, className? }",
          desc: l.trans({
            en: "Renders a loaded model, a loading state, or an empty state from one nullable model plus a loading flag. It is the store-side sibling of `Load.View`, which takes a fetch promise instead.",
            ko: "nullable model 하나와 loading 플래그로 로드된 model·loading·empty 상태를 렌더합니다. fetch promise를 받는 `Load.View`의 store 쪽 형제입니다.",
          }),
        },
        {
          name: "Model.ViewModal",
          type: "{ id, slice, renderView, renderTitle?, renderAction?, modal?, modalClassName?, viewClassName? }",
          desc: l.trans({
            en: "The detail view in a modal, with a title and an action slot.",
            ko: "modal 안의 상세 보기이며 title과 action slot을 갖습니다.",
          }),
        },
        {
          name: "Model.ViewEditModal",
          type: "{ slice, renderView, renderTemplate, renderTitle?, menu?, editLabel?, saveLabel? }",
          desc: l.trans({
            en: "One modal that flips between the detail view and the form. `menu={false}` draws no kebab, which also takes the remove entry off the modal.",
            ko: "상세 보기와 form 사이를 오가는 modal 하나입니다. `menu={false}`면 케밥 메뉴를 그리지 않으며, 그러면 삭제 항목도 modal에서 사라집니다.",
          }),
        },
        {
          name: "Model.Remove",
          type: "{ slice, modelId, children, name?, title?, description?, action?, modal?, redirect? }",
          desc: l.trans({
            en: "Removal behind a confirmation modal. `children` is the trigger; `title` / `description` / `action` are the modal's slots. Replacing `action` takes over the removal — call nothing else and the record stays.",
            ko: "확인 modal을 거치는 삭제입니다. `children`이 trigger이고, `title` / `description` / `action`이 modal의 slot입니다. `action`을 교체하면 삭제 동작까지 직접 맡아야 하며, 아무것도 호출하지 않으면 레코드는 그대로 남습니다.",
          }),
        },
        {
          name: "Model.SureToRemove",
          type: "{ slice, modelId, name, trigger?, title?, description?, confirmLabel?, typeNameToRemove?, redirect? }",
          desc: l.trans({
            en: "The heavier removal: a confirmation whose `typeNameToRemove` makes the user type `name` back before the delete button enables. It takes no `children` at all — `trigger` is the whole control.",
            ko: "더 무거운 삭제입니다. `typeNameToRemove`를 켜면 삭제 버튼이 활성화되기 전에 사용자가 `name`을 직접 입력해야 합니다. `children`은 아예 받지 않고, `trigger`가 control 전체입니다.",
          }),
        },
        {
          name: "Model.AdminPanel",
          type: "{ slice, components, columns?, actions?, tools?, summaryColumns?, insightColumns?, queryMap? }",
          desc: l.trans({
            en: "A whole admin screen from the generated `Unit` / `Template` / `View` namespaces — listing, toolbar, dashboard tiles, and the CRUD modals. A role without a `General` export is skipped.",
            ko: "generated `Unit` / `Template` / `View` namespace로 만드는 admin 화면 전체입니다. 목록, toolbar, dashboard 타일, CRUD modal을 포함합니다. `General` export가 없는 role은 건너뜁니다.",
          }),
        },
        {
          name: "Model.LoadInit / Model.LoadView",
          type: "{ init } / { view }",
          desc: l.trans({
            en: "Seed the client store from a fetch result and render nothing. Reach for them where the markup is already server-rendered and only the store still needs the data.",
            ko: "fetch 결과로 client store를 seed하고 아무것도 렌더하지 않습니다. markup은 이미 서버에서 렌더됐고 store만 데이터가 필요한 자리에 씁니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Use `Model` components inside a module's `Util`, `View`, or `Zone` files, where the generated store actions are already in scope.",
          ko: "generated store action이 이미 닿는 module의 `Util`, `View`, `Zone` 파일 안에서 `Model` component를 사용하세요.",
        }),
        l.trans({
          en: "`trigger` replaces the control that opens the modal, and nothing else does: `Model.New` and `Model.Edit` spend their `children` on the form body and carry no `className`, and `Model.SureToRemove` takes no children at all.",
          ko: "modal을 여는 control을 바꾸는 것은 `trigger`뿐입니다. `Model.New`와 `Model.Edit`의 `children`은 form 본문이고 `className`도 없으며, `Model.SureToRemove`는 children을 아예 받지 않습니다.",
        }),
      ],
      code: `import { fetch, Product } from "@apps/shop/client";
import { buttonRecipe, Model } from "akanjs/ui";

export const ProductActions = ({ productId, name }) => (
  <div className="flex gap-2">
    <Model.Edit slice={fetch.slice.product} modelId={productId}>
      <Product.Template.General />
    </Model.Edit>
    <Model.SureToRemove slice={fetch.slice.product} modelId={productId} name={name} typeNameToRemove />
  </div>
);

export const ProductNew = () => (
  <Model.New
    slice={fetch.slice.product}
    partial={{ status: "draft" }}
    trigger={<button className={buttonRecipe({ variant: "primary" })}>New product</button>}
  >
    <Product.Template.General />
  </Model.New>
);`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="core-ui" title={l.trans({ en: "Core UI", ko: "Core UI" })}>
        <Docs.Title>{l.trans({ en: "Core UI", ko: "Core UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Core UI components are the most common `akanjs/ui` imports in apps and libs. They compose routing, images, layout containers, fetch loading, and model store workflows.",
              ko: "Core UI component는 apps/libs에서 가장 자주 import되는 `akanjs/ui` 요소입니다. routing, image, layout container, fetch loading, model store workflow를 조합합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Three of the five are namespaces, and the split inside each is worth knowing before you pick a member: `Layout` separates content containers from frame slots, `Load` separates a list from a view from a stream, and `Model` separates a button from a wrapper from a body.",
              ko: "다섯 중 셋이 namespace이며, member를 고르기 전에 각 namespace 안의 구분을 알아 두면 좋습니다. `Layout`은 content container와 frame slot을, `Load`는 목록·상세·stream을, `Model`은 버튼·wrapper·본문을 나눕니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {components.map((component) => (
        <UiComponentSlide key={component.name} component={component} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
