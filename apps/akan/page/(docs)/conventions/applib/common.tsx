import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const layerPlacement: IntroItem[] = [
    {
      name: "common/",
      desc: l.trans({
        en: "Pure, isomorphic, zero-dependency. It may import a sibling common/* file and akanjs/base, and nothing else — not Err, which is why throwing code stays out of it.",
        ko: "순수하고, 양쪽 런타임에서 돌고, 의존성이 없습니다. 형제 common/* 파일과 akanjs/base만 import할 수 있고 그 밖에는 없습니다. Err도 없으므로 던지는 코드는 여기 두지 않습니다.",
      }),
      example: "libs/util/common/isHttpUri.ts\n// camelCase file, filename equals the single export",
    },
    {
      name: "webkit/",
      desc: l.trans({
        en: "Touches window, navigator or Capacitor, or is a React hook. The browser half of what common/ cannot hold.",
        ko: "window, navigator, Capacitor를 건드리거나 React hook입니다. common/이 담을 수 없는 것의 브라우저 쪽 절반입니다.",
      }),
      example: "libs/util/webkit/useGeoLocation.tsx\n// use<Thing>.tsx — .tsx even with no JSX",
    },
    {
      name: "srvkit/",
      desc: l.trans({
        en: "Touches node:*, Bun, process.env, a secret, or a server SDK. The server half, and the only place a vendor package is imported directly.",
        ko: "node:*, Bun, process.env, secret, server SDK를 건드립니다. 서버 쪽 절반이고, vendor 패키지를 직접 import하는 유일한 곳입니다.",
      }),
      example: "libs/util/srvkit/cloudflareApi.ts\n// camelCase file, PascalCase class",
    },
    {
      name: "ui/",
      desc: l.trans({
        en: "Renders JSX and is not bound to one model. A component tied to a model belongs in that module as a Unit, View, Template, Util or Zone instead.",
        ko: "JSX를 그리고 model 하나에 묶이지 않습니다. model에 묶인 component는 그 module의 Unit, View, Template, Util, Zone으로 갑니다.",
      }),
      example: "apps/akan/ui/BrowserMockup.tsx\n// PascalCase component, camelCase sidecar",
    },
    {
      name: "plugin/",
      desc: l.trans({
        en: "A build-time or CLI-time AkanPlugin, registered in akan.config.ts and re-exported from the generated barrel.",
        ko: "빌드 시점 또는 CLI 시점의 AkanPlugin입니다. akan.config.ts에 등록하고 생성된 barrel에서 re-export합니다.",
      }),
      example: "libs/util/plugin/pushNotification.plugin.ts\n// <name>.plugin.ts",
    },
  ];
  return (
    <Scroll>
      <Scroll.Slide id="common-overview" title={l.trans({ en: "Common Overview", ko: "Common 개요" })}>
        <Docs.Title>{l.trans({ en: "Common Overview", ko: "Common 개요" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The common folder contains logic that can run in both server and client environments. Use it for pure helpers, shared formatting, validation, metadata builders, and transforms that should not depend on browser-only or server-only APIs.",
              ko: "common 폴더는 서버와 클라이언트 환경 양쪽에서 실행될 수 있는 로직을 담습니다. browser 전용 API나 server 전용 API에 의존하지 않는 순수 helper, shared formatting, validation, metadata builder, transform에 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Use srvkit for server-only logic, webkit for browser or web-rendering logic, and common for cross-runtime logic shared by services, signals, pages, and components.",
              ko: "서버 전용 로직은 srvkit, 브라우저 또는 웹 렌더링 로직은 webkit, service, signal, page, component가 함께 쓰는 cross-runtime 로직은 common에 둡니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "The five folders answer one question each, and the test is what the code touches rather than what it is for. Reading them together is faster than reading any one of them, so the same table opens all three pages.",
              ko: "다섯 folder가 각각 질문 하나에 답하고, 기준은 그 코드가 무엇을 위한 것인지가 아니라 무엇을 건드리는지입니다. 하나씩 읽는 것보다 함께 읽는 편이 빠르므로, 같은 표가 세 문서를 모두 엽니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Folder", ko: "폴더" })} items={layerPlacement} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="what-belongs" title={l.trans({ en: "What Belongs In Common", ko: "Common에 두는 것" })}>
        <Docs.Title>{l.trans({ en: "What Belongs In Common", ko: "Common에 두는 것" })}</Docs.Title>
        <div className="space-y-4">
          {[
            {
              title: l.trans({ en: "Formatters", ko: "Formatter" }),
              desc: l.trans({
                en: "Formatting logic used in both service output and UI display, such as bytes, packets, money, or short labels.",
                ko: "bytes, packets, money, short label처럼 service output과 UI display에서 모두 쓰는 formatting 로직입니다.",
              }),
              snippetTitle: "common/formatBytes.ts",
              code: `export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return \`\${(bytes / 1024 ** index).toFixed(1)}\${units[index]}\`;
};`,
            },
            {
              title: l.trans({ en: "Validators", ko: "Validator" }),
              desc: l.trans({
                en: "Validation or predicate helpers that should behave the same on the server and in the browser.",
                ko: "서버와 브라우저에서 동일하게 동작해야 하는 validation 또는 predicate helper입니다.",
              }),
              snippetTitle: "common/isHttpUri.ts",
              code: `export const isHttpUri = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};`,
            },
            {
              title: l.trans({ en: "Random/string utilities", ko: "Random/string utility" }),
              desc: l.trans({
                en: "Small deterministic or generic helpers such as random codes, padding, shuffling, or short string transforms.",
                ko: "random code, padding, shuffle, 짧은 문자열 변환처럼 작은 범용 helper입니다.",
              }),
              snippetTitle: "common/randomCode.ts",
              code: `export const randomCode = (length = 6) => {
  return Math.floor(Math.random() * 10 ** length)
    .toString()
    .padStart(length, "0");
};`,
            },
            {
              title: l.trans({ en: "Metadata builders", ko: "Metadata builder" }),
              desc: l.trans({
                en: "Small objects or builder classes that describe query, filter, or display metadata without binding to one runtime.",
                ko: "query, filter, display metadata를 특정 runtime에 묶지 않고 표현하는 작은 object 또는 builder class입니다.",
              }),
              snippetTitle: "common/getQueryMeta.ts",
              code: `export class QueryMeta {
  queryKey: string | null = null;

  constructor(public refName: string) {}

  query(key: string) {
    this.queryKey = key;
    return this;
  }
}

export const getQueryMeta = (refName: string) => new QueryMeta(refName);`,
            },
            {
              title: l.trans({ en: "Content transforms", ko: "Content transform" }),
              desc: l.trans({
                en: "Pure transforms that convert stored content into another shape, such as extracting plain text from editor JSON.",
                ko: "editor JSON에서 plain text를 추출하는 것처럼 저장된 content를 다른 형태로 변환하는 순수 transform입니다.",
              }),
              snippetTitle: "common/extractTextFromSlateJson.ts",
              code: `export const extractTextFromSlateJson = (nodes: { text?: string; children?: unknown[] }[]): string => {
  return nodes
    .map((node) => {
      if (node.text !== undefined) return node.text;
      if (!node.children) return "";
      return extractTextFromSlateJson(node.children as { text?: string; children?: unknown[] }[]);
    })
    .join("");
};`,
            },
          ].map(({ title, desc, snippetTitle, code }) => (
            <div key={title} className={panelRecipe()}>
              <div className="font-bold text-foreground">{title}</div>
              <div className="mt-2 text-foreground/70 text-sm">{desc}</div>
              <div className="mt-3">
                <Code.Snippet className="w-full" title={snippetTitle} code={code} />
              </div>
            </div>
          ))}
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="barrel-optimization"
        title={l.trans({ en: "Barrel, Optimized Import, And Shape", ko: "Barrel, 최적화 import, 권장 구조" })}
      >
        <Docs.Title>
          {l.trans({ en: "Barrel, Optimized Import, And Shape", ko: "Barrel, 최적화 import, 권장 구조" })}
        </Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The common folder is also a barrel folder like ui and webkit. Export shared helpers from index.ts, then import from the barrel. Akan can optimize imports so pages include only the common helpers they actually use.",
              ko: "common 폴더도 ui와 webkit처럼 barrel folder입니다. shared helper를 index.ts에서 export하고 barrel에서 import합니다. Akan은 import를 최적화해서 페이지가 실제로 사용하는 common helper만 bundle에 포함할 수 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Prefer one file, one export, and file name equals export name. This keeps cross-runtime helpers easy to find and easy to optimize.",
              ko: "1개 파일, 1개 export, 파일명과 export명을 일치시키는 것을 권장합니다. 이렇게 하면 cross-runtime helper를 찾기 쉽고 최적화하기도 쉬워집니다.",
            })}
          </div>
        </Docs.Description>
        <div className="space-y-3">
          <Code.Snippet
            className="w-full"
            title="common/randomCode.ts"
            code={`export const randomCode = (length = 6) => {
  return Math.floor(Math.random() * 10 ** length)
    .toString()
    .padStart(length, "0");
};`}
          />
          <Code.Snippet
            className="w-full"
            title="common/index.ts"
            code={`export { randomCode } from "./randomCode";`}
          />
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="server-client-usage"
        title={l.trans({ en: "Server And Client Usage", ko: "서버와 클라이언트 사용" })}
      >
        <Docs.Title>{l.trans({ en: "Server And Client Usage", ko: "서버와 클라이언트 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A common helper can be used from both service code and page/client code. Keep the helper free from window, document, Bun, fs, process.env, or vendor SDK assumptions unless those APIs are available in both runtimes.",
              ko: "common helper는 service 코드와 page/client 코드 양쪽에서 사용할 수 있습니다. window, document, Bun, fs, process.env, vendor SDK처럼 한쪽 runtime에만 있는 API에 의존하지 않도록 유지하세요.",
            })}
          </div>
        </Docs.Description>
        <div className={cardGridRecipe()}>
          <Code.Snippet
            className="w-full"
            title="order.service.ts"
            code={`import { randomCode } from "@libs/util/common";

export class OrderService extends serve(db.order, () => ({})) {
  createOrderCode() {
    return randomCode(8);
  }
}`}
          />
          <Code.Snippet
            className="w-full"
            title="ui/PreviewCode.tsx"
            code={`import { randomCode } from "@libs/util/common";

export const PreviewCode = () => {
  return <span>{randomCode(8)}</span>;
};`}
          />
        </div>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="practical-rules" title={l.trans({ en: "Practical Rules", ko: "실전 규칙" })}>
        <Docs.Title>{l.trans({ en: "Practical Rules", ko: "실전 규칙" })}</Docs.Title>
        <Docs.Description>
          <div className="space-y-1">
            {[
              l.trans({
                en: "Use common when the same logic must work in both service/signal code and page/component code.",
                ko: "같은 로직이 service/signal 코드와 page/component 코드 양쪽에서 동작해야 한다면 common을 사용합니다.",
              }),
              l.trans({
                en: "Use srvkit instead when the helper needs server-only APIs.",
                ko: "helper가 server-only API를 필요로 한다면 srvkit을 사용합니다.",
              }),
              l.trans({
                en: "Use webkit instead when the helper needs browser-only APIs.",
                ko: "helper가 browser-only API를 필요로 한다면 webkit을 사용합니다.",
              }),
              l.trans({
                en: "Keep common helpers small, pure, and imported from the barrel.",
                ko: "common helper는 작고 순수하게 유지하고 barrel에서 import합니다.",
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
