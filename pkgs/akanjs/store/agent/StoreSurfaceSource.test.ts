import { beforeAll, describe, expect, test } from "bun:test";
import { Int, SLICE_META } from "akanjs/base";
import { Translator } from "akanjs/client/translator";
import { ConstantRegistry, via } from "akanjs/constant";
import type { ClientSignal } from "akanjs/fetch";
import type { SerializedSignal } from "akanjs/signal";
import { AgenticSurface } from "use-agentic";
import { store } from "../store";
import { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { AgentBridge } from "./AgentBridge";
import { StoreSurfaceSource } from "./StoreSurfaceSource";

const NoteInput = via((f) => ({ title: f(String) }));
const NoteObject = via(NoteInput, () => ({}));
const NoteLight = via(NoteObject, ["title"] as const, () => ({}));
const NoteFull = via(NoteObject, NoteLight, () => ({}));
const NoteInsight = via(NoteFull, (f) => ({ count: f(Int, { default: 0 }) }));
const noteConstant = ConstantRegistry.buildModel(
  "surfaceNote",
  NoteInput,
  NoteObject,
  NoteFull,
  NoteLight,
  NoteInsight,
  {
    NoteInput,
    NoteObject,
    NoteFull,
    NoteLight,
    NoteInsight,
  },
);

const serializedSignal: SerializedSignal = {
  prefix: "surfaceNote",
  getGuards: ["SignedIn"],
  cruGuards: ["SignedIn"],
  endpoint: {},
  slice: { "": { args: [] } },
};

const makeSignal = () => {
  const handlers: Record<string, unknown> = {};
  const fetch = new Proxy(handlers, { get: (target, key: string) => (target[key] ??= async () => null) });
  return {
    refName: "surfaceNote",
    _slice: { [SLICE_META]: {} },
    cnst: noteConstant,
    fetch,
    serializedSignal,
    slices: [],
  } as unknown as ClientSignal<"surfaceNote">;
};

let source: StoreSurfaceSource;
let instance: StoreInstance;
const entryOf = (name: string) => source.tools().find((tool) => tool.name === name);

beforeAll(() => {
  process.env.AKAN_PUBLIC_APP_NAME = "surfacetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "surfacetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  Translator.setActiveLocale("en");
  class SurfaceNoteStore extends store(makeSignal(), () => ({})) {}
  StoreRegistry.register(SurfaceNoteStore);
  instance = new StoreInstance(StoreRegistry.merge("surfaceRoot", SurfaceNoteStore));
  source = new StoreSurfaceSource(new AgentBridge(instance, { surfaceNote: serializedSignal }));
  // What a mounted component's subscription does: without a live key the store publishes nothing.
  instance.retainLive("surfaceNoteForm");
});

describe("StoreSurfaceSource", () => {
  test("maps every bridge tool with its schema and effect", () => {
    const create = entryOf("createSurfaceNote");
    expect(create?.effect).toBe("mutation");
    expect(create?.parameters).toMatchObject({ type: "object" });
    expect(entryOf("setTitleOnSurfaceNote")?.effect).toBe("state");
  });

  test("remove* keys default to a confirm gate; nothing else does", () => {
    expect(entryOf("removeSurfaceNote")?.confirm).toBe(true);
    expect(entryOf("createSurfaceNote")?.confirm).toBeUndefined();
  });

  test("calls dispatch through the bridge, argument checking included", async () => {
    const surface = new AgenticSurface();
    surface.addSource(source);
    await surface.call("setTitleOnSurfaceNote", { title: "hello" });
    expect((instance.get().surfaceNoteForm as { title: string }).title).toBe("hello");
    await expect(surface.call("setTitleOnSurfaceNote", { title: 5 })).rejects.toThrow("must be a string");
  });

  test("readState pulls one masked state key on demand", async () => {
    const surface = new AgenticSurface();
    surface.addSource(source);
    await surface.call("setTitleOnSurfaceNote", { title: "pulled" });
    const value = (await surface.call("readState", { key: "surfaceNoteForm" })) as { title: string };
    expect(value.title).toBe("pulled");
    await expect(surface.call("readState", { key: "nope" })).rejects.toThrow("Unknown state key: nope");
  });

  test("navigate drives the client router and refuses anything but an internal path", async () => {
    const { router } = await import("akanjs/client");
    router.init({ side: "server", routeManifest: [] } as never);
    const surface = new AgenticSurface();
    surface.addSource(source);
    const navigate = entryOf("navigate");
    expect(navigate?.guard?.({ path: "https://evil.example" })).toContain("internal path");
    expect(navigate?.guard?.({ path: "//evil.example" })).toContain("internal path");
    expect(navigate?.guard?.({ path: "/docs/intro" })).toBe(true);
    await expect(surface.call("navigate", { path: "https://evil.example" })).rejects.toThrow("internal path");
    expect(await surface.call("navigate", { path: "/docs/intro" })).toBe("Navigating to /docs/intro.");
  });

  test("a page's own hook registration shadows the store entry of the same name", async () => {
    const surface = new AgenticSurface();
    surface.addSource(source);
    let shadowed = 0;
    surface.registerTool([], {
      name: "setTitleOnSurfaceNote",
      run: () => {
        shadowed += 1;
      },
    });
    await surface.call("setTitleOnSurfaceNote", {});
    expect(shadowed).toBe(1);
  });

  test("readScreen is published and answers honestly with no document", async () => {
    const surface = new AgenticSurface();
    surface.addSource(source);
    const readScreen = entryOf("readScreen");
    expect(readScreen?.effect).toBe("query");
    expect(readScreen?.parameters).toEqual({ type: "object", properties: {}, additionalProperties: false });
    expect(await surface.call("readScreen", {})).toBe("No rendered document is available.");
  });

  test("the tool list follows the live screen between calls", () => {
    expect(entryOf("createSurfaceNote")).toBeTruthy();
    instance.releaseLive("surfaceNoteForm");
    expect(entryOf("createSurfaceNote")).toBeUndefined();
    expect(entryOf("navigate")).toBeTruthy();
    expect(entryOf("readScreen")).toBeTruthy();
    instance.retainLive("surfaceNoteForm");
    expect(entryOf("createSurfaceNote")).toBeTruthy();
  });
});

describe("StoreSurfaceSource zone views", () => {
  test("a zone view publishes only the stores its own subtree subscribes, built-ins included", () => {
    instance.releaseLive("surfaceNoteForm");
    instance.retainLive("surfaceNoteForm", "notes");
    const zone = source.tools(["notes"]).map((tool) => tool.name);
    expect(zone).toContain("setTitleOnSurfaceNote");
    expect(zone).toContain("readScreen");
    const other = source.tools(["other"]).map((tool) => tool.name);
    expect(other).not.toContain("setTitleOnSurfaceNote");
    expect(other).toContain("navigate");
    const root = source.tools().map((tool) => tool.name);
    expect(root).toContain("setTitleOnSurfaceNote");
    instance.releaseLive("surfaceNoteForm", "notes");
    instance.retainLive("surfaceNoteForm");
  });

  test("readState is gated by the view's own liveness", async () => {
    instance.releaseLive("surfaceNoteForm");
    instance.retainLive("surfaceNoteForm", "notes");
    const surface = new AgenticSurface();
    surface.addSource(source);
    const read = surface.view(["other"]).call("readState", { key: "surfaceNoteForm" });
    await expect(read).rejects.toThrow("not part of the current screen's surface");
    const value = (await surface.view(["notes"]).call("readState", { key: "surfaceNoteForm" })) as { title: string };
    expect(value.title).toBeDefined();
    instance.releaseLive("surfaceNoteForm", "notes");
    instance.retainLive("surfaceNoteForm");
  });
});
