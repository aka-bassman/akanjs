# Testing

- Source: /cheatsheet/dev/test
- Mirror: /llms/pages/cheatsheet/dev/test.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Testing (#overview)
- Spec Helper (#helper)
- Test File (#test-file)
- What To Test (#targets)
- Command (#command)
- Tips (#tips)

## Content

Testing

In Akan apps, start testing from signals. A signal test checks the real business flow through the generated fetch API before you spend time on UI details.

A signal suite is always two files, and the split is not stylistic:

`<model>.signal.spec.ts` holds reusable fixtures built on `sampleOf(cnst.XInput)`, each with an explicit return type and no assertions. Other modules import from it.

`<model>.signal.test.ts` holds the assertions: `describe("<Model> Signal")`, `let` fixtures at describe scope, one `beforeAll`, and story-ordered `it` blocks.

Both files sit beside the module they cover, and the suite boots the whole lib barrel, so signup, permission, validation, and state transitions are all reachable from one fetch.

Spec Helper

A spec file builds agents and sample data. The fetch it hands back is flat — every endpoint sits directly on it, so it reads `agent.fetch.createArticle(...)`, never a namespace per model.

Agent types are re-exported from `lib/user/user.signal.spec.ts` and imported from there, not from the owning lib.

Test File

The test file carries every assertion. Fixtures are `let` bindings at describe scope so each `it` continues the story the previous one left, and a refusal is asserted with `rejects.toThrow()`.

What To Test

Happy path: create, update, publish, archive.

Permission: guest cannot publish, owner can edit, admin can remove.

Validation: missing title, invalid date, duplicated accountId.

State transition: draft to published, pending to approved.

External dependency: file upload, payment callback, message publish.

Command

Run app tests from the workspace root. `akan test` prepares the target first, then runs `bun test --isolate` inside it. Add `--write false` when you want to skip code generation during a check.

Never run plain `bun test`. Without `--isolate` every test file shares one global object, and dozens of tests fail from cross-file state pollution — `bunfig.toml`'s `[test] isolate` is not honored. Running it from the workspace root breaks subprocess stdio pipes on top of that. `akan test` passes `--isolate` for you.

Tips

Create data through signals when possible so the test uses the same rules as the app.

Keep the spec free of assertions. A fixture that asserts fails somebody else's suite for a reason their file does not show.

Test one important behavior per `it` block.

## Code Examples

### apps/myapp/lib/article/article.signal.spec.ts

```ts
import { getUserAgentWithPhone, type UserAgent } from "@libs/shared/lib/user/user.signal.spec";
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
};
```

### apps/myapp/lib/article/article.signal.test.ts

```ts
import { beforeAll, describe, expect, it } from "bun:test";

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
});
```

### Terminal

```bash
akan test myapp
akan test myapp --write false
cd apps/myapp && bun test --isolate
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

