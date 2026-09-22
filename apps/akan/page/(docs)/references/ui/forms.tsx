import { usePage } from "@apps/akan/client";
import { Divider, Docs, DocsToc, type UiComponentReference, UiComponentSlide } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const components: UiComponentReference[] = [
    {
      name: "Field",
      desc: l.trans({
        en: "The form-field namespace, and the layer a module template is written in. `<Field>` itself is a section wrapper — label, help tooltip, optional marker, and a column for the controls inside it; every member below is one labelled control. They share a prop vocabulary: `value` / `onChange`, `label` / `desc`, `nullable`, `disabled`, `placeholder`, `transform`, `validate`, and `className` / `labelClassName` / `inputClassName`. What differs between them is the shape of `value`.",
        ko: "form field namespace이며, module template이 쓰이는 layer입니다. `<Field>` 자체는 section wrapper로 label, 도움말 tooltip, optional 표시, 그리고 그 안의 control들이 놓이는 열을 제공합니다. 아래 member는 모두 label이 붙은 control 하나입니다. prop 어휘를 공유합니다 — `value` / `onChange`, `label` / `desc`, `nullable`, `disabled`, `placeholder`, `transform`, `validate`, 그리고 `className` / `labelClassName` / `inputClassName`. member마다 다른 것은 `value`의 형태입니다.",
      }),
      props: [
        {
          name: "Field",
          type: "{ label?, desc?, nullable?, containerClassName?, children? }",
          desc: l.trans({
            en: "Section wrapper. Draws the label row and stacks its children in a gap-4 column.",
            ko: "section wrapper입니다. label 행을 그리고 자식을 gap-4 세로 열로 쌓습니다.",
          }),
        },
        {
          name: "Field.Label",
          type: "{ label, desc?, unit?, nullable?, mode? }",
          desc: l.trans({
            en: "The label row itself. Capitalizes a string label, hangs `desc` off a help tooltip, and appends `(optional)` when `nullable`.",
            ko: "label 행 자체입니다. 문자열 label을 capitalize하고, `desc`를 도움말 tooltip에 걸며, `nullable`이면 `(optional)`을 덧붙입니다.",
          }),
        },
        {
          name: "Field.Text",
          type: "{ value: string | null, minlength?, maxlength?, inputStyleType? }",
          desc: l.trans({
            en: "One-line text. `inputStyleType` picks bordered, borderless, or underline.",
            ko: "한 줄 text입니다. `inputStyleType`으로 bordered, borderless, underline 중 하나를 고릅니다.",
          }),
        },
        {
          name: "Field.TextArea",
          type: "{ value: string | null, rows?, minlength?, maxlength? }",
          desc: l.trans({ en: "Multi-line text.", ko: "여러 줄 text입니다." }),
        },
        {
          name: "Field.Email",
          type: "{ value: string | null, inputStyleType? }",
          desc: l.trans({
            en: "Text with email validation built in.",
            ko: "email 검증이 내장된 text입니다.",
          }),
        },
        {
          name: "Field.Phone",
          type: "{ value: string | null }",
          desc: l.trans({
            en: "Text with phone-number validation and formatting.",
            ko: "전화번호 검증과 형식 처리가 붙은 text입니다.",
          }),
        },
        {
          name: "Field.Password",
          type: "{ value, confirmValue?, onChangeConfirm?, showConfirm? }",
          desc: l.trans({
            en: "Masked text. `showConfirm` adds the second box and checks the two against each other.",
            ko: "가려진 text입니다. `showConfirm`을 켜면 확인 입력이 하나 더 붙고 두 값을 서로 대조합니다.",
          }),
        },
        {
          name: "Field.Number",
          type: "{ value: number | null, min?, max?, unit?, formatter?, parser? }",
          desc: l.trans({
            en: "One number. `unit` is drawn in the label; `formatter` / `parser` control how the digits are shown and read back.",
            ko: "숫자 하나입니다. `unit`은 label에 표시되고, `formatter` / `parser`가 자릿수를 어떻게 보여주고 되읽을지 정합니다.",
          }),
        },
        {
          name: "Field.DoubleNumber",
          type: "{ value: [number, number] | null, min?, max?, separator? }",
          desc: l.trans({
            en: "A pair of numbers in one row — a range, a ratio, a coordinate.",
            ko: "한 행에 놓인 숫자 두 개입니다. 범위, 비율, 좌표 같은 값에 씁니다.",
          }),
        },
        {
          name: "Field.Date",
          type: "{ value: Dayjs, min?, max?, showTime? }",
          desc: l.trans({
            en: "One date, optionally with a time part.",
            ko: "날짜 하나이며, 필요하면 시각까지 받습니다.",
          }),
        },
        {
          name: "Field.DateRange",
          type: "{ from, to, onChangeFrom, onChangeTo, onChange?, showTime? }",
          desc: l.trans({
            en: "Two ends of a range. `onChange` fires only once both ends are set — nobody can query a half-open one.",
            ko: "범위의 두 끝입니다. `onChange`는 양끝이 모두 정해진 뒤에만 발생합니다. 한쪽이 빈 범위는 조회할 수 없기 때문입니다.",
          }),
        },
        {
          name: "Field.Switch",
          type: "{ value: boolean | null, onDesc?, offDesc? }",
          desc: l.trans({
            en: "A labelled boolean. `onDesc` / `offDesc` explain the current position beside the toggle.",
            ko: "label이 붙은 boolean입니다. `onDesc` / `offDesc`가 toggle 옆에서 현재 상태를 설명합니다.",
          }),
        },
        {
          name: "Field.ToggleSelect",
          type: "{ items, value: I | null, nullable?, validate?, btnClassName? }",
          desc: l.trans({
            en: "One choice as a row of buttons. `items` takes an `enumOf(...)` instance directly and translates each value through the dictionary.",
            ko: "버튼 줄로 고르는 단일 선택입니다. `items`는 `enumOf(...)` instance를 그대로 받아 각 값을 dictionary로 번역합니다.",
          }),
        },
        {
          name: "Field.MultiToggleSelect",
          type: "{ items, value: I[] | null, minlength?, maxlength? }",
          desc: l.trans({
            en: "The same row, many selected. `minlength` / `maxlength` are enforced with localized messages.",
            ko: "같은 줄에서 여러 개를 고릅니다. `minlength` / `maxlength`는 번역된 메시지와 함께 강제됩니다.",
          }),
        },
        {
          name: "Field.TextList",
          type: "{ value: string[] | null, minTextlength?, maxTextlength? }",
          desc: l.trans({
            en: "An ordered list of strings, each its own input, reorderable by drag and removable per row.",
            ko: "순서가 있는 문자열 목록입니다. 각 항목이 자기 입력창을 갖고, 드래그로 순서를 바꾸며 행마다 지울 수 있습니다.",
          }),
        },
        {
          name: "Field.Tags",
          type: "{ value: string[] | null, minTextlength?, maxTextlength? }",
          desc: l.trans({
            en: "An unordered set of short strings, drawn as badges with an inline add box.",
            ko: "순서 없는 짧은 문자열 집합입니다. badge로 그려지고 인라인 추가 입력이 붙습니다.",
          }),
        },
        {
          name: "Field.List",
          type: "{ value: Item[] | null, onAdd, renderItem }",
          desc: l.trans({
            en: "A list of embedded objects. You render one row; the field draws the frame, the add button, and the per-row remove.",
            ko: "내장 객체의 목록입니다. 행 하나만 렌더하면 field가 틀, 추가 버튼, 행별 삭제를 그립니다.",
          }),
        },
        {
          name: "Field.Parent",
          type: "{ value: Light | null, slice, renderOption, onSearch? }",
          desc: l.trans({
            en: "One related model, held as the Light instance. `slice` is the generated slice the options are loaded from.",
            ko: "관련 model 하나를 Light instance로 들고 있습니다. `slice`는 option을 불러올 generated slice입니다.",
          }),
        },
        {
          name: "Field.ParentId",
          type: "{ value: string | null, slice, onChange: (id, model) => void }",
          desc: l.trans({
            en: "The same picker holding only the id — what a form field of type `ID` stores. The chosen model arrives as the second argument.",
            ko: "같은 picker이지만 id만 들고 있습니다. `ID` 타입 form field가 저장하는 형태이며, 고른 model은 두 번째 인자로 전달됩니다.",
          }),
        },
        {
          name: "Field.Children",
          type: "{ value: Light[] | null, slice, renderOption }",
          desc: l.trans({
            en: "Many related models as Light instances.",
            ko: "여러 관련 model을 Light instance로 담습니다.",
          }),
        },
        {
          name: "Field.ChildrenId",
          type: "{ value: string[] | null, slice, renderOption }",
          desc: l.trans({ en: "Many related models as ids.", ko: "여러 관련 model을 id로 담습니다." }),
        },
      ],
      notes: [
        l.trans({
          en: "Pass the generated setter by reference — `onChange={st.do.setNameOnUser}`. That is what makes the framework emit `data-akan-action` / `data-akan-state` on the control and publish the field as an agent tool. An inline arrow (`onChange={(v) => st.do.setNameOnUser(v)}`) runs identically and publishes nothing: a closure the caller wrote says nothing about what it does, so the annotation is dropped rather than guessed. `no-unpublished-form-setter.grit` fails the build on the pass-through form.",
          ko: "generated setter는 참조로 넘기세요 — `onChange={st.do.setNameOnUser}`. 그래야 framework가 control에 `data-akan-action` / `data-akan-state`를 붙이고 그 field를 agent tool로 공개합니다. 인라인 화살표(`onChange={(v) => st.do.setNameOnUser(v)}`)는 동작은 같지만 아무것도 공개하지 않습니다. 호출자가 쓴 closure는 자기가 무엇을 하는지 말해 주지 않으므로, 추측하지 않고 주석을 포기합니다. 통과용 화살표는 `no-unpublished-form-setter.grit`가 빌드에서 막습니다.",
        }),
        l.trans({
          en: "A wrapper that transforms the value, adds a statement, or writes a nested path with `writeOnX` stays legal — normalize with the control's own `transform` prop where you can, and publish the rest explicitly with `st.tool`.",
          ko: "값을 변형하거나, 문장을 하나 더 실행하거나, `writeOnX`로 중첩 경로에 쓰는 wrapper는 그대로 써도 됩니다. 가능하면 control의 `transform` prop으로 정규화하고, 나머지는 `st.tool`로 명시적으로 공개하세요.",
        }),
        l.trans({
          en: "`libs/shared/ui/Field` wraps and extends this namespace for project-specific controls such as rich text, maps, and postcode.",
          ko: "`libs/shared/ui/Field`는 rich text, 지도, 우편번호 같은 프로젝트 전용 control을 위해 이 namespace를 감싸고 확장합니다.",
        }),
      ],
      code: `import { Field, Layout, cnst, st } from "@apps/koyo/client";

export const Template = () => {
  const icecreamOrderForm = st.use.icecreamOrderForm();
  return (
    <Layout.Template>
      <Field.Text label="name" value={icecreamOrderForm.name} onChange={st.do.setNameOnIcecreamOrder} />
      <Field.ToggleSelect
        label="size"
        items={cnst.IcecreamOrderSize}
        value={icecreamOrderForm.size}
        onChange={st.do.setSizeOnIcecreamOrder}
      />
      <Field.Number label="price" unit="KRW" value={icecreamOrderForm.price} onChange={st.do.setPriceOnIcecreamOrder} />
      <Field.Tags label="toppings" value={icecreamOrderForm.toppings} onChange={st.do.setToppingsOnIcecreamOrder} />
    </Layout.Template>
  );
};`,
    },
    {
      name: "Input",
      desc: l.trans({
        en: "Controlled primitive input namespace. Reach for it below `Field` — a search box, a filter bar, an inline cell editor — where you want the input without the label row. Every leaf is its own override slot, so `Input`, `Input.TextArea`, `Input.Password`, `Input.Email`, `Input.Number`, and `Input.Checkbox` can each be re-skinned on their own.",
        ko: "controlled primitive input namespace입니다. label 행 없이 입력만 필요한 자리 — 검색창, filter bar, 인라인 셀 편집 — 에서 `Field` 아래 단계로 사용합니다. 각 leaf가 자기 override slot이라서 `Input`, `Input.TextArea`, `Input.Password`, `Input.Email`, `Input.Number`, `Input.Checkbox`를 따로따로 다시 스킨할 수 있습니다.",
      }),
      props: [
        {
          name: "value",
          type: "string",
          desc: l.trans({ en: "Controlled input value.", ko: "controlled input value입니다." }),
        },
        {
          name: "onChange",
          type: "(value, event?) => void",
          desc: l.trans({ en: "Receives the next string value.", ko: "다음 string value를 받습니다." }),
        },
        {
          name: "validate",
          type: "(value) => boolean | string",
          desc: l.trans({
            en: "Returns true for valid input or an error message.",
            ko: "valid input이면 true를, 아니면 error message를 반환합니다.",
          }),
        },
        {
          name: "inputStyleType",
          type: `"bordered" | "borderless" | "underline"`,
          desc: l.trans({
            en: "The surface the field is drawn on.",
            ko: "field가 그려지는 표면 모양입니다.",
          }),
        },
        {
          name: "onPressEnter",
          type: "(value) => void",
          desc: l.trans({
            en: "Called on Enter — the search-box idiom, without a form element.",
            ko: "Enter에서 호출됩니다. form element 없이 검색창을 만드는 관용구입니다.",
          }),
        },
        {
          name: "Input.TextArea / Password / Email / Number / Checkbox",
          type: "subcomponents",
          desc: l.trans({
            en: "The typed variants. Each keeps the same controlled `value` / `onChange` contract in its own value type.",
            ko: "타입별 변형입니다. 각자 자기 값 타입으로 같은 controlled `value` / `onChange` 계약을 유지합니다.",
          }),
        },
      ],
      code: `import { Input } from "akanjs/ui";

export const SearchInput = ({ query, setQuery, search }) => (
  <Input
    value={query}
    onChange={setQuery}
    placeholder="Search"
    inputStyleType="underline"
    onPressEnter={search}
  />
);`,
    },
    {
      name: "Select",
      desc: l.trans({
        en: "Controlled selector that accepts primitive arrays, label/value options, or Akan enum instances. It supports single, multiple, and searchable selection modes. The option list portals to document.body and is placed against the field, matching its width, so a Select inside a scrolling modal body or a table is not clipped by it.",
        ko: "primitive array, label/value option, Akan enum instance를 받을 수 있는 controlled selector입니다. single, multiple, searchable selection mode를 지원합니다. option list는 document.body로 portal되어 field 기준으로 배치되고 field 너비를 따르므로, 스크롤되는 modal body나 table 안의 Select도 잘리지 않습니다.",
      }),
      props: [
        {
          name: "value",
          type: "T | T[]",
          desc: l.trans({
            en: "Selected value, or selected values when multiple is true.",
            ko: "선택된 value입니다. multiple이 true이면 selected values입니다.",
          }),
        },
        {
          name: "options",
          type: "T[] | { label, value }[] | enum",
          desc: l.trans({ en: "Option source.", ko: "option source입니다." }),
        },
        {
          name: "multiple",
          type: "boolean",
          desc: l.trans({ en: "Enable multiple selected values.", ko: "여러 값을 선택할 수 있게 합니다." }),
        },
        {
          name: "searchable",
          type: "boolean",
          desc: l.trans({
            en: "Show search input and optionally call onSearch.",
            ko: "search input을 표시하고 필요하면 onSearch를 호출합니다.",
          }),
        },
        {
          name: "renderOption / renderSelected",
          type: "(value) => ReactNode",
          desc: l.trans({ en: "Custom display renderers.", ko: "custom display renderer입니다." }),
        },
      ],
      code: `import { Select } from "akanjs/ui";

export const StatusSelect = ({ status, setStatus }) => (
  <Select
    label="status"
    value={status}
    options={["ready", "running", "done"]}
    onChange={(next) => setStatus(next)}
  />
);`,
    },
    {
      name: "Switch",
      desc: l.trans({
        en: 'A boolean as a `<button role="switch">`, so focus and Space/Enter toggling come from the platform rather than from a keydown handler. Controlled and uncontrolled both work: pass `checked` for the first, `defaultChecked` for the second. Use `Field.Switch` when the value is a model field and you want the label row with it.',
        ko: '`<button role="switch">`로 만든 boolean입니다. 포커스와 Space/Enter 토글이 keydown handler가 아니라 플랫폼에서 옵니다. controlled와 uncontrolled 모두 동작하며, 앞은 `checked`, 뒤는 `defaultChecked`를 넘깁니다. 값이 model field이고 label 행까지 필요하면 `Field.Switch`를 쓰세요.',
      }),
      props: [
        {
          name: "checked",
          type: "boolean",
          desc: l.trans({
            en: "Controlled state. Left out, the switch keeps its own.",
            ko: "controlled 상태입니다. 빼면 switch가 자체 상태를 갖습니다.",
          }),
        },
        {
          name: "defaultChecked",
          type: "boolean",
          desc: l.trans({
            en: "Starting position for the uncontrolled form.",
            ko: "uncontrolled 형태의 시작 위치입니다.",
          }),
        },
        {
          name: "onChange",
          type: "(checked: boolean) => void",
          desc: l.trans({
            en: "Receives the next position. Passed by reference, it publishes the field to the agent.",
            ko: "다음 위치를 받습니다. 참조로 넘기면 그 field가 에이전트에 공개됩니다.",
          }),
        },
        {
          name: "variant",
          type: `"primary" | "accent" | "success"`,
          desc: l.trans({
            en: "The colour of the on position. The off position is always `bg-muted`.",
            ko: "켜짐 위치의 색입니다. 꺼짐 위치는 항상 `bg-muted`입니다.",
          }),
        },
        {
          name: "disabled",
          type: "boolean",
          desc: l.trans({
            en: "Blocks the toggle and dims the control; the published tool goes with it.",
            ko: "토글을 막고 control을 흐리게 합니다. 공개된 tool도 함께 사라집니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "Inside a `Dropdown` menu item, put `data-dropdown-keep-open` on the `<li>` so flipping the switch does not close the menu.",
          ko: "`Dropdown` menu item 안에 넣을 때는 `<li>`에 `data-dropdown-keep-open`을 붙여, switch를 조작해도 메뉴가 닫히지 않게 하세요.",
        }),
      ],
      code: `import { Switch } from "akanjs/ui";

export const NotifyToggle = () => {
  const notify = st.use.notify();
  return <Switch checked={notify} onChange={st.do.setNotify} variant="accent" />;
};`,
    },
    {
      name: "Radio",
      desc: l.trans({
        en: 'A single choice as a `role="radiogroup"` of `role="radio"` buttons, with arrow-key roving focus. Each child carries its own `value`; the group resolves the selection by matching it, and falls back to treating a numeric `value` as an index only when no child owns it — resolving both at once is what once let two options read as checked at the same time.',
        ko: '`role="radiogroup"` 안의 `role="radio"` 버튼으로 만든 단일 선택이며, 화살표 키로 포커스가 이동합니다. 자식마다 자기 `value`를 갖고, 그룹은 그것을 맞춰 선택을 결정합니다. 어떤 자식도 그 값을 갖지 않을 때에만 숫자 `value`를 index로 해석합니다. 둘을 동시에 해석하던 시절에는 두 항목이 동시에 선택된 것처럼 보였습니다.',
      }),
      props: [
        {
          name: "value",
          type: "string | number | null",
          desc: l.trans({
            en: "The selected child's `value`, or a position when no child declares one.",
            ko: "선택된 자식의 `value`이거나, 어떤 자식도 선언하지 않았을 때는 위치입니다.",
          }),
        },
        {
          name: "onChange",
          type: "(value, idx) => void",
          desc: l.trans({
            en: "Receives the chosen child's `value` and its index.",
            ko: "고른 자식의 `value`와 그 index를 받습니다.",
          }),
        },
        {
          name: "children",
          type: "ReactNode | ReactElement[]",
          desc: l.trans({
            en: "The options, normally `Radio.Item`s. The framework draws the dot and the row; the child renders only its own body.",
            ko: "선택지이며 보통 `Radio.Item`입니다. 점과 행은 framework가 그리고, 자식은 자기 본문만 렌더합니다.",
          }),
        },
        {
          name: "Radio.Item",
          type: "{ value, children, className?, checked?, onChange? }",
          desc: l.trans({
            en: "One option's body. Its own override slot (`RadioItem`), separate from the group's.",
            ko: "선택지 하나의 본문입니다. 그룹과는 별개의 override slot(`RadioItem`)을 갖습니다.",
          }),
        },
      ],
      code: `import { Radio } from "akanjs/ui";

export const PlanPicker = ({ plan, setPlan }) => (
  <Radio value={plan} onChange={(value) => setPlan(value)}>
    <Radio.Item value="basic">Basic</Radio.Item>
    <Radio.Item value="pro">Pro</Radio.Item>
  </Radio>
);`,
    },
    {
      name: "ToggleSelect",
      desc: l.trans({
        en: "A choice as a row of pressed buttons rather than a dropdown — right where the option count is small and the labels are short. `ToggleSelect` is single-select, `ToggleSelect.Multi` many. `nullable` and `validate` are required props, not optional ones: a toggle row has no empty state to fall back on, so both decisions are made at the call site.",
        ko: "dropdown 대신 눌린 버튼 줄로 고르는 선택입니다. 선택지가 적고 label이 짧은 자리에 맞습니다. `ToggleSelect`는 단일 선택, `ToggleSelect.Multi`는 다중 선택입니다. `nullable`과 `validate`는 optional이 아니라 필수 prop입니다. toggle 줄에는 돌아갈 빈 상태가 없으므로 두 결정을 호출부에서 내립니다.",
      }),
      props: [
        {
          name: "items",
          type: "string[] | number[] | { label, value, disabled? }[]",
          desc: l.trans({
            en: "The cells. `Field.ToggleSelect` accepts an `enumOf(...)` instance on top of this and translates each value first.",
            ko: "cell 목록입니다. `Field.ToggleSelect`는 여기에 더해 `enumOf(...)` instance를 받아 각 값을 먼저 번역합니다.",
          }),
        },
        {
          name: "value",
          type: "I",
          desc: l.trans({ en: "The selected value.", ko: "선택된 값입니다." }),
        },
        {
          name: "nullable",
          type: "boolean",
          desc: l.trans({
            en: "Required. Whether the selection may be cleared — which is also whether `onClear` is ever called.",
            ko: "필수입니다. 선택을 비울 수 있는지 정하며, 이것이 곧 `onClear`가 호출되는지 여부입니다.",
          }),
        },
        {
          name: "validate",
          type: "(value) => boolean | string",
          desc: l.trans({
            en: "Required. Returns true, or the message to show under the row.",
            ko: "필수입니다. true를 반환하거나, 줄 아래에 표시할 메시지를 반환합니다.",
          }),
        },
        {
          name: "onChange / onClear",
          type: "(value, idx) => void / () => void",
          desc: l.trans({
            en: "The pick and the clear. `onClear` fires only in the `nullable` form.",
            ko: "선택과 비우기입니다. `onClear`는 `nullable` 형태에서만 발생합니다.",
          }),
        },
        {
          name: "renderItem",
          type: "(item, { selected, disabled, onToggle }) => ReactNode",
          desc: l.trans({
            en: "Draws one cell. `onToggle` is the cell's own action — put it on whatever the cell renders.",
            ko: "cell 하나를 그립니다. `onToggle`이 그 cell의 action이므로, cell이 렌더하는 element에 직접 붙이세요.",
          }),
        },
        {
          name: "ToggleSelect.Multi",
          type: "{ items, value: string[] | number[], nullable, validate, onChange }",
          desc: l.trans({
            en: "The many-selected form. Its own override slot (`ToggleSelectMulti`).",
            ko: "다중 선택 형태입니다. 자체 override slot(`ToggleSelectMulti`)을 갖습니다.",
          }),
        },
      ],
      code: `import { ToggleSelect } from "akanjs/ui";

export const SizePicker = ({ size, setSize }) => (
  <ToggleSelect
    items={["small", "medium", "large"]}
    value={size}
    nullable={false}
    validate={() => true}
    onChange={(next) => setSize(next)}
  />
);`,
    },
    {
      name: "DatePicker",
      desc: l.trans({
        en: "A date as the browser's own field, so the calendar, the locale, and the touch keyboard are the platform's. `min` and `max` are enforced by the browser; `disabledDate` is rejected on selection rather than greyed out, because a native field constrains only through those two.",
        ko: "브라우저 자체 field로 받는 날짜입니다. 달력, 로케일, 터치 키보드가 모두 플랫폼의 것입니다. `min`과 `max`는 브라우저가 강제하고, `disabledDate`는 회색 처리가 아니라 선택 시 거절됩니다. native field는 그 둘로만 제약할 수 있기 때문입니다.",
      }),
      props: [
        {
          name: "value",
          type: "Dayjs | null",
          desc: l.trans({ en: "The current value.", ko: "현재 값입니다." }),
        },
        {
          name: "onChange",
          type: "(value: Dayjs | null) => void",
          desc: l.trans({ en: "Receives the next value.", ko: "다음 값을 받습니다." }),
        },
        {
          name: "showTime",
          type: "boolean",
          desc: l.trans({
            en: "Switches the native input to datetime-local.",
            ko: "native input을 datetime-local로 바꿉니다.",
          }),
        },
        {
          name: "min / max",
          type: "Dayjs | null",
          desc: l.trans({
            en: "Earliest and latest selectable values. The browser enforces them.",
            ko: "선택 가능한 가장 이른 값과 늦은 값입니다. 브라우저가 강제합니다.",
          }),
        },
        {
          name: "disabledDate",
          type: "(date: Dayjs) => boolean | null | undefined",
          desc: l.trans({
            en: "Rejected on selection rather than greyed out.",
            ko: "회색 처리가 아니라 선택 시 거절됩니다.",
          }),
        },
        {
          name: "DatePicker.RangePicker",
          type: "{ value: [Dayjs | null, Dayjs | null], onChange, showTime?, disabledDate? }",
          desc: l.trans({
            en: "Both ends in one control, as a tuple. Its own override slot (`DatePickerRangePicker`).",
            ko: "양끝을 tuple 하나로 받는 control입니다. 자체 override slot(`DatePickerRangePicker`)을 갖습니다.",
          }),
        },
        {
          name: "DatePicker.TimePicker",
          type: "{ value: Dayjs | null, onChange, disabled?, disabledDate? }",
          desc: l.trans({
            en: "The time part alone. Its own override slot (`DatePickerTimePicker`).",
            ko: "시각 부분만 받습니다. 자체 override slot(`DatePickerTimePicker`)을 갖습니다.",
          }),
        },
      ],
      notes: [
        l.trans({
          en: "For a model field use `Field.Date` / `Field.DateRange` instead — they add the label row, the optional marker, and the store wiring around this control.",
          ko: "model field에는 `Field.Date` / `Field.DateRange`를 쓰세요. 이 control 위에 label 행, optional 표시, store 배선을 얹어 줍니다.",
        }),
      ],
      code: `import { DatePicker } from "akanjs/ui";

export const RangeFilter = ({ range, setRange }) => (
  <DatePicker.RangePicker value={range} onChange={setRange} showTime />
);`,
    },
    {
      name: "Button",
      desc: l.trans({
        en: "The one button primitive. A synchronous handler renders a plain button; returning a promise is what opts the same button into loading, success, and error state and blocks duplicate clicks while processing. There is no separate async button to choose.",
        ko: "버튼 primitive는 하나입니다. 동기 handler면 평범한 button으로 렌더되고, promise를 반환하면 같은 button이 loading·success·error state로 들어가며 처리 중 중복 click을 막습니다. 별도의 async button을 고를 필요가 없습니다.",
      }),
      props: [
        {
          name: "onClick",
          type: "(event, { onError }) => Promise<Result> | Result",
          desc: l.trans({
            en: "Optional. Returning a promise enables the async states; returning nothing keeps it a plain button.",
            ko: "optional입니다. promise를 반환하면 async state가 켜지고, 아무것도 반환하지 않으면 평범한 button입니다.",
          }),
        },
        {
          name: "onSuccess",
          type: "(result) => void",
          desc: l.trans({
            en: "Called after the success state is shown briefly.",
            ko: "success state가 짧게 표시된 뒤 호출됩니다.",
          }),
        },
        {
          name: "loadingMode",
          type: `"hold" | "replace"`,
          desc: l.trans({
            en: "Both modes keep the box fixed — CSS cannot animate an auto width, so a resizing button can only snap. hold (default) fades a bare indicator over the children, sizing the box to the label. replace cross-fades to a labelled indicator, keeping both labels stacked so the box is the wider of the two from the start.",
            ko: "두 mode 모두 box를 고정합니다 — CSS는 auto 너비를 animation할 수 없어서, 크기가 바뀌는 button은 튀는 것 말고 방법이 없습니다. hold(기본)는 children 위에 indicator만 겹쳐 box를 label 크기로 유지합니다. replace는 label까지 교차 fade하며, 두 label을 겹쳐 두어 box가 처음부터 둘 중 넓은 쪽으로 고정됩니다.",
          }),
        },
        {
          name: "showError",
          type: "boolean",
          desc: l.trans({
            en: "Whether a failure renders its message under the button. Off leaves it to the framework toast, keeping the layout fixed.",
            ko: "실패 message를 button 아래에 렌더할지 여부입니다. 끄면 framework toast에만 맡겨 layout이 고정됩니다.",
          }),
        },
        {
          name: "disabled",
          type: "boolean",
          desc: l.trans({
            en: "Inherited native button prop; also disabled while loading/success.",
            ko: "native button에서 상속된 prop입니다. loading/success 중에도 disabled됩니다.",
          }),
        },
      ],
      code: `import { Button } from "akanjs/ui";

// 동기 handler — spinner 없이 평범한 button.
export const CloseButton = ({ close }) => <Button variant="ghost" onClick={close}>Close</Button>;

// promise 를 반환 — 같은 component 가 loading → success 로 동작한다.
export const SaveButton = ({ save }) => (
  <Button
    onClick={async (_event, { onError }) => {
      const result = await save();
      if (!result.ok) onError("base.error");
      return result;
    }}
  >
    Save
  </Button>
);`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="forms-ui" title={l.trans({ en: "Forms UI", ko: "Forms UI" })}>
        <Docs.Title>{l.trans({ en: "Forms UI", ko: "Forms UI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A model form in Akan is not a form element with state in it. The store holds `<model>Form`, the generated setters write one field each, and a control's only job is to show the current value and hand the next one back. That is why nothing on this page keeps state of its own.",
              ko: "Akan에서 model form은 안에 상태를 담은 form element가 아닙니다. store가 `<model>Form`을 들고, generated setter가 field를 하나씩 쓰며, control이 하는 일은 현재 값을 보여주고 다음 값을 돌려주는 것뿐입니다. 이 페이지의 어떤 컴포넌트도 자체 상태를 갖지 않는 이유입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Work down the layers: `Field.*` for a model field, `Input` / `Select` / `Switch` / `Radio` / `ToggleSelect` / `DatePicker` for a control without a label row, and `Button` for the action at the end.",
              ko: "층을 따라 내려가며 고르세요. model field에는 `Field.*`, label 행이 필요 없는 control에는 `Input` / `Select` / `Switch` / `Radio` / `ToggleSelect` / `DatePicker`, 마지막 action에는 `Button`입니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert type="error">
          {l.trans({
            en: "Hand every setter over by reference — `onChange={st.do.setSizeOnTicket}`, never `onChange={(size) => st.do.setSizeOnTicket(size)}`. The two run identically, and only the first emits `data-akan-action` on the control and publishes the field as an agent tool. `no-unpublished-form-setter.grit` is an error, because it is a silent failure in two lines that read the same.",
            ko: "setter는 반드시 참조로 넘기세요 — `onChange={st.do.setSizeOnTicket}`이고, `onChange={(size) => st.do.setSizeOnTicket(size)}`는 안 됩니다. 동작은 똑같지만 `data-akan-action`을 control에 붙이고 그 field를 agent tool로 공개하는 것은 앞쪽뿐입니다. 똑같아 보이는 두 줄에서 조용히 실패하는 문제라 `no-unpublished-form-setter.grit`가 error로 막습니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />
      {components.map((component) => (
        <UiComponentSlide key={component.name} component={component} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
