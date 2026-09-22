# MCP Server

- Source: /cheatsheet/interface/mcp
- Mirror: /llms/pages/cheatsheet/interface/mcp.md
- Section: cheatsheet
- Category: Interface
- Priority: P2

## Headings

- MCP Server (#overview)
- 1. Turn The Server On (#enable)
- 2. Write An Endpoint (#tool)
- 3. Slices And CRUD (#slice)
- 4. Publish A Screen As A Prompt (#prompt)
- When A Prompt Cannot Run (#prompt-failures)
- 5. Report Progress (#progress)
- Authorization (#auth)
- Tips (#tips)

## Content

MCP Server

Become tools. A generated read also gets a resource URI.

A screen published from its page file as a slash command the user invokes, not the model.

Never exposed — their arguments read a socket MCP does not have.

Exposure follows the guards, and there is no per-endpoint opt-in. Every candidate walks one ordered ladder at boot, first match wins, and whichever rung it stopped on is the sentence the boot log prints:

Published, or refused and why

1. Turn The Server On

/mcp is mounted by default. Configure it in lib/option.ts — not main.ts — so the process that mounts the route actually receives the settings. Every lib's option is read in mount order with the app's last. A value written in code wins over the env of the same name, but writing undefined does not erase one.

Whether the route is mounted at all. AKAN_MCP / AKAN_PUBLIC_MCP is an opt-out: only the literal false or 0 turns it off.

Drops every endpoint that is not a query, whatever its guards allow — a deployment valve, not the exposure switch. AKAN_MCP_READONLY is an opt-in: only true or 1 turns it on.

Mount path. The published OAuth resource identifier follows it, so changing it changes the aud a token has to carry. AKAN_MCP_PATH, normalized to a leading slash.

Reported as serverInfo.version — the same placeholder the OpenAPI document uses. AKAN_MCP_VERSION.

What this app is for and which tool to reach for first, handed to the model with the tool list. AKAN_MCP_INSTRUCTIONS.

Extra origins past the DNS-rebinding check, beyond the server's own host. Only a browser-hosted client sends Origin. AKAN_MCP_ALLOWED_ORIGINS, comma-separated.

Entries per catalogue page. A client that wants the whole list follows nextCursor until it stops. AKAN_MCP_PAGE_SIZE.

The one language the catalogue and its error text are written in. Server-wide on purpose: the document is built once at boot and read by a model, not a person. AKAN_MCP_LANGUAGE.

How much of a result's shape each tool advertises. shallow names a nested model instead of inlining it, full inlines the whole closure, none publishes no outputSchema and keeps the text block on. AKAN_MCP_OUTPUT_SCHEMA.

Whether a structured result also ships as serialized JSON in the text block — a flat doubling of every model-returning call. AKAN_MCP_LEGACY_TEXT can only turn it off; there is no env spelling that turns it back on.

Per-caller budget for tools/call, resources/read and prompts/get, counted per process — so replicas do not share it. Listings are not counted. false takes it off and warns at boot. AKAN_MCP_RATE_LIMIT and AKAN_MCP_CONCURRENT.

Characters of screen data one page prompt may attach before its lists are cut, largest first. A page's own limit is right for a screen and wrong for a model's window. AKAN_MCP_PROMPT_BUDGET.

OAuth resource-server identity. Naming an authorization server makes a credential mandatory rather than advertising one. AKAN_MCP_AUTH_SERVERS, AKAN_MCP_SCOPES, AKAN_MCP_RESOURCE; verify is a function and has no env spelling.

2. Write An Endpoint

Name the guards and you are done. The tool name is the endpoint key, the input schema comes from the declared arguments, and the output schema from the return model.

Write the dictionary entry at the same time. An agent picks a tool by its description, so a missing one is a broken tool — the boot log warns for every published entry that has none.

3. Slices And CRUD

Generated CRUD publishes from the slice() guards map — get, cru, and the per-verb entries. A named slice does not inherit that map: write its own guards, or it is refused and named in the boot log.

mcp: false keeps an entry off the shelf without touching its guards. On slice() it mirrors the guards map key for key — root, get, cru, create, update, remove — and reaches exactly as far: the root slice and generated CRUD, never a named slice or a custom endpoint. Those write their own. A bare mcp: false expands to root, get and cru only; create, update and remove then inherit cru.

Every published read also gets a resource URI. An insight does not — it is an aggregate with nothing to point at. A custom endpoint keeps its tool and gets no template, and the refused lightX read gets neither. The root list is the bare .../list, with no third segment, because that segment is the slice key.

generated resource uris

The root list's raw query argument is typed Any, so it is left out of the schema. Declare a named filter slice when an agent should narrow a list.

4. Publish A Screen As A Prompt

A prompt is a screen, not an endpoint. Declare it in the page file with .prompt(name, description): the user invokes it as a slash command, and the model receives what the page loads. There is no prompt() builder in a signal, and Msg is not a public API.

The description is the whole instruction the model receives — English, in API vocabulary. Agent.Guide text is never used for MCP.

Arguments are the declaration: .param() is required, .search() optional, and desc is the argument's description. A list argument gets Comma-separated list. appended and is typed comma-separated in prompts/get. An ID, Int, or enum value is validated by the page's own declaration.

prompts/list lists every page with .prompt(). A name matches ^[A-Za-z0-9_-]{1,64}$ and is unique across pages.

prompts/get runs the page's body — root layouts, layouts, then the render function — in the RSC worker under the caller's bearer token. No JSX is rendered and no client component runs; every fetch.* query the page makes is recorded and becomes the answer.

The description, as the first user message.

One per query, embedded and masked by that endpoint's return model — hidden, secret, and visual fields stripped — at the akan:// uri the tool answers to, or akan://<toolKey>?args for a custom read.

A final line, Tools for this screen: a, b, c. — the published tools of the modules the page fetched from, filtered to what the caller may see.

When A Prompt Cannot Run

A prompt cannot re-run itself and there is no fallback context, so every way a screen can decline has to arrive as a message the caller can act on. Each of these is answered instead of the page's data, not alongside it:

What happened

A required argument was left out

No <arg> was named for "<prompt>". Find it with <model>List…, then run this prompt again with <arg>=<id>. The page is not run at all, and the answer points at the tool that finds the id rather than guessing one.

The page redirects, with no token

A 401 credential challenge, so the client authenticates instead of concluding the screen does not exist.

The page redirects, with a token

This screen is not available to the signed-in account. A guard refusing a query inside the body reads the same way a redirect does — as the screen declining this account.

router.notFound()

No screen exists for these arguments.

Any other throw

The page failed to load. — and the real error is logged server-side, where it does not describe your internals to a caller.

Lists are cut, largest first, to promptBudget — 60,000 characters by default — with a note: Attached the first N of M rows of `key`; call it for the rest.

Tool exposure is unchanged — guards decide, and mcp: false and Person still apply. The in-page chat keeps only its six built-in slash commands; app prompts are not listed there.

Prompts come from the RSC worker, so an API-only build serves none at all.

5. Report Progress

Report from wherever the work happens. Outside a streamed call it is a no-op, so the same service runs unchanged over HTTP, a websocket, and in tests.

The client must send both Accept: text/event-stream and a progressToken. The server switches only after the first report.

Cancellation is the client closing the stream. Watch McpProgress.signal; the framework cannot stop an exec already in flight.

McpProgress.streaming is true while anyone is reading, so an expensive message can be skipped.

Authorization

MCP arrives over HTTP and runs the ordinary pipeline, so guards, Self, and account middleware behave as they do for a browser call. One difference: the cookie header is stripped at the door, so the Authorization header is the only credential the route accepts.

The verdict reads the caller only. Evaluated when filtering a listing, so an anonymous agent is not offered admin tools it can only fail at.

Needs the call's arguments, so it is never evaluated for a listing. The entry stays visible and is stopped at call time.

Every guard must declare static scope with no default. SignedIn / Admin are account; every Can<Verb><Model> is resource. The listing is a UX filter — the call still runs every guard.

OAuth resource server, by env

Unauthenticated calls get a WWW-Authenticate challenge, so a client authenticates instead of concluding the tool does not exist.

insufficient_scope is enforced only once AKAN_MCP_SCOPES is set. First-party Akan tokens carry no scope claim.

A token with no aud is refused once AKAN_MCP_AUTH_SERVERS names an issuer, and accepted while none is named.

Tips

A missing tool is explained in the boot log: MCP catalogue: tools=… then one verbose line per refusal. Turn verbose on, because there is no opt-in to notice — that log is the only place the answer exists.

Write the model's .desc(). Generated CRUD tools append it to Get X, and the root list borrows the .of() label — those entries have no other text.

Narrow by cost, and read the boot log first. MCP forbids a $ref across entries, so every entry inlines the schema of every model it mentions and the listing is re-sent whole to every agent that connects. A per-signal MCP catalogue cost: line says where the bytes went.

Two endpoints cannot share a tool name. The first in candidate order — refName then key — keeps it, and the other is refused with another endpoint is already published under this name.

An unknown argument is reported as the caller's mistake. A missing document is too — No <Model> found for the arguments given. Only a genuine failure answers that the server failed.

A field.visual field is stripped from every MCP result and from the readable schema, so the two agree. Reach for it whenever a field is bulky and useless to a model.

## Code Examples

### apps/myapp/lib/option.ts

```ts
export const option = new AkanOption<ModulesOptions>().setMcp({
  instructions: "Domain tools for the akan app. Start from taskListInTodo.",
  language: "en",
  outputSchema: "shallow",
});

// setMcp also takes a function, for a value that has to come from the server env:
//   .setMcp((env) => ({ readOnly: env.environment !== "main" }))
```

### apps/myapp/lib/task/task.signal.ts

```ts
export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation }) => ({
  taskSummary: query(cnst.TaskInsight, { guards: [SignedIn] })
    .search("status", cnst.TaskStatus)
    .exec(async function (status) {
      return await this.taskService.insightByStatuses([status ?? "todo"]);
    }),
  startTask: mutation(cnst.Task, { guards: [CanWriteTask] })
    .param("taskId", ID)
    .exec(async function (taskId) {
      return await this.taskService.startTask(taskId);
    }),
})) {}
```

### apps/myapp/lib/task/task.dictionary.ts

```ts
.endpoint<TaskEndpoint>((fn) => ({
  startTask: fn(["Start Task", "작업 시작"])
    .desc(["Moves one task from todo to in progress", "할 일 하나를 진행중으로 옮깁니다"])
    .arg((t) => ({ taskId: t(["Task ID", "할 일 ID"]).desc(["The task to start", "시작할 할 일"]) })),
}))
```

### apps/myapp/lib/task/task.signal.ts

```ts
export class TaskSlice extends slice(
  srv.task,
  {
    guards: { root: Admin, get: SignedIn, cru: SignedIn },
    mcp: { cru: false }, // [!code highlight]
  },
  (init) => ({
    inTodo: init({ guards: [SignedIn] }).exec(function () {
      return this.taskService.queryByStatuses(["todo"]);
    }),
  }),
) {}

// A named slice and a custom endpoint carry a plain boolean, never the map.
requestPhoneCode: mutation(Boolean, { guards: [SignedIn], mcp: false })
```

### Code

```ts
akan://task/{taskId}
akan://task/list{?skip,limit,sort}
akan://task/list/inTodo{?skip,limit,sort}
```

### apps/myapp/page/project/[projectId]/tickets.tsx

```ts
export default page()
  .param("projectId", ID, { desc: "The project to brief." })
  .search("statuses", [String], { desc: "Statuses to include." })
  .prompt("briefProjectTickets", "Brief the ticket board of one project.")
  .render(async ({ projectId, statuses }) => {
    const [{ project }, { ticketInitInProject }] = await Promise.all([
      fetch.viewProject(projectId),
      fetch.initTicketInProject(projectId, statuses),
    ]);
    return <Ticket.Zone.Card init={ticketInitInProject} project={project} />;
  });
```

### apps/myapp/lib/task/task.service.ts

```ts
async importTasks(rows: cnst.TaskInput[]) {
  for (const [idx, row] of rows.entries()) {
    McpProgress.report(idx + 1, { total: rows.length, message: `importing ${row.title}` });
    await this.createTask(row);
  }
  return rows.length;
}
```

### Code

```bash
AKAN_MCP_AUTH_SERVERS=https://auth.example.com
AKAN_MCP_SCOPES=akan.read,akan.write
AKAN_MCP_RESOURCE=https://api.example.com/mcp
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

