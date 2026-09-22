import { usePage } from "@apps/akan/client";
import { Divider, Docs, DocsToc, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const components: UiComponentReference[] = [
    {
      name: "Data",
      desc: l.trans({
        en: "The admin listing, in parts. `Data.ListContainer` is the whole screen — toolbar, dashboard tiles, the list in either rendering, and the CRUD modals — and every other member is one piece of it, exported so a screen that wants a different arrangement composes rather than forks. All of them take the same `slice`, the generated metadata that says which model and which store keys the listing is reading.",
        ko: "admin 목록 화면을 부품으로 나눈 namespace입니다. `Data.ListContainer`가 화면 전체 — toolbar, dashboard 타일, 두 가지 렌더링의 목록, CRUD modal — 이고, 나머지 member는 그 조각들입니다. 배치를 다르게 하고 싶은 화면이 fork 대신 조합할 수 있도록 공개되어 있습니다. 모두 같은 `slice`를 받으며, 이것이 어떤 model과 어떤 store key를 읽는지 알려 주는 generated metadata입니다.",
      }),
      props: [
        {
          name: "Data.ListContainer",
          type: "{ slice, type?, query?, queryMap?, init?, create?, columns?, tools?, actions?, renderItem?, renderDashboard?, ... }",
          desc: l.trans({
            en: 'The whole listing. `type` picks the starting rendering and the toolbar toggles it; `query` fixes the filter, and given one the panel is scoped and offers no query maker. A column is a field name or `{ key, title?, render?, responsive?, only? }`, and an action is `"view"` / `"edit"` / `"remove"` or an element of your own — both also take a factory that receives the loaded list.',
            ko: '목록 화면 전체입니다. `type`이 시작 렌더링을 고르고 toolbar가 그것을 전환합니다. `query`를 주면 filter가 고정되고 panel은 범위가 좁혀져 query maker를 제공하지 않습니다. column은 field 이름이거나 `{ key, title?, render?, responsive?, only? }`이고, action은 `"view"` / `"edit"` / `"remove"` 또는 직접 만든 element입니다. 둘 다 불러온 목록을 받는 factory로도 넘길 수 있습니다.',
          }),
        },
        {
          name: "Data.TableList",
          type: "{ slice, columns, init?, queryArgs?, actions?, renderView?, renderTemplate?, onItemClick? }",
          desc: l.trans({
            en: "The listing as rows. It owns its own CRUD modals, so it works standalone.",
            ko: "행으로 표시하는 목록입니다. 자기 CRUD modal을 직접 갖고 있어 단독으로도 동작합니다.",
          }),
        },
        {
          name: "Data.CardList",
          type: "{ slice, columns, renderItem, init?, actions?, renderView?, renderLoading? }",
          desc: l.trans({
            en: "The same listing as cards. `renderItem` receives the model plus the slice, so a card can open the same modals the table does.",
            ko: "같은 목록을 카드로 표시합니다. `renderItem`이 model과 slice를 함께 받으므로, 카드에서도 table과 같은 modal을 열 수 있습니다.",
          }),
        },
        {
          name: "Data.Item",
          type: "{ slice, model, cover?, title?, actions?, columns?, onClick?, children? }",
          desc: l.trans({
            en: "One card. `cover` and `title` are slots; `actions` draws the row's action controls with the store wiring already done.",
            ko: "카드 하나입니다. `cover`와 `title`은 slot이고, `actions`는 store 배선이 끝난 행 action control을 그립니다.",
          }),
        },
        {
          name: "Data.Pagination",
          type: "{ slice, className? }",
          desc: l.trans({
            en: "The pager, reading page state from the slice's store rather than from props.",
            ko: "pager입니다. 페이지 상태를 prop이 아니라 slice의 store에서 읽습니다.",
          }),
        },
        {
          name: "Data.Dashboard",
          type: "{ slice, summary, columns?, presents?, queryMap?, summaryRefName?, onSelect?, queryKey? }",
          desc: l.trans({
            en: "Summary tiles above the list. A tile narrows the listing when its own field declares a query with `.meta(...)`, or when `queryMap` names one; with neither it renders as a plain tile. `queryKey` is the filter the listing is showing, so a tile stops looking active once the toolbar moves off it.",
            ko: "목록 위의 요약 타일입니다. 타일의 field가 `.meta(...)`로 query를 선언했거나 `queryMap`이 지정하면 그 타일이 목록을 좁힙니다. 둘 다 없으면 단순 타일로 렌더됩니다. `queryKey`는 목록이 현재 보여 주는 filter이며, toolbar가 다른 곳으로 옮겨 가면 타일의 활성 표시가 풀립니다.",
          }),
        },
        {
          name: "Data.Insight",
          type: "{ slice, insight, columns? }",
          desc: l.trans({
            en: "The model's own insight values — the aggregates a slice returns beside its rows. The header already carries the total count, so name the others.",
            ko: "model의 insight 값입니다. slice가 행과 함께 돌려주는 집계이며, 전체 개수는 header가 이미 보여 주므로 나머지를 지정하세요.",
          }),
        },
        {
          name: "Data.QueryMaker",
          type: "{ slice, query?, onApply? }",
          desc: l.trans({
            en: "The filter builder: pick one of the model's declared filters, fill its args, apply. `onApply` defaults to the slice's own store, which is where a listing reads it.",
            ko: "filter 작성기입니다. model이 선언한 filter 중 하나를 고르고 인자를 채워 적용합니다. `onApply`의 기본값은 slice의 store이며, 목록이 filter를 읽는 곳도 거기입니다.",
          }),
        },
        {
          name: "Data.RefPicker",
          type: "{ refName, value, onChange }",
          desc: l.trans({
            en: "The id picker a filter arg gets when its `ref` names a model — how a filter taking an owner id is filled by hand.",
            ko: "filter 인자의 `ref`가 model을 가리킬 때 붙는 id picker입니다. owner id를 받는 filter를 손으로 채우는 방법입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`Data.*` is the admin surface. A product screen composes `Load.Units` with the module's own `Unit` and `Zone` components instead — these carry a toolbar, a query maker, and a data export, which is a lot of client JS for a list a visitor only reads.",
          ko: "`Data.*`는 admin 표면입니다. 제품 화면은 대신 module 자신의 `Unit`·`Zone` component와 `Load.Units`를 조합하세요. 이쪽은 toolbar, query maker, 데이터 내보내기를 함께 싣는데, 방문자가 읽기만 하는 목록에는 client JS가 너무 많습니다.",
        }),
      ],
      code: `import { Data } from "akanjs/ui";

export const ProductZone = ({ slice }) => (
  <Data.ListContainer
    slice={slice}
    type="list"
    columns={["name", "status", "createdAt"]}
    actions={["view", "edit", "remove"]}
  />
);`,
    },
    {
      name: "RecentTime",
      desc: l.trans({
        en: "Localized relative-time label with a tooltip containing the absolute date. It switches from relative labels to formatted dates after the configured break unit.",
        ko: "절대 시간을 tooltip으로 제공하는 localized relative-time label입니다. 설정한 break unit 이후에는 relative label 대신 formatted date로 전환됩니다.",
      }),
      props: [
        {
          name: "date",
          type: "Date | Dayjs | null",
          desc: l.trans({
            en: "Date value to render. Null renders nothing.",
            ko: "렌더링할 date 값입니다. null이면 아무것도 렌더링하지 않습니다.",
          }),
        },
        {
          name: "breakUnit",
          type: "Intl.RelativeTimeFormatUnit",
          desc: l.trans({
            en: "Unit where relative display stops and date formatting begins.",
            ko: "relative display를 멈추고 date formatting을 시작할 기준 unit입니다.",
          }),
        },
        {
          name: "format",
          type: '"auto" | "full"',
          desc: l.trans({
            en: "Automatic compact format or full date-time format.",
            ko: "자동 compact format 또는 전체 date-time format입니다.",
          }),
        },
        {
          name: "relative",
          type: '"fromNow" | "always" | "auto" | (ctx) => string',
          desc: l.trans({
            en: 'Relative phrasing. `"fromNow"` (default) is dayjs locale strings. `"always"` / `"auto"` use Intl (`1 day ago` vs `yesterday`). A function replaces the relative label.',
            ko: '상대 시각 문구. `"fromNow"`(기본)는 dayjs locale 문자열, `"always"` / `"auto"`는 Intl(`1일 전` vs `어제`)입니다. 함수는 relative label을 직접 바꿉니다.',
          }),
        },
      ],
      code: `import { RecentTime } from "akanjs/ui";

export const StoryMeta = ({ story }) => (
  <div className="text-sm text-foreground/60">
    <RecentTime date={story.createdAt} relative="auto" />
  </div>
);`,
    },
    {
      name: "Loading",
      desc: l.trans({
        en: "Six indicators, one per shape of thing that is waiting. Pick by what the reader is looking at: a skeleton where content will appear, a spinner where a control is working, a progress bar where the work has a known end. Each member is an independent override slot, so an app can re-skin the skeleton without touching the spinner.",
        ko: "기다리는 대상의 모양마다 하나씩, 여섯 개의 indicator입니다. 읽는 사람이 보고 있는 것에 맞춰 고르세요. 곧 내용이 들어올 자리에는 skeleton, 동작 중인 control 자리에는 spinner, 끝이 정해진 작업에는 progress bar입니다. 각 member가 독립된 override slot이라서, spinner를 건드리지 않고 skeleton만 다시 스킨할 수 있습니다.",
      }),
      props: [
        {
          name: "Loading.Spin",
          type: `{ className?, indicator?, isCenter?, size?, tone? }`,
          desc: l.trans({
            en: "The spinner. `size` is a named step or a pixel number; `tone=\"current\"` inherits the surface's foreground, which is what a filled surface needs — `text-primary/70` is legible on the app background and vanishes on a `bg-info` badge. A replacement `indicator` carries its own colour; the rotation is the wrapper's, so it needs no `animate-spin`.",
            ko: 'spinner입니다. `size`는 이름 있는 단계이거나 픽셀 숫자이고, `tone="current"`는 표면의 foreground를 그대로 씁니다. 채워진 표면에는 이쪽이 필요합니다 — `text-primary/70`은 앱 배경에서는 읽히지만 `bg-info` badge 위에서는 사라집니다. 교체한 `indicator`는 자기 색을 갖고, 회전은 wrapper가 담당하므로 `animate-spin`을 붙일 필요가 없습니다.',
          }),
        },
        {
          name: "Loading.Skeleton",
          type: "{ className?, active?, style? }",
          desc: l.trans({
            en: "The shape content will take, pulsing while `active`. This is the `fallback` a `Load.Stream` or a Suspense boundary wants.",
            ko: "내용이 들어올 자리의 모양이며, `active`인 동안 깜빡입니다. `Load.Stream`이나 Suspense boundary의 `fallback`에 어울리는 것이 이것입니다.",
          }),
        },
        {
          name: "Loading.ProgressBar",
          type: "{ className?, value, max }",
          desc: l.trans({
            en: "A determinate bar. Reach for it only when `value` and `max` are both real — an upload, a multi-step job — and a spinner otherwise.",
            ko: "진행률이 정해진 막대입니다. `value`와 `max`가 둘 다 실제 값일 때 — 업로드, 여러 단계로 나뉜 작업 — 에만 쓰고, 그 밖에는 spinner를 쓰세요.",
          }),
        },
        {
          name: "Loading.Button",
          type: "{ className?, active?, style? }",
          desc: l.trans({
            en: "A button-shaped placeholder, for a control that is not there yet. Not the in-button spinner — `Button` grows that itself when its handler returns a promise.",
            ko: "아직 없는 control 자리를 채우는 button 모양 placeholder입니다. button 안의 spinner가 아닙니다. 그쪽은 handler가 promise를 반환할 때 `Button`이 스스로 만듭니다.",
          }),
        },
        {
          name: "Loading.Input",
          type: "{ className?, active?, style? }",
          desc: l.trans({
            en: "The same, shaped like a field.",
            ko: "같은 것이며 field 모양입니다.",
          }),
        },
        {
          name: "Loading.Area",
          type: "{ className?, indicator?, children? }",
          desc: l.trans({
            en: "An `absolute inset-0` scrim with a centred mark and a message, for a region whose content is on screen but busy. It needs a positioned ancestor. `children` replaces the localized processing message, `indicator` the spinner above it.",
            ko: "`absolute inset-0` 막이며, 가운데 mark와 메시지를 둡니다. 내용은 화면에 있지만 작업 중인 영역을 위한 것이라, 위치가 지정된 조상이 필요합니다. `children`은 번역된 처리 중 메시지를, `indicator`는 그 위 spinner를 대체합니다.",
          }),
        },
      ],
      code: `import { Loading } from "akanjs/ui";

export const UploadProgress = ({ sent, total }) => (
  <div className="flex items-center gap-3">
    <Loading.Spin size="sm" tone="current" />
    <Loading.ProgressBar value={sent} max={total} className="flex-1" />
  </div>
);`,
    },
    {
      name: "Badge",
      desc: l.trans({
        en: "The status pill. It is a `<span>` plus the `badgeRecipe` variants and nothing else — every other attribute passes through, so `title`, `aria-*`, and a click handler all work. Because the recipe resolves through the route's recipe slot, an app can restyle every badge at once by binding `recipes: { badge }` in an `_overrides.tsx`, without touching a call site.",
        ko: "상태 pill입니다. `<span>`에 `badgeRecipe` variant를 얹은 것이 전부이고 나머지 속성은 그대로 전달되므로, `title`, `aria-*`, click handler가 모두 동작합니다. recipe가 route의 recipe slot을 통해 결정되기 때문에, 앱은 `_overrides.tsx`에서 `recipes: { badge }`만 bind하면 호출부를 하나도 건드리지 않고 모든 badge를 한 번에 다시 칠할 수 있습니다.",
      }),
      props: [
        {
          name: "variant",
          type: `"default" | "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "info" | "error" | "outline"`,
          desc: l.trans({
            en: "The colour. Map a model enum to one through a module-scope `as const` table rather than a conditional at the call site.",
            ko: "색입니다. 호출부의 조건식 대신 module scope의 `as const` 표로 model enum을 여기에 매핑하세요.",
          }),
        },
        {
          name: "size",
          type: `"xs" | "sm" | "md" | "lg"`,
          desc: l.trans({
            en: "Height and text size. `md` by default.",
            ko: "높이와 글자 크기입니다. 기본값은 `md`입니다.",
          }),
        },
        {
          name: "outline",
          type: "boolean",
          desc: l.trans({
            en: "Keeps the variant's colour and draws it as an outline instead of a fill.",
            ko: "variant의 색은 유지하고 채움 대신 외곽선으로 그립니다.",
          }),
        },
        {
          name: "...HTMLAttributes<HTMLSpanElement>",
          type: "attributes",
          desc: l.trans({
            en: "Everything a `<span>` takes, `className` included — merged by the recipe, so a utility here wins over the variant.",
            ko: "`<span>`이 받는 모든 것이며 `className`도 포함합니다. recipe가 병합하므로 여기서 준 utility가 variant를 이깁니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "For the classes without the element — a badge look on an `<a>` or a `<button>` — call `badgeRecipe(variants, className)` directly. It is server-safe and takes an array as its second argument, so it never needs `cn()` around it.",
          ko: "element 없이 class만 필요할 때 — `<a>`나 `<button>`에 badge 모양을 입힐 때 — 는 `badgeRecipe(variants, className)`를 직접 호출하세요. server에서도 안전하고 두 번째 인자로 배열도 받으므로 `cn()`으로 감쌀 필요가 없습니다.",
        }),
      ],
      code: `import { Badge } from "akanjs/ui";

const toneOf = {
  ready: "info",
  running: "warning",
  done: "success",
} as const;

export const StatusBadge = ({ status }) => <Badge variant={toneOf[status]}>{status}</Badge>;`,
    },
    {
      name: "Empty",
      desc: l.trans({
        en: "Standard no-data state with a localized default description and optional content below the empty body.",
        ko: "localized default description과 optional child content를 제공하는 표준 no-data state입니다.",
      }),
      props: [
        {
          name: "description",
          type: "ReactNode",
          desc: l.trans({
            en: "Custom empty-state text. Defaults to localized `base.noData`.",
            ko: "custom empty-state text입니다. 기본값은 localized `base.noData`입니다.",
          }),
        },
        {
          name: "icon",
          type: "ReactNode",
          desc: l.trans({
            en: "The mark above the description. Defaults to the framework inbox glyph.",
            ko: "description 위 mark입니다. 기본값은 프레임워크 inbox glyph입니다.",
          }),
        },
        {
          name: "minHeight",
          type: "number",
          desc: l.trans({ en: "Minimum empty body height in pixels.", ko: "empty body의 최소 높이(px)입니다." }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({
            en: "Optional follow-up action or explanation rendered below the empty state.",
            ko: "empty state 아래에 렌더링되는 optional follow-up action 또는 설명입니다.",
          }),
        },
      ],
      code: `import { Empty, Link } from "akanjs/ui";

export const EmptyProducts = () => (
  <Empty description="No products yet">
    <Link href="/products/new" className={buttonRecipe({ variant: "primary" })}>Create product</Link>
  </Empty>
);`,
    },
    {
      name: "Table",
      desc: l.trans({
        en: "Responsive table wrapper used by data-heavy screens. It supports column renderers, row click handlers, loading state, empty state, and optional `Pagination`.",
        ko: "data-heavy screen에서 사용하는 responsive table wrapper입니다. column renderer, row click handler, loading state, empty state, optional `Pagination`을 지원합니다.",
      }),
      props: [
        {
          name: "columns",
          type: "Column[]",
          desc: l.trans({
            en: "Header/cell definitions with optional responsive visibility.",
            ko: "optional responsive visibility를 포함하는 header/cell 정의입니다.",
          }),
        },
        {
          name: "dataSource",
          type: "unknown[]",
          desc: l.trans({ en: "Rows rendered by the table.", ko: "table에 렌더링되는 row 목록입니다." }),
        },
        {
          name: "pagination",
          type: "PaginationProps | false",
          desc: l.trans({
            en: "Pagination config or false to disable.",
            ko: "pagination 설정이거나 비활성화를 위한 false입니다.",
          }),
        },
        {
          name: "onRow",
          type: "(record, index) => handlers",
          desc: l.trans({
            en: "Factory for row events such as click navigation.",
            ko: "click navigation 같은 row event를 만드는 factory입니다.",
          }),
        },
        {
          name: "header / footer",
          type: "ReactNode",
          desc: l.trans({
            en: "Content drawn above the table and below the pager.",
            ko: "table 위와 pager 아래에 그려지는 content입니다.",
          }),
        },
        {
          name: "empty",
          type: "ReactNode",
          desc: l.trans({
            en: "Placeholder for a table with no rows. Defaults to `Empty`.",
            ko: "row가 없을 때의 placeholder입니다. 기본값은 `Empty`입니다.",
          }),
        },
        {
          name: "loadingIndicator",
          type: "ReactNode",
          desc: l.trans({
            en: "The mark shown over the rows while `loading`.",
            ko: "`loading` 동안 row 위에 표시되는 mark입니다.",
          }),
        },
      ],
      code: `import { Table } from "akanjs/ui";

<Table
  columns={[{ title: "Name", dataIndex: "name" }]}
  dataSource={products}
  loading={loading}
  pagination={{ currentPage, total, itemsPerPage: 20, onPageSelect: setPage }}
/>;`,
    },
    {
      name: "Pagination",
      desc: l.trans({
        en: "Standalone page-number control. Use it when pagination state is local; use `Data.Pagination` when the state is generated from a model slice.",
        ko: "standalone page-number control입니다. pagination state가 local이면 이 컴포넌트를 사용하고, model slice에서 생성된 state라면 `Data.Pagination`을 사용합니다.",
      }),
      props: [
        {
          name: "currentPage",
          type: "number",
          desc: l.trans({ en: "Current 1-based page number.", ko: "현재 1-based page number입니다." }),
        },
        {
          name: "total",
          type: "number",
          desc: l.trans({ en: "Total item count.", ko: "전체 item 수입니다." }),
        },
        {
          name: "itemsPerPage",
          type: "number",
          desc: l.trans({ en: "Number of items per page.", ko: "page당 item 수입니다." }),
        },
        {
          name: "onPageSelect",
          type: "(page: number) => void",
          desc: l.trans({
            en: "Called with the selected 1-based page number.",
            ko: "선택한 1-based page number와 함께 호출됩니다.",
          }),
        },
        {
          name: "prev / next / ellipsis",
          type: "ReactNode",
          desc: l.trans({
            en: "The marks inside the step controls and in place of skipped pages. The buttons, their disabled state and their labels stay the framework's.",
            ko: "이전/다음 control 안의 mark와 생략된 page를 대신하는 mark입니다. button과 disabled 상태, label은 프레임워크가 유지합니다.",
          }),
        },
        {
          name: "empty",
          type: "ReactNode",
          desc: l.trans({
            en: "Placeholder for a pager with no pages. Replaces the deprecated `renderEmpty`, which is a node and not a render function.",
            ko: "page가 없을 때의 placeholder입니다. render 함수가 아니라 node였던 `renderEmpty`를 대체합니다.",
          }),
        },
      ],
      code: `import { Pagination } from "akanjs/ui";

<Pagination
  currentPage={page}
  total={total}
  itemsPerPage={20}
  onPageSelect={setPage}
/>;`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="display-ui" title={l.trans({ en: "Display UI", ko: "Display UI" })}>
        <Docs.Title>{l.trans({ en: "Display UI", ko: "Display UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Display components render model lists, timestamps, loading feedback, empty states, status pills, and table/pagination surfaces. Prefer `Data` for generated model lists and standalone helpers for local UI state.",
              ko: "Display component는 model list, timestamp, loading feedback, empty state, 상태 pill, table/pagination surface를 렌더링합니다. generated model list에는 `Data`, local UI state에는 standalone helper를 우선 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Two of them come in a store-bound and a prop-bound pair, and picking the wrong one is the usual mistake: `Data.Pagination` reads a slice's page state from the store, `Pagination` takes the numbers as props; `Data.TableList` is a listing wired to a model, `Table` is rows you already have.",
              ko: "이 중 둘은 store에 묶인 것과 prop으로 받는 것이 짝을 이루며, 흔한 실수가 그 둘을 바꿔 쓰는 것입니다. `Data.Pagination`은 slice의 페이지 상태를 store에서 읽고 `Pagination`은 숫자를 prop으로 받습니다. `Data.TableList`는 model에 배선된 목록이고 `Table`은 이미 손에 있는 행입니다.",
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
