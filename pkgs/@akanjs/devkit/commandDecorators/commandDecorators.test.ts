import { afterEach, describe, expect, test } from "bun:test";
import { AppExecutor, WorkspaceExecutor } from "../executors";
import { App, type ArgMeta, type ArgsOption, getArgMetas, Lib, Module, Pkg, Sys, Workspace } from "./argMeta";
import { getArgumentValue, getInternalArgumentValue, getOptionValue } from "./command";
import { command } from "./commandBuilder";
import {
  assertUniqueDependencies,
  CommandContainer,
  getDependencyKey,
  injectDependencies,
  runner,
  script,
} from "./dependencyBuilder";
import { formatCommandHelp, formatHelp } from "./helpFormatter";
import { getTargetMetas } from "./targetMeta";

const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, "g");
const stripAnsi = (value: string) => value.replace(ansiPattern, "");

describe("command helper metadata", () => {
  afterEach(() => {
    CommandContainer.clear();
  });

  test("records targets, args, options, and internal executor tokens", () => {
    class ExampleRunner extends runner("example") {
      run() {
        return "ok";
      }
    }

    class ExampleScript extends script("example", [ExampleRunner]) {
      callRunner() {
        return this.exampleRunner.run();
      }
    }

    class ExampleCommand extends command("example", [ExampleScript], ({ public: publicTarget, dev }) => ({
      createModule: publicTarget({ short: true, desc: "Create a module" })
        .arg("moduleName", String, { desc: "module name", example: "user" })
        .option("count", Number, { desc: "count", default: 1 })
        .option("force", Boolean, { desc: "force", default: false })
        .with(Workspace, App, Lib, Sys, Pkg, Module)
        .exec(function (moduleName, count, force, workspace, app, lib, sys, pkg, module) {
          expect(this.exampleScript.callRunner()).toBe("ok");
          return { moduleName, count, force, workspace, app, lib, sys, pkg, module };
        }),
      devOnlyTask: dev({ devOnly: true, desc: "Hidden task" })
        .arg("targetName", String)
        .exec((targetName) => targetName),
    })) {}

    const targetMetas = getTargetMetas(ExampleCommand);
    expect(targetMetas.map((target) => target.key)).toEqual(["createModule", "devOnlyTask"]);
    expect(targetMetas[0]?.targetOption).toEqual({
      runsOnWorkspaceRoot: true,
      short: true,
      desc: "Create a module",
      type: "public",
    });
    expect(targetMetas[1]?.targetOption).toEqual({
      runsOnWorkspaceRoot: true,
      devOnly: true,
      desc: "Hidden task",
      type: "dev",
    });

    const [allArgMetas, optionMetas, internalArgMetas] = getArgMetas(ExampleCommand, "createModule");
    expect(allArgMetas.map((arg) => [arg.type, arg.idx])).toEqual([
      ["Argument", 0],
      ["Option", 1],
      ["Option", 2],
      ["Workspace", 3],
      ["App", 4],
      ["Lib", 5],
      ["Sys", 6],
      ["Pkg", 7],
      ["Module", 8],
    ]);
    expect(optionMetas.map((arg) => arg.name)).toEqual(["count", "force"]);
    const internalArgTypes = internalArgMetas.map((arg) => arg.type as string);
    expect(internalArgTypes).toEqual(["Argument", "Workspace", "App", "Lib", "Sys", "Pkg", "Module"]);

    const commandInstance = CommandContainer.get(ExampleCommand);
    const result = targetMetas[0]?.handler.call(
      commandInstance,
      "profile",
      2,
      true,
      { name: "workspace" },
      { name: "app" },
      { name: "lib" },
      { name: "sys" },
      { name: "pkg" },
      { name: "module" },
    );
    expect(result).toMatchObject({ moduleName: "profile", count: 2, force: true });
  });

  test("formats global and command help from helper metadata", () => {
    class HelpCommand extends command("help", ({ public: publicTarget, dev }) => ({
      buildApp: publicTarget({ desc: "Build app" })
        .with(App)
        .option("write", Boolean, { desc: "write generated files", default: true })
        .option("mode", String, {
          desc: "build mode",
          enum: [
            { label: "Fast", value: "fast" },
            { label: "Full", value: "full" },
          ],
        })
        .exec(() => undefined),
      generateModule: publicTarget({ desc: "Generate module" })
        .with(Module)
        .arg("modelName", String, { desc: "model name" })
        .exec(() => undefined),
      hiddenTask: dev({ devOnly: true, desc: "Hidden task" }).exec(() => undefined),
    })) {}

    const globalHelp = stripAnsi(formatHelp([HelpCommand], "1.2.3"));
    expect(globalHelp).toContain("Version: 1.2.3");
    expect(globalHelp).toContain("build-app [app]");
    expect(globalHelp).toContain("generate-module [sys:module] [modelName]");
    expect(globalHelp).not.toContain("hidden-task");

    const commandHelp = stripAnsi(formatCommandHelp(HelpCommand, "buildApp"));
    expect(commandHelp).toContain("akan build-app [app]");
    expect(commandHelp).toContain("--write");
    expect(commandHelp).toContain("[default: true]");
    expect(commandHelp).toContain("Fast, Full");
  });

  test("resolves the only app without prompting for selection", async () => {
    const workspace = new WorkspaceExecutor({ workspaceRoot: "/workspace", repoName: "repo" });
    workspace.getExecs = async () => [["single-command-test-app"], [], []];

    const app = await getInternalArgumentValue({ key: "", idx: 0, type: "App" }, undefined, workspace);

    if (!(app instanceof AppExecutor)) throw new Error(`expected an AppExecutor, got ${app.constructor.name}`);
    expect(app.name).toBe("single-command-test-app");
    expect(app.workspace).toBe(workspace);
  });
});

describe("command helper dependency injection", () => {
  afterEach(() => {
    CommandContainer.clear();
  });

  test("creates stable dependency keys and singleton injected instances", () => {
    class StableRunner extends runner("stable") {
      readonly id = Math.random();
    }

    class StableScript extends script("stable", [StableRunner]) {}

    expect(StableRunner.refName).toBe("stable");
    expect(StableRunner.dependencyKind).toBe("runner");
    expect(StableRunner.dependencyKey).toBe("stableRunner");
    expect(StableScript.dependencyKind).toBe("script");
    expect(StableScript.dependencyKey).toBe("stableScript");
    expect(getDependencyKey(StableScript)).toBe("stableScript");

    const first = CommandContainer.get(StableScript);
    const second = CommandContainer.get(StableScript);
    expect(first).toBe(second);
    expect(first.stableRunner).toBe(CommandContainer.get(StableRunner));
    expect(Object.keys(first)).not.toContain("stableRunner");

    expect(() => {
      first.stableRunner = new StableRunner();
    }).toThrow();
  });

  test("rejects duplicate dependencies by class or generated key", () => {
    class OneRunner extends runner("duplicate") {}
    class AnotherRunner extends runner("duplicate") {}

    expect(() => assertUniqueDependencies([OneRunner, OneRunner])).toThrow("Duplicate command dependency class");
    expect(() => assertUniqueDependencies([OneRunner, AnotherRunner])).toThrow(
      'Duplicate command dependency key "duplicateRunner"',
    );
    expect(() => script("broken", [OneRunner, AnotherRunner])).toThrow(
      'Duplicate command dependency key "duplicateRunner"',
    );
  });

  test("injectDependencies detects circular command dependencies", () => {
    class CircularA {
      static readonly refName = "circularA";
      static readonly dependencyKind = "script";
      static readonly dependencyKey = "circularAScript";

      constructor() {
        CommandContainer.get(CircularB);
      }
    }

    class CircularB {
      static readonly refName = "circularB";
      static readonly dependencyKind = "script";
      static readonly dependencyKey = "circularBScript";

      constructor() {
        CommandContainer.get(CircularA);
      }
    }

    expect(() => CommandContainer.get(CircularA)).toThrow("Circular command dependency");
  });

  test("injects explicit dependency lists into arbitrary objects", () => {
    class DirectRunner extends runner("direct") {
      value = "runner";
    }

    const target = {};
    const injected = injectDependencies(target, [DirectRunner]);
    expect(injected.directRunner.value).toBe("runner");

    const descriptor = Object.getOwnPropertyDescriptor(injected, "directRunner");
    expect(descriptor?.enumerable).toBe(false);
    expect(descriptor?.writable).toBe(false);
  });
});

describe("enum arg choices", () => {
  const optionMeta = (enumChoices: ArgsOption["enum"]): ArgMeta => ({
    name: "format",
    argsOption: { type: "string", enum: enumChoices },
    key: "run",
    idx: 0,
    type: "Option",
  });
  const argumentMeta = (enumChoices: ArgsOption["enum"]): ArgMeta => ({
    ...optionMeta(enumChoices),
    name: "action",
    type: "Argument",
  });
  const context = { values: {} };

  test("passes a declared choice through", async () => {
    expect(await getOptionValue(optionMeta(["text", "json"]), { format: "json" }, context)).toBe("json");
  });

  // Before this check `akan quality --format yaml` reached the script as "yaml" while the declaration
  // claimed the parameter was "text" | "json".
  test("rejects an undeclared value in commander's wording", async () => {
    await expect(getOptionValue(optionMeta(["text", "json"]), { format: "yaml" }, context)).rejects.toThrow(
      "option '--format' argument 'yaml' is invalid. Allowed choices are text, json.",
    );
  });

  test("names a positional argument as an argument", async () => {
    await expect(getArgumentValue(argumentMeta(["scan", "ssr"]), "sssr")).rejects.toThrow(
      "argument 'action' argument 'sssr' is invalid. Allowed choices are scan, ssr.",
    );
  });

  test("kebab-cases a camelCase option name the way the flag is spelled", async () => {
    await expect(
      getOptionValue({ ...optionMeta(["apk", "aab"]), name: "assembleType" }, { assembleType: "ipa" }, context),
    ).rejects.toThrow("option '--assemble-type'");
  });

  test("compares a labelled choice by its value, not its label", async () => {
    const labelled = optionMeta([{ label: "JSON output", value: "json" }]);
    expect(await getOptionValue(labelled, { format: "json" }, context)).toBe("json");
    await expect(getOptionValue(labelled, { format: "JSON output" }, context)).rejects.toThrow("is invalid");
  });

  // A DynamicEnum resolves against a context that is not populated yet, and the interactive select is its
  // only consumer, so an explicit value passes through unchecked rather than being rejected wrongly.
  test("leaves a dynamic choice list unchecked", async () => {
    expect(
      await getOptionValue(
        optionMeta(() => ["text"]),
        { format: "anything" },
        context,
      ),
    ).toBe("anything");
  });

  test("an option with no enum is unaffected", async () => {
    expect(await getOptionValue(optionMeta(undefined), { format: "whatever" }, context)).toBe("whatever");
  });
});

describe("enum arg type inference", () => {
  afterEach(() => {
    CommandContainer.clear();
  });

  /**
   * Compile-time only. Nothing here can fail at runtime: if `enum` stops narrowing, the parameter widens
   * to the primitive and these calls stop typechecking, so the regression surfaces in `akan typecheck`
   * rather than in fifteen `as "a" | "b"` casts creeping back into the command files.
   */
  const expectLiteral = <Expected>(_value: Expected) => undefined;

  test("a static enum narrows the exec parameter to its declared choices", () => {
    class InferenceRunner extends runner("inference") {}
    class InferenceScript extends script("inference", [InferenceRunner]) {}

    class InferenceCommand extends command("inference", [InferenceScript], ({ public: target }) => ({
      run: target({ desc: "run" })
        .arg("action", String, { enum: ["scan", "ssr"] })
        .option("format", String, { enum: ["text", "json"], default: "text" })
        .option("count", Number, { enum: [1, 2] })
        .option("scope", String, { enum: ["all", "one"], nullable: true })
        .option("label", String, { enum: [{ label: "JSON output", value: "json" }] })
        .option("plain", String, { desc: "no choices declared" })
        .option("dynamic", String, { enum: () => ["a", "b"] })
        .exec(async (action, format, count, scope, label, plain, dynamic) => {
          expectLiteral<"scan" | "ssr">(action);
          expectLiteral<"text" | "json">(format);
          expectLiteral<1 | 2>(count);
          expectLiteral<"all" | "one" | null>(scope);
          expectLiteral<"json">(label);
          expectLiteral<string>(plain);
          expectLiteral<string>(dynamic);
        }),
    })) {}

    const [targetMeta] = getTargetMetas(InferenceCommand);
    expect(targetMeta?.key).toBe("run");
    expect(targetMeta?.args.map((arg) => ("name" in arg ? arg.name : arg.type))).toEqual([
      "action",
      "format",
      "count",
      "scope",
      "label",
      "plain",
      "dynamic",
    ]);
  });
});
