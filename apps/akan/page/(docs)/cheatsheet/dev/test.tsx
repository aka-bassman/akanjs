import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Testing", ko: "Testing" })}>
        <Docs.Title>{l.trans({ en: "Testing", ko: "Testing" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "In Akan apps, start testing from signals. A signal test checks the real business flow through the generated fetch API before you spend time on UI details.",
              ko: "Akan app에서는 signal 테스트부터 시작하세요. Signal test는 UI 세부사항보다 먼저 generated fetch API를 통해 실제 business flow를 확인합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A signal suite is always two files, and the split is not stylistic:",
              ko: "Signal suite는 항상 두 파일이고, 이 구분은 취향 문제가 아닙니다:",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "`<model>.signal.spec.ts` holds reusable fixtures built on `sampleOf(cnst.XInput)`, each with an explicit return type and no assertions. Other modules import from it.",
                ko: "`<model>.signal.spec.ts`는 `sampleOf(cnst.XInput)` 위에 세운 재사용 fixture를 담습니다. 각 fixture는 반환 타입을 명시하고 assertion은 넣지 않습니다. 다른 module이 여기서 import합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: '`<model>.signal.test.ts` holds the assertions: `describe("<Model> Signal")`, `let` fixtures at describe scope, one `beforeAll`, and story-ordered `it` blocks.',
                ko: '`<model>.signal.test.ts`는 assertion을 담습니다. `describe("<Model> Signal")`, describe scope의 `let` fixture, `beforeAll` 하나, 그리고 이야기 순서대로 놓인 `it` block입니다.',
              })}
            </li>
            <li>
              {l.trans({
                en: "Both files sit beside the module they cover, and the suite boots the whole lib barrel, so signup, permission, validation, and state transitions are all reachable from one fetch.",
                ko: "두 파일 모두 대상 module 옆에 둡니다. Suite가 lib barrel 전체를 띄우므로 signup, permission, validation, state transition을 하나의 fetch로 모두 확인할 수 있습니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="helper" title={l.trans({ en: "Spec Helper", ko: "Spec helper" })}>
        <Docs.Title>{l.trans({ en: "Spec Helper", ko: "Spec helper" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A spec file builds agents and sample data. The fetch it hands back is flat — every endpoint sits directly on it, so it reads `agent.fetch.createArticle(...)`, never a namespace per model.",
              ko: "Spec 파일은 agent와 sample data를 만듭니다. 돌려주는 fetch는 평평합니다. 모든 endpoint가 그 위에 바로 붙어 있어서 `agent.fetch.createArticle(...)`처럼 읽고, model별 namespace는 없습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Agent types are re-exported from `lib/user/user.signal.spec.ts` and imported from there, not from the owning lib.",
              ko: "Agent 타입은 `lib/user/user.signal.spec.ts`에서 다시 export하며, 소유한 lib이 아니라 거기서 import합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/article/article.signal.spec.ts"
          code={`import { getUserAgentWithPhone, type UserAgent } from "@libs/shared/lib/user/user.signal.spec";
import { getOrSetupSignalTestFetch, sampleOf } from "akanjs/test";

import * as cnst from "../cnst";
import type { fetch as appFetch } from "../useServer";

type AppFetch = typeof appFetch;
export type WriterAgent = UserAgent<AppFetch>;

export const getWriterAgent = async (): Promise<WriterAgent> => await getUserAgentWithPhone<AppFetch>();

export const getGuestFetch = async (): Promise<AppFetch> => await getOrSetupSignalTestFetch<AppFetch>();

export const createDraftArticle = async (agent: WriterAgent): Promise<cnst.Article> => {
  const articleInput = sampleOf(cnst.ArticleInput);
  return await agent.fetch.createArticle({ ...articleInput, status: "draft" });
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="test-file" title={l.trans({ en: "Test File", ko: "Test file" })}>
        <Docs.Title>{l.trans({ en: "Test File", ko: "Test file" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The test file carries every assertion. Fixtures are `let` bindings at describe scope so each `it` continues the story the previous one left, and a refusal is asserted with `rejects.toThrow()`.",
              ko: "Assertion은 전부 test file에 있습니다. Fixture는 describe scope의 `let` binding이라 각 `it`이 앞의 `it`이 남긴 이야기를 이어가고, 거절은 `rejects.toThrow()`로 확인합니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/article/article.signal.test.ts"
          code={`import { beforeAll, describe, expect, it } from "bun:test";

import type * as cnst from "../cnst";
import * as articleSpec from "./article.signal.spec";

describe("Article Signal", () => {
  let writerAgent: articleSpec.WriterAgent;
  let article: cnst.Article;

  beforeAll(async () => {
    writerAgent = await articleSpec.getWriterAgent();
  });

  it("creates a draft", async () => {
    article = await articleSpec.createDraftArticle(writerAgent);
    expect(article.status).toBe("draft");
  });

  it("publishes the draft", async () => {
    article = await writerAgent.fetch.publishArticle(article.id);
    expect(article.status).toBe("published");
  });

  it("refuses to publish for anyone but the owner", async () => {
    const guestFetch = await articleSpec.getGuestFetch();
    await expect(guestFetch.publishArticle(article.id)).rejects.toThrow();
  });
});`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="targets" title={l.trans({ en: "What To Test", ko: "무엇을 테스트할까" })}>
        <Docs.Title>{l.trans({ en: "What To Test", ko: "무엇을 테스트할까" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Happy path: create, update, publish, archive.",
                ko: "Happy path: create, update, publish, archive.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Permission: guest cannot publish, owner can edit, admin can remove.",
                ko: "Permission: guest는 publish 불가, owner는 edit 가능, admin은 remove 가능.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Validation: missing title, invalid date, duplicated accountId.",
                ko: "Validation: title 누락, 잘못된 date, accountId 중복.",
              })}
            </li>
            <li>
              {l.trans({
                en: "State transition: draft to published, pending to approved.",
                ko: "State transition: draft에서 published, pending에서 approved.",
              })}
            </li>
            <li>
              {l.trans({
                en: "External dependency: file upload, payment callback, message publish.",
                ko: "External dependency: file upload, payment callback, message publish.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="command" title={l.trans({ en: "Command", ko: "명령어" })}>
        <Docs.Title>{l.trans({ en: "Command", ko: "명령어" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Run app tests from the workspace root. `akan test` prepares the target first, then runs `bun test --isolate` inside it. Add `--write false` when you want to skip code generation during a check.",
              ko: "Workspace root에서 app test를 실행합니다. `akan test`는 대상을 먼저 준비한 뒤 그 안에서 `bun test --isolate`를 실행합니다. 점검 중 code generation을 건너뛰려면 `--write false`를 붙입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="Terminal"
          language="bash"
          code={`akan test myapp
akan test myapp --write false
cd apps/myapp && bun test --isolate`}
        />
        <Docs.Alert type="warning">
          {l.trans({
            en: "Never run plain `bun test`. Without `--isolate` every test file shares one global object, and dozens of tests fail from cross-file state pollution — `bunfig.toml`'s `[test] isolate` is not honored. Running it from the workspace root breaks subprocess stdio pipes on top of that. `akan test` passes `--isolate` for you.",
            ko: "`bun test`를 그냥 실행하지 마세요. `--isolate` 없이는 모든 test file이 하나의 global object를 공유해 파일 간 state 오염으로 수십 개가 실패합니다. `bunfig.toml`의 `[test] isolate`는 적용되지 않습니다. Workspace root에서 실행하면 subprocess stdio pipe까지 깨집니다. `akan test`는 `--isolate`를 대신 붙여 줍니다.",
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Create data through signals when possible so the test uses the same rules as the app.",
                ko: "가능하면 signal로 데이터를 만들어 app과 같은 rule을 타게 하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Keep the spec free of assertions. A fixture that asserts fails somebody else's suite for a reason their file does not show.",
                ko: "Spec에는 assertion을 두지 마세요. Assertion이 든 fixture는 다른 suite를 실패시키면서 그 이유를 그쪽 파일에서는 보여주지 않습니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Test one important behavior per `it` block.",
                ko: "`it` block 하나에는 중요한 behavior 하나만 테스트하세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
