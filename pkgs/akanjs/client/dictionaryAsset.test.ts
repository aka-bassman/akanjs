import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DictionaryAsset } from "./dictionaryAsset";
import { Translator } from "./translator";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "akan-dictionary-asset-"));
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

let moduleSeq = 0;
const writeModule = (lang: string, title: string) => {
  const file = path.join(root, `${lang}-${++moduleSeq}.js`);
  fs.writeFileSync(
    file,
    `globalThis.__dictEvaluations = (globalThis.__dictEvaluations ?? 0) + 1;
export const lang = ${JSON.stringify(lang)};
export default JSON.parse(${JSON.stringify(JSON.stringify({ app: { title: { t: title } } }))});`,
  );
  return file;
};
const evaluations = () => (globalThis as { __dictEvaluations?: number }).__dictEvaluations ?? 0;

describe("DictionaryAsset", () => {
  test("puts the module's locale into the Translator, importing a URL once", async () => {
    const url = writeModule("ko", "제목");
    const before = evaluations();

    await Promise.all([DictionaryAsset.load(url), DictionaryAsset.load(url)]);
    await DictionaryAsset.load(url);

    expect(evaluations() - before).toBe(1);
    expect(Translator.translateByLocale("ko", "app.title")).toBe("제목");
  });

  test("replaces a locale with a newer build's module", async () => {
    await DictionaryAsset.load(writeModule("ko", "옛 제목"));
    await DictionaryAsset.load(writeModule("ko", "새 제목"));

    expect(Translator.translateByLocale("ko", "app.title")).toBe("새 제목");
  });

  test("resolves at once for a page without a dictionary", async () => {
    await expect(DictionaryAsset.load(undefined)).resolves.toBeUndefined();
    await expect(DictionaryAsset.load(null)).resolves.toBeUndefined();
  });

  test("forgets a failed import, so a later load of the same URL tries again", async () => {
    const url = path.join(root, "ja-late.js");

    await expect(DictionaryAsset.load(url)).rejects.toThrow();
    fs.writeFileSync(url, `export const lang = "ja"; export default { app: { title: { t: "タイトル" } } };`);
    await DictionaryAsset.load(url);

    expect(Translator.translateByLocale("ja", "app.title")).toBe("タイトル");
  });
});
