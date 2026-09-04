import { describe, expect, it } from "bun:test";
import type { Transformer } from "@lexical/markdown";
import {
  type EditorFeature,
  type EditorNodeLike,
  featuresOf,
  isPlainOnly,
  lossesOf,
  syntaxOf,
  transformersOf,
} from "./feature";

// The real table lives in `markdown.ts`, which reaches MermaidNode → `@libs/util/ui` → the util store
// and cannot be imported here. These fixtures stand in for it; what is under test is the derivation.
const transformerOf = (name: string) => ({ type: "element", regExp: new RegExp(name) }) as unknown as Transformer;

const HEADING = transformerOf("heading");
const QUOTE = transformerOf("quote");
const BOLD = transformerOf("bold");

const features: EditorFeature[] = [
  { key: "heading", nodeType: "heading", transformers: [HEADING], syntax: "`#` headings" },
  { key: "quote", nodeType: "quote", transformers: [QUOTE], syntax: "`>` quotes" },
  { key: "emphasis", transformers: [BOLD], syntax: "**bold**" },
  { key: "image", nodeType: "akan-image", label: "image" },
  { key: "table", nodeType: "table", label: "table" },
];

describe("editor features", () => {
  describe("transformersOf", () => {
    it("flattens in declaration order, which is what settles a tie between two transformers", () => {
      expect(transformersOf(features)).toEqual([HEADING, QUOTE, BOLD]);
    });

    it("is empty for a table of pure losses", () => {
      expect(transformersOf([{ nodeType: "akan-image", label: "image" }])).toEqual([]);
    });
  });

  describe("lossesOf", () => {
    it("names only what no transformer carries", () => {
      expect(lossesOf(features)).toEqual({ "akan-image": { label: "image" }, table: { label: "table" } });
    });

    it("cannot report a carried feature as a loss even when it also carries a label", () => {
      expect(lossesOf([{ nodeType: "quote", label: "quote", transformers: [QUOTE] }])).toEqual({});
    });

    it("keeps a carried feature that narrows its loss, so a merged table cell is still reported", () => {
      const when = (node: EditorNodeLike) => node.type === "table";
      expect(
        lossesOf([{ nodeType: "table", label: "merged table cell", transformers: [QUOTE], lossyWhen: when }]),
      ).toEqual({ table: { label: "merged table cell", when } });
    });

    it("skips a text format, which is no node of its own", () => {
      expect(lossesOf([{ label: "emphasis" }])).toEqual({});
    });

    it("lets a later feature override an earlier one of the same node type", () => {
      const overridden = lossesOf([
        { nodeType: "akan-image", label: "image" },
        { nodeType: "akan-image", label: "picture" },
      ]);
      expect(overridden).toEqual({ "akan-image": { label: "picture" } });
    });
  });

  describe("featuresOf", () => {
    it("is every feature when no key list narrows it, which is the editor's default", () => {
      expect(featuresOf(features, undefined)).toEqual(features);
    });

    it("keeps table order, which is what settles a tie between two transformers", () => {
      expect(featuresOf(features, ["emphasis", "heading"]).map((feature) => feature.key)).toEqual([
        "heading",
        "emphasis",
      ]);
    });

    it("drops a plugin's own keyless feature, which its plugin switches on instead", () => {
      expect(featuresOf([...features, { nodeType: "akan-page-block", label: "nested page" }], ["heading"])).toEqual([
        features[0] as EditorFeature,
      ]);
    });

    it("is empty for an empty key list, so a field can offer nothing at all", () => {
      expect(featuresOf(features, [])).toEqual([]);
    });

    it("narrows what the agent is told it may write", () => {
      expect(syntaxOf(featuresOf(features, ["emphasis"]))).toBe("**bold**");
    });
  });

  describe("isPlainOnly", () => {
    it("holds for a field offering nothing", () => {
      expect(isPlainOnly([])).toBe(true);
    });

    it("holds for a field whose every capability adds no formatting", () => {
      expect(isPlainOnly([{ key: "mention", nodeType: "akan-mention", transformers: [BOLD], plain: true }])).toBe(true);
    });

    it("fails as soon as one capability can make the document rich", () => {
      expect(isPlainOnly(featuresOf(features, ["heading"]))).toBe(false);
    });
  });

  describe("syntaxOf", () => {
    it("joins the clauses of every carried feature", () => {
      expect(syntaxOf(features)).toBe("`#` headings, `>` quotes, **bold**");
    });

    it("leaves out a clause on a feature nothing carries", () => {
      expect(syntaxOf([{ nodeType: "table", label: "table", syntax: "`| a |` tables" }])).toBe("");
    });
  });
});
