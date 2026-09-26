import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { Int } from "akanjs/base";
import { Translator } from "akanjs/client/translator";
import { ConstantRegistry, via } from "akanjs/constant";
import type { SerializedSignal } from "akanjs/signal";
import { AgenticSurface } from "use-agentic";
import { mount } from "../mount.fixture";
import { store } from "../store";
import { setTestEnv, stubSignal } from "../store.fixture";
import { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { AgentBridge } from "./AgentBridge";
import { AgentContext } from "./AgentContext";
import { StoreSurfaceSource } from "./StoreSurfaceSource";

const NoteInput = via((f) => ({ title: f(String) }));
const NoteObject = via(NoteInput, () => ({}));
const NoteLight = via(NoteObject, ["title"] as const, () => ({}));
const NoteFull = via(NoteObject, NoteLight, () => ({}));
const NoteInsight = via(NoteFull, (f) => ({ count: f(Int, { default: 0 }) }));
const noteConstant = ConstantRegistry.buildModel("ctxNote", NoteInput, NoteObject, NoteFull, NoteLight, NoteInsight, {
  NoteInput,
  NoteObject,
  NoteFull,
  NoteLight,
  NoteInsight,
});

const serializedSignal: SerializedSignal = {
  prefix: "ctxNote",
  getGuards: ["SignedIn"],
  cruGuards: ["SignedIn"],
  endpoint: {},
  slice: { "": { args: [] } },
};

let instance: StoreInstance;
let context: AgentContext;
let surface: AgenticSurface;

beforeAll(async () => {
  setTestEnv("ctxtest");
  Translator.setActiveLocale("en");
  // Imported after the env is seeded — `baseSt` reads it at module evaluation.
  const { BaseStore } = await import("../baseSt");
  class CtxNoteStore extends store(stubSignal("ctxNote", noteConstant, serializedSignal), () => ({ mode: "draft" })) {}
  StoreRegistry.register(CtxNoteStore);
  instance = new StoreInstance(StoreRegistry.merge("ctxRoot", BaseStore, CtxNoteStore));
  const bridge = new AgentBridge(instance);
  context = new AgentContext(instance, bridge);
  surface = new AgenticSurface();
  surface.addSource(new StoreSurfaceSource(bridge));
});

describe("AgentContext", () => {
  test("carries the route, live keys except those subscribed with agent: false, and inline primitives only", async () => {
    const Reader = () => {
      instance.use.ctxNoteForm?.();
      instance.use.mode?.();
      instance.use.pathname?.({ agent: false });
      instance.use.theme?.();
      return null;
    };
    const unmount = mount(<Reader />);
    const blocks = context.blocks(surface);

    const route = blocks.find((block) => block.kind === "route");
    expect(route?.path).toBe(window.location.pathname);
    expect(route?.params).toEqual({});

    const live = blocks.find((block) => block.kind === "state")?.live as {
      key: string;
      model?: string;
      value?: unknown;
    }[];
    expect(live.find((entry) => entry.key === "ctxNoteForm")?.model).toBe("ctxNote");
    expect(live.find((entry) => entry.key === "ctxNoteForm")?.value).toBeUndefined();
    expect(live.find((entry) => entry.key === "mode")?.value).toBe("draft");
    expect(live.find((entry) => entry.key === "pathname")).toBeUndefined();
    expect(live.find((entry) => entry.key === "theme")?.value).toBe("system");

    const value = (await surface.call("readState", { key: "ctxNoteForm" })) as { title?: string };
    expect(typeof value).toBe("object");
    unmount();

    expect(context.blocks(surface).find((block) => block.kind === "state")).toBeUndefined();
  });

  test("shows a screen block only when something is on screen", () => {
    expect(context.blocks(surface).find((block) => block.kind === "screen")).toBeUndefined();
    const close = surface.openScope([], { id: "ctxNoteInOrg", kind: "ctxNote" });
    const screen = context.blocks(surface).find((block) => block.kind === "screen");
    expect(screen?.scopes).toEqual([{ path: "ctxNoteInOrg", kind: "ctxNote" }]);
    close();
  });
});
