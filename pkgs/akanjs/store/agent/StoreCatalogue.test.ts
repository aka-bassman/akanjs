import { beforeAll, describe, expect, test } from "bun:test";
import { enumOf, Int, SLICE_META } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import type { ClientSignal } from "akanjs/fetch";
import type { SerializedSignal } from "akanjs/signal";
import { store } from "../store";
import { StoreInstance } from "../storeInstance";
import { StoreRegistry } from "../storeRegistry";
import { StoreCatalogue } from "./StoreCatalogue";

class CatalogueStatus extends enumOf("catalogueStatus", ["todo", "done"] as const) {}

const AttachmentInput = via((f) => ({ url: f(String) }));
const AttachmentObject = via(AttachmentInput, () => ({}));
const AttachmentLight = via(AttachmentObject, ["url"] as const, () => ({}));
const AttachmentFull = via(AttachmentObject, AttachmentLight, () => ({}));
const AttachmentInsight = via(AttachmentFull, () => ({}));
ConstantRegistry.buildModel(
  "catalogueAttachment",
  AttachmentInput,
  AttachmentObject,
  AttachmentFull,
  AttachmentLight,
  AttachmentInsight,
  { AttachmentInput, AttachmentObject, AttachmentFull, AttachmentLight, AttachmentInsight },
);

const TaskInput = via((f) => ({
  title: f(String, { example: "Ship it" }),
  count: f(Int, { default: 0 }),
  tags: f([String]),
  status: f(CatalogueStatus, { default: "todo" }),
  attachment: f(AttachmentFull).optional(),
  labels: f(Map, { of: String, default: () => new Map<string, string>() }).optional(),
  secretMemo: f.secret(String).optional(),
  hiddenFlag: f.hidden(Boolean, { default: false }),
}));
const TaskObject = via(TaskInput, () => ({}));
const TaskLight = via(TaskObject, ["title"] as const, () => ({}));
const TaskFull = via(TaskObject, TaskLight, () => ({}));
const TaskInsight = via(TaskFull, (f) => ({ count: f(Int, { default: 0 }) }));
const taskConstant = ConstantRegistry.buildModel(
  "catalogueTask",
  TaskInput,
  TaskObject,
  TaskFull,
  TaskLight,
  TaskInsight,
  { TaskInput, TaskObject, TaskFull, TaskLight, TaskInsight },
);

const serializedSignal: SerializedSignal = {
  prefix: "catalogueTask",
  getGuards: ["SignedIn"],
  cruGuards: ["SignedIn"],
  endpoint: {
    startCatalogueTask: {
      type: "mutation",
      args: [{ type: "param", name: "taskId", refName: "ID" }],
      returns: { refName: "catalogueTask", modelType: "full" },
      guards: ["SignedIn"],
    },
  },
  slice: {
    "": { args: [] },
    byStatus: { args: [{ type: "param", name: "status", refName: "String", enum: "catalogueStatus" }] },
  },
};

const makeSignal = () => {
  const handlers: Record<string, unknown> = {};
  const fetch = new Proxy(handlers, {
    get: (target, key: string) => (target[key] ??= async () => null),
  });
  return {
    refName: "catalogueTask",
    _slice: { [SLICE_META]: {} },
    cnst: taskConstant,
    fetch,
    serializedSignal,
    slices: [],
  } as unknown as ClientSignal<"catalogueTask">;
};

let catalogue: StoreCatalogue;
let reasonOf: (key: string) => string | undefined;

beforeAll(() => {
  process.env.AKAN_PUBLIC_APP_NAME = "cataloguetest";
  process.env.AKAN_PUBLIC_REPO_NAME = "cataloguetest";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "localhost";
  process.env.AKAN_PUBLIC_ENV = "testing";

  class TaskStore extends store(
    makeSignal(),
    () => ({ draft: "", openTaskIds: [] as string[] }),
    ({ computed }) => ({ draftLabel: computed(["draft"], (draft: string) => `draft:${draft}`) }),
  ) {
    // Named after the endpoint it calls, which is the house rule and what lets it inherit the schema.
    async startCatalogueTask(taskId: string) {
      await Promise.resolve(taskId);
    }
    // Data comes from the form the agent has already filled, so it declares nothing.
    async submitDraft() {
      await Promise.resolve();
    }
    // Neither an endpoint nor a field describes this, and it insists on an argument.
    pickCoordinates(x: number, y: number) {
      this.set({ draft: `${x},${y}` });
    }
  }
  StoreRegistry.register(TaskStore);
  const instance = new StoreInstance(StoreRegistry.merge("catalogueRoot", TaskStore));
  catalogue = new StoreCatalogue(instance, { catalogueTask: serializedSignal });
  reasonOf = (key: string) => catalogue.refusals.find((refusal) => refusal.key === key)?.reason;
});

describe("StoreCatalogue actions", () => {
  test("borrows the endpoint's arguments for every action named after one", () => {
    expect(catalogue.store.action.createCatalogueTask).toEqual({
      args: [{ type: "body", name: "data", refName: "catalogueTask", modelType: "input" }],
      effect: "mutation",
      refName: "catalogueTask",
      endpoint: "createCatalogueTask",
    });
    // A custom action gets the same treatment purely by being named after its endpoint.
    expect(catalogue.store.action.startCatalogueTask).toEqual({
      args: [{ type: "param", name: "taskId", refName: "ID" }],
      effect: "mutation",
      refName: "catalogueTask",
      endpoint: "startCatalogueTask",
    });
  });

  test("describes a form setter from the field it writes", () => {
    expect(catalogue.store.action.setTitleOnCatalogueTask).toEqual({
      args: [{ type: "body", name: "title", refName: "String", example: "Ship it" }],
      effect: "state",
      refName: "catalogueTask",
      field: "title",
      role: "set",
    });
    expect(catalogue.store.action.setStatusOnCatalogueTask?.args).toEqual([
      { type: "body", name: "status", refName: "String", enum: "catalogueStatus" },
    ]);
  });

  test("takes one element on the array add/sub setters, and an index on sub", () => {
    expect(catalogue.store.action.setTagsOnCatalogueTask?.args).toEqual([
      { type: "body", name: "tags", refName: "String", arrDepth: 1 },
    ]);
    expect(catalogue.store.action.addTagsOnCatalogueTask?.args).toEqual([
      { type: "body", name: "tags", refName: "String" },
    ]);
    expect(catalogue.store.action.subTagsOnCatalogueTask?.args).toEqual([
      { type: "param", name: "idx", refName: "Int" },
    ]);
    expect(catalogue.store.action.addOrSubTagsOnCatalogueTask?.role).toBe("addOrSub");
  });

  test("never publishes a setter for a hidden or secret field", () => {
    // The same boundary `resolveReturn` and `Msg.mask` hold, facing the other way: publishing the setter would
    // name the field and invite a write to it in one entry.
    expect(catalogue.store.action.setSecretMemoOnCatalogueTask).toBeUndefined();
    expect(catalogue.store.action.setHiddenFlagOnCatalogueTask).toBeUndefined();
    expect(reasonOf("setSecretMemoOnCatalogueTask")).toContain("secret field");
    expect(reasonOf("setHiddenFlagOnCatalogueTask")).toContain("hidden field");
  });

  test("refuses the shapes it cannot describe, naming each one", () => {
    expect(catalogue.store.action.setLabelsOnCatalogueTask).toBeUndefined();
    expect(reasonOf("setLabelsOnCatalogueTask")).toContain("Map");
    expect(catalogue.store.action.setAttachmentOnCatalogueTask).toBeUndefined();
    expect(reasonOf("setAttachmentOnCatalogueTask")).toContain("catalogueAttachment");
    expect(catalogue.store.action.selectCatalogueTask).toBeUndefined();
    expect(reasonOf("selectCatalogueTask")).toContain("list item itself");
  });

  test("publishes a no-argument custom action and refuses one that takes arguments it cannot describe", () => {
    // The owning module travels with it even though the name gives no hint of one: that is where its words are.
    expect(catalogue.store.action.submitDraft).toEqual({ args: [], effect: "state", refName: "catalogueTask" });
    expect(catalogue.store.action.pickCoordinates).toBeUndefined();
    expect(reasonOf("pickCoordinates")).toContain("2 arguments");
  });

  test("gives each generated slice action the role's arguments, and a named slice its own", () => {
    expect(catalogue.store.action.setPageOfCatalogueTask).toEqual({
      args: [{ type: "param", name: "page", refName: "Int" }],
      effect: "query",
      refName: "catalogueTask",
      role: "setPageOfModel",
    });
    expect(catalogue.store.action.initCatalogueTaskByStatus).toEqual({
      args: [{ type: "param", name: "status", refName: "String", enum: "catalogueStatus" }],
      effect: "query",
      refName: "catalogueTask",
      role: "initModel",
    });
    // The unnamed root slice takes no arguments, so the two must not be confused for one another.
    expect(catalogue.store.action.initCatalogueTask?.args).toEqual([]);
  });

  test("keys are sorted, so the catalogue text is the same on the next boot", () => {
    const keys = Object.keys(catalogue.store.action);
    expect(keys).toEqual([...keys].sort());
    expect(Object.keys(catalogue.store.state)).toEqual([...Object.keys(catalogue.store.state)].sort());
  });
});

describe("StoreCatalogue state", () => {
  test("reads the type off the live value and marks what cannot be written", () => {
    expect(catalogue.store.state.draft).toEqual({ type: "string", derived: false });
    expect(catalogue.store.state.draftLabel).toEqual({ type: "string", derived: true });
    expect(catalogue.store.state.openTaskIds?.type).toBe("list");
  });

  test("attributes a slice's own keys to its model and role", () => {
    expect(catalogue.store.state.pageOfCatalogueTaskByStatus).toEqual({
      type: "number",
      refName: "catalogueTask",
      role: "pageOfModel",
      derived: false,
    });
    expect(catalogue.store.state.catalogueTaskListByStatus?.role).toBe("modelList");
  });

  test("names the model from the declaration even when the value cannot", () => {
    // `STATE_META` holds initial values, not types, so a key that starts null says nothing about its shape — but
    // which model it belongs to is declared, and that is what a read of it has to be masked by.
    expect(catalogue.store.state.catalogueTask).toEqual({
      type: "unknown",
      refName: "catalogueTask",
      modelType: "full",
      derived: false,
    });
    // The form is the case that matters: `immerify` copies it into a plain object, so the value has no class left.
    expect(catalogue.store.state.catalogueTaskForm).toEqual({
      type: "object",
      refName: "catalogueTask",
      modelType: "input",
      derived: false,
    });
  });
});

describe("StoreCatalogue exposure declarations", () => {
  test("agent: false hides the whole store behind one refusal line", () => {
    class HiddenStore extends store("catalogueHidden" as const, () => ({ hiddenDraft: "", hiddenTally: 0 })) {
      static override agent = false as const;
      wipeEverything() {
        this.set({ hiddenDraft: "" });
      }
    }
    StoreRegistry.register(HiddenStore);
    const scoped = new StoreInstance(StoreRegistry.merge("catalogueHiddenRoot", HiddenStore));
    const hiddenCatalogue = new StoreCatalogue(scoped, {});
    expect(hiddenCatalogue.store.state.hiddenDraft).toBeUndefined();
    expect(hiddenCatalogue.store.action.wipeEverything).toBeUndefined();
    expect(hiddenCatalogue.refusals.find((refusal) => refusal.key === "catalogueHidden")?.reason).toContain(
      "agent: false",
    );
  });

  test("exclude withholds the named keys and actions while the rest stay derived", () => {
    class TrimmedStore extends store("catalogueTrimmed" as const, () => ({ keepDraft: "", cutDraft: "" })) {
      static override agent = { exclude: ["cutDraft", "cutSweep"] };
      keepSweep() {
        this.set({ keepDraft: "" });
      }
      cutSweep() {
        this.set({ cutDraft: "" });
      }
    }
    StoreRegistry.register(TrimmedStore);
    const scoped = new StoreInstance(StoreRegistry.merge("catalogueTrimmedRoot", TrimmedStore));
    const trimmedCatalogue = new StoreCatalogue(scoped, {});
    expect(trimmedCatalogue.store.state.keepDraft).toBeTruthy();
    expect(trimmedCatalogue.store.state.cutDraft).toBeUndefined();
    expect(trimmedCatalogue.store.action.keepSweep).toBeTruthy();
    expect(trimmedCatalogue.store.action.cutSweep).toBeUndefined();
    expect(trimmedCatalogue.refusals.find((refusal) => refusal.key === "cutSweep")?.reason).toContain("agent");
  });

  test("a generated set<Key> convenience is skipped without a refusal row", () => {
    expect(catalogue.store.action.setDraft).toBeUndefined();
    expect(catalogue.refusals.find((refusal) => refusal.key === "setDraft")).toBeUndefined();
  });
});
