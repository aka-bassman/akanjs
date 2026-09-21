import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const baseVariables: IntroItem[] = [
    {
      name: "st.<model>: Full | null",
      desc: l.trans({ en: "The cached full model instance.", ko: "cache된 full model instance입니다." }),
    },
    {
      name: "st.<model>Loading: string | boolean",
      desc: l.trans({ en: "Loading status for the model instance.", ko: "model instance의 loading 상태입니다." }),
    },
    {
      name: "st.<model>Form: Default",
      desc: l.trans({
        en: "Form state for create or update flows.",
        ko: "create 또는 update 흐름의 form state입니다.",
      }),
    },
    {
      name: "st.<model>FormLoading: string | boolean",
      desc: l.trans({ en: "Loading status for form submission.", ko: "form 제출의 loading 상태입니다." }),
    },
    {
      name: "st.<model>Submit: Submit",
      desc: l.trans({ en: "Latest submit state.", ko: "가장 최근 submit state입니다." }),
    },
    {
      name: "st.<model>ViewAt: Date",
      desc: l.trans({ en: "Time when the detailed view was opened.", ko: "상세 view가 열린 시각입니다." }),
    },
    {
      name: "st.<model>Modal: string | null",
      desc: l.trans({ en: "Modal key associated with this model.", ko: "이 model에 연결된 modal key입니다." }),
    },
  ];

  const baseMethods: IntroItem[] = [
    {
      name: "create<Class>InForm(options?)",
      desc: l.trans({ en: "Create a document using form state.", ko: "form state로 document를 생성합니다." }),
    },
    {
      name: "update<Class>InForm(options?)",
      desc: l.trans({ en: "Update a document using form state.", ko: "form state로 document를 수정합니다." }),
    },
    {
      name: "create<Class>(data, options?)",
      desc: l.trans({ en: "Create a new document with data.", ko: "data로 새 document를 생성합니다." }),
    },
    {
      name: "update<Class>(id, data, options?)",
      desc: l.trans({ en: "Update an existing document.", ko: "기존 document를 수정합니다." }),
    },
    { name: "remove<Class>(id, options?)", desc: l.trans({ en: "Remove a document.", ko: "document를 제거합니다." }) },
    {
      name: "check<Class>Submitable(disabled?)",
      desc: l.trans({ en: "Check whether the form can be submitted.", ko: "form을 제출할 수 있는지 확인합니다." }),
    },
    {
      name: "submit<Class>(options?)",
      desc: l.trans({ en: "Submit the form for create or update.", ko: "create 또는 update로 form을 제출합니다." }),
    },
    {
      name: "new<Class>(partial?, options?)",
      desc: l.trans({ en: "Initialize form state for creation.", ko: "생성용 form state를 초기화합니다." }),
    },
    {
      name: "edit<Class>(model, options?)",
      desc: l.trans({ en: "Initialize form state for editing.", ko: "수정용 form state를 초기화합니다." }),
    },
    {
      name: "merge<Class>(model, data, options?)",
      desc: l.trans({
        en: "Merge data into an existing cached document.",
        ko: "cache된 기존 document에 data를 병합합니다.",
      }),
    },
    {
      name: "view<Class>(model, options?)",
      desc: l.trans({ en: "Open detailed view state.", ko: "상세 view state를 엽니다." }),
    },
    {
      name: "set<Class>(...models)",
      desc: l.trans({ en: "Manually set model cache.", ko: "model cache를 직접 설정합니다." }),
    },
    { name: "reset<Class>(model?)", desc: l.trans({ en: "Reset model state.", ko: "model state를 초기화합니다." }) },
  ];

  const sliceVariables: IntroItem[] = [
    {
      name: "st.default<Class>: Default",
      desc: l.trans({ en: "Default value for the slice.", ko: "slice의 default 값입니다." }),
    },
    {
      name: "st.<slice>List: DataList<Light>",
      desc: l.trans({ en: "List loaded by init or refresh.", ko: "init 또는 refresh가 불러온 list입니다." }),
    },
    {
      name: "st.<slice>ListLoading: boolean",
      desc: l.trans({ en: "Loading status of the list.", ko: "list의 loading 상태입니다." }),
    },
    {
      name: "st.<slice>InitList: DataList<Light>",
      desc: l.trans({ en: "Initial list snapshot.", ko: "최초 list snapshot입니다." }),
    },
    {
      name: "st.<slice>InitAt: Date",
      desc: l.trans({ en: "Time when the list was initialized.", ko: "list가 초기화된 시각입니다." }),
    },
    {
      name: "st.<slice>Selection: DataList<Light>",
      desc: l.trans({ en: "Selected items in the list.", ko: "list에서 선택된 항목입니다." }),
    },
    {
      name: "st.<slice>Insight: Insight",
      desc: l.trans({ en: "Insight data for the list.", ko: "list의 insight data입니다." }),
    },
    {
      name: "st.lastPageOf<Slice>: number",
      desc: l.trans({ en: "Last accessed page number.", ko: "마지막으로 접근한 page 번호입니다." }),
    },
    {
      name: "st.pageOf<Slice>: number",
      desc: l.trans({ en: "Current page number.", ko: "현재 page 번호입니다." }),
    },
    { name: "st.limitOf<Slice>: number", desc: l.trans({ en: "Items per page.", ko: "page당 항목 수입니다." }) },
    {
      name: "st.queryArgsOf<Slice>: QueryArgs",
      desc: l.trans({ en: "Current query arguments.", ko: "현재 query 인자입니다." }),
    },
    { name: "st.sortOf<Slice>: Sort", desc: l.trans({ en: "Current sort setting.", ko: "현재 sort 설정입니다." }) },
  ];

  const sliceMethods: IntroItem[] = [
    {
      name: "init<Slice>(...args)",
      desc: l.trans({ en: "Initialize list with query args.", ko: "query 인자로 list를 초기화합니다." }),
    },
    {
      name: "refresh<Slice>(initForm?)",
      desc: l.trans({ en: "Reload list with strict consistency.", ko: "엄격한 일관성으로 list를 다시 불러옵니다." }),
    },
    {
      name: "select<Slice>(model, options?)",
      desc: l.trans({ en: "Update selection state.", ko: "선택 state를 갱신합니다." }),
    },
    {
      name: "setPageOf<Slice>(page, options?)",
      desc: l.trans({ en: "Change page and reload.", ko: "page를 바꾸고 다시 불러옵니다." }),
    },
    {
      name: "loadMoreOf<Slice>(options?)",
      desc: l.trans({
        en: "Append the rows after the ones loaded.",
        ko: "이미 불러온 행 다음의 행을 이어 붙입니다.",
      }),
    },
    {
      name: "setLimitOf<Slice>(limit, options?)",
      desc: l.trans({ en: "Change list limit and reload.", ko: "list limit을 바꾸고 다시 불러옵니다." }),
    },
    {
      name: "setQueryArgsOf<Slice>(...args)",
      desc: l.trans({ en: "Change query arguments and reload.", ko: "query 인자를 바꾸고 다시 불러옵니다." }),
    },
    {
      name: "setSortOf<Slice>(sort, options?)",
      desc: l.trans({ en: "Change sort and reload.", ko: "sort를 바꾸고 다시 불러옵니다." }),
    },
  ];

  const stateManagementMethods: IntroItem[] = [
    {
      name: "get()",
      desc: l.trans({
        en: "Get the current snapshot of the store state.",
        ko: "store state의 현재 snapshot을 가져옵니다.",
      }),
      example: `const { ticket, ticketList } = this.get();`,
    },
    {
      name: "set(state)",
      desc: l.trans({
        en: "Update store state. It merges shallowly.",
        ko: "store state를 업데이트합니다. 얕게 병합됩니다.",
      }),
      example: `this.set({ ticketModal: null });`,
    },
    {
      name: "pick(...keys)",
      desc: l.trans({
        en: "Select required state values. It throws immediately if any requested key is null or undefined.",
        ko: "필수 state 값을 선택합니다. 요청한 key 중 하나라도 null 또는 undefined면 즉시 error를 발생시킵니다.",
      }),
      example: `const { ticketForm } = this.pick("ticketForm");`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="store-overview" title="model.store.ts">
        <Docs.Title>model.store.ts</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A store file is the client-side state and action layer for a module. Pages and UI components read state from the store and call store actions instead of coordinating fetch calls directly.",
              ko: "store 파일은 module의 client-side state와 action layer입니다. page와 UI component는 fetch 호출을 직접 조율하지 않고 store에서 state를 읽고 store action을 호출합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Stores sit between UI and generated fetch/sig clients. Service and document files keep business rules; store files handle UI state, form state, list state, toast messages, and client navigation around those calls.",
              ko: "store는 UI와 generated fetch/sig client 사이에 위치합니다. business rule은 service와 document에 두고, store는 UI state, form state, list state, toast message, client navigation을 다룹니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="class-structure" title={l.trans({ en: "Store Class Structure", ko: "Store class 구조" })}>
        <Docs.Title>{l.trans({ en: "Store Class Structure", ko: "Store class 구조" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Define a store with store(sig.model, stateFactory). The second argument is a factory, so default state is recreated safely for each runtime instance.",
              ko: "store는 store(sig.model, stateFactory)로 정의합니다. 두 번째 인자는 factory이므로 runtime instance마다 default state가 안전하게 다시 만들어집니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="ticket.store.ts"
          code={`import { msg } from "@apps/akan/client";
import { store } from "akanjs/store";

import * as cnst from "../cnst";
import { fetch, sig } from "../useClient";

export class TicketStore extends store(sig.ticket, () => ({
  backlogTicketList: [] as cnst.LightTicket[],
})) {
  async openTicket(id: string, due: Dayjs) {
    msg.loading("ticket.openTicketLoading", { key: "openTicket" });
    this.setTicket(await fetch.openTicket(id, due));
    msg.success("ticket.openTicketSuccess", { key: "openTicket" });
    this.set({ ticketModal: null });
  }
}`}
        />
        <Code.Snippet
          className="w-full"
          title="service-only store"
          code={`export class MyappStore extends store("myapp" as const, () => ({
  menuOpen: false,
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="generated-extension"
        title={l.trans({ en: "Extending Generated Stores", ko: "Generated store 확장" })}
      >
        <Docs.Title>{l.trans({ en: "Extending Generated Stores", ko: "Generated store 확장" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When an app extends a generated or library domain, pass the generated stores after local state. The inherited state, actions, and metadata are merged first, then the app adds its own state and actions.",
              ko: "app이 generated 또는 library domain을 확장한다면 local state 뒤에 generated stores를 넘깁니다. inherited state, action, metadata가 merge되고 app이 자기 state와 action을 추가합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="user.store.ts"
          code={`import { user } from "../__lib/lib.store";

export class UserStore extends store(
  sig.user,
  () => ({
    self: new cnst.User(),
  }),
  ...user.stores,
) {
  async refreshSelf() {
    const { self } = this.get();
    this.set({ self: await fetch.user(self.id) });
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="writable-derived-state"
        title={l.trans({ en: "Writable And Derived State", ko: "Writable와 derived state" })}
      >
        <Docs.Title>{l.trans({ en: "Writable And Derived State", ko: "Writable와 derived state" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Most stores only need plain writable state. The state builder also supports persist and session values. A third store() argument can define derived state such as URL search params or computed values.",
              ko: "대부분의 store는 plain writable state만 필요합니다. state builder는 persist와 session 값도 지원합니다. store()의 세 번째 인자로 URL search param이나 computed value 같은 derived state를 정의할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="store state builders"
          code={`export class TicketStore extends store(
  sig.ticket,
  ({ persist, session }) => ({
    viewMode: persist(String, { default: "board" }),
    draftKeyword: session(String, { default: "" }),
  }),
  ({ search, computed }) => ({
    status: search("status", TicketStatus, { default: "active" }),
    hasKeyword: computed(["draftKeyword"], (keyword) => keyword.length > 0),
  }),
) {}`}
        />
        <div className="grid gap-3 xl:grid-cols-4">
          {[
            {
              title: "plain",
              desc: l.trans({
                en: "Use normal values for UI state that can reset with the store.",
                ko: "store와 함께 reset되어도 되는 UI state에는 일반 값을 사용합니다.",
              }),
            },
            {
              title: "persist",
              desc: l.trans({
                en: "Use for values that should survive browser reloads.",
                ko: "browser reload 이후에도 유지해야 하는 값에 사용합니다.",
              }),
            },
            {
              title: "session",
              desc: l.trans({
                en: "Use for values that should last only during the current browser session.",
                ko: "현재 browser session 동안만 유지하면 되는 값에 사용합니다.",
              }),
            },
            {
              title: "search / computed",
              desc: l.trans({
                en: "Use for URL-backed state or values derived from writable state.",
                ko: "URL 기반 state 또는 writable state에서 계산되는 값에 사용합니다.",
              }),
            },
          ].map(({ title, desc }) => (
            <div key={title} className={panelRecipe()}>
              <div className="font-bold text-foreground">{title}</div>
              <div className="mt-2 text-foreground/70">{desc}</div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="state-management" title={l.trans({ en: "State Interaction", ko: "State 상호작용" })}>
        <Docs.Title>{l.trans({ en: "State Interaction", ko: "State 상호작용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Inside a store action, use get for optional reads, pick for required state, and set for updates. pick is useful when the next line cannot work without that state.",
              ko: "store action 내부에서는 optional read에 get, 필수 state에 pick, update에 set을 사용합니다. 다음 코드가 해당 state 없이는 동작할 수 없을 때 pick이 유용합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.IntroTable type="method" items={stateManagementMethods} />
        <Docs.Alert>
          {l.trans({
            en: "pick throws if the requested value is null or undefined. Use get when null is a valid branch you want to handle manually.",
            ko: "pick은 요청한 값이 null 또는 undefined면 error를 발생시킵니다. null을 직접 처리해야 하는 분기라면 get을 사용하세요.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="standard-api" title={l.trans({ en: "Standard Model API", ko: "표준 model API" })}>
        <Docs.Title>{l.trans({ en: "Standard Model API", ko: "표준 model API" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A store bound to sig.model receives generated model state and generated CRUD/form actions. These helpers cover common create, update, remove, view, edit, submit, and cache flows.",
              ko: "sig.model에 묶인 store는 generated model state와 generated CRUD/form action을 받습니다. 이 helper들은 create, update, remove, view, edit, submit, cache 흐름을 다룹니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.SubTitle>Base State</Docs.SubTitle>
        <Docs.IntroTable type="field" items={baseVariables} />
        <div className="mb-8" />
        <Docs.SubTitle>Base Actions</Docs.SubTitle>
        <Docs.IntroTable type="method" items={baseMethods} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="slice-features"
        title={l.trans({ en: "Slice Auto-Generated Features", ko: "Slice 자동 생성 기능" })}
      >
        <Docs.Title>{l.trans({ en: "Slice Auto-Generated Features", ko: "Slice 자동 생성 기능" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Slice state and actions are generated from slices declared in model.signal.ts. Use them for list pages, pagination, sorting, selection, and insight state.",
              ko: "slice state와 action은 model.signal.ts에 선언된 slice에서 생성됩니다. list page, pagination, sorting, selection, insight state에 사용합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="ticket.signal.ts"
          code={`export class TicketSlice extends slice(srv.ticket, { guards: { root: User } }, (init) => ({
  inProject: init()
    .param("projectId", ID)
    .exec(function (projectId) {
      return this.ticketService.queryInProject(projectId);
    }),
})) {}`}
        />
        <Docs.SubTitle>Generated Slice State</Docs.SubTitle>
        <Docs.IntroTable type="field" items={sliceVariables} />
        <div className="mb-8" />
        <Docs.SubTitle>Generated Slice Actions</Docs.SubTitle>
        <Docs.IntroTable type="method" items={sliceMethods} />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="usage-patterns" title={l.trans({ en: "Usage Patterns", ko: "사용 패턴" })}>
        <Docs.Title>{l.trans({ en: "Usage Patterns", ko: "사용 패턴" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use this.get, this.pick, this.set, generated fetch clients, and generated setters inside store actions. In React components, read with st.use and call actions with st.do.",
              ko: "store action 내부에서는 this.get, this.pick, this.set, generated fetch client, generated setter를 사용합니다. React component에서는 st.use로 읽고 st.do로 action을 호출합니다.",
            })}
          </div>
        </Docs.Description>
        <div className={cardGridRecipe()}>
          <Code.Snippet
            className="w-full"
            title="Inside store"
            code={`async archiveTicketMany() {
  const { ticketList } = this.get();
  await fetch.archiveTicketMany(ticketList.map((ticket) => ticket.id));
  this.set({ completeTicketList: [] });
}`}
          />
          <Code.Snippet
            className="w-full"
            title="Inside component"
            code={`const ticket = st.use.ticket();

<button onClick={() => st.do.openTicket(ticket.id, due)}>
  Open
</button>`}
          />
        </div>
        <Docs.SubTitle>{l.trans({ en: "Auto-Generated Setters", ko: "자동 생성 setter" })}</Docs.SubTitle>
        <Code.Snippet
          className="w-full"
          title="setter examples"
          code={`st.do.setTicketModal(null);
st.set({ ticketModal: null });`}
        />
        <Docs.Alert type="error">
          {l.trans({
            en: (
              <span>
                Never write <code>import type &#123; RootStore &#125; from "../st"</code> in a store, and never cast
                with <code>this as unknown as RootStore</code>. The import pulls every store into one module graph and
                crashes <code>akan build</code> with a Bun SSR segfault. A store coordinates through its own state, so
                write what the other store needs into this store's state instead.
              </span>
            ),
            ko: (
              <span>
                store에서 <code>import type &#123; RootStore &#125; from "../st"</code>를 쓰지 말고,{" "}
                <code>this as unknown as RootStore</code> casting도 하지 마세요. 이 import는 모든 store를 하나의 module
                graph로 끌어와 <code>akan build</code>를 Bun SSR segfault로 크래시시킵니다. store는 자기 state로
                조율하므로, 다른 store가 필요로 하는 값은 이 store의 state에 기록합니다.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-1">
            {[
              l.trans({
                en: "Keep UI orchestration in store: fetch calls, loading state, toast messages, modal state, and navigation.",
                ko: "fetch call, loading state, toast message, modal state, navigation 같은 UI orchestration은 store에 둡니다.",
              }),
              l.trans({
                en: "Keep pure business rules in constants, documents, services, or signals instead of store actions.",
                ko: "순수 business rule은 store action이 아니라 constant, document, service, signal에 둡니다.",
              }),
              l.trans({
                en: "Use pick for required state and get when null is a valid branch.",
                ko: "필수 state에는 pick을, null이 가능한 분기에는 get을 사용합니다.",
              }),
              l.trans({
                en: "Use generated fetch clients inside store actions and generated setters like this.setTicket after successful mutations.",
                ko: "store action 내부에서는 generated fetch client를 사용하고 mutation 성공 후 this.setTicket 같은 generated setter를 사용합니다.",
              }),
              l.trans({
                en: "Extend generated or library stores with ...model.stores before adding app-specific state and actions.",
                ko: "app 전용 state와 action을 추가하기 전에 ...model.stores로 generated 또는 library store를 확장합니다.",
              }),
              l.trans({
                en: "Return nothing from a store action. Every method dispatches through st.do, so write the result into state with this.set instead.",
                ko: "store action은 값을 반환하지 않습니다. 모든 method는 st.do를 통해 dispatch되므로 결과는 this.set으로 state에 기록합니다.",
              }),
            ].map((rule) => (
              <div key={rule} className={panelRecipe({ padding: "row" }, "text-foreground/70")}>
                {rule}
              </div>
            ))}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
