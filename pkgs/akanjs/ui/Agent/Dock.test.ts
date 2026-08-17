import { beforeAll, describe, expect, test } from "bun:test";
import type { ClientSignal } from "akanjs/fetch";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server.browser";

let html: string;

/**
 * Imported after the environment is set, not before: the `akanjs/store` barrel reaches `baseSt`, which calls
 * `getEnv()` while the module is still evaluating. Static imports all run before any test body could set it.
 */
beforeAll(async () => {
  process.env.AKAN_PUBLIC_APP_NAME = "docktest";
  process.env.AKAN_PUBLIC_REPO_NAME = "docktest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";

  const [{ Int, SLICE_META }, { ConstantRegistry, via }, storeFacet, { Dock }] = await Promise.all([
    import("akanjs/base"),
    import("akanjs/constant"),
    import("akanjs/store"),
    import("./Dock"),
  ]);
  const { AgentBridge, store, StoreInstance, StoreRegistry } = storeFacet;

  const DeskInput = via((f) => ({
    label: f(String),
    seats: f(Int, { default: 0 }),
    secretCode: f.secret(String).optional(),
  }));
  const DeskObject = via(DeskInput, () => ({}));
  const DeskLight = via(DeskObject, ["label"] as const, () => ({}));
  const DeskFull = via(DeskObject, DeskLight, () => ({}));
  const DeskInsight = via(DeskFull, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("dockDesk", DeskInput, DeskObject, DeskFull, DeskLight, DeskInsight, {
    DeskInput,
    DeskObject,
    DeskFull,
    DeskLight,
    DeskInsight,
  });

  const serializedSignal = {
    prefix: "dockDesk",
    getGuards: ["SignedIn"],
    cruGuards: ["SignedIn"],
    endpoint: {},
    slice: { "": { args: [] } },
  };
  const handlers: Record<string, unknown> = {};
  const signal = {
    refName: "dockDesk",
    _slice: { [SLICE_META]: {} },
    cnst,
    fetch: new Proxy(handlers, { get: (target, key: string) => (target[key] ??= async () => null) }),
    serializedSignal,
    slices: [],
  } as unknown as ClientSignal<"dockDesk">;

  class DeskStore extends store(signal, () => ({ deskDraft: "" })) {}
  StoreRegistry.register(DeskStore);
  const instance = new StoreInstance(StoreRegistry.merge("dockRoot", DeskStore));
  const bridge = new AgentBridge(instance, { dockDesk: serializedSignal as never });
  html = await new Response(await renderToReadableStream(createElement(Dock, { bridge, open: true }))).text();
});

describe("Agent.Dock", () => {
  test("renders the catalogue a page actually publishes", () => {
    expect(html).toContain("setLabelOnDockDesk");
    expect(html).toContain("createDockDesk");
    expect(html).toContain("mutation");
  });

  test("shows every refusal with its reason, which is the point of having them", () => {
    expect(html).toContain("setSecretCodeOnDockDesk");
    expect(html).toContain("secret field");
  });

  test("never offers a refused action as callable", () => {
    // The refusals section names it; the action list must not, or the dock invites the call it just refused.
    const actions = html.slice(0, html.indexOf("Refused"));
    expect(actions).toContain("setLabelOnDockDesk");
    expect(actions).not.toContain("setSecretCodeOnDockDesk");
  });
});
