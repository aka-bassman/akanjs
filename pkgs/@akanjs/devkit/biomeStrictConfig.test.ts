import { describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { BiomeStrictConfig } from "./biomeStrictConfig";

const workspace = async () => await mkdtemp(path.join(tmpdir(), "akan-biome-strict-"));

describe("BiomeStrictConfig", () => {
  test("writes nothing when the workspace has no biome config", async () => {
    const root = await workspace();
    const strictConfig = new BiomeStrictConfig(root);

    expect(await strictConfig.write()).toBeNull();
    expect(await Bun.file(strictConfig.filePath).exists()).toBe(false);
  });

  test("layers the domains over the workspace config, base first", async () => {
    const root = await workspace();
    await Bun.write(path.join(root, "biome.json"), "{}\n");
    const strictConfig = new BiomeStrictConfig(root, { id: "test" });

    const filePath = await strictConfig.write();

    expect(filePath).toBe(path.join(root, ".biome.strict.test.json"));
    expect(await Bun.file(path.join(root, ".biome.strict.test.json")).json()).toEqual({
      extends: ["@akanjs/devkit/biome.base.json", "./biome.json", "@akanjs/devkit/biome.domains.json"],
    });
  });

  test("prefers biome.json over biome.jsonc, mirroring Biome's own precedence", async () => {
    const root = await workspace();
    await Bun.write(path.join(root, "biome.json"), "{}\n");
    await Bun.write(path.join(root, "biome.jsonc"), "{}\n");
    const strictConfig = new BiomeStrictConfig(root, { id: "test" });

    await strictConfig.write();

    const written = (await Bun.file(strictConfig.filePath).json()) as { extends: string[] };
    expect(written.extends[1]).toBe("./biome.json");
  });

  test("removes the copy, and stays quiet when there is nothing to remove", async () => {
    const root = await workspace();
    await Bun.write(path.join(root, "biome.jsonc"), "{}\n");
    const strictConfig = new BiomeStrictConfig(root, { id: "test" });
    await strictConfig.write();

    await strictConfig.remove();
    await strictConfig.remove();

    expect(await Bun.file(strictConfig.filePath).exists()).toBe(false);
  });
});
