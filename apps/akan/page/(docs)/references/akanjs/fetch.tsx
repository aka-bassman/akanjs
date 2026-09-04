import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";

export default function Page() {
  const { l } = usePage();
  const symbols = [
    {
      name: "InitHandle / ViewHandle / EditHandle",
      desc: l.trans({
        en: "What `fetch.init<Model><Suffix>`, `fetch.view<Model>`, and `fetch.edit<Model>` return. Awaiting the handle gives the object these helpers have always given, so every existing call site reads unchanged. Reading a field off the un-awaited handle gives that field's own promise instead, so a route can hand each one to the section that renders it and let the slowest arrive last rather than holding the whole page. Every request leaves at call time, so splitting the result never serializes the queries.",
        ko: "`fetch.init<Model><Suffix>`, `fetch.view<Model>`, `fetch.edit<Model>`의 return type입니다. handle을 await하면 기존과 동일한 객체를 주므로 기존 호출부는 그대로 동작합니다. await하지 않고 field를 읽으면 그 field의 promise를 주므로, route가 각 promise를 해당 section에 넘겨 느린 query가 page 전체를 붙잡지 않게 할 수 있습니다. 모든 request는 호출 시점에 이미 출발하므로 결과를 쪼개도 query가 직렬화되지 않습니다.",
      }),
      code: `const { userInitInOrg, userListInOrg } = fetch.initUserInOrg(orgId);
const { orderView } = fetch.viewOrder(orderId);

return (
  <>
    <User.Zone.Card init={userInitInOrg} />
    <Load.Stream of={userListInOrg}>{(userList) => <User.Unit.Total count={userList.length} />}</Load.Stream>
    <Order.Zone.View view={orderView} />
  </>
);`,
    },
    {
      name: "ClientInit",
      desc: l.trans({
        en: "Zone prop type for initialized list pages. It contains list objects, insight object, pagination fields, query args, sort state, and init timestamp, and accepts either the resolved payload or the `x<Model>Init<Suffix>` promise the init handle hands out. A pending promise renders behind the Zone's own Suspense boundary.",
        ko: "initialized list page를 위한 Zone prop type입니다. list object, insight object, pagination field, query arg, sort state, init timestamp를 포함하며, 해소된 payload 또는 init handle이 주는 `x<Model>Init<Suffix>` promise를 모두 받습니다. 아직 해소되지 않은 promise는 Zone 자체의 Suspense boundary 뒤에서 렌더링됩니다.",
      }),
      code: `import type { ClientInit } from "akanjs/fetch";

export interface Props {
  userInit: ClientInit<"user", LightUser, UserInsight>;
}`,
    },
    {
      name: "ClientView / ClientEdit",
      desc: l.trans({
        en: "Zone prop types for a single model. Each wraps the server payload — `x<Model>View` for read, `x<Model>Edit` for a form — and accepts the resolved object or the promise the view/edit handle hands out. `ClientEdit` also accepts a partial form object, which is how a new-record page seeds defaults with no request at all.",
        ko: "단일 model을 위한 Zone prop type입니다. 각각 server payload를 감싸며 — 조회는 `x<Model>View`, form은 `x<Model>Edit` — 해소된 객체와 view/edit handle이 주는 promise를 모두 받습니다. `ClientEdit`은 partial form 객체도 받으므로, 새 record page는 request 없이 기본값만 넘길 수 있습니다.",
      }),
      code: `import type { ClientEdit, ClientView } from "akanjs/fetch";

export interface Props {
  ticketView: ClientView<"ticket", Ticket>;
  ticketEdit: ClientEdit<"ticket", Ticket>;
}`,
    },
    {
      name: "SliceMeta",
      desc: l.trans({
        en: "Metadata carried with initialized slice data. UI helpers use it to know the ref name, slice name, and number of query arguments behind a list or insight block.",
        ko: "initialized slice data와 함께 전달되는 metadata입니다. UI helper는 list 또는 insight block 뒤의 ref name, slice name, query argument 수를 알기 위해 사용합니다.",
      }),
      code: `import type { SliceMeta } from "akanjs/fetch";

export function Toolbar({ meta }: { meta: SliceMeta }) {
  return <div>{meta.sliceName}</div>;
}`,
    },
    {
      name: "FetchInitForm",
      desc: l.trans({
        en: "Option shape for list initialization. It controls page, limit, sort, default form values, invalidation, and whether insight data should be fetched together with the list. `insight: false` skips the aggregate query outright, so `x<Model>ObjInsight` is `null` and the rows in hand are the whole count there is — pass it whenever the screen shows no total and no pagination.",
        ko: "list initialization을 위한 option shape입니다. page, limit, sort, default form value, invalidation, insight data를 list와 함께 fetch할지 여부를 제어합니다. `insight: false`는 aggregate query를 아예 보내지 않으므로 `x<Model>ObjInsight`가 `null`이 되고 손에 든 row가 전체 개수가 됩니다 — 총계와 pagination을 표시하지 않는 화면이라면 넘기세요.",
      }),
      code: `import type { FetchInitForm } from "akanjs/fetch";

const option: FetchInitForm<UserInput, UserFilter> = {
  page: 1,
  limit: 20,
  insight: false,
};`,
    },
    {
      name: "Account",
      desc: l.trans({
        en: "Request account shape shared by server middleware and services. It always includes `appName` and `environment`, then allows app-specific account data to be added by generic parameter.",
        ko: "server middleware와 service가 공유하는 request account shape입니다. 항상 `appName`과 `environment`를 포함하고 generic parameter로 app-specific account data를 추가할 수 있습니다.",
      }),
      code: `import type { Account } from "akanjs/fetch";

type AdminAccount = Account<{ userId: string; role: "admin" }>;`,
    },
    {
      name: "FetchClient",
      desc: l.trans({
        en: "Runtime client that turns serialized signal metadata into typed HTTP and WebSocket fetch functions. App clients use the proxy around this class, while advanced tests can instantiate or clone it directly.",
        ko: "serialized signal metadata를 typed HTTP 및 WebSocket fetch function으로 바꾸는 runtime client입니다. app client는 이 class를 감싼 proxy를 사용하고, advanced test에서는 직접 instantiate하거나 clone할 수 있습니다.",
      }),
      code: `import { FetchClient } from "akanjs/fetch";

const client = new FetchClient("http://localhost:8282/api");
client.setJwt(token);
const cloned = client.clone({ connect: false });`,
    },
    {
      name: "getRequest / headers / cookies",
      desc: l.trans({
        en: "Server-side request helpers backed by AsyncLocalStorage or a request fallback stack. Use them in server components and fetch internals to read the current request without pulling client dependencies.",
        ko: "AsyncLocalStorage 또는 request fallback stack으로 동작하는 server-side request helper입니다. client dependency를 끌어오지 않고 current request를 읽기 위해 server component와 fetch internal에서 사용합니다.",
      }),
      code: `import { cookies, getRequest, headers } from "akanjs/fetch";

const req = getRequest();
const authorization = headers().get("authorization");
const jwt = cookies().get("jwt")?.value;`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-fetch" title="akanjs/fetch">
        <Docs.Title>akanjs/fetch</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/fetch` defines the typed client/server fetch boundary. Import it for Zone props, generated fetch client types, request-scoped headers/cookies/theme helpers, and advanced FetchClient usage.",
              ko: "`akanjs/fetch`는 typed client/server fetch boundary를 정의합니다. Zone props, generated fetch client type, request-scoped headers/cookies/theme helper, advanced FetchClient 사용에 import합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {symbols.map((symbol) => (
        <Scroll.Slide key={symbol.name} id={symbol.name} title={symbol.name}>
          <Docs.Title>{symbol.name}</Docs.Title>
          <Docs.Description>
            <div>{symbol.desc}</div>
          </Docs.Description>
          <Code.Snippet
            className="w-full"
            title={l.trans({ en: "Usage", ko: "사용 예시" })}
            language="typescript"
            code={symbol.code}
          />
        </Scroll.Slide>
      ))}
      <DocsToc />
    </Scroll>
  );
}
