import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { AgentRunner, ToolCallRequest } from "use-agentic";

let lib: typeof import("use-agentic");
let DefaultChat: typeof import("./Chat").DefaultChat;
let Chat: typeof import("./Chat").default;
let Guide: typeof import("./Guide").Guide;
let UiOverrideProvider: typeof import("../UiOverride").UiOverrideProvider;

const runtimeFetch: Record<string, unknown> = {};

const l = Object.assign((key: string) => key, {
  _: (key: string) => key,
  rich: (key: string) => key,
  trans: (translation: Record<string, string>) => translation.en,
});

/**
 * Imported after the environment is set, not before: `./Chat` reaches the `akanjs/store` barrel, whose `baseSt`
 * calls `getEnv()` while the module is still evaluating. Same pattern as Dock.test.ts.
 */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "chattest";
  process.env.AKAN_PUBLIC_REPO_NAME = "chattest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ path: "/", lang: "en", l }), fetch: runtimeFetch });
  const { FetchClient } = await import("akanjs/fetch");
  new FetchClient("http://chattest", {}, {
    task: {
      endpoint: { planWeek: { type: "prompt", args: [], returns: { refName: "Any", arrDepth: 1 } } },
    },
  } as never);
  lib = await import("use-agentic");
  ({ DefaultChat, default: Chat } = await import("./Chat"));
  ({ Guide } = await import("./Guide"));
  ({ UiOverrideProvider } = await import("../UiOverride"));
});

const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, unmount: () => act(() => root.unmount()) };
};

type Turn = { text?: string; toolCall?: ToolCallRequest };
const scripted = (...turns: Turn[]): AgentRunner => {
  let index = 0;
  return {
    async *run() {
      const turn = turns[Math.min(index, turns.length - 1)];
      index += 1;
      if (turn.toolCall) {
        yield { type: "toolCall", ...turn.toolCall };
        yield { type: "done", stop: "toolUse" };
        return;
      }
      if (turn.text) yield { type: "text", delta: turn.text };
      yield { type: "done", stop: "end" };
    },
  };
};

const untilFlushed = async (done: () => boolean) => {
  for (let i = 0; i < 100 && !done(); i += 1) await Promise.resolve();
};

describe("Agent.Chat", () => {
  test("opens from the launcher into the composer", () => {
    const session = new lib.AgentSession(new lib.AgenticSurface(), scripted({ text: "hi" }));
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <DefaultChat />
      </lib.AgentProvider>,
    );
    const launcher = container.querySelector<HTMLButtonElement>('button[aria-label="base.agent"]');
    expect(launcher).toBeTruthy();
    // data-agent-ui is what keeps the chat out of readScreen.
    expect(launcher?.hasAttribute("data-agent-ui")).toBe(true);
    expect(container.innerHTML).not.toContain("base.agentPlaceholder");
    act(() => launcher?.click());
    expect(container.innerHTML).toContain("base.agentPlaceholder");
    expect(container.innerHTML).toContain("base.agentIntro");
    expect(container.querySelector("aside")?.hasAttribute("data-agent-ui")).toBe(true);
    unmount();
  });

  test("renders the transcript the session accumulates", async () => {
    const session = new lib.AgentSession(new lib.AgenticSurface(), scripted({ text: "All done." }));
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <DefaultChat defaultOpen />
      </lib.AgentProvider>,
    );
    await act(async () => {
      await session.send("fill the form");
    });
    expect(container.innerHTML).toContain("fill the form");
    expect(container.innerHTML).toContain("All done.");
    unmount();
  });

  test("gates a confirmed tool behind the approval card and runs it on approve", async () => {
    let ran = 0;
    const surface = new lib.AgenticSurface();
    surface.registerTool([], {
      name: "removeThing",
      confirm: true,
      run: () => {
        ran += 1;
      },
    });
    const session = new lib.AgentSession(
      surface,
      scripted({ toolCall: { id: "c1", name: "removeThing", args: {} } }, { text: "Removed." }),
    );
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <DefaultChat defaultOpen />
      </lib.AgentProvider>,
    );
    let sendDone: Promise<void> = Promise.resolve();
    await act(async () => {
      sendDone = session.send("remove it");
      await untilFlushed(() => !!session.pendingApproval);
    });
    expect(ran).toBe(0);
    expect(container.innerHTML).toContain("Run removeThing?");
    const approve = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("base.approve"));
    expect(approve).toBeTruthy();
    await act(async () => {
      approve?.click();
      await sendDone;
    });
    expect(ran).toBe(1);
    expect(container.innerHTML).toContain("Removed.");
    expect(container.innerHTML).not.toContain("base.approve");
    unmount();
  });

  test("shows one row per tool call, resolved in place instead of repeated as a result", async () => {
    const surface = new lib.AgenticSurface();
    surface.registerTool([], { name: "searchDocs", run: () => [{ href: "/docs/core/routing" }] });
    const session = new lib.AgentSession(
      surface,
      scripted({ toolCall: { id: "c1", name: "searchDocs", args: { query: "routing" } } }, { text: "Found it." }),
    );
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <DefaultChat defaultOpen />
      </lib.AgentProvider>,
    );
    await act(async () => {
      await session.send("find the routing docs");
    });
    // The call and its result are two wire messages — the model needs both — and one row on screen.
    expect(session.messages.filter((message) => message.toolCalls?.length || message.toolResults?.length)).toHaveLength(
      2,
    );
    expect(container.innerHTML.split("searchDocs").length - 1).toBe(1);
    expect(container.innerHTML).toContain("✓");
    // Two calls of one tool differ only by their arguments, so the row carries them.
    expect(container.innerHTML).toContain("routing");
    expect(container.innerHTML).toContain("Found it.");
    unmount();
  });

  test("a mounted Guide layers its text into the turn's instructions", async () => {
    const requests: { instructions?: string }[] = [];
    const runner: AgentRunner = {
      async *run(request) {
        requests.push({ instructions: request.instructions });
        yield { type: "text", delta: "ok" };
        yield { type: "done", stop: "end" };
      },
    };
    const session = new lib.AgentSession(new lib.AgenticSurface(), runner, { instructions: "App framing." });
    const { unmount } = mount(
      <lib.AgentProvider session={session}>
        <Guide instructions="This subtree edits the weekly plan." />
        <DefaultChat defaultOpen />
      </lib.AgentProvider>,
    );
    await act(async () => {
      await session.send("hi");
    });
    expect(requests[0].instructions).toBe("App framing.\n\nThis subtree edits the weekly plan.");
    unmount();
  });

  test("a slash command lists prompts and injects the prompt's messages as the user's turn", async () => {
    runtimeFetch.planWeek = () =>
      Promise.resolve([{ role: "user", content: { type: "text", text: "Plan the week from the board." } }]);
    const session = new lib.AgentSession(new lib.AgenticSurface(), scripted({ text: "Planned." }));
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <DefaultChat defaultOpen />
      </lib.AgentProvider>,
    );
    const input = container.querySelector("input");
    // happy-dom dispatch never reaches React's synthetic onChange, so type through the React props directly.
    const propsKey = Object.keys(input ?? {}).find((key) => key.startsWith("__reactProps$")) ?? "";
    const props = (input as unknown as Record<string, { onChange: (event: unknown) => void }>)[propsKey];
    act(() => props.onChange({ target: { value: "/" } }));
    const entry = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("/planWeek"));
    expect(entry).toBeTruthy();
    await act(async () => {
      entry?.click();
      await untilFlushed(() => session.messages.length >= 2 && !session.isRunning);
    });
    expect(container.innerHTML).toContain("Plan the week from the board.");
    expect(container.innerHTML).toContain("Planned.");
    unmount();
  });

  test("resolves an _overrides AgentChat slot in place of the default", () => {
    const Branded = ({ title }: { title?: string }) => <div data-skin="brand">{title ?? "branded"}</div>;
    const session = new lib.AgentSession(new lib.AgenticSurface(), scripted({ text: "hi" }));
    const { container, unmount } = mount(
      <lib.AgentProvider session={session}>
        <UiOverrideProvider value={{ AgentChat: Branded }}>
          <Chat title="HELLO" />
        </UiOverrideProvider>
      </lib.AgentProvider>,
    );
    expect(container.innerHTML).toContain('data-skin="brand"');
    expect(container.innerHTML).toContain("HELLO");
    expect(container.querySelector('button[aria-label="base.agent"]')).toBeNull();
    unmount();
  });
});
