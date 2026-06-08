import { afterEach, describe, expect, test } from "bun:test";
import { CommandContainer, ModuleExecutor } from "@akanjs/devkit";
import { cleanupCliTempWorkspace, createCallRecorder, createTempModule } from "../testHelpers";
import { ModuleRunner } from "./module.runner";
import { ModuleScript } from "./module.script";

const tempRoots: string[] = [];

afterEach(async () => {
  CommandContainer.clear();
  await Promise.all(tempRoots.splice(0).map((root) => cleanupCliTempWorkspace(root)));
});

describe("ModuleRunner", () => {
  test("creates full module template files in the target module directory", async () => {
    const { root, module } = await createTempModule("post");
    tempRoots.push(root);
    const runner = new ModuleRunner();

    const files = await runner.createModuleTemplate(module);

    expect(files.abstract.filename).toBe("post.abstract.md");
    expect(files.abstract.content).toContain("Module Abstract");
    expect(files.constant.filename).toBe("post.constant.ts");
    expect(files.dictionary.filename).toBe("post.dictionary.ts");
    expect(files.service.content).toContain("serve");
    expect(files.signal.content).toContain("signal");
    expect(await Bun.file(`${module.cwdPath}/post.constant.ts`).exists()).toBe(true);
    expect(await Bun.file(`${module.cwdPath}/post.abstract.md`).exists()).toBe(true);
    expect(await Bun.file(`${module.cwdPath}/Post.View.tsx`).exists()).toBe(true);
  });

  test("creates service module template files without database files", async () => {
    const { root, app } = await createTempModule("unused");
    tempRoots.push(root);
    const service = ModuleExecutor.from(app, "_localBuild");
    const runner = new ModuleRunner();

    const files = await runner.createService(service);

    expect(files.abstract.filename).toBe("localBuild.abstract.md");
    expect(files.abstract.content).toContain("Service Abstract");
    expect(files.service.filename).toBe("localBuild.service.ts");
    expect(files.service.content).toContain('serve("localBuild" as const');
    expect(files.signal.content).toContain("LocalBuildEndpoint");
    expect(files.store.content).toContain('store("localBuild" as const');
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.service.ts`).exists()).toBe(true);
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.abstract.md`).exists()).toBe(true);
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.signal.ts`).exists()).toBe(true);
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.store.ts`).exists()).toBe(true);
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.dictionary.ts`).exists()).toBe(true);
    expect(await Bun.file(`${app.cwdPath}/lib/_localBuild/localBuild.constant.ts`).exists()).toBe(false);
  });

  test("creates individual component templates through the parent system", async () => {
    const { root, module } = await createTempModule("comment");
    tempRoots.push(root);
    const runner = new ModuleRunner();

    const { component } = await runner.createComponentTemplate(module, "view");

    expect(component.filename).toBe("comment.View.tsx");
    expect(component.content).toContain("export const General");
    expect(await Bun.file(`${module.sys.cwdPath}/lib/comment/Comment.View.tsx`).exists()).toBe(true);
  });
});

describe("ModuleScript", () => {
  test("creates module template, optionally creates crud page, and scans system", async () => {
    const script = CommandContainer.get(ModuleScript);
    const recorder = createCallRecorder();
    const sys = {
      type: "app",
      name: "demo",
      workspace: {},
      scan: async () => recorder.record("scan"),
    };
    script.moduleRunner.createModuleTemplate = async (module) => {
      recorder.record("createModuleTemplate", module.name);
      return {} as never;
    };
    script.pageScript.createCrudPage = async (module, options) =>
      recorder.record("createCrudPage", module.name, options);

    await script.createModuleTemplate(sys as never, "post", { page: true });

    expect(recorder.names()).toEqual(["createModuleTemplate", "createCrudPage", "scan"]);
    expect(recorder.calls[1]?.args[1]).toMatchObject({ basePath: null, single: false });
  });

  test("creates service module and scans system", async () => {
    const script = CommandContainer.get(ModuleScript);
    const recorder = createCallRecorder();
    const sys = {
      type: "app",
      name: "demo",
      workspace: {},
      scan: async () => recorder.record("scan"),
    };
    script.moduleRunner.createService = async (module) => {
      recorder.record("createService", module.name);
      return {} as never;
    };

    await script.createService(sys as never, "localBuild");

    expect(recorder.names()).toEqual(["createService", "scan"]);
    expect(recorder.calls[0]?.args[0]).toBe("_localBuild");
  });
});
