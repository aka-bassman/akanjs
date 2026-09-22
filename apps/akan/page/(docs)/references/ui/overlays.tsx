import { usePage } from "@apps/akan/client";
import { Divider, Docs, DocsToc, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const components: UiComponentReference[] = [
    {
      name: "Modal",
      desc: l.trans({
        en: "Controlled modal wrapper built on Akan's headless `Dialog` state. Use it for common app overlays where you want title/content/action slots without composing the full dialog namespace. The surface is deliberately plain — no transition, no gesture — so it never animates content the user is reading. `LegacyModal` keeps the previous animated skin.",
        ko: "Akan의 headless `Dialog` state 위에 구성된 controlled modal wrapper입니다. full dialog namespace를 직접 조합하지 않고 title/content/action slot만 필요한 일반 app overlay에 사용합니다. transition과 gesture가 없는 단순한 surface라서 읽고 있는 내용이 움직이지 않습니다. 이전 애니메이션 skin은 `LegacyModal`에 남아 있습니다.",
      }),
      props: [
        {
          name: "open",
          type: "boolean",
          desc: l.trans({ en: "Controlled open state.", ko: "controlled open state입니다." }),
        },
        {
          name: "onCancel",
          type: "() => void",
          desc: l.trans({
            en: "Called when the modal requests closing.",
            ko: "modal이 닫힘을 요청할 때 호출됩니다.",
          }),
        },
        {
          name: "trigger",
          type: "ReactNode",
          desc: l.trans({
            en: "Element that opens the modal. Given one, `open` may be left out and the modal keeps its own state.",
            ko: "modal을 여는 element입니다. 넘기면 `open` 없이도 modal이 자체 state로 동작합니다.",
          }),
        },
        {
          name: "title",
          type: "string | ReactNode",
          desc: l.trans({ en: "Optional title slot.", ko: "optional title slot입니다." }),
        },
        {
          name: "closeButton",
          type: "ReactNode | false",
          desc: l.trans({
            en: "The dismiss control, drawn in the corner slot that already closes the dialog — a replacement needs no wiring. `false` draws none.",
            ko: "닫기 control입니다. 코너 slot 자체가 dialog를 닫으므로 교체해도 별도 배선이 필요 없습니다. `false`면 그리지 않습니다.",
          }),
        },
        {
          name: "action",
          type: "ReactNode",
          desc: l.trans({ en: "Optional footer/action slot.", ko: "optional footer/action slot입니다." }),
        },
        {
          name: "confirmClose",
          type: "boolean",
          desc: l.trans({ en: "Ask for confirmation before closing.", ko: "닫기 전에 confirmation을 요청합니다." }),
        },
      ],
      code: `import { Modal, buttonRecipe } from "akanjs/ui";

export const ProductModal = ({ open, close, product }) => (
  <Modal open={open} onCancel={close} title="Product">
    <ProductView product={product} />
  </Modal>
);`,
    },
    {
      name: "Dialog",
      desc: l.trans({
        en: "Headless compound dialog namespace for custom modal composition. Use it when `Modal` is too opinionated and you need a custom trigger, title, content, or action layout.",
        ko: "custom modal composition을 위한 headless compound dialog namespace입니다. `Modal`보다 custom trigger, title, content, action layout이 필요할 때 사용합니다.",
      }),
      props: [
        {
          name: "Dialog",
          type: "{ open?, defaultOpen?, className? }",
          desc: l.trans({ en: "Provider/root for dialog state.", ko: "dialog state를 위한 provider/root입니다." }),
        },
        {
          name: "Dialog.Trigger",
          type: "component",
          desc: l.trans({
            en: "Opens the dialog from custom trigger content.",
            ko: "custom trigger content로 dialog를 엽니다.",
          }),
        },
        {
          name: "Dialog.Modal",
          type: "component",
          desc: l.trans({
            en: "Modal surface and close behavior.",
            ko: "modal surface와 close behavior를 제공합니다.",
          }),
        },
        {
          name: "Dialog.LegacyModal",
          type: "component",
          desc: l.trans({
            en: "Previous surface: spring open/close and drag-to-dismiss on touch.",
            ko: "이전 surface입니다. spring 전환과 touch drag-to-dismiss가 있습니다.",
          }),
        },
        {
          name: "Dialog.Title / Content / Action",
          type: "components",
          desc: l.trans({ en: "Named modal slots.", ko: "이름이 있는 modal slot입니다." }),
        },
      ],
      code: `import { Dialog } from "akanjs/ui";

<Dialog defaultOpen={false}>
  <Dialog.Trigger>
    <button className={buttonRecipe()}>Open</button>
  </Dialog.Trigger>
  <Dialog.Modal>
    <Dialog.Title>Custom dialog</Dialog.Title>
    <Dialog.Content>Body content</Dialog.Content>
    <Dialog.Action><button className={buttonRecipe()}>Save</button></Dialog.Action>
  </Dialog.Modal>
</Dialog>;`,
    },
    {
      name: "Popconfirm",
      desc: l.trans({
        en: "Inline confirmation popover for destructive or irreversible actions. It wraps a trigger element and shows localized OK/cancel buttons. The popover portals to document.body and is placed against its trigger — above it when there is no room below, with the pointer following — so it is not clipped by a modal, a scrolling container, or the dropdown menu that Model.Remove draws it from. Its scrim swallows the next click, and the overlay that opened it stays open.",
        ko: "파괴적이거나 되돌릴 수 없는 action을 위한 inline confirmation popover입니다. trigger element를 감싸고 localized OK/cancel button을 표시합니다. popover는 document.body로 portal되어 trigger 기준으로 배치되며, 아래 공간이 없으면 위로 뒤집히고 화살표도 따라갑니다. 따라서 modal, 스크롤 컨테이너, Model.Remove가 이것을 그리는 dropdown menu에 잘리지 않습니다. scrim이 다음 클릭을 흡수하고, 이것을 연 overlay는 열린 채로 남습니다.",
      }),
      props: [
        {
          name: "title",
          type: "string",
          desc: l.trans({ en: "Confirmation title.", ko: "confirmation title입니다." }),
        },
        {
          name: "description",
          type: "ReactNode",
          desc: l.trans({ en: "Optional detailed message.", ko: "optional detailed message입니다." }),
        },
        {
          name: "onConfirm",
          type: "() => void",
          desc: l.trans({ en: "Called when the user confirms.", ko: "사용자가 confirm할 때 호출됩니다." }),
        },
        {
          name: "okText / cancelText",
          type: "ReactNode",
          desc: l.trans({ en: "Custom button labels.", ko: "custom button label입니다." }),
        },
        {
          name: "icon",
          type: "ReactNode | false",
          desc: l.trans({
            en: "The mark beside the message. `false` draws none.",
            ko: "message 옆 mark입니다. `false`면 그리지 않습니다.",
          }),
        },
        {
          name: "actions",
          type: "ReactNode",
          desc: l.trans({
            en: "The whole footer, replacing both buttons. A replacement owns the confirm and the dismiss.",
            ko: "두 버튼을 모두 대체하는 footer입니다. 교체하면 confirm과 dismiss를 직접 처리해야 합니다.",
          }),
        },
      ],
      code: `import { Popconfirm } from "akanjs/ui";

<Popconfirm title="Remove product?" onConfirm={() => remove(product.id)}>
  <button className={buttonRecipe({ variant: "destructive", size: "sm" })}>Remove</button>
</Popconfirm>;`,
    },
    {
      name: "Dropdown",
      desc: l.trans({
        en: "Compact dropdown menu wrapper. It is commonly used for row actions, comment/story menus, and context actions in list UIs. The menu portals to document.body and is placed against its trigger, so it is not clipped by a modal surface, a scrolling modal body, or a table's scroll container. A menu item may open a Modal: the menu stays mounted while it is closed, so the overlay survives, and clicks inside an overlay this menu opened do not count as outside clicks. An overlay it did not open still dismisses it.",
        ko: "compact dropdown menu wrapper입니다. list UI의 row action, comment/story menu, context action에 자주 사용됩니다. menu는 document.body로 portal되어 trigger 기준으로 배치되므로 modal surface, 스크롤되는 modal body, table scroll container에 잘리지 않습니다. menu item이 Modal을 열어도 됩니다. 메뉴는 닫힐 때 unmount되지 않고 숨겨지므로 overlay가 그대로 유지되며, 이 메뉴가 연 overlay 내부 클릭은 외부 클릭으로 처리되지 않습니다. 이 메뉴가 열지 않은 overlay는 평소대로 메뉴를 닫습니다.",
      }),
      props: [
        {
          name: "value",
          type: "ReactNode",
          desc: l.trans({ en: "Trigger button content.", ko: "trigger button content입니다." }),
        },
        {
          name: "trigger",
          type: "ReactNode",
          desc: l.trans({
            en: "The whole trigger element, drawn instead of the framework's ghost button. It is cloned, not wrapped, so the menu's aria-expanded lands on the control a screen reader activates — the element must forward className, onClick and aria-*.",
            ko: "프레임워크 ghost button 대신 그릴 trigger element 전체입니다. 감싸지 않고 clone하므로 aria-expanded가 스크린리더가 활성화하는 control에 붙습니다 — element가 className, onClick, aria-*를 forward해야 합니다.",
          }),
        },
        {
          name: "content",
          type: "ReactNode",
          desc: l.trans({ en: "Dropdown menu content.", ko: "dropdown menu content입니다." }),
        },
        {
          name: "buttonClassName",
          type: "string",
          desc: l.trans({ en: "Classes for the trigger button.", ko: "trigger button에 적용할 class입니다." }),
        },
        {
          name: "dropdownClassName",
          type: "string",
          desc: l.trans({ en: "Classes for the menu panel.", ko: "menu panel에 적용할 class입니다." }),
        },
        {
          name: "align",
          type: `"start" | "end"`,
          desc: l.trans({
            en: "Trigger edge the menu lines up with, end (right) by default. Position is computed, so a left-0 class cannot do this.",
            ko: "menu를 trigger의 어느 쪽 끝에 맞출지 정합니다. 기본값은 end(오른쪽)입니다. 위치를 계산해서 넣기 때문에 left-0 class로는 바꿀 수 없습니다.",
          }),
        },
        {
          name: "data-dropdown-keep-open",
          type: "attribute",
          desc: l.trans({
            en: "Put it on a menu item that runs its own interaction (a switch, a copy button) so clicking it does not close the menu.",
            ko: "자체 상호작용을 가진 menu item(switch, copy button 등)에 붙이면 클릭해도 메뉴가 닫히지 않습니다.",
          }),
        },
      ],
      code: `import { Dropdown } from "akanjs/ui";

<Dropdown
  value="Actions"
  content={
    <>
      <li><button>Edit</button></li>
      <li data-dropdown-keep-open="">
        <Switch checked={notify} onChange={setNotify} />
      </li>
      <li><button>Remove</button></li>
    </>
  }
/>;`,
    },
    {
      name: "BottomSheet",
      desc: l.trans({
        en: "The mobile overlay: a panel that comes up from the bottom edge and is dismissed by dragging it back down. `type` is the whole decision — a `half` sheet covers part of the screen and draws a grab handle, a `full` sheet takes it all and draws a close row instead. Like `Modal` it works controlled or self-contained: give it `open` and `onCancel`, or give it a `trigger` and let it keep its own state.",
        ko: "mobile용 overlay입니다. 아래 모서리에서 올라오고 아래로 끌어내려 닫는 패널입니다. `type`이 사실상 모든 결정입니다. `half` sheet은 화면 일부를 덮고 잡는 손잡이를 그리며, `full` sheet은 전체를 덮고 대신 닫기 행을 그립니다. `Modal`처럼 controlled로도 자체 완결형으로도 동작합니다. `open`과 `onCancel`을 주거나, `trigger`를 주고 상태를 맡기면 됩니다.",
      }),
      props: [
        {
          name: "type",
          type: `"full" | "half"`,
          desc: l.trans({
            en: "Required. `half` covers part of the screen with a grab handle; `full` takes the whole screen with a close row.",
            ko: "필수입니다. `half`는 화면 일부를 덮고 손잡이를 그리며, `full`은 전체를 덮고 닫기 행을 그립니다.",
          }),
        },
        {
          name: "open / onCancel",
          type: "boolean / () => void",
          desc: l.trans({
            en: "Controlled state. Left out, the sheet opens from its own trigger and handle.",
            ko: "controlled 상태입니다. 빼면 sheet이 자기 trigger와 손잡이로 열립니다.",
          }),
        },
        {
          name: "trigger",
          type: "ReactNode",
          desc: l.trans({ en: "Element that opens the sheet.", ko: "sheet을 여는 element입니다." }),
        },
        {
          name: "header / handle / close",
          type: "ReactNode",
          desc: l.trans({
            en: "`header` replaces the whole top row — the handle or the close row, whichever `type` draws. `handle` and `close` replace just the mark inside it.",
            ko: "`header`는 위쪽 행 전체를 대체합니다. `type`에 따라 손잡이 행이거나 닫기 행입니다. `handle`과 `close`는 그 안의 mark만 대체합니다.",
          }),
        },
        {
          name: "bodyClassName",
          type: "string",
          desc: l.trans({
            en: "Classes for the scrolling body, where `className` reaches the sheet surface.",
            ko: "스크롤되는 본문에 적용할 class입니다. `className`은 sheet 표면에 적용됩니다.",
          }),
        },
        {
          name: "ref",
          type: "BottomSheetRef",
          desc: l.trans({
            en: "`{ open, close }` — the imperative handle, for a sheet a page opens from somewhere that is not a trigger.",
            ko: "`{ open, close }` 명령형 handle입니다. trigger가 아닌 곳에서 page가 sheet을 열 때 씁니다.",
          }),
        },
      ],
      code: `import { BottomSheet } from "akanjs/ui";

export const FilterSheet = ({ children }) => (
  <BottomSheet type="half" trigger={<button className={buttonRecipe({ size: "sm" })}>Filter</button>}>
    {children}
  </BottomSheet>
);`,
    },
    {
      name: "Tooltip",
      desc: l.trans({
        en: "A hint on hover or keyboard focus, in pure CSS — no state, no portal, no positioning pass. That buys a tooltip that costs nothing and renders on the server, and it costs viewport-edge flipping: a bubble near the edge is clipped rather than moved. It is a hint surface, so that is the right trade; when the content has to be read, it is not a tooltip. An empty `content` renders the trigger alone, so a conditional hint needs no wrapper of its own.",
        ko: "hover나 키보드 포커스에서 뜨는 힌트이며 순수 CSS입니다. 상태도, portal도, 위치 계산도 없습니다. 그 덕에 비용이 없고 서버에서 렌더되지만, 뷰포트 가장자리에서 뒤집히지 않습니다 — 가장자리의 말풍선은 옮겨지는 대신 잘립니다. 힌트 표면이므로 그 교환이 맞습니다. 반드시 읽혀야 하는 내용이라면 그것은 tooltip이 아닙니다. `content`가 비어 있으면 trigger만 렌더하므로, 조건부 힌트에 별도 wrapper가 필요 없습니다.",
      }),
      props: [
        {
          name: "content",
          type: "ReactNode",
          desc: l.trans({
            en: "The hint. Empty, null, or undefined renders `children` alone.",
            ko: "힌트 내용입니다. 비어 있거나 null·undefined면 `children`만 렌더합니다.",
          }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "The trigger the bubble is anchored to.", ko: "말풍선이 붙는 trigger입니다." }),
        },
        {
          name: "side",
          type: `"top" | "right" | "bottom" | "left"`,
          desc: l.trans({
            en: "Which side the bubble sits on. `top` by default.",
            ko: "말풍선이 놓이는 방향입니다. 기본값은 `top`입니다.",
          }),
        },
        {
          name: "variant",
          type: `"default" | "primary" | "info"`,
          desc: l.trans({
            en: "The bubble's colour. `Field.Label` uses `info` for the help icon beside a field description.",
            ko: "말풍선 색입니다. `Field.Label`은 field 설명 옆 도움말 아이콘에 `info`를 씁니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "It is an override slot, so an app that needs a positioned tooltip — one that flips, or follows the pointer — binds its own in `_overrides.tsx` and every existing call site follows.",
          ko: "override slot이므로, 위치를 계산하는 tooltip — 뒤집히거나 포인터를 따라가는 — 이 필요한 앱은 `_overrides.tsx`에서 자기 것을 bind하면 기존 호출부가 전부 따라옵니다.",
        }),
      ],
      code: `import { Tooltip } from "akanjs/ui";

export const SyncedAt = ({ at, detail }) => (
  <Tooltip content={detail} side="right" variant="info">
    <span className="text-foreground/60 text-sm">{at}</span>
  </Tooltip>
);`,
    },
    {
      name: "Menu",
      desc: l.trans({
        en: "A navigation menu from a data structure rather than from markup: `items` is a tree of `{ key, label, icon?, children? }`, and the component draws the rows, the submenus, and the active state. `mode` is the axis — `inline` for a sidebar, `horizontal` for a top bar, where anything that does not fit folds into an overflow menu.",
        ko: "markup이 아니라 데이터 구조로 만드는 navigation menu입니다. `items`는 `{ key, label, icon?, children? }`의 트리이고, 행과 submenu, 활성 상태는 component가 그립니다. `mode`가 축을 정합니다 — sidebar에는 `inline`, 상단 bar에는 `horizontal`이며, 후자는 넘치는 항목을 overflow menu로 접습니다.",
      }),
      props: [
        {
          name: "items",
          type: "MenuItem[]",
          desc: l.trans({
            en: "`{ key, label, icon?, children?, type? }`. A `children` array makes the row a submenu.",
            ko: "`{ key, label, icon?, children?, type? }`입니다. `children` 배열이 있으면 그 행이 submenu가 됩니다.",
          }),
        },
        {
          name: "mode",
          type: `"horizontal" | "inline"`,
          desc: l.trans({
            en: "The axis. `inline` by default; `horizontal` folds the overflow into a trailing menu.",
            ko: "축입니다. 기본값은 `inline`이고, `horizontal`은 넘치는 항목을 뒤쪽 menu로 접습니다.",
          }),
        },
        {
          name: "selectedKeys / defaultSelectedKeys",
          type: "string[]",
          desc: l.trans({
            en: "Controlled and uncontrolled selection, by item key.",
            ko: "item key로 지정하는 controlled·uncontrolled 선택입니다.",
          }),
        },
        {
          name: "onClick",
          type: "(item: MenuItem) => void",
          desc: l.trans({ en: "Receives the clicked item.", ko: "클릭된 item을 받습니다." }),
        },
        {
          name: "inlineCollapsed",
          type: "boolean",
          desc: l.trans({
            en: "Narrows an `inline` menu to its icons.",
            ko: "`inline` menu를 아이콘만 남게 좁힙니다.",
          }),
        },
        {
          name: "renderItem",
          type: "(item, active) => ReactNode",
          desc: l.trans({
            en: "Draws one item's body. The row, its click, and any submenu stay the framework's.",
            ko: "item 하나의 본문을 그립니다. 행과 클릭, submenu는 framework가 유지합니다.",
          }),
        },
        {
          name: "ulClassName / liClassName / labelClassName",
          type: "string / string / (isActive) => string",
          desc: l.trans({
            en: "The three levels below `className`, which reaches the wrapper.",
            ko: "wrapper에 닿는 `className` 아래의 세 층위입니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "`Menu` is a navigation structure and `Dropdown` is a transient action list — they look alike and are not interchangeable. Row actions on a list belong in a `Dropdown`.",
          ko: "`Menu`는 navigation 구조이고 `Dropdown`은 일시적인 action 목록입니다. 겉모습이 비슷하지만 서로 대체할 수 없습니다. 목록의 행 action은 `Dropdown`의 몫입니다.",
        }),
      ],
      code: `import { Menu } from "akanjs/ui";

export const AdminSider = ({ selected, select }) => (
  <Menu
    mode="inline"
    selectedKeys={[selected]}
    onClick={(item) => select(item.key)}
    items={[
      { key: "product", label: "Products" },
      { key: "order", label: "Orders", children: [{ key: "order.open", label: "Open" }] },
    ]}
  />
);`,
    },
    {
      name: "Portal",
      desc: l.trans({
        en: "Renders `children` into an element the page already has, named by `id`. This is the wiring behind `Layout.Navbar` — a component deep in a route puts content into the route's top inset without either one knowing about the other. It is server-aware: during SSR the content is captured for the shell rather than dropped, so a portalled navbar is in the first byte instead of appearing after hydration.",
        ko: "`children`을 page에 이미 있는 element 안으로 `id`로 지정해 렌더합니다. `Layout.Navbar` 뒤의 배선이 이것입니다. route 깊숙한 곳의 component가 서로를 모른 채 route의 top inset에 내용을 넣습니다. 서버를 인식합니다. SSR 중에는 내용이 버려지지 않고 shell용으로 수집되므로, portal된 navbar가 hydration 이후가 아니라 첫 바이트에 들어 있습니다.",
      }),
      props: [
        {
          name: "id",
          type: "string",
          desc: l.trans({
            en: "The `id` of the host element. Nothing renders until an element with it exists, so the host has to be mounted first.",
            ko: "host element의 `id`입니다. 그 id를 가진 element가 생기기 전에는 아무것도 렌더되지 않으므로 host가 먼저 마운트되어야 합니다.",
          }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "What is rendered into the host.", ko: "host 안에 렌더할 내용입니다." }),
        },
      ],
      notes: [
        l.trans({
          en: "It is not the way to escape a clipping ancestor — `Modal`, `Dropdown`, `Select`, and `Popconfirm` already portal to `document.body` and place themselves against their trigger. Reach for `Portal` only for a named slot the app frame owns.",
          ko: "잘리는 조상에서 빠져나오는 수단이 아닙니다. `Modal`, `Dropdown`, `Select`, `Popconfirm`은 이미 `document.body`로 portal되어 trigger 기준으로 자리를 잡습니다. `Portal`은 앱 frame이 소유한 이름 붙은 slot에만 쓰세요.",
        }),
      ],
      code: `import { Portal } from "akanjs/ui";

export const PrintAction = ({ children }) => <Portal id="topInsetContent">{children}</Portal>;`,
    },
    {
      name: "Copy",
      desc: l.trans({
        en: "Copy-to-clipboard trigger that also shows a global success message through Akan store messages.",
        ko: "clipboard에 복사하고 Akan store message로 global success message를 보여주는 trigger입니다.",
      }),
      props: [
        {
          name: "text",
          type: "string",
          desc: l.trans({ en: "Text copied to the clipboard.", ko: "clipboard에 복사할 text입니다." }),
        },
        {
          name: "copyMessage",
          type: "string",
          desc: l.trans({ en: "Optional custom success message.", ko: "optional custom success message입니다." }),
        },
        {
          name: "children",
          type: "ReactNode",
          desc: l.trans({ en: "Trigger element.", ko: "trigger element입니다." }),
        },
      ],
      code: `import { Copy } from "akanjs/ui";

<Copy text={shareUrl}>
  <button className={buttonRecipe({ size: "sm" })}>Copy link</button>
</Copy>;`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overlays-ui" title={l.trans({ en: "Overlays UI", ko: "Overlays UI" })}>
        <Docs.Title>{l.trans({ en: "Overlays UI", ko: "Overlays UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Overlay components cover modal flows, custom dialogs, destructive confirmations, bottom sheets, menus, hints, and copy actions. Use `Modal` for common controlled overlays and the headless `Dialog` namespace for custom composition.",
              ko: "Overlay component는 modal flow, custom dialog, destructive confirmation, bottom sheet, menu, 힌트, copy action을 다룹니다. 일반 controlled overlay에는 `Modal`, custom composition에는 headless `Dialog` namespace를 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Four of them portal to `document.body` and place themselves against their trigger — `Modal`, `Dropdown`, `Popconfirm`, and `Select` — so none of them is clipped by a scrolling modal body or a table's overflow container. `Portal` is the named-slot version of the same mechanism, and `Tooltip` deliberately does none of it.",
              ko: "이 중 넷 — `Modal`, `Dropdown`, `Popconfirm`, `Select` — 은 `document.body`로 portal되어 trigger 기준으로 자리를 잡으므로, 스크롤되는 modal 본문이나 table의 overflow container에 잘리지 않습니다. `Portal`은 같은 장치를 이름 붙은 slot에 쓰는 형태이고, `Tooltip`은 의도적으로 그 어느 것도 하지 않습니다.",
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
