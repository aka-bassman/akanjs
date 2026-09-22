// biome-ignore-all lint/plugin: this page quotes every banned class, import and marker on purpose — the
// diagnostics it would otherwise raise are its subject matter.
import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc, type OptionItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const fixes = [
    {
      id: "raw-palette",
      rule: "no-raw-palette-class",
      title: l.trans({ en: "A colour outside the vocabulary", ko: "어휘 밖의 색" }),
      desc: l.trans({
        en: "Vocabulary closure strips the raw Tailwind palette from the compiled stylesheet, so bg-blue-500 is not a warning about taste — it is a class with no CSS behind it. The element renders unstyled and the DOM still shows the class you wrote.",
        ko: "어휘 폐쇄가 컴파일된 스타일시트에서 raw Tailwind 팔레트를 걷어내므로, bg-blue-500은 취향에 대한 경고가 아닙니다. 뒤에 CSS가 없는 class입니다. element는 스타일 없이 그려지고, DOM에는 당신이 적은 class가 그대로 보입니다.",
      }),
      before: [
        {
          title: "apps/myapp/ui/StatusBadge.tsx",
          code: `export const StatusBadge = ({ label }: StatusBadgeProps) => (
  <span className="rounded bg-blue-500 px-2 text-white" style={{ borderColor: "#e5e7eb" }}>
    {label}
  </span>
);`,
        },
      ],
      after: [
        {
          title: "apps/myapp/ui/StatusBadge.tsx",
          code: `export const StatusBadge = ({ label }: StatusBadgeProps) => (
  <span className="rounded border-border bg-primary px-2 text-primary-foreground">{label}</span>
);`,
        },
      ],
    },
    {
      id: "throw-raw-error",
      rule: "no-throw-raw-error",
      title: l.trans({ en: "A raw Error", ko: "맨 Error" }),
      desc: l.trans({
        en: "A bare Error reaches the caller as Internal Server Error with no message, and it has no translation. Throw an Err naming a key, and register that key in the module's dictionary as an [en, ko] pair.",
        ko: "맨 Error는 메시지 없이 Internal Server Error로 호출자에게 도착하고 번역도 없습니다. key를 이름으로 든 Err를 던지고, 그 key를 module dictionary에 [en, ko] 쌍으로 등록합니다.",
      }),
      before: [
        {
          title: "apps/myapp/lib/ticket/ticket.service.ts",
          code: `async openTicket(ticketId: string) {
  const ticket = await this.getTicket(ticketId);
  if (ticket.status !== "active") throw new Error("ticket is not active");
  return await ticket.open().save();
}`,
        },
      ],
      after: [
        {
          title: "apps/myapp/lib/ticket/ticket.service.ts",
          code: `import { Err } from "../dict";

async openTicket(ticketId: string) {
  const ticket = await this.getTicket(ticketId);
  if (ticket.status !== "active") throw new Err("ticket.error.notActive");
  return await ticket.open().save();
}`,
        },
        {
          title: "apps/myapp/lib/ticket/ticket.dictionary.ts",
          code: `  .error({
    notActive: ["The ticket is not active", "티켓이 활성 상태가 아니다."],
  })`,
        },
      ],
    },
    {
      id: "form-setter",
      rule: "no-unpublished-form-setter",
      title: l.trans({ en: "A setter wrapped in an arrow", ko: "화살표로 감싼 setter" }),
      desc: l.trans({
        en: "The two lines run identically, and only one of them works. Passing the setter by reference is what makes the framework emit data-akan-action on the control and publish the field as an agent tool; an anonymous closure names no action, so both are silently dropped.",
        ko: "두 줄은 똑같이 실행되고, 둘 중 하나만 동작합니다. setter를 참조로 넘겨야 framework가 control에 data-akan-action을 붙이고 그 field를 agent tool로 게시합니다. 익명 closure는 어떤 action도 지목하지 않으므로 둘 다 조용히 사라집니다.",
      }),
      before: [
        {
          title: "apps/myapp/lib/ticket/Ticket.Template.tsx",
          code: `<Field.Text label={l("ticket.title")} value={ticketForm.title} onChange={(v) => st.do.setTitleOnTicket(v)} />`,
        },
      ],
      after: [
        {
          title: "apps/myapp/lib/ticket/Ticket.Template.tsx",
          code: `<Field.Text label={l("ticket.title")} value={ticketForm.title} onChange={st.do.setTitleOnTicket} />`,
        },
      ],
    },
    {
      id: "store-return",
      rule: "no-return-in-store-action",
      title: l.trans({ en: "A value returned from a store action", ko: "store action이 돌려준 값" }),
      desc: l.trans({
        en: "Every method of a store class is dispatched through st.do.<action>(), and that dispatch is typed void. The value is unreachable at every call site. Write it into state instead; a bare return; guard clause stays legal.",
        ko: "store class의 모든 method는 st.do.<action>()으로 dispatch되고 그 dispatch는 void입니다. 돌려준 값은 어느 호출 지점에서도 닿을 수 없습니다. 대신 state에 씁니다. 조건 탈출용 맨 return;은 그대로 허용됩니다.",
      }),
      before: [
        {
          title: "apps/myapp/lib/ticket/ticket.store.ts",
          code: `async openTicket(ticketId: string) {
  const ticket = await fetch.openTicket(ticketId);
  return ticket;
}`,
        },
      ],
      after: [
        {
          title: "apps/myapp/lib/ticket/ticket.store.ts",
          code: `async openTicket(ticketId: string) {
  const ticket = await fetch.openTicket(ticketId);
  this.set({ ticket });
}`,
        },
      ],
    },
    {
      id: "init-fetch",
      rule: "no-init-fetch-in-client",
      title: l.trans({ en: "A hydration call made from the client", ko: "client에서 부른 hydration 호출" }),
      desc: l.trans({
        en: "fetch.init<Model><Suffix> is not a request, it is the snapshot Load.Units seeds the store from. Run from a route it resolves before the first byte; run after hydration it is two extra round trips for a shell the browser already painted, landing in a local variable no store reads.",
        ko: "fetch.init<Model><Suffix>는 요청이 아니라 Load.Units가 store를 채울 때 쓰는 스냅샷입니다. route에서 부르면 첫 바이트 이전에 해소됩니다. hydration 이후에 부르면 브라우저가 이미 그려 놓은 껍데기를 위한 왕복 두 번이고, 어떤 store도 읽지 않는 지역 변수에 도착합니다.",
      }),
      before: [
        {
          title: "apps/myapp/lib/ticket/Ticket.Zone.tsx",
          code: `"use client";

export const Card = ({ projectId }: CardProps) => {
  const [init, setInit] = useState<ClientInit<"ticket"> | null>(null);
  useEffect(() => {
    void fetch.initTicketInProject(projectId).then(setInit);
  }, []);
  return init ? <Load.Units init={init} renderItem={(ticket) => <Ticket.Unit.Card ticket={ticket} />} /> : null;
};`,
        },
      ],
      after: [
        {
          title: "apps/myapp/page/project/[projectId]/_index.tsx",
          code: `export default page()
  .param("projectId", ID)
  .render(async ({ projectId }) => {
    const { ticketInitInProject } = fetch.initTicketInProject(projectId);
    return <Ticket.Zone.Card init={ticketInitInProject} />;
  });`,
        },
      ],
    },
    {
      id: "private-methods",
      rule: "no-js-private-class-method",
      title: l.trans({ en: "#private in one of the four suffixes", ko: "네 suffix 중 하나에서 쓴 #private" }),
      desc: l.trans({
        en: "#private is banned in exactly four file suffixes — constant.ts, document.ts, service.ts and store.ts — because the framework mixes generated members into those classes and a # member is not reachable from a mixin. Everywhere else, srvkit included, #private stays the house style.",
        ko: "#private은 정확히 네 개의 파일 suffix에서 금지됩니다. constant.ts, document.ts, service.ts, store.ts입니다. framework가 이 class들에 생성된 멤버를 mixin하는데, # 멤버는 mixin에서 닿지 않기 때문입니다. srvkit을 포함한 나머지에서는 #private이 그대로 기본 스타일입니다.",
      }),
      before: [
        {
          title: "apps/myapp/lib/ticket/ticket.service.ts",
          code: `async #syncStock() {
  return await this.ticketModel.syncStock();
}
async refreshStock() {
  return await this.#syncStock();
}`,
        },
      ],
      after: [
        {
          title: "apps/myapp/lib/ticket/ticket.service.ts",
          code: `private async _syncStock() {
  return await this.ticketModel.syncStock();
}
async refreshStock() {
  return await this._syncStock();
}`,
        },
      ],
    },
  ];

  const rules: OptionItem[] = [
    {
      key: "no-raw-palette-class",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "bg-blue-500, text-gray-400. Renders as no CSS. Use a semantic token — bg-primary, text-foreground/70.",
        ko: "bg-blue-500, text-gray-400. CSS가 없어 아무것도 적용되지 않습니다. bg-primary, text-foreground/70 같은 시맨틱 토큰을 씁니다.",
      }),
    },
    {
      key: "no-arbitrary-color",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "bg-[#3b82f6], text-[rgb(0,0,0)]. Ignores data-theme entirely. A variable reference such as bg-[var(--kakao)] is deliberately not matched — that is how a lib pins a vendor colour.",
        ko: "bg-[#3b82f6], text-[rgb(0,0,0)]. data-theme을 완전히 무시합니다. bg-[var(--kakao)] 같은 변수 참조는 의도적으로 걸리지 않습니다. 라이브러리가 벤더 색을 고정하는 방법입니다.",
      }),
    },
    {
      key: "no-daisyui-legacy-class",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "btn-primary, card-body, bg-base-100, text-base-content, bg-error. daisyUI was removed, so these render unstyled. base-100/200/300 to background/muted/border, base-content to foreground, <colour>-content to <colour>-foreground, error to destructive.",
        ko: "btn-primary, card-body, bg-base-100, text-base-content, bg-error. daisyUI가 제거되어 스타일 없이 그려집니다. base-100/200/300은 background/muted/border, base-content는 foreground, <colour>-content는 <colour>-foreground, error는 destructive로 바꿉니다.",
      }),
    },
    {
      key: "no-inline-color",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "A colour literal inside style={{ ... }} or a <style> body. Bypasses the token layer and theme switching. style={{ color: 'var(--primary)' }} when a runtime value is unavoidable.",
        ko: "style={{ ... }}이나 <style> 본문 안의 색 리터럴입니다. 토큰 계층과 테마 전환을 건너뜁니다. runtime 값이 불가피하면 style={{ color: 'var(--primary)' }}를 씁니다.",
      }),
    },
    {
      key: "no-interpolated-arbitrary-class",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "An arbitrary value whose brackets are filled at runtime, such as a min-h bracket holding an interpolated number. Tailwind extracts arbitrary values from source text, so the class compiles to no CSS — silently, and worse when a literal of the same shape exists elsewhere. Use a style prop, or a fixed set of literal classes.",
        ko: "대괄호 안을 runtime에 채우는 arbitrary 값입니다. 보간된 숫자를 담은 min-h 대괄호가 그렇습니다. Tailwind는 소스 텍스트에서 arbitrary 값을 추출하므로 이 class는 CSS를 만들지 않습니다. 조용히 실패하고, 같은 모양의 리터럴이 다른 곳에 있으면 더 나쁩니다. style prop이나 고정된 리터럴 class 집합을 씁니다.",
      }),
    },
    {
      key: "no-throw-raw-error",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: 'throw new Error(...). Throw new Err("<module>.error.<key>") and register the key. Exempt: tests, *.constant.ts, common/**, env/** — the last two have no legal Err import path, so keep throwing code out of them.',
        ko: 'throw new Error(...)입니다. new Err("<module>.error.<key>")를 던지고 key를 등록합니다. 테스트, *.constant.ts, common/**, env/**는 예외입니다. 뒤의 둘은 Err를 import할 경로가 없으므로 던지는 코드를 두지 않습니다.',
      }),
    },
    {
      key: "no-return-in-store-action",
      type: "*.store.ts",
      default: "error",
      desc: l.trans({
        en: "st.do.<action>() is typed void, so a returned value is unreachable. Write it into state with this.set({ ... }).",
        ko: "st.do.<action>()은 void이므로 돌려준 값에 닿을 수 없습니다. this.set({ ... })으로 state에 씁니다.",
      }),
    },
    {
      key: "no-unpublished-form-setter",
      type: "apps/** libs/** *.tsx",
      default: "error",
      desc: l.trans({
        en: "onChange={(v) => st.do.setXOnY(v)}. Pass the setter by reference. A wrapper that transforms, adds a statement, or writes a nested path through writeOnX stays legal — publish that one with an explicit st.tool.",
        ko: "onChange={(v) => st.do.setXOnY(v)} 형태입니다. setter를 참조로 넘기세요. 값을 변환하거나 문장을 더하거나 writeOnX로 중첩 경로에 쓰는 wrapper는 그대로 허용됩니다. 그런 것은 st.tool로 명시해 게시합니다.",
      }),
    },
    {
      key: "no-model-type-in-util-zone",
      type: "*.Util.tsx *.Zone.tsx",
      default: "error",
      desc: l.trans({
        en: "A cnst model on a prop of an always-client file. Take an id instead. Exempt: an indexed enum access, a ClientInit / ClientView / ClientEdit or ModelsProps type argument, a function-typed prop, and a cnst type that never leaves the file.",
        ko: "언제나 client인 파일의 prop에 붙은 cnst model입니다. 대신 id를 받습니다. 인덱스 접근 enum, ClientInit / ClientView / ClientEdit 또는 ModelsProps의 타입 인자, 함수 타입 prop, 파일 밖으로 나가지 않는 cnst 타입은 예외입니다.",
      }),
    },
    {
      key: "no-redeclare-predefined-endpoint",
      type: "*.signal.ts",
      default: "error",
      desc: l.trans({
        en: "An endpoint whose name collides with generated CRUD — <model>, light/create/update/remove/view/edit/merge<Model>. The signal layer can pass typecheck and fail only at runtime, so treat it as an error even on a green build.",
        ko: "생성된 CRUD와 이름이 겹치는 endpoint입니다. <model>, light/create/update/remove/view/edit/merge<Model>이 그 대상입니다. signal 계층은 typecheck를 통과하고 runtime에서만 실패할 수 있으므로, 빌드가 초록색이어도 에러로 다룹니다.",
      }),
    },
    {
      key: "no-init-fetch-in-client",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "fetch.init<Model><Suffix> or fetch.get<Model>Init<Suffix> from a client file. Load it in the route; reload from the client through st.do.init<Model><Suffix>(). Matched by shape, so a hand-written initPayment is out of scope.",
        ko: "client 파일에서 부른 fetch.init<Model><Suffix> 또는 fetch.get<Model>Init<Suffix>입니다. route에서 불러오고, client에서 다시 읽을 때는 st.do.init<Model><Suffix>()를 씁니다. 모양으로 판정하므로 직접 만든 initPayment는 대상이 아닙니다.",
      }),
    },
    {
      key: "no-async-component-in-ui",
      type: "{apps,libs}/**/ui/**",
      default: "error",
      desc: l.trans({
        en: "React has no async client component, so a ui/ component that awaits breaks as soon as a client parent renders it. Await in the page and take the resolved data as a prop. Only a PascalCase binding whose own initializer is async is matched.",
        ko: "React에는 async client component가 없으므로, await하는 ui/ component는 client 부모가 그리는 순간 깨집니다. page에서 await하고 해소된 데이터를 prop으로 받습니다. 자기 초기화식이 async인 PascalCase 바인딩만 걸립니다.",
      }),
    },
    {
      key: "no-bang-comment-in-client",
      type: "ui/ webkit/ common/ page/ + module components",
      default: "error",
      desc: l.trans({
        en: "A bang comment marker — two slashes or a block opener followed by an exclamation point — in browser-reachable code. Bun keeps it through minification, so the note ships to every visitor. Use a FIXME comment there. The diagnostic is file-level and always lands on line 1, so search the file for the marker.",
        ko: "브라우저에 닿는 코드의 bang 주석 표식입니다. 슬래시 둘 또는 블록 주석 시작 뒤에 느낌표가 오는 형태입니다. Bun이 minify 후에도 남기므로 모든 방문자에게 전송됩니다. 그곳에서는 FIXME 주석을 씁니다. 진단은 파일 단위라 언제나 1행을 가리키므로, 표식은 파일에서 직접 찾아야 합니다.",
      }),
    },
    {
      key: "no-deprecated-log-level",
      type: "apps/** libs/**",
      default: "error",
      desc: l.trans({
        en: "logger.log() and Logger.log(). The ladder is trace verbose debug info warn error; log was a seventh tier below info that the production level silently dropped. The method is kept and emits at info, so the call reads like a level and is not one — write .info().",
        ko: "logger.log()와 Logger.log()입니다. 사다리는 trace verbose debug info warn error이고, log는 운영 레벨이 조용히 버리던 info 아래의 일곱 번째 층이었습니다. method는 남아 있고 info로 내보내므로 레벨처럼 읽히지만 레벨이 아닙니다. .info()를 씁니다.",
      }),
    },
    {
      key: "no-deep-internal-import",
      type: "module files, page/**, barrels",
      default: "error",
      desc: l.trans({
        en: "Three arms: an @apps or @libs import past the first two segments, a module file importing through ../../, and a module .tsx under lib/ using an internal relative import such as ../cnst. Cross-module constant references are the sanctioned exception.",
        ko: "세 갈래입니다. 앞의 두 구간을 넘어가는 @apps·@libs import, ../../를 지나는 module 파일 import, 그리고 lib/ 아래 module .tsx가 ../cnst 같은 내부 상대 경로를 쓰는 경우입니다. module 간 constant 참조는 허용된 예외입니다.",
      }),
    },
    {
      key: "no-import-external-library",
      type: "module files, page/**, barrels",
      default: "error",
      desc: l.trans({
        en: "Anything that is not relative, akanjs, @akanjs, @apps, @libs, @pkgs, @playwright, react or bun:test. Re-export the symbol through a lib first — the one-line shims in a lib's common/, webkit/ or ui/ exist for exactly this and are load-bearing.",
        ko: "상대 경로, akanjs, @akanjs, @apps, @libs, @pkgs, @playwright, react, bun:test가 아닌 모든 것입니다. 먼저 lib을 통해 re-export합니다. 라이브러리의 common/, webkit/, ui/에 있는 한 줄짜리 shim이 바로 이 때문에 있으며 하중을 받고 있습니다.",
      }),
    },
    {
      key: "no-import-server-in-client",
      type: "ui/ webkit/ page/ *.store.ts *.tsx",
      default: "error",
      desc: l.trans({
        en: "A client file may not import a *.document, *.dictionary, *.service or *.signal, srvkit/, a package server entrypoint, or the db / srv / sig / dict / option / useServer barrels. import type is erased before bundling and stays legal; a mixed value-and-type import is not exempt.",
        ko: "client 파일은 *.document, *.dictionary, *.service, *.signal, srvkit/, package server entrypoint, db / srv / sig / dict / option / useServer barrel을 import할 수 없습니다. import type은 번들 전에 지워지므로 허용되고, 값과 타입을 섞은 import는 예외가 아닙니다.",
      }),
    },
    {
      key: "no-import-client-in-server",
      type: "*.document *.dictionary *.service *.signal srvkit/",
      default: "error",
      desc: l.trans({
        en: "The mirror image: a server file may not import a *.store, a module component, ui/, webkit/, a package client entrypoint, or the st / store / useClient barrels. common/ and *.constant.ts are held to both rules, so they reach neither side.",
        ko: "반대 방향입니다. server 파일은 *.store, module component, ui/, webkit/, package client entrypoint, st / store / useClient barrel을 import할 수 없습니다. common/과 *.constant.ts는 두 규칙을 모두 적용받으므로 어느 쪽에도 닿지 못합니다.",
      }),
    },
    {
      key: "no-import-client-functions",
      type: "page/** *.Unit.tsx *.View.tsx",
      default: "error",
      desc: l.trans({
        en: "A React client hook or the store imported into a server component. Move the interaction into a client component and render it from the server one.",
        ko: "server component에 들어온 React client hook 또는 store입니다. 상호작용을 client component로 옮기고 server component가 그것을 그리게 합니다.",
      }),
    },
    {
      key: "no-use-client-in-server",
      type: "page/** *.Unit.tsx *.View.tsx",
      default: "error",
      desc: l.trans({
        en: "The directive at the top of a file whose role is always a server component. Split the interactive part out rather than converting the whole file.",
        ko: "역할상 언제나 server component인 파일 맨 위의 지시자입니다. 파일 전체를 바꾸지 말고 상호작용 부분만 떼어냅니다.",
      }),
    },
    {
      key: "non-scalar-props-restricted",
      type: "page/**",
      default: "error",
      desc: l.trans({
        en: "A function expression handed as a prop from a server component. Allowed: loader, render, of. Pass data down and keep the callback inside the client component.",
        ko: "server component에서 prop으로 넘긴 함수 표현식입니다. loader, render, of만 허용됩니다. 데이터를 내려보내고 callback은 client component 안에 둡니다.",
      }),
    },
    {
      key: "no-js-private-class-method",
      type: "*.constant *.document *.service *.store",
      default: "error",
      desc: l.trans({
        en: "#private in the four suffixes the framework mixes into. Use a TypeScript private method with an underscore name. The rule is scoped by file path, not by class shape, so #private stays the house style under srvkit/ including adapt() classes.",
        ko: "framework가 mixin하는 네 suffix에서 쓴 #private입니다. underscore 이름의 TypeScript private method를 씁니다. 규칙은 class 모양이 아니라 파일 경로로 좁혀지므로, adapt() class를 포함한 srvkit/ 아래에서는 #private이 그대로 기본 스타일입니다.",
      }),
    },
    {
      key: "nursery/useSortedClasses",
      type: "everything",
      default: "error, safe fix",
      desc: l.trans({
        en: "Never hand-order Tailwind classes, and never re-order what the formatter produced. It also sorts the string arguments to cn(). Output such as font-bold text-2xl text-foreground is correct.",
        ko: "Tailwind class를 손으로 정렬하지 말고, formatter가 내놓은 순서를 되돌리지도 마세요. cn()의 문자열 인자도 정렬합니다. font-bold text-2xl text-foreground 같은 결과가 정답입니다.",
      }),
    },
    {
      key: "suspicious/noConsole",
      type: "everything",
      default: "error",
      desc: l.trans({
        en: 'console.log and console.debug. Only assert, error, info and warn are allowed. Server code uses the injected this.logger or a new Logger("ClassName").',
        ko: 'console.log와 console.debug입니다. assert, error, info, warn만 허용됩니다. server 코드는 주입된 this.logger나 new Logger("ClassName")를 씁니다.',
      }),
    },
    {
      key: "correctness/noUnusedImports",
      type: "everything",
      default: "error, safe fix",
      desc: l.trans({
        en: "Removed by the formatter rather than reported at you. This is one reason a repo-wide akan lint rewrites files it was not asked about.",
        ko: "보고되는 대신 formatter가 지웁니다. 저장소 전체에 akan lint를 돌리면 묻지 않은 파일까지 바뀌는 이유 중 하나입니다.",
      }),
    },
    {
      key: "suspicious/noArrayIndexKey",
      type: "everything",
      default: "off",
      desc: l.trans({
        en: "Off on purpose. key={idx} for an embedded scalar with no id of its own is intentional here, not an oversight.",
        ko: "의도적으로 꺼져 있습니다. 자기 id가 없는 embedded scalar에 key={idx}를 쓰는 것은 실수가 아니라 의도입니다.",
      }),
    },
    {
      key: "correctness/useExhaustiveDependencies",
      type: "everything",
      default: "off",
      desc: l.trans({
        en: "Off on purpose. The short dependency arrays in this workspace are deliberate, and an effect that has to run once is written that way on purpose.",
        ko: "의도적으로 꺼져 있습니다. 이 워크스페이스의 짧은 dependency 배열은 의도된 것이고, 한 번만 돌아야 하는 effect는 일부러 그렇게 쓰여 있습니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide
        id="silent-failures"
        title={l.trans({ en: "Lint Is Not About Style", ko: "Lint는 스타일 이야기가 아니다" })}
      >
        <Docs.Title>{l.trans({ en: "Lint Is Not About Style", ko: "Lint는 스타일 이야기가 아니다" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "You write bg-blue-500 on a badge. The page renders, the class is right there in the DOM, and the badge is the wrong colour. Nothing threw, nothing warned in the browser, and the only thing that knows is the linter you have not run yet.",
              ko: "badge에 bg-blue-500을 적습니다. 페이지는 그려지고, class는 DOM에 그대로 있으며, badge는 엉뚱한 색입니다. 아무것도 throw하지 않았고 브라우저에서 경고도 없었으며, 사실을 아는 것은 아직 돌리지 않은 linter뿐입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Most of the rules below are that shape. They do not catch ugly code; they catch code that compiles, runs, looks correct, and quietly does nothing — a class with no CSS behind it, a form field that publishes no agent tool, a store action whose return value is unreachable, a comment that ships to every visitor.",
              ko: "아래 규칙 대부분이 그 모양입니다. 못생긴 코드를 잡는 것이 아니라, 컴파일되고 실행되고 정상으로 보이면서 조용히 아무 일도 하지 않는 코드를 잡습니다. 뒤에 CSS가 없는 class, agent tool을 게시하지 않는 form field, 돌려준 값에 닿을 수 없는 store action, 모든 방문자에게 전송되는 주석 같은 것입니다.",
            })}
          </div>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <code>akan lint</code> runs with <code>--fix</code> on by default, so it rewrites files. Run it on the
                  app or lib you touched — <code>akan lint myapp</code> — and reach for{" "}
                  <code>bunx biome check "&lt;path&gt;"</code> when you only want to be told. A repo-wide run in a dirty
                  tree edits work nobody asked it to.
                </span>
              ),
              ko: (
                <span>
                  <code>akan lint</code>는 기본적으로 <code>--fix</code>가 켜진 채 실행되어 파일을 고쳐 씁니다. 수정한
                  app이나 lib에만 돌리고 — <code>akan lint myapp</code> — 확인만 하고 싶을 때는{" "}
                  <code>bunx biome check "&lt;path&gt;"</code>를 쓰세요. 작업 중인 트리에서 저장소 전체에 돌리면 아무도
                  시키지 않은 작업까지 고칩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="fix-errors" title={l.trans({ en: "Six You Will Meet First", ko: "가장 먼저 만나게 될 여섯" })}>
        <Docs.Title>{l.trans({ en: "Six You Will Meet First", ko: "가장 먼저 만나게 될 여섯" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Each of these names a rule, and the fix is mechanical once you know which one fired. The diagnostic prints the rule name; the pair below shows what it wants instead.",
              ko: "각각이 규칙 하나를 지목하고, 어느 규칙이 걸렸는지 알면 수정은 기계적입니다. 진단은 규칙 이름을 찍어 주고, 아래 짝은 그 규칙이 대신 원하는 모양을 보여줍니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-6">
          {fixes.map(({ id, rule, title, desc, before, after }) => (
            <div key={id} className={panelRecipe({ radius: "2xl" })}>
              <div className="font-bold text-foreground">{title}</div>
              <div className="mt-1 font-mono text-primary text-xs">{rule}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <div className="mb-3 font-bold text-destructive">❌ Before</div>
                  <div className="space-y-3">
                    {before.map(({ title: snippetTitle, code }) => (
                      <Code.Snippet className="w-full" key={snippetTitle} title={snippetTitle} code={code} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                  <div className="mb-3 font-bold text-success">✅ After</div>
                  <div className="space-y-3">
                    {after.map(({ title: snippetTitle, code }) => (
                      <Code.Snippet className="w-full" key={snippetTitle} title={snippetTitle} code={code} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="every-rule"
        title={l.trans({ en: "Every Rule That Breaks The Build", ko: "빌드를 깨는 모든 규칙" })}
      >
        <Docs.Title>{l.trans({ en: "Every Rule That Breaks The Build", ko: "빌드를 깨는 모든 규칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Twenty-two of these are grit plugins written for this workspace, scoped to the paths they apply to; the rest are Biome's own. The second column is where the rule looks, which is why a plain package under pkgs/ never trips the module-convention ones at all.",
              ko: "이 중 스물둘은 이 워크스페이스를 위해 쓰인 grit 플러그인이고 적용 경로가 정해져 있습니다. 나머지는 Biome 자체 규칙입니다. 두 번째 열은 규칙이 들여다보는 곳입니다. pkgs/ 아래의 평범한 패키지가 module 규칙에 아예 걸리지 않는 이유이기도 합니다.",
            })}
          </div>
          <Docs.OptionTable items={rules} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="suppression" title={l.trans({ en: "Suppressing One", ko: "예외 처리하기" })}>
        <Docs.Title>{l.trans({ en: "Suppressing One", ko: "예외 처리하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A fixed colour is sometimes right — an OS-chrome mockup, a data-visualization scale, a vendor's brand. Those take a suppression, and the suppression carries a reason. There is no bare disable block anywhere in this workspace.",
              ko: "고정된 색이 맞을 때도 있습니다. OS 크롬 목업, 데이터 시각화 척도, 벤더의 브랜드 색 같은 것입니다. 그런 경우에는 예외를 적고, 예외에는 이유를 답니다. 이 워크스페이스에 이유 없는 disable 블록은 없습니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/ui/BrowserChrome.tsx"
            code={`// biome-ignore lint/plugin: macOS traffic lights are fixed colours, not theme tokens
<span className="bg-[#ff5f57]" />

// biome-ignore-all lint/plugin: every swatch in this file is a data-viz scale value`}
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  A grit plugin diagnostic is suppressed as <code>lint/plugin</code>, not <code>plugin</code>. The bare{" "}
                  <code>{"// biome-ignore plugin:"}</code> form that Biome's own category name suggests does{" "}
                  <strong>nothing</strong> — it is accepted, it looks right, and the rule still fires.
                </span>
              ),
              ko: (
                <span>
                  grit 플러그인 진단은 <code>plugin</code>이 아니라 <code>lint/plugin</code>으로 억제합니다. Biome 자체
                  카테고리 이름이 암시하는 <code>{"// biome-ignore plugin:"}</code> 형태는{" "}
                  <strong>아무 일도 하지 않습니다</strong>. 받아들여지고, 맞아 보이고, 규칙은 그대로 걸립니다.
                </span>
              ),
            })}
          </Docs.Alert>
          <Docs.Alert type="error">
            {l.trans({
              en: (
                <span>
                  <code>biome.json</code> is strict JSON, and a comment in it breaks configuration resolution. Biome
                  does not report the parse error — it falls back to discovery and aborts on whatever nested config the
                  walk finds, so the message you get names a file you did not edit. Rename it to{" "}
                  <code>biome.jsonc</code> when you need to document a disabled rule.
                </span>
              ),
              ko: (
                <span>
                  <code>biome.json</code>은 엄격한 JSON이라 주석 하나가 설정 해석을 망가뜨립니다. Biome은 파싱 에러를
                  보고하지 않습니다. 탐색으로 되돌아간 뒤 그 과정에서 찾은 중첩 설정에서 중단하므로, 손대지 않은 파일의
                  이름이 메시지에 뜹니다. 꺼 둔 규칙을 설명해야 한다면 <code>biome.jsonc</code>로 이름을 바꾸세요.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="commands" title={l.trans({ en: "Commands", ko: "명령어" })}>
        <Docs.Title>{l.trans({ en: "Commands", ko: "명령어" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "akan lint prints up to 200 diagnostics. Biome's own default is 20 with no count printed, which reads as progress when all that changed is the mix of findings.",
              ko: "akan lint는 진단을 200개까지 찍습니다. Biome 자체 기본값은 개수 표시 없는 20개인데, 발견된 항목의 구성만 바뀌었을 때도 진전처럼 읽힙니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code={`akan lint myapp                      # format and fix one app, lib, or package
akan lint myapp --max-diagnostics 0  # print every diagnostic
akan lintAll                         # every app and library
bunx biome check "apps/myapp/lib/order"   # report only, no writes`}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "Where the configuration lives:", ko: "설정이 있는 곳:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "biome.json at the repo root extends @akanjs/devkit/biome.base.json, which is where every grit plugin is scoped to the paths it applies to.",
                  ko: "저장소 루트의 biome.json이 @akanjs/devkit/biome.base.json을 확장하고, 모든 grit 플러그인의 적용 경로가 그 파일에 정해져 있습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "The plugin sources are @akanjs/devkit/lint/*.grit, one file per rule, each opening with a comment explaining what would break without it.",
                  ko: "플러그인 원본은 @akanjs/devkit/lint/*.grit이며 규칙마다 파일 하나입니다. 각 파일은 그 규칙이 없으면 무엇이 깨지는지 설명하는 주석으로 시작합니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "Generated files are excluded from linting and formatting entirely — cnst.ts, db.ts, dict.ts, sig.ts, srv.ts, st.ts, the facet barrels, and every env file.",
                  ko: "생성된 파일은 lint와 format에서 완전히 제외됩니다. cnst.ts, db.ts, dict.ts, sig.ts, srv.ts, st.ts, facet barrel, 모든 env 파일이 그렇습니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
