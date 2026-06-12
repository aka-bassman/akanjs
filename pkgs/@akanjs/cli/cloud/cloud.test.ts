import { afterEach, describe, expect, mock, test } from "bun:test";
import { CommandContainer, getArgMetas, getTargetMetas } from "@akanjs/devkit";
import { createCallRecorder, createFakeExecutor } from "../testHelpers";
import { CloudCommand } from "./cloud.command";
import { CloudRunner } from "./cloud.runner";
import { CloudScript } from "./cloud.script";

afterEach(() => {
  CommandContainer.clear();
  mock.restore();
});

describe("CloudCommand", () => {
  test("selects npm or local registry target instead of accepting raw registry URLs", async () => {
    const command = CommandContainer.get(CloudCommand);
    const recorder = createCallRecorder();
    const workspace = createFakeExecutor("workspace");
    const previousRegistry = process.env.AKAN_NPM_REGISTRY;
    process.env.AKAN_NPM_REGISTRY = "http://127.0.0.1:4873";
    command.cloudScript.deployAkan = async (...args) => recorder.record("deployAkan", ...args);

    try {
      const [metas] = getArgMetas(CloudCommand, "deployAkan");
      const registryMeta = metas.find((meta) => meta.name === "registry");
      expect(registryMeta?.argsOption.enum).toContainEqual({ label: "npm", value: "npm" });
      expect(registryMeta?.argsOption.enum).toContainEqual({ label: "local", value: "local" });
      expect(registryMeta?.argsOption.enum).toHaveLength(2);
      expect(getArgMetas(CloudCommand, "update")[1].find((meta) => meta.name === "registry")?.argsOption.enum).toEqual([
        { label: "npm", value: "npm" },
        { label: "local", value: "local" },
      ]);

      const handler = getTargetMetas(CloudCommand).find((meta) => meta.key === "deployAkan")?.handler;
      await handler?.call(command, true, "npm", workspace);
      await handler?.call(command, false, "local", workspace);
    } finally {
      if (previousRegistry === undefined) delete process.env.AKAN_NPM_REGISTRY;
      else process.env.AKAN_NPM_REGISTRY = previousRegistry;
    }

    expect(recorder.calls).toEqual([
      { name: "deployAkan", args: [workspace, { test: true, registryUrl: undefined }] },
      { name: "deployAkan", args: [workspace, { test: false, registryUrl: "http://127.0.0.1:4873" }] },
    ]);
  });
});

describe("CloudScript", () => {
  test("update delegates to runner then prints global CLI version", async () => {
    const script = CommandContainer.get(CloudScript);
    const recorder = createCallRecorder();
    const workspace = createFakeExecutor("workspace", {}, recorder);
    script.cloudRunner.update = async (...args) => recorder.record("update", ...args);

    await script.update(workspace as never, "dev");

    expect(recorder.names()).toEqual(["workspace.spinning", "update", "spinner.succeed", "workspace.spawn"]);
    expect(recorder.calls.at(-1)?.args).toEqual(["akan", ["--version"], { stdio: "inherit" }]);
  });

  test("verifies dist packages before deploying Akan packages", async () => {
    const script = CommandContainer.get(CloudScript);
    const recorder = createCallRecorder();
    const workspace = createFakeExecutor("workspace", {}, recorder);
    script.cloudRunner.getAkanPkgs = async (...args) => {
      recorder.record("getAkanPkgs", ...args);
      return ["akanjs", "@akanjs/cli"];
    };
    script.packageScript.updateWorskpaceRootPackageJson = async (...args) =>
      recorder.record("updateRootPackageJson", ...args);
    script.applicationScript.test = async (...args) => recorder.record("test", ...args);
    script.packageScript.buildPackage = async (...args) => recorder.record("buildPackage", ...args);
    script.packageScript.verifyAkanPublishPackages = async (...args) =>
      recorder.record("verifyAkanPublishPackages", ...args);
    script.cloudRunner.deployAkan = async (...args) => recorder.record("deployAkan", ...args);

    await script.deployAkan(workspace as never, { test: true, registryUrl: "http://127.0.0.1:4873" });

    expect(recorder.names()).toEqual([
      "getAkanPkgs",
      "updateRootPackageJson",
      "test",
      "test",
      "buildPackage",
      "buildPackage",
      "verifyAkanPublishPackages",
      "deployAkan",
    ]);
    expect(recorder.calls.at(-2)?.args).toEqual([workspace]);
    expect(recorder.calls.at(-1)?.args).toEqual([
      workspace,
      ["akanjs", "@akanjs/cli"],
      { registryUrl: "http://127.0.0.1:4873" },
    ]);
  });
});

describe("CloudRunner", () => {
  test("filters Akan packages from workspace package list", async () => {
    const workspace = {
      getPkgs: async () => ["akanjs", "create-akan-workspace", "@sample/tool"],
    };

    await expect(new CloudRunner().getAkanPkgs(workspace as never)).resolves.toEqual([
      "akanjs",
      "create-akan-workspace",
    ]);
  });

  test("publishes to a custom registry and normalizes internal Akan dependency versions", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ "dist-tags": { rc: "2.1.0-rc.10" } }))) as never;
    const recorder = createCallRecorder();
    const files = new Map<string, unknown>([
      ["pkgs/akanjs/package.json", { name: "akanjs", version: "2.1.0-rc.10" }],
      [
        "pkgs/@akanjs/cli/package.json",
        {
          name: "@akanjs/cli",
          version: "2.1.0-rc.10",
          dependencies: { akanjs: "2.1.0-rc.9" },
        },
      ],
      ["dist/pkgs/akanjs/package.json", { name: "akanjs", version: "2.1.0-rc.10" }],
      [
        "dist/pkgs/@akanjs/cli/package.json",
        {
          name: "@akanjs/cli",
          version: "2.1.0-rc.10",
          dependencies: { akanjs: "2.1.0-rc.9" },
        },
      ],
    ]);
    const workspace = createFakeExecutor(
      "workspace",
      {
        workspaceRoot: "/repo",
        readJson: async (path: string) => files.get(path),
        writeFile: async (path: string, content: string) => files.set(path, JSON.parse(content)),
        writeJson: async (path: string, content: unknown) => files.set(path, content),
      },
      recorder,
    );

    try {
      await new CloudRunner().deployAkan(workspace as never, ["akanjs", "@akanjs/cli"], {
        registryUrl: "http://127.0.0.1:4873/",
        confirmPublish: false,
        tag: "rc",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(files.get("dist/pkgs/@akanjs/cli/package.json")).toMatchObject({
      version: "2.1.0-rc.11",
      dependencies: { akanjs: "2.1.0-rc.11" },
    });
    expect(recorder.calls.filter((call) => call.name === "workspace.spawn").map((call) => call.args)).toEqual([
      [
        "npm",
        [
          "publish",
          "--tag",
          "rc",
          "--registry",
          "http://127.0.0.1:4873",
          "--//127.0.0.1:4873/:_authToken=akan-local-registry",
        ],
        {
          cwd: "/repo/dist/pkgs/akanjs",
          env: expect.objectContaining({
            AKAN_NPM_REGISTRY: "http://127.0.0.1:4873",
            NPM_CONFIG_REGISTRY: "http://127.0.0.1:4873",
          }),
          stdio: "inherit",
        },
      ],
      [
        "npm",
        [
          "publish",
          "--tag",
          "rc",
          "--registry",
          "http://127.0.0.1:4873",
          "--//127.0.0.1:4873/:_authToken=akan-local-registry",
        ],
        {
          cwd: "/repo/dist/pkgs/@akanjs/cli",
          env: expect.objectContaining({
            AKAN_NPM_REGISTRY: "http://127.0.0.1:4873",
            NPM_CONFIG_REGISTRY: "http://127.0.0.1:4873",
          }),
          stdio: "inherit",
        },
      ],
    ]);
  });
});
