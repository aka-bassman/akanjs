import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  const symbols = [
    {
      name: "ID",
      desc: l.trans({
        en: "24 hex string uuid used for document ids and signal payload ids. It validates as a string and keeps an empty string as the default placeholder value. A relation is declared with the model class itself, so ID is for a bare id a model stores without a relation.",
        ko: "document id와 signal payload id에 사용하는 24자리 hex string uuid입니다. string으로 검증되며 기본 placeholder 값으로 빈 문자열을 유지합니다. relation은 model class 자체로 선언하므로, ID는 relation 없이 id만 저장할 때 사용합니다.",
      }),
      code: `import { ID } from "akanjs/base";
import { via } from "akanjs/constant";

export class FileMetaInput extends via((field) => ({
  fileId: field(ID).optional(),
})) {}`,
    },
    {
      name: "Int",
      desc: l.trans({
        en: "Integer primitive scalar for numeric fields that must be safe integers. It is common in counters, pagination values, metric samples, and scalar constant definitions. The JS global Number is not a field type — Int or Float is.",
        ko: "safe integer여야 하는 numeric field를 위한 integer primitive scalar입니다. counter, pagination value, metric sample, scalar constant definition에서 자주 사용합니다. JS global Number는 field type이 아니므로 Int 또는 Float을 사용합니다.",
      }),
      code: `import { Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class AccessStatInput extends via((field) => ({
  total: field(Int, { default: 0 }),
})) {}`,
    },
    {
      name: "Float",
      desc: l.trans({
        en: "Finite number primitive scalar for decimal values such as coordinates, rates, balances, and resource metrics. Use it when fractional values are valid business data.",
        ko: "coordinate, rate, balance, resource metric처럼 decimal value를 위한 finite number primitive scalar입니다. fractional value가 유효한 business data일 때 사용합니다.",
      }),
      code: `import { Float } from "akanjs/base";
import { via } from "akanjs/constant";

export class CoordinateInput extends via((field) => ({
  lat: field(Float),
  lng: field(Float),
})) {}`,
    },
    {
      name: "Any",
      desc: l.trans({
        en: "Loose object scalar for payloads whose shape is intentionally open. Prefer explicit scalar/model fields when the shape is stable; use Any for integration blobs or flexible metadata. Pass the TypeScript shape as the type argument so the field is still typed. Never carry bytes in Any — declare Binary.",
        ko: "shape을 의도적으로 열어 두는 payload를 위한 loose object scalar입니다. shape이 안정적이면 명시적인 scalar/model field를 우선 사용하고, integration blob이나 flexible metadata에는 Any를 사용합니다. TypeScript shape을 type argument로 넘기면 field type은 유지됩니다. byte는 Any가 아니라 Binary로 선언합니다.",
      }),
      code: `import { Any } from "akanjs/base";
import { via } from "akanjs/constant";

export class EventPayloadInput extends via((field) => ({
  body: field<Record<string, unknown>>(Any, { default: {} }),
})) {}`,
    },
    {
      name: "Binary",
      desc: l.trans({
        en: "Raw bytes for a signal argument or return, never a model field. It is a Uint8Array on both sides and base64 on a JSON wire; a pubsub whose whole return is Binary sends its own websocket frame instead. Store a blob as a File model.",
        ko: "signal argument와 return을 위한 raw byte입니다. model field로는 쓸 수 없습니다. 양쪽 모두 Uint8Array이고 JSON wire에서는 base64이며, return 전체가 Binary인 pubsub은 별도의 websocket binary frame으로 보냅니다. blob 저장은 File model을 사용합니다.",
      }),
      code: `import { Every } from "@libs/shared/srvkit";
import { Binary } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as srv from "../srv";

export class StreamEndpoint extends endpoint(srv.stream, ({ pubsub }) => ({
  chunkReceived: pubsub(Binary, { guards: [Every] })
    .room("channel", String)
    .exec(() => undefined),
})) {}`,
    },
    {
      name: "Upload",
      desc: l.trans({
        en: "File upload primitive for a signal body, and nothing else. It is valid only inside a mutation flagged with `fileUpload: true`, and a model that stores files references the File model instead.",
        ko: "signal body 전용 file upload primitive입니다. `fileUpload: true`로 표시한 mutation 안에서만 유효하며, file을 저장하는 model은 File model을 참조합니다.",
      }),
      code: `import { Every } from "@libs/shared/srvkit";
import { ID, Upload } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class FileEndpoint extends endpoint(srv.file, ({ mutation }) => ({
  addFiles: mutation([cnst.File], { guards: [Every], fileUpload: true })
    .body("files", [Upload])
    .body("parentId", ID, { nullable: true })
    .exec(async function (files, parentId) {
      return await this.fileService.addFiles(files, parentId);
    }),
})) {}`,
    },
    {
      name: "dayjs / Dayjs",
      desc: l.trans({
        en: "Akan re-exports the configured dayjs function and Dayjs type from base. Apps and libs use it for document dates, store state dates, service calculations, and UI formatting.",
        ko: "Akan은 base에서 configured dayjs function과 Dayjs type을 re-export합니다. apps/libs는 document date, store state date, service calculation, UI formatting에 사용합니다.",
      }),
      code: `import { type Dayjs, dayjs } from "akanjs/base";

const createdAt: Dayjs = dayjs();
const label = createdAt.format("YYYY-MM-DD");`,
    },
    {
      name: "enumOf",
      desc: l.trans({
        en: "Creates a typed enum scalar class from a literal value list. The generated enum exposes values, has, indexOf, find, filter, map, and forEach helpers used by constants and UI labels.",
        ko: "literal value list에서 typed enum scalar class를 생성합니다. generated enum은 constants와 UI label에서 사용하는 values, has, indexOf, find, filter, map, forEach helper를 제공합니다.",
      }),
      code: `import { enumOf } from "akanjs/base";

export class JobStatus extends enumOf("jobStatus", ["ready", "running", "done"] as const) {}

JobStatus.has("ready");
JobStatus.map((value) => value.toUpperCase());`,
    },
    {
      name: "getEnv",
      desc: l.trans({
        en: "Reads and caches Akan runtime environment values from public/server environment variables. It returns client/server URI data, operation mode, app identity, and render mode.",
        ko: "public/server environment variable에서 Akan runtime environment 값을 읽고 캐시합니다. client/server URI data, operation mode, app identity, render mode를 반환합니다.",
      }),
      code: `import { getEnv } from "akanjs/base";

const env = getEnv();
if (env.operationMode === "local") {
  console.info(env.serverHttpUri);
}`,
    },
    {
      name: "getApiPrefix / getWsPrefix",
      desc: l.trans({
        en: "Read the route prefix the running app answers on, instead of writing `/api` or `/ws` as a literal. Both fall back to the default when nothing moved them, and both read the value the server-rendered page wrote before any component ran, so a moved prefix reaches the browser too.",
        ko: "실행 중인 app이 응답하는 route prefix를 읽습니다. `/api`나 `/ws`를 literal로 쓰지 않습니다. 아무것도 옮기지 않았다면 기본값으로 떨어지고, server-rendered page가 component 실행 전에 기록한 값을 읽으므로 옮긴 prefix가 browser까지 전달됩니다.",
      }),
      code: `import { getApiPrefix, getWsPrefix } from "akanjs/base";

const healthPath = \`\${getApiPrefix()}/_akan/app/health\`;
const socketPath = getWsPrefix();`,
    },
    {
      name: "DataList",
      desc: l.trans({
        en: "Small id-keyed collection helper for light model arrays. It keeps a map from id to index and provides immutable-style set, delete, filter, slice, pick, and iteration helpers.",
        ko: "light model array를 위한 작은 id-keyed collection helper입니다. id에서 index로 가는 map을 유지하고 immutable-style set, delete, filter, slice, pick, iteration helper를 제공합니다.",
      }),
      code: `import { DataList } from "akanjs/base";

const users = new DataList([{ id: "a", nickname: "Akan" }]);
users.set({ id: "b", nickname: "Akan" });
const user = users.pick("a");`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="akanjs-base" title="akanjs/base">
        <Docs.Title>akanjs/base</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "`akanjs/base` contains Akan's primitive scalar classes, runtime environment helpers, and foundational utility types. Import it when defining constants, document ids, date values, runtime-specific behavior, or type-level model helpers.",
              ko: "`akanjs/base`는 Akan의 primitive scalar class, runtime environment helper, foundational utility type을 제공합니다. constant, document id, date value, runtime-specific behavior, type-level model helper를 정의할 때 import합니다.",
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
});
