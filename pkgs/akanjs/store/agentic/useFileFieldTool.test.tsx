import "../../test/registerDom";
import { describe, expect, test } from "bun:test";
import { Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AgenticSurface, AgentProvider } from "use-agentic";
import { store } from "../store";
import { StoreRegistry } from "../storeRegistry";
import { FormFields } from "./formFields";
import { type FileFieldSource, useFileFieldTool } from "./useFileFieldTool";

const FileInput = via((f) => ({ filename: f(String) }));
const FileObj = via(FileInput, () => ({}));
const FileLight = via(FileObj, ["filename"] as const, () => ({}));
const FileFull = via(FileObj, FileLight, () => ({}));
const FileInsight = via(FileFull, (f) => ({ count: f(Int, { default: 0 }) }));
ConstantRegistry.buildModel("fileToolFile", FileInput, FileObj, FileFull, FileLight, FileInsight, {});

const Input = via((f) => ({
  title: f(String),
  image: f(FileLight),
  refImages: f([FileLight]),
  cover: f(FileLight).optional(),
}));
const Obj = via(Input, () => ({}));
const Light = via(Obj, ["title"] as const, () => ({}));
const Full = via(Obj, Light, () => ({}));
const Insight = via(Full, (f) => ({ count: f(Int, { default: 0 }) }));
ConstantRegistry.buildModel("fileToolCut", Input, Obj, Full, Light, Insight, {});

interface Picture {
  id: string;
  filename: string;
}

const written: [string, unknown][] = [];
class FileToolStore extends store("fileTool" as const, () => ({
  fileToolCutForm: {} as { [key: string]: unknown },
})) {
  setImageOnFileToolCut(value: unknown) {
    written.push(["image", value]);
  }
  setRefImagesOnFileToolCut(value: unknown) {
    written.push(["refImages", value]);
  }
  setCoverOnFileToolCut(value: unknown) {
    written.push(["cover", value]);
  }
  // Stand in for the generated array actions, which only exist on a store built from a signal.
  addRefImagesOnFileToolCut(value: unknown) {
    written.push(["addRefImages", value]);
  }
  subRefImagesOnFileToolCut(idxs: unknown) {
    written.push(["subRefImages", idxs]);
  }
}
StoreRegistry.register(FileToolStore);
StoreRegistry.instance.addStore(StoreRegistry.merge("fileToolRoot", FileToolStore));
const instance = StoreRegistry.instance;
const dispatch = instance.do as unknown as { [key: string]: (value: unknown) => void };

const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return () => {
    act(() => root.unmount());
    container.remove();
  };
};

const pictures: Picture[] = [
  { id: "f1", filename: "hero.png" },
  { id: "f2", filename: "logo.png" },
];

const source = (
  held: Picture[],
  options: { disabled?: boolean; max?: number; min?: number } = {},
): FileFieldSource<Picture> => ({
  read: () => held,
  label: (file) => file.filename,
  ...options,
});

/** The snapshot is name-ordered, so every entry is looked up by the name it published under. */
const toolOf = (surface: AgenticSurface, name: string) => surface.snapshot().tools.find((tool) => tool.name === name);

const control = (surface: AgenticSurface, onChange: unknown, src: FileFieldSource<Picture>) => {
  const Control = () => {
    useFileFieldTool(onChange, src);
    return null;
  };
  return (
    <AgentProvider surface={surface}>
      <Control />
    </AgentProvider>
  );
};

describe("useFileFieldTool", () => {
  test("an upload control publishes a listing tool and an id-taking setter", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setImageOnFileToolCut, source(pictures)));

    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual([
      "loadImageOptionsOnFileToolCut",
      "setImageOnFileToolCut",
    ]);
    expect(toolOf(surface, "setImageOnFileToolCut")?.parameters).toEqual({
      type: "object",
      properties: { imageId: { type: "string" } },
      required: ["imageId"],
      additionalProperties: false,
    });
    expect(await surface.call("loadImageOptionsOnFileToolCut")).toEqual([
      { id: "f1", label: "hero.png" },
      { id: "f2", label: "logo.png" },
    ]);

    await surface.call("setImageOnFileToolCut", { imageId: "f2" });
    expect(written).toEqual([["image", { id: "f2", filename: "logo.png" }]]);
    unmount();
    expect(surface.snapshot().tools).toHaveLength(0);
  });

  test("an id no file answers to is refused by name, with what the screen is holding", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setImageOnFileToolCut, source(pictures)));

    await expect(surface.call("setImageOnFileToolCut", { imageId: "f9" })).rejects.toThrow(
      "The fileToolCut form offers no file f9. It offers: f1 (hero.png), f2 (logo.png).",
    );
    expect(written).toEqual([]);
    unmount();
  });

  test("with nothing attached yet the refusal says so instead of listing an empty set", async () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setImageOnFileToolCut, source([])));

    await expect(surface.call("setImageOnFileToolCut", { imageId: "f1" })).rejects.toThrow(
      "No file is offered for image yet — one has to be attached or uploaded first.",
    );
    unmount();
  });

  test("on a list the refusal names the boundary and routes, since the field's own ids are real", async () => {
    const surface = new AgenticSurface();
    instance.set({ fileToolCutForm: { refImages: [{ id: "older" }] } });
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures)));

    // "older" is on the field and on screen; it is not in the tray. Refusing it as no file at all reads as the
    // form being wrong rather than the verb, so the sentence says which set it is outside and what does cover it.
    await expect(surface.call("setRefImagesOnFileToolCut", { refImagesIds: ["older"] })).rejects.toThrow(
      "A file already on refImages may not be offered at all — it can only be removed by position, with subRefImagesOnFileToolCut.",
    );
    unmount();

    // A single field has no such route, so it keeps the shorter sentence.
    const one = new AgenticSurface();
    const off = mount(control(one, dispatch.setImageOnFileToolCut, source(pictures)));
    const refusal = await one
      .call("setImageOnFileToolCut", { imageId: "older" })
      .catch((error: Error) => error.message);
    expect(refusal).toBe("The fileToolCut form offers no file older. It offers: f1 (hero.png), f2 (logo.png).");
    off();
  });

  test("a file list takes ids, and appending leaves what is already there alone", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    instance.set({ fileToolCutForm: { refImages: [{ id: "f1" }] } });
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures)));

    expect(surface.snapshot().tools.map((tool) => tool.name)).toEqual([
      "addRefImagesOnFileToolCut",
      "loadRefImagesOptionsOnFileToolCut",
      "setRefImagesOnFileToolCut",
      "subRefImagesOnFileToolCut",
    ]);
    expect(toolOf(surface, "setRefImagesOnFileToolCut")?.parameters).toEqual({
      type: "object",
      properties: { refImagesIds: { type: "array", items: { type: "string" } } },
      required: ["refImagesIds"],
      additionalProperties: false,
    });

    await surface.call("setRefImagesOnFileToolCut", { refImagesIds: ["f2", "f1"] });
    await surface.call("addRefImagesOnFileToolCut", { refImagesIds: ["f2"] });
    await surface.call("subRefImagesOnFileToolCut", { idxs: [0] });
    expect(written).toEqual([
      [
        "refImages",
        [
          { id: "f2", filename: "logo.png" },
          { id: "f1", filename: "hero.png" },
        ],
      ],
      ["addRefImages", [{ id: "f2", filename: "logo.png" }]],
      ["subRefImages", [0]],
    ]);
    unmount();
  });

  test("a position no file sits at is refused against the list the form is holding", async () => {
    const surface = new AgenticSurface();
    instance.set({ fileToolCutForm: { refImages: [{ id: "f1" }] } });
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures)));

    await expect(surface.call("subRefImagesOnFileToolCut", { idxs: [] })).rejects.toThrow(
      '"idxs" of subRefImagesOnFileToolCut takes at least one position.',
    );
    await expect(surface.call("subRefImagesOnFileToolCut", { idxs: [1] })).rejects.toThrow(
      "refImages holds 1 file, so 1 is out of range.",
    );
    unmount();
  });

  test("a nullable file field can be cleared, so its id is optional", async () => {
    const surface = new AgenticSurface();
    written.length = 0;
    const unmount = mount(control(surface, dispatch.setCoverOnFileToolCut, source(pictures)));

    expect(toolOf(surface, "setCoverOnFileToolCut")?.parameters).toEqual({
      type: "object",
      properties: { coverId: { type: "string" } },
      additionalProperties: false,
    });
    await surface.call("setCoverOnFileToolCut", {});
    expect(written).toEqual([["cover", null]]);
    unmount();
  });

  test("a cap refuses the append that would break it, and says so ahead of the call", async () => {
    const surface = new AgenticSurface();
    instance.set({ fileToolCutForm: { refImages: [{ id: "f1" }, { id: "f2" }] } });
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures, { max: 2 })));

    // In the description too: a limit an agent can only learn by tripping it is the one the listing tool exists
    // to spare it, and the server's own `Err` is a round trip away.
    expect(toolOf(surface, "addRefImagesOnFileToolCut")?.description).toContain("It holds at most 2 files.");
    await expect(surface.call("addRefImagesOnFileToolCut", { refImagesIds: ["f1"] })).rejects.toThrow(
      "refImages holds at most 2 files, and that would make 3. Remove one with subRefImagesOnFileToolCut first.",
    );
    await expect(surface.call("setRefImagesOnFileToolCut", { refImagesIds: ["f1", "f2", "f1"] })).rejects.toThrow(
      "refImages holds at most 2 files, and that would make 3.",
    );
    unmount();
  });

  test("a floor refuses the removal that would break it", async () => {
    const surface = new AgenticSurface();
    instance.set({ fileToolCutForm: { refImages: [{ id: "f1" }] } });
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures, { min: 1 })));

    await expect(surface.call("subRefImagesOnFileToolCut", { idxs: [0] })).rejects.toThrow(
      "refImages holds at least 1 file, and that would leave 0. Replace one with addRefImagesOnFileToolCut instead.",
    );
    unmount();
  });

  test("an uncapped field says nothing about a cap", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setRefImagesOnFileToolCut, source(pictures)));
    expect(toolOf(surface, "addRefImagesOnFileToolCut")?.description).not.toContain("at most");
    unmount();
  });

  test("no candidate list publishes nothing — a shared control forwards an optional tray", () => {
    const surface = new AgenticSurface();
    const Control = () => {
      useFileFieldTool(dispatch.setImageOnFileToolCut, { label: (file: Picture) => file.filename });
      return null;
    };
    const unmount = mount(
      <AgentProvider surface={surface}>
        <Control />
      </AgentProvider>,
    );
    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });

  test("the listing tool is named the same as the relation picker's, so one spelling serves both", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setImageOnFileToolCut, source(pictures)));
    expect(toolOf(surface, FormFields.optionsToolName("fileToolCut", "image"))).toBeDefined();
    unmount();
  });

  test("an inline arrow names nothing, so it publishes nothing", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, (value: unknown) => void written.push(["image", value]), source(pictures)));
    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });

  test("a disabled control publishes nothing — the screen offers the person no lever either", () => {
    const surface = new AgenticSurface();
    const unmount = mount(control(surface, dispatch.setImageOnFileToolCut, source(pictures, { disabled: true })));
    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });

  test("a field the form can describe on its own is left to useFieldTool", () => {
    const surface = new AgenticSurface();
    const Control = () => {
      useFileFieldTool(dispatch.setTitleOnFileToolCut, source(pictures));
      return null;
    };
    const unmount = mount(
      <AgentProvider surface={surface}>
        <Control />
      </AgentProvider>,
    );
    expect(surface.snapshot().tools).toHaveLength(0);
    unmount();
  });
});
