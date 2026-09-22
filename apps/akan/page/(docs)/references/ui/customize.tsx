import { usePage } from "@apps/akan/client";
import { cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const slotGroups = [
    {
      title: l.trans({ en: "Leaf primitives", ko: "Leaf primitive" }),
      slots: [
        "Badge",
        "Modal",
        "Empty",
        "Pagination",
        "Popconfirm",
        "Dropdown",
        "Table",
        "Menu",
        "Tooltip",
        "Unauthorized",
      ],
    },
    { title: l.trans({ en: "Generic", ko: "Generic" }), slots: ["Button", "Select"] },
    {
      title: l.trans({ en: "Input (compound)", ko: "Input (compound)" }),
      slots: ["Input", "InputTextArea", "InputPassword", "InputEmail", "InputNumber", "InputCheckbox"],
    },
    { title: l.trans({ en: "Radio (compound)", ko: "Radio (compound)" }), slots: ["Radio", "RadioItem"] },
    {
      title: l.trans({ en: "DatePicker (compound)", ko: "DatePicker (compound)" }),
      slots: ["DatePicker", "DatePickerRangePicker", "DatePickerTimePicker"],
    },
    {
      title: l.trans({ en: "ToggleSelect (compound)", ko: "ToggleSelect (compound)" }),
      slots: ["ToggleSelect", "ToggleSelectMulti"],
    },
    {
      title: l.trans({ en: "Loading (namespace)", ko: "Loading (namespace)" }),
      slots: ["LoadingSpin", "LoadingSkeleton", "LoadingProgressBar", "LoadingButton", "LoadingInput", "LoadingArea"],
    },
    { title: l.trans({ en: "Toast (compound)", ko: "Toast (compound)" }), slots: ["Toast", "ToastItem"] },
    { title: l.trans({ en: "Edit shell", ko: "Edit shell" }), slots: ["DraftBar"] },
    {
      title: l.trans({ en: "In-page chat", ko: "인페이지 채팅" }),
      slots: [
        "AgentChat",
        "AgentLauncher",
        "AgentBubble",
        "AgentSteps",
        "AgentComposer",
        "AgentApproval",
        "AgentQuestion",
        "AgentQueued",
        "AgentMenu",
        "AgentMarkdown",
        "AgentToolCard",
        "AgentCode",
      ],
    },
  ];

  const recipeSlots = [
    {
      key: "button",
      type: "(variants?: ButtonVariants, className?: ClassValue) => string",
      desc: l.trans({
        en: "Every framework client component that draws a button — `Button`, the add and remove controls inside `Field.List` and `Field.TextList`, the pager, the modal footers.",
        ko: "버튼을 그리는 모든 framework client component입니다. `Button`, `Field.List`와 `Field.TextList` 안의 추가·삭제 control, pager, modal footer가 여기 해당합니다.",
      }),
    },
    {
      key: "badge",
      type: "(variants?: BadgeVariants, className?: ClassValue) => string",
      desc: l.trans({
        en: "`Badge` and the tag chips `Field.Tags` draws.",
        ko: "`Badge`와 `Field.Tags`가 그리는 태그 chip입니다.",
      }),
    },
    {
      key: "input",
      type: "(variants?: InputSurfaceVariants, className?: ClassValue) => string",
      desc: l.trans({
        en: "The field shell `Input`, `TextArea`, and `Select` share.",
        ko: "`Input`, `TextArea`, `Select`가 공유하는 field 껍데기입니다.",
      }),
    },
  ];

  const brandComponentCode = `"use client";
// apps/<app>/ui/BrandModal.tsx
import { Dialog, type AkanModalComponent, buttonRecipe } from "akanjs/ui";

// Compose the framework's headless parts so you re-skin the surface without re-owning
// focus-trap, escape handling, scroll-lock, or portal behavior. Typed as the slot contract,
// so it is checked as a drop-in replacement for the framework <Modal>.
export const BrandModal: AkanModalComponent = ({ open, onCancel, title, children }) => (
  <Dialog open={open}>
    <Dialog.Modal className="border-4 border-primary" onCancel={onCancel}>
      {title ? <Dialog.Title>{title}</Dialog.Title> : null}
      <Dialog.Content>{children}</Dialog.Content>
    </Dialog.Modal>
  </Dialog>
);`;

  const manifestCode = `// apps/<app>/page/_overrides.tsx  — a plain module, NO "use client"
import { BrandModal } from "@apps/<app>/ui";
import { override } from "akanjs/ui";

// override() type-checks each binding against the slot's contract and rejects unknown slots.
export default override({ Modal: BrandModal });`;

  const scopingCode = `// page/_overrides.tsx            → applies to the whole app
export default override({ Modal: BrandModal });

// page/(admin)/_overrides.tsx    → narrows the (admin) subtree; closest ancestor wins,
//                                   and unlisted slots keep inheriting from above.
export default override({ Modal: AdminModal, Table: AdminTable });`;

  const genericCode = `// The public <Button<Todo> … /> keeps full generic inference at every call site.
// Your override is authored against the widest prop type — no generics required of you.
import { type AkanUiOverrides, buttonRecipe } from "akanjs/ui";

export const BrandButton: AkanUiOverrides["Button"] = ({ children, onClick, ...rest }) => (
  <button
    type="button"
    className={buttonRecipe({ variant: "primary" })}
    onClick={(e) => onClick?.(e, { onError: () => {} })}
    {...rest}
  >
    {children}
  </button>
);`;

  const recipeCode = `// apps/<app>/ui/Recipe/neonButton.ts — the full framework variant contract, restyled.
import { recipe, tv } from "akanjs/ui";

export const neonButtonRecipe = recipe(
  tv({
    base: "inline-flex items-center justify-center rounded-none uppercase tracking-widest",
    variants: {
      variant: { default: "…", primary: "…", secondary: "…", accent: "…", neutral: "…", outline: "…",
                 ghost: "…", destructive: "…", success: "…", warning: "…", info: "…", link: "…" },
      size: { xs: "…", sm: "…", md: "…", lg: "…", icon: "…" },
      shape: { default: "", square: "…", circle: "…" },
      outline: { true: "…" },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "default" },
  }),
);

// apps/<app>/page/(brand)/_overrides.tsx — component slots and recipe slots in one manifest.
import { neonButtonRecipe } from "@apps/<app>/ui";
import { override } from "akanjs/ui";

export default override({ Modal: BrandModal, recipes: { button: neonButtonRecipe } });`;

  const compoundCode = `// Each compound leaf is its own slot: InputPassword, InputCheckbox, RadioItem,
// DatePickerRangePicker, LoadingSpin, … so you re-skin exactly one field.
import { BrandCheckbox } from "@apps/<app>/ui";
import { override } from "akanjs/ui";

export default override({ InputCheckbox: BrandCheckbox });
// <Input.Checkbox /> now renders BrandCheckbox; <Input />, <Input.Password /> stay default.`;

  return (
    <Scroll>
      <Scroll.Slide id="customization" title={l.trans({ en: "Customization", ko: "커스터마이즈" })}>
        <Docs.Title>{l.trans({ en: "Customization", ko: "커스터마이즈" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Any `akanjs/ui` component can be re-skinned per route without forking it. You write a drop-in replacement in your app's `ui/` folder and bind it to a framework slot in a `page/**/_overrides.tsx` manifest. Every existing `<Modal>`, `<Button>`, `<Table>` call site in that route subtree then renders your version instead — no call-site changes.",
              ko: "모든 `akanjs/ui` 컴포넌트는 fork 없이 route 단위로 re-skin할 수 있습니다. app의 `ui/` 폴더에 drop-in 교체 컴포넌트를 작성하고 `page/**/_overrides.tsx` manifest에서 framework slot에 bind하면 됩니다. 해당 route subtree의 기존 `<Modal>`, `<Button>`, `<Table>` 호출부는 call-site 변경 없이 여러분의 버전으로 렌더링됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Overrides cascade down the route tree exactly like layouts: an override declared higher up applies to everything below it, and a nested manifest narrows or replaces it for its own subtree (closest ancestor wins).",
              ko: "override는 layout과 똑같이 route tree를 따라 cascade됩니다. 상위에 선언한 override는 그 아래 전체에 적용되고, 하위 manifest는 자신의 subtree에 대해 이를 좁히거나 교체합니다(가장 가까운 조상이 우선).",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert type="info">
          {l.trans({
            en: 'The `_overrides.tsx` manifest is logic-free and needs no `"use client"` directive. `override()` returns a plain, server-safe map; the framework generates the client boundary that mounts the provider. Keep the file to imports plus a single `export default override({ … })`.',
            ko: '`_overrides.tsx` manifest는 logic-free이고 `"use client"` directive가 필요 없습니다. `override()`는 server-safe한 순수 map을 반환하고, provider를 mount하는 client boundary는 framework가 생성합니다. 파일은 import와 단 하나의 `export default override({ … })`로만 유지하세요.',
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="how-it-works" title={l.trans({ en: "How it works", ko: "동작 방식" })}>
        <Docs.Title>{l.trans({ en: "How it works", ko: "동작 방식" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: '1. Write a drop-in component in `apps/<app>/ui/`. Type it against the slot contract (`AkanModalComponent`, or `AkanUiOverrides["<Slot>"]` for any other slot) so it is verified as a real replacement. Compose the framework\'s headless parts (e.g. `Dialog`) instead of re-implementing behavior.',
              ko: '1. `apps/<app>/ui/`에 drop-in 컴포넌트를 작성합니다. slot contract(`AkanModalComponent`, 그 외 slot은 `AkanUiOverrides["<Slot>"]`)로 타입을 지정해 실제 교체 가능 여부를 검증받으세요. 동작을 재구현하지 말고 framework의 headless 부품(예: `Dialog`)을 조합하세요.',
            })}
          </div>
        </Docs.Description>
        <Docs.CodeSnippet
          title={l.trans({ en: "1. App component", ko: "1. App 컴포넌트" })}
          code={brandComponentCode}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "2. Declare it in `page/**/_overrides.tsx`. `override(map)` is a typed identity helper: keys are the PascalCase framework slot names, each value is checked against that slot's props, and unknown slot names are rejected at compile time.",
              ko: "2. `page/**/_overrides.tsx`에 선언합니다. `override(map)`은 typed identity helper입니다. key는 PascalCase framework slot 이름이고, 각 value는 해당 slot의 props로 검사되며, 알 수 없는 slot 이름은 compile 시점에 거부됩니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.CodeSnippet title={l.trans({ en: "2. Manifest", ko: "2. Manifest" })} code={manifestCode} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="scoping" title={l.trans({ en: "Scoping", ko: "적용 범위" })}>
        <Docs.Title>{l.trans({ en: "Scoping", ko: "적용 범위" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Place `_overrides.tsx` at `page/` for an app-wide skin, or inside any route group / segment to scope it to that subtree. Nested manifests merge over ancestors slot-by-slot, so a child manifest only overrides the slots it lists and inherits the rest.",
              ko: "app 전체 skin은 `page/`에, 특정 subtree에만 적용하려면 route group/segment 안에 `_overrides.tsx`를 두세요. 중첩된 manifest는 slot 단위로 조상 위에 merge되므로, 자식 manifest는 나열한 slot만 override하고 나머지는 상속합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.CodeSnippet title={l.trans({ en: "Nested scoping", ko: "중첩 적용" })} code={scopingCode} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="slots" title={l.trans({ en: "Overridable slots", ko: "Override 가능한 slot" })}>
        <Docs.Title>{l.trans({ en: "Overridable slots", ko: "Override 가능한 slot" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The framework exposes 46 slots. Behavioral and infrastructure components (Portal, InfiniteScroll, ClientSide, …) are intentionally not overridable — they are wiring, not skins.",
              ko: "framework가 제공하는 slot은 46개입니다. 동작/인프라 성격의 컴포넌트(Portal, InfiniteScroll, ClientSide, …)는 skin이 아니라 wiring이므로 의도적으로 override 대상에서 제외했습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The one you are most likely to reach for and not find is the toast stack — `System`'s `Messages`. It is not a slot because it is not a skin: it keeps the `msg.*` wiring, the store read, the body-level portal, and the dismiss timers. `Toast` and `ToastItem` are the slots instead, so a replacement re-skins the surface without re-implementing when a toast appears and goes away.",
              ko: "찾아보고 없어서 가장 당황하기 쉬운 것은 toast 더미, 즉 `System`의 `Messages`입니다. skin이 아니라서 slot이 아닙니다. `msg.*` 배선, store 읽기, body 수준 portal, 자동 닫힘 타이머를 스스로 들고 있기 때문입니다. 대신 `Toast`와 `ToastItem`이 slot이므로, 언제 toast가 뜨고 사라지는지를 다시 구현하지 않고 표면만 바꿀 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <div className={cardGridRecipe()}>
          {slotGroups.map(({ title, slots }) => (
            <div key={title} className={panelRecipe()}>
              <div className="mb-2 font-bold text-foreground">{title}</div>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <span key={slot} className="rounded-md bg-muted px-2 py-1 font-mono text-foreground/80 text-sm">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="generic-components" title={l.trans({ en: "Generic components", ko: "Generic 컴포넌트" })}>
        <Docs.Title>{l.trans({ en: "Generic components", ko: "Generic 컴포넌트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`Button` and `Select` are generic. The public component keeps its full generic signature, so call sites like `<Select<MyEnum, true> … />` still infer their value and onChange shapes. The override slot stores the widest instantiation, so you author a plain, non-generic replacement.",
              ko: "`Button`과 `Select`는 generic입니다. 공개 컴포넌트는 generic signature를 그대로 유지하므로 `<Select<MyEnum, true> … />` 같은 call-site는 value/onChange 형태를 그대로 추론합니다. override slot은 가장 넓은 instantiation을 저장하므로, 여러분은 generic 없는 평범한 교체 컴포넌트를 작성하면 됩니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.CodeSnippet title={l.trans({ en: "Generic override", ko: "Generic override" })} code={genericCode} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="compound-components" title={l.trans({ en: "Compound components", ko: "Compound 컴포넌트" })}>
        <Docs.Title>{l.trans({ en: "Compound components", ko: "Compound 컴포넌트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Components with sub-parts — `Input.Password`, `Radio.Item`, `DatePicker.RangePicker`, `ToggleSelect.Multi`, and every `Loading.*` member — expose one slot per leaf, named `<Base><Sub>` (e.g. `InputPassword`, `LoadingSpin`). Override just the leaves you want; the rest keep their defaults, and `Input.Password` / `Loading.Spin` access stays intact.",
              ko: "하위 부품을 가진 컴포넌트(`Input.Password`, `Radio.Item`, `DatePicker.RangePicker`, `ToggleSelect.Multi`, 그리고 모든 `Loading.*` member)는 leaf마다 하나의 slot을 노출하며 이름은 `<Base><Sub>`입니다(예: `InputPassword`, `LoadingSpin`). 원하는 leaf만 override하면 나머지는 기본값을 유지하고, `Input.Password` / `Loading.Spin` 접근도 그대로 동작합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.CodeSnippet
          title={l.trans({ en: "Compound leaf override", ko: "Compound leaf override" })}
          code={compoundCode}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="recipe-slots" title={l.trans({ en: "Recipe slots", ko: "Recipe slot" })}>
        <Docs.Title>{l.trans({ en: "Recipe slots", ko: "Recipe slot" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Replacing a component to change how it looks is more than you need when the structure is already right. The manifest takes a second kind of key for that: `recipes`, typed by `AkanUiRecipes`, swaps the className factory a framework component resolves through and leaves its structure and behavior — async states, focus handling, a11y — completely alone.",
              ko: "구조는 그대로 두고 모양만 바꾸고 싶은데 컴포넌트를 통째로 교체하는 것은 과합니다. manifest는 그런 경우를 위해 두 번째 종류의 key를 받습니다. `AkanUiRecipes`로 타입이 정해진 `recipes`는 framework component가 사용하는 className factory만 바꾸고, 구조와 동작 — async 상태, 포커스 처리, 접근성 — 은 손대지 않습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A replacement must accept the framework recipe's full variant contract, because every existing call site keeps working. Adding an axis of your own is allowed by the type but only reachable from code that knows your recipe's type — extending the vocabulary is not this slot's job. Add the axis to the framework recipe, or author an app recipe under `apps/<app>/ui/Recipe/`.",
              ko: "교체본은 framework recipe의 variant 계약 전체를 받아야 합니다. 기존 호출부가 그대로 동작해야 하기 때문입니다. 축을 더 얹는 것은 타입상 허용되지만, 그 축은 교체본의 타입을 아는 코드에서만 닿습니다. 어휘를 넓히는 것은 이 slot의 일이 아닙니다. framework recipe에 축을 더하거나, `apps/<app>/ui/Recipe/` 아래에 앱 recipe를 작성하세요.",
            })}
          </div>
        </Docs.Description>
        <Docs.OptionTable items={recipeSlots} />
        <Docs.CodeSnippet title={l.trans({ en: "Recipe slot", ko: "Recipe slot" })} code={recipeCode} />
        <Docs.Alert type="warning">
          {l.trans({
            en: "A recipe slot is a client-side, route-scoped restyle. It reaches framework client components, which resolve through `useUiRecipe(...)`. It does not reach a `buttonRecipe(...)` call written directly in app JSX — that import is static and has no context — and it does not reach server components (`Unit`, `View`), which render the canonical framework recipe on purpose.",
            ko: "recipe slot은 client 쪽에서, route 범위로 다시 칠하는 장치입니다. `useUiRecipe(...)`로 recipe를 찾는 framework client component에만 닿습니다. 앱 JSX에 직접 쓴 `buttonRecipe(...)` 호출에는 닿지 않으며 — 그 import는 정적이라 context가 없습니다 — server component(`Unit`, `View`)에도 닿지 않습니다. 그쪽은 의도적으로 framework 기본 recipe를 렌더합니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>

      <DocsToc />
    </Scroll>
  );
});
