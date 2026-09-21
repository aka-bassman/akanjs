import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="service-zone" title={l.trans({ en: "Service Zone", ko: "Service Zone" })}>
        <Docs.Title>{l.trans({ en: "Service Zone", ko: "Service Zone" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service Zone is a client page section for a service feature. It composes store state, store actions, service UI controls, loading indicators, results, and pagination.",
              ko: "Service Zone은 service feature를 위한 client page section입니다. store state, store action, service UI control, loading indicator, result, pagination을 조립합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "It is not a model list section by default. The `_search` Zone renders search administration UI, even though search itself is a service workflow rather than a document model.",
              ko: "기본적으로 model list section이 아닙니다. `_search` Zone은 search가 document model이 아니라 service workflow인데도 search administration UI를 렌더링합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A Zone is a client component, but that is a cost, not a licence. Keep it to the store reads and the controls that need them, and push the markup down to a server component it renders as children — every element left in the Zone ships twice, as HTML and as bundled JS the browser re-runs.",
              ko: "Zone은 client component지만, 그것은 허가가 아니라 비용입니다. store 읽기와 그것이 필요한 control만 남기고 markup은 children으로 렌더링하는 server component로 내립니다. Zone에 남은 element는 HTML과 브라우저가 다시 실행하는 bundle JS로 두 번 전송됩니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide
        id="store-driven-section"
        title={l.trans({ en: "Store-Driven Section", ko: "Store-driven section" })}
      >
        <Docs.Title>{l.trans({ en: "Store-Driven Section", ko: "Store-driven section" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A service Zone usually reads state through `st.use.*` and runs feature actions through `st.do.*`. Keep data loading in store actions and let Zone focus on composition.",
              ko: "Service Zone은 보통 `st.use.*`로 state를 읽고 `st.do.*`로 feature action을 실행합니다. data loading은 store action에 두고 Zone은 composition에 집중합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "When a small interaction is reused, pull it from the service Util file. Zone can then arrange those Util pieces with local domain components into the final page section.",
              ko: "재사용되는 작은 interaction은 service Util 파일에서 가져다 쓰면 됩니다. Zone은 그런 Util 조각과 domain component를 배치해서 최종 page section을 구성합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Seed the store from the route instead of loading on mount. The page fetches and hands the result down as a prop; a useEffect with an empty dependency array is a round trip the server could have made before the first byte.",
              ko: "mount 시점에 load하지 말고 route에서 store를 채웁니다. page가 fetch해서 결과를 prop으로 내려주면 됩니다. dependency 배열이 빈 useEffect는 server가 첫 바이트 이전에 끝낼 수 있었던 왕복입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Search.Zone.tsx"
          code={`"use client";

export const Database = ({ indexNames }: DatabaseProps) => {
  const searchIndexName = st.use.searchIndexName();
  const searchResult = st.use.searchResult();

  return (
    <SearchResults result={searchResult} indexNames={indexNames} disabled={!searchIndexName} />
  );
};`}
        />
        <Code.Snippet
          className="w-full"
          title="apps/myapp/page/search/_index.tsx"
          code={`export default page().render(async () => {
  const indexNames = await fetch.getSearchIndexNames();
  return <Search.Zone.Database indexNames={indexNames} />;
});`}
        />
      </Scroll.Slide>
      <Divider />

      <DocsToc />
    </Scroll>
  );
});
