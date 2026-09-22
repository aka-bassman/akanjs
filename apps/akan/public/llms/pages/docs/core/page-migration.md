# Page Migration

- Source: /docs/core/page-migration
- Mirror: /llms/pages/docs/core/page-migration.md
- Section: docs
- Category: Core Concepts
- Priority: P2

## Headings

- Why The Chain (#why-the-chain)
- A Plain Page (#plain-page)
- Params And Search Params (#params-and-search)
- A Layout (#layout)
- The Root Layout (#root-layout)
- Mapping Table (#mapping)
- Rules The Loader Enforces (#rules)
- MCP Prompts (#mcp-prompts)
- Verify (#verify)

## Content

Page Migration

Why The Chain

A route file used to be a default function beside a handful of named exports: pageConfig, generateMetadata, Loading, fonts, and so on. It is now one declaration — export default page()…render(fn) — and every route setting is a stage of that chain. This page walks each legacy shape to its chain form.

One declaration

The module has a single export, so the loader reads one shape and a setting cannot drift into a stray named export.

Typed arguments

.param() and .search() declare what the page reads, and .render() receives those values flat and already typed, with lang — the locale segment — on every route without a stage. A path value the type refuses answers not-found; a bad search value is dropped.

The page is also the prompt

The same declaration publishes the screen to MCP with .prompt(): its .param() stages are the required arguments and its .search() stages the optional ones. Nothing is declared twice.

A Plain Page

Drop the function keyword, hand the body to .render(), and close with });. usePage(), getSelf() and fetch.* are called inside it exactly as before. Mark the render async only when it awaits.

Before · page/about.tsx

After · page/about.tsx

Params And Search Params

PageProps is gone. Every [x] segment of the file's path becomes a .param() stage, in order, and every query key the page reads becomes a .search() stage. pageConfig, generateMetadata and Loading fold into .config(), .metadata() and .loading(). The render receives the declared arguments by name.

Before · page/(user)/project/[projectId]/_index.tsx

After · page/(user)/project/[projectId]/_index.tsx

Arrive as string. Use ID for every segment whose name ends in Id.

Arrive as number. A path segment that does not parse answers not-found.

Arrive as boolean and as Dayjs. String, Boolean and Date are globals; ID, Int and Float come from akanjs/base.

Arrives as the enum's value union, so cnst.ServeType yields the same type the model field carries.

Search only. Arrives as an array; ?tags=a is a one-item list. Every search argument is optional, so it may be undefined.

Keep the body order inside .render(): usePage(), then auth such as getSelf({ unauthorize: "/signin" }), then the fetches in one Promise.all, then the return. Only the wrapper changed.

A Layout

A _layout.tsx becomes a layout() chain. It takes the same stages as page(), receives children beside its arguments, and replaces the NotFound and Error exports with .notFound() and .error(). A layout declares only the [x] segments it reads — most read none and declare no .param() at all.

Before · page/org/[orgId]/_layout.tsx

After · page/org/[orgId]/_layout.tsx

A layout that reads nothing is the shortest chain there is: export default layout().render(({ children }) => …). Auth gates such as getSelf({ unauthorize }) stay inside that render, before any markup.

The Root Layout

The root _layout.tsx of an app, or of a basePath, becomes a rootLayout() chain. Each app-wide export — fonts, theme, manifest, reconnect, wsConnect, layoutStyle, gaTrackingId, head — is a stage of the same name. The stylesheet import stays the first line.

Before · page/_layout.tsx

After · page/_layout.tsx

Mapping Table

Every legacy export has exactly one chain stage. Read the left column off the file you are migrating and write the right column.

Rules The Loader Enforces

The route loader and akan sync read the same rules. The loader applies them when a module is imported; akan sync reads the chain off the source without evaluating it, so a broken file is named before the first request.

One export

A chain module exports nothing beside default. A named export beside the chain is refused — every route setting is a stage.

The right root for the file

page() in a _layout.tsx, or layout() in a page file, is refused.

Every segment declared

A page must .param() every [x] segment of its path, in order; a layout may declare a subset. akan sync refuses a [projectId] folder whose page declares no .param("projectId"), and a .param() naming a segment that is not in the path.

String literals

The names in .param() and .prompt(), and devOnly in .config(), are read off the source without running the module, so they must be literals.

One metadata stage

.metadata() or .head(), never both in one module. Metadata is not merged across layouts and pages; the nearest route module wins.

_overrides.tsx is unchanged

The UI-override manifest keeps its export default override({ … }) shape. Only page and layout files migrate.

The legacy shape still loads. Each unmigrated file is named once at boot, so the server log is the list of what is left:

Boot warning

MCP Prompts

prompt() on endpoint() is removed. This is a breaking change: a signal file can no longer declare a prompt, and the Msg helpers it built messages with are no longer public. A screen is published as an MCP prompt from its page instead, with the .prompt() stage. The description is the whole instruction the model receives — English, in the API's own vocabulary. Agent.Guide is for the in-page agent and never reaches MCP.

Every page with a .prompt() stage. Its .param() stages are required arguments and its .search() stages optional ones; a list argument's description gets "Comma-separated list." appended and is typed comma-separated in prompts/get. ID, Int and enum values are validated by the page's own declaration. Names match ^[A-Za-z0-9_-]{1,64}$ and are unique across pages. Page prompts exist only when web is enabled.

Runs the page's body — root layouts, layouts, then the page render — in the RSC worker under the caller's bearer token. No JSX is rendered and no client component runs; every fetch.* query the page made is recorded. The answer is the description as the first user message, one embedded resource per query masked by the endpoint's return model and addressed by the akan:// uri the tool answers to, and a final "Tools for this screen: a, b, c." line naming the published tools of the modules the page fetched from, filtered per caller.

Lists are cut largest-first until the attachments fit 60,000 characters, and the cut is said: "Attached the first N of M rows of `key`; call it for the rest." Tune it with option.setMcp({ promptBudget }) or AKAN_MCP_PROMPT_BUDGET.

Refusals

A required argument left out answers one message and runs nothing: "No <arg> was named for \"<prompt>\". Find it with <model>List…, then run this prompt again with <arg>=<id>." A redirect such as getSelf({ unauthorize }) answers a 401 challenge without a token, otherwise "This screen is not available to the signed-in account." Not-found answers "No screen exists for these arguments." and a throw answers "The page failed to load."

In-page chat

Agent.Chat keeps only its six built-in slash commands — /new, /retry, /compact, /copy, /help, /tools. App prompts are not listed there; a page prompt is for MCP clients.

Verify

Typecheck catches an argument the render reads but the chain never declared, and lint catches a stray named export or an import that crossed a boundary. Run both after each file.

From the repo root

The legacy shape still loads, so an app migrates file by file. Each file that has not moved yet logs the boot warning above once; when the log is quiet, the migration is complete.

## Code Examples

### Code

```ts
import { usePage } from "@apps/myapp/client";

export default function Page() {
  const { l } = usePage();
  return <h1>{l("about.title")}</h1>;
}
```

### Code

```ts
import { usePage } from "@apps/myapp/client";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();
  return <h1>{l("about.title")}</h1>;
});
```

### Code

```ts
import { fetch, Task } from "@apps/myapp/client";
import type { GenerateMetadata, PageConfig } from "akanjs/client";

interface PageProps {
  params: { projectId: string };
  searchParams?: { tab?: string; tags?: string | string[] };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { projectId } = params;
  const tags = [searchParams?.tags ?? []].flat();
  const [{ taskInitInProject }] = await Promise.all([fetch.initTaskInProject(projectId)]);
  return <Task.Zone.Card init={taskInitInProject} tab={searchParams?.tab} tags={tags} />;
}

export const pageConfig = { transition: "stack" } satisfies PageConfig;

export const generateMetadata = (({ params }) => ({
  title: `Project ${params.projectId}`,
})) satisfies GenerateMetadata;

export function Loading() {
  return <div>Loading project...</div>;
}
```

### Code

```ts
import { fetch, Task } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to open." })
  .search("tab", String, { desc: "Which tab opens first." })
  .search("tags", [String], { desc: "Tags to filter by." })
  .config({ transition: "stack" })
  .metadata(({ projectId }) => ({ title: `Project ${projectId}` }))
  .loading(() => <div>Loading project...</div>)
  .render(async ({ projectId, tab, tags }) => {
    const [{ taskInitInProject }] = await Promise.all([fetch.initTaskInProject(projectId)]);
    return <Task.Zone.Card init={taskInitInProject} tab={tab} tags={tags ?? []} />;
  });
```

### Code

```ts
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: { orgId: string };
}

export default function Layout({ children, params }: LayoutProps) {
  return <section data-org={params.orgId}>{children}</section>;
}

export function Loading() {
  return <div>Loading...</div>;
}

export function NotFound({ pathname }: { pathname: string }) {
  return <div>Nothing at {pathname}</div>;
}

export function Error() {
  return <div>Something went wrong.</div>;
}
```

### Code

```ts
import { ID } from "akanjs/base";
import { layout } from "akanjs/client";

export default layout()
  .param("orgId", ID)
  .loading(() => <div>Loading...</div>)
  .notFound(({ pathname }) => <div>Nothing at {pathname}</div>)
  .error(() => <div>Something went wrong.</div>)
  .render(({ children, orgId }) => <section data-org={orgId}>{children}</section>);
```

### Code

```ts
import "./styles.css";
import type { Font, LayoutProps, WebAppManifest } from "akanjs/client";

export const fonts: Font[] = [
  { name: "pretendard", default: true, paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }] },
];
export const manifest: WebAppManifest = {
  name: "My App",
  shortName: "MyApp",
  startUrl: "/",
  display: "standalone",
};
export const theme = "dark";
export const reconnect = false;
export const wsConnect = false;
export const layoutStyle = "web";
export const gaTrackingId = "G-XXXXXXXXXX";
export const head = (
  <>
    <title>My App</title>
    <link rel="icon" href="/favicon.ico" />
  </>
);

export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
}
```

### Code

```ts
import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([{ name: "pretendard", default: true, paths: [{ src: "/fonts/pretendard.woff2", weight: 400 }] }])
  .manifest({ name: "My App", shortName: "MyApp", startUrl: "/", display: "standalone" })
  .theme("dark")
  .reconnect(false)
  .wsConnect(false)
  .layoutStyle("web")
  .gaTrackingId("G-XXXXXXXXXX")
  .head(
    <>
      <title>My App</title>
      <link rel="icon" href="/favicon.ico" />
    </>,
  )
  .render(({ children }) => children);
```

### Code

```bash
page/(user)/project/[projectId]/_index.tsx uses the legacy route shape (a default function beside named exports). Write `export default page()…` instead — see the "Migrating page/" recipe.
```

### page/(user)/project/[projectId]/tickets.tsx

```ts
import { fetch, Ticket } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID, { desc: "The project to brief." })
  .search("statuses", [String], { desc: "Statuses to include." })
  .prompt("briefProjectTickets", "Brief the ticket board of one project.")
  .render(async ({ projectId, statuses }) => {
    const { ticketInitInProject } = await fetch.initTicketInProject(projectId, statuses ?? []);
    return <Ticket.Zone.Board init={ticketInitInProject} />;
  });
```

### Code

```bash
bun run akan typecheck <app>
bun run akan lint <app>
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

