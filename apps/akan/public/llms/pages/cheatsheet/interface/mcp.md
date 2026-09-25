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

Model Context Protocol: the standard AI clients like Claude Code and Cursor use to call a server.

A function the model may call; each published endpoint becomes one, named by its key.

A read addressed by an `akan://` URI, which a client can attach as context.

A screen published for the user to run as a slash command in the MCP client.

The list of tools, resources and prompts a client downloads when it connects.

Signal (*.signal.ts)

Custom endpoints and the generated create, update and remove become tools named by their key.

Generated reads are tools that also get an `akan://` resource URI.

An aggregate with nothing to point at, so it stays a tool with no URI.

Never exposed: their arguments read a socket an MCP request does not have.

Page (page/**)

A screen the user runs as a slash command; the model does not pick it.

It declares `mcp: false`

It was curated off the shelf on purpose; its guards and HTTP stay exactly as they were.

A guard declares `static agents = false`, like `Person`

It is an act reserved for a person, so no model is ever offered it.

It declares no `guards`, or an empty list

Nobody decided who may call it; write `guards: [Public]` if anonymous access is the intent.

It is the generated `light<Model>` read

It reads the same document as `<model>` in a smaller shape, so the agent calls `<model>` instead.

It is a `pubsub` or a `message`

It rides the websocket, and its arguments read a socket an MCP request does not have.

The deployment is read-only and it is not a `query`

The `readOnly` valve drops every mutation, whatever its guards allow.

It returns `Any`, `Upload` or `Binary`

A model cannot be told what comes back, and raw bytes only fill its context window.

It takes a file upload

A file upload has no MCP representation.

It is a `mutation` whose only guard is `Public`

`[Public]` on a write is having no guard, spelled out; add a real one.

A required argument is typed `Any`

`Any` is left out of the schema, so expose a named filter slice instead.

Whether `/mcp` is mounted; `false` or `0` in the env turns it off whatever the code says.

Publishes queries only, whatever the guards allow; the env turns it on only on `true` or `1`.

Mount path; the OAuth resource identifier, and so the `aud` a token needs, follows it.

Reported as `serverInfo.version`, the same placeholder the OpenAPI document uses.

Sent to the model with the tool list: what the app is for and which tool to reach first.

Extra origins past the DNS-rebinding check; only a browser-hosted client sends an Origin.

Entries per catalogue page; a client follows `nextCursor` for the rest.

The one language of the catalogue and its error text, server-wide.

Result shape a tool advertises: `shallow` names nested models, `full` inlines, `none` omits.

Repeats a structured result as JSON in the text block; the env can only turn it off.

Per-caller budget for `tools/call`, `resources/read` and `prompts/get`, counted per process.

Characters of screen data one page prompt may attach before its lists are cut.

The OAuth resource-server identity; naming an authorization server makes a token mandatory.

The endpoint key as written, such as `startTask`.

Every `.param()`, `.search()` and `.body()` argument in one object; `.search()` ones are optional.

The return model; a scalar or a nullable single return ships as text only.

The endpoint's dictionary label and its `.desc()`.

`readOnlyHint` on a query, `destructiveHint` on a `remove…` or `delete…` mutation.

The root slice: guarded by `guards.root`, opted out with `mcp: { root: false }`.

The full read: `guards.get` and `mcp: { get: false }`; `lightTask` is never published.

`guards.cru` and `mcp: { cru: false }`, or a per-verb key such as `create`.

A named slice: only its own `init({ guards, mcp })` counts.

The page's description, as the first user message.

One per query, masked by its endpoint's return model: no hidden, secret or visual fields.

The `akan://` URI the tool answers to; a custom read gets `akan://<toolKey>?args`.

The fetched modules' published tools that the caller may see, minus the attached reads.

A required argument was left out

The page is not run; the answer names the tool that finds the id.

An argument fails the page's declaration

The page is not run; the declaration's own error message is returned.

A redirect or a guard refusal, with no token

A `401` credential challenge, so the client signs in instead of giving up.

A redirect or a guard refusal, with a token

One fixed answer, so it never confirms whether an id exists.

Answered as not-found for these arguments.

Any other throw

The real error is logged on the server and never described to the caller.

Hides from listing

Checked at call

Reads only the caller, so an anonymous agent is not offered admin tools it can only fail.

Needs the call's arguments, so the entry stays listed and is stopped at call time.

Your app mounts libs/shared

Nothing to set. The app serves the OAuth 2.1 server itself (metadata, consent, registration, token, revocation) and names itself the issuer.

Somebody else's issuer

OAuth For Agents

Where an agent's token comes from, and how to revoke it.

In-Page Agent

The chat inside your own pages, a different surface from MCP.

Words used on this page

Term

What becomes what

What you wrote

Published as

Not published as

When an endpoint is refused

Exposure follows the guards, and there is no per-endpoint opt-in. An endpoint is published unless one of these applies, checked top to bottom:

Refused when

Why, and what to do

1. Turn The Server On

Options

2. Write An Endpoint

Tool part

Write the dictionary entry in the same change:

3. Slices And CRUD

Generated entry

Resource URIs

Every published generated read also gets a URI a client can read directly:

Generated resource URIs

4. Publish A Screen As A Prompt

What prompts/get sends back

Part

When A Prompt Cannot Run

A prompt cannot re-run itself and has no fallback context, so every way a screen can decline comes back as a message the caller can act on. Each of these answers instead of the page's data:

What happened

5. Report Progress

Authorization

What a caller is shown

Guard

Yes

No

The listing is only a convenience filter; the call still runs every guard.

Where tokens come from

For somebody else's issuer, set these in the deployment env:

OAuth resource server, by env

Tips

## Code Examples

### apps/myapp/lib/option.ts

```ts
export const option = new AkanOption<ModulesOptions>().setMcp({
  instructions: "Task tracking for one team. Start from taskListInTodo.",
  language: "en",
  outputSchema: "shallow",
});

// A value decided at boot takes a function of the env.server.* options:
//   .setMcp(() => ({ readOnly: getEnv().environment === "debug" }))
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
    .arg((t) => ({
      taskId: t(["Task ID", "할 일 ID"]).desc(["The task to start", "시작할 할 일"]),
    })),
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

// A named slice and a custom endpoint carry a plain boolean, never the map:
//   inArchive: init({ guards: [SignedIn], mcp: false })
//   requestPhoneCode: mutation(Boolean, { guards: [SignedIn], mcp: false })
```

### Code

```markdown
akan://task/{taskId}
akan://task/list{?queryKey,skip,limit,sort}
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
    return (
      <>
        <Project.View.General project={project} />
        <Ticket.Zone.Card init={ticketInitInProject} projectId={projectId} />
      </>
    );
  });
```

### apps/myapp/lib/task/task.service.ts

```ts
import { McpProgress } from "akanjs/signal";

export class TaskService extends serve(db.task, () => ({})) {
  async importTasks(rows: cnst.TaskInput[]) {
    for (const [idx, row] of rows.entries()) {
      McpProgress.report(idx + 1, {
        total: rows.length,
        message: `importing ${row.title}`,
      });
      await this.createTask(row);
    }
    return rows.length;
  }
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

