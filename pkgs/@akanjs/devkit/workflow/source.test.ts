import { describe, expect, test } from "bun:test";
import { inspectDictionaryStructure } from "./source";

describe("inspectDictionaryStructure", () => {
  test("preserves protected dictionary chain order around the model object", () => {
    const structure = inspectDictionaryStructure(
      `
import { modelDictionary } from "akanjs/dictionary";
import type { Article, ArticleSlice } from "./article.constant";

export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Article", "Article"]))
  .model<Article>((t) => ({
    title: t(["Title", "제목"]),
  }))
  .slice<ArticleSlice>((fn) => ({
    inPublic: fn(["Article In Public", "Article 공개"]),
  }))
  .enum<ArticleStatus>("articleStatus", (t) => ({}))
  .error({})
  .translate({});
`,
      "Article",
    );

    expect(structure).toMatchObject({
      parseValid: true,
      modelObjectFound: true,
      chainOrderValid: true,
      fields: ["title"],
    });
    expect(structure.chainMethods).toEqual(["modelDictionary", "of", "model", "slice", "enum", "error", "translate"]);
  });

  test("reports broken dictionary chain order even when the field remains inside model", () => {
    const structure = inspectDictionaryStructure(
      `
import { modelDictionary } from "akanjs/dictionary";
import type { Article, ArticleSlice } from "./article.constant";

export const dictionary = modelDictionary(["en", "ko"])
  .slice<ArticleSlice>((fn) => ({
    inPublic: fn(["Article In Public", "Article 공개"]),
  }))
  .model<Article>((t) => ({
    title: t(["Title", "제목"]),
  }))
  .translate({})
  .error({});
`,
      "Article",
    );

    expect(structure).toMatchObject({
      parseValid: true,
      modelObjectFound: true,
      chainOrderValid: false,
      fields: ["title"],
    });
    expect(structure.chainMethods).toEqual(["modelDictionary", "slice", "model", "translate", "error"]);
  });
});
