import { beforeAll, describe, expect, test } from "bun:test";
import { enumOf, Int, SLICE_META } from "akanjs/base";
import { Translator } from "akanjs/client/translator";
import { ConstantRegistry, via } from "akanjs/constant";
import type { ClientSignal } from "akanjs/fetch";
import type { SerializedSignal } from "akanjs/signal";
import { store } from "../store";
import { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { AgentBridge } from "./AgentBridge";

class BridgeStatus extends enumOf("bridgeStatus", ["todo", "done"] as const) {}

const NoteInput = via((f) => ({
  title: f(String),
  count: f(Int, { default: 0 }),
  status: f(BridgeStatus, { default: "todo" }),
  dueAt: f(Date).optional(),
  secretMemo: f.secret(String).optional(),
}));
const NoteObject = via(NoteInput, () => ({}));
const NoteLight = via(NoteObject, ["title"] as const, () => ({}));
const NoteFull = via(NoteObject, NoteLight, () => ({}));
const NoteInsight = via(NoteFull, (f) => ({ count: f(Int, { default: 0 }) }));
const noteConstant = ConstantRegistry.buildModel(
  "bridgeNote",
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
    // Registers the enum, the way a module's `cnst` barrel does. Without it nothing knows the allowed values.
    BridgeStatus,
  },
);

const serializedSignal: SerializedSignal = {
  prefix: "bridgeNote",
  getGuards: ["SignedIn"],
  cruGuards: ["SignedIn"],
  endpoint: {
    startBridgeNote: {
      type: "mutation",
      args: [{ type: "param", name: "noteId", refName: "ID" }],
      returns: { refName: "bridgeNote", modelType: "full" },
      guards: ["SignedIn"],
    },
  },
  slice: { "": { args: [] } },
};

const started: string[] = [];

const makeSignal = () => {
  const handlers: Record<string, unknown> = {};
  const fetch = new Proxy(handlers, { get: (target, key: string) => (target[key] ??= async () => null) });
  return {
    refName: "bridgeNote",
    _slice: { [SLICE_META]: {} },
    cnst: noteConstant,
    fetch,
    serializedSignal,
    slices: [],
  } as unknown as ClientSignal<"bridgeNote">;
};

let bridge: AgentBridge;
let instance: StoreInstance;
const toolOf = (name: string) => bridge.tools.find((tool) => tool.name === name);

beforeAll(() => {
  process.env.AKAN_PUBLIC_APP_NAME = "bridgetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "bridgetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";
  Translator.seed("en", {
    bridgeNote: {
      signal: {
        startBridgeNote: {
          t: "Start",
          desc: { t: "Starts the note" },
          arg: { noteId: { t: "Note ID", desc: { t: "Which note to start" } } },
        },
      },
      title: { t: "Title", desc: { t: "The one line a reader scans for" } },
    },
  });
  Translator.setActiveLocale("en");

  class NoteStore extends store(makeSignal(), () => ({ draft: "", tally: { runs: 0 } })) {
    async startBridgeNote(noteId: string) {
      started.push(noteId);
      await Promise.resolve();
    }
    async submitDraft() {
      await Promise.resolve();
    }
  }
  StoreRegistry.register(NoteStore);
  instance = new StoreInstance(StoreRegistry.merge("bridgeRoot", NoteStore));
  bridge = new AgentBridge(instance, { bridgeNote: serializedSignal });
});

describe("AgentBridge catalogue", () => {
  test("publishes one flat named object per action, the shape MCP publishes", () => {
    expect(toolOf("startBridgeNote")?.inputSchema).toEqual({
      type: "object",
      properties: {
        noteId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", description: "Which note to start" },
      },
      required: ["noteId"],
      additionalProperties: false,
    });
    expect(toolOf("startBridgeNote")?.effect).toBe("mutation");
    expect(toolOf("setTitleOnBridgeNote")?.effect).toBe("state");
  });

  test("embeds a model argument's schema in the tool rather than referencing one outside it", () => {
    const schema = toolOf("createBridgeNote")?.inputSchema as { properties: object; $defs?: object };
    expect(schema.properties).toEqual({ data: { $ref: "#/$defs/BridgeNoteInput" } });
    expect(Object.keys(schema.$defs ?? {})).toContain("BridgeNoteInput");
  });

  test("takes the endpoint's words, then the field's", () => {
    expect(toolOf("startBridgeNote")?.description).toBe("Starts the note");
    // A field setter inherits no endpoint words; the field's label is what it is about.
    expect(toolOf("setTitleOnBridgeNote")?.title).toBe("Title");
    expect(toolOf("setTitleOnBridgeNote")?.description).toBe("The one line a reader scans for");
    // An action named after neither has nothing to borrow, and publishes its name alone.
    expect(toolOf("submitDraft")?.description).toBeUndefined();
  });

  test("describes each argument from where the argument came from", () => {
    // The prose exists at the endpoint's arg node and at the field's own node, and publishing a typed argument
    // with no description throws that away.
    const borrowed = toolOf("startBridgeNote")?.inputSchema as { properties: { noteId: { description?: string } } };
    expect(borrowed.properties.noteId.description).toBe("Which note to start");
    const setter = toolOf("setTitleOnBridgeNote")?.inputSchema as { properties: { title: { description?: string } } };
    expect(setter.properties.title.description).toBe("The one line a reader scans for");
    // A slice role's `page` is the framework's own and has no dictionary entry to borrow.
    const paged = toolOf("setPageOfBridgeNote")?.inputSchema as { properties: { page: { description?: string } } };
    expect(paged.properties.page.description).toBeUndefined();
  });
});

describe("AgentBridge call", () => {
  test("maps named arguments onto the action's parameters and dispatches through st.do", async () => {
    await bridge.call("startBridgeNote", { noteId: "note-1" });
    expect(started).toEqual(["note-1"]);
    await bridge.call("setTitleOnBridgeNote", { title: "Ship it" });
    expect((instance.get().bridgeNoteForm as { title: string }).title).toBe("Ship it");
  });

  test("refuses an action that is not published, and a required argument that is missing", async () => {
    // `setSecretMemoOnBridgeNote` exists on the store; it is refused by the catalogue, so it is not callable here.
    await expect(bridge.call("setSecretMemoOnBridgeNote", { secretMemo: "x" })).rejects.toThrow("Unknown action");
    await expect(bridge.call("startBridgeNote", {})).rejects.toThrow('Missing argument "noteId"');
  });

  test("checks each value against what the argument declared", async () => {
    // `st.do` is a rest wrapper that accepts anything, so without this the wrong type is written and rendered.
    await expect(bridge.call("setCountOnBridgeNote", { count: "3" })).rejects.toThrow("whole number");
    await expect(bridge.call("setStatusOnBridgeNote", { status: "archived" })).rejects.toThrow("must be one of");
    await bridge.call("setStatusOnBridgeNote", { status: "done" });
    expect((instance.get().bridgeNoteForm as { status: string }).status).toBe("done");
  });

  test("takes an ISO string for a date, which is all an agent can send", async () => {
    await bridge.call("setDueAtOnBridgeNote", { dueAt: "2026-08-17T00:00:00.000Z" });
    expect((instance.get().bridgeNoteForm as { dueAt: Date }).dueAt).toEqual(new Date("2026-08-17T00:00:00.000Z"));
    await expect(bridge.call("setDueAtOnBridgeNote", { dueAt: "not a date" })).rejects.toThrow("ISO 8601");
  });

  test("keeps a transcript, failures included", () => {
    const failed = bridge.transcript.filter((call) => call.error);
    expect(bridge.transcript.some((call) => call.name === "startBridgeNote" && !call.error)).toBe(true);
    expect(failed.some((call) => call.name === "setCountOnBridgeNote")).toBe(true);
  });
});

describe("AgentBridge read", () => {
  test("strips a secret field the user typed into the form", () => {
    // The form is the case the mask exists for: it holds what the user typed, and an in-page agent ships what it
    // reads to a remote model. `immerify` has already dropped the class, so the model comes from the declaration.
    const form = instance.get().bridgeNoteForm as Record<string, unknown>;
    instance.set({ bridgeNoteForm: { ...form, secretMemo: "hunter2" } });
    const read = bridge.read("bridgeNoteForm") as Record<string, unknown>;
    expect(read.title).toBe("Ship it");
    expect(read).not.toHaveProperty("secretMemo");
  });

  test("passes a primitive through and refuses an object no model claims", () => {
    expect(bridge.read("draft")).toBe("");
    expect(bridge.read("pageOfBridgeNote")).toBe(1);
    expect(() => bridge.read("tally")).toThrow("belongs to no model");
    expect(() => bridge.read("nothingHere")).toThrow("Unknown state key");
  });
});
