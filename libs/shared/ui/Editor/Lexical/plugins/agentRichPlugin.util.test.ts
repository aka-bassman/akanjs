import { describe, expect, it } from "bun:test";
import { contentFromText } from "../../../../common/contentFromText";
import { isEmptyRichContent, lossSentence, lossyNodesOf, richBlockListing, richBlocksOf } from "./agentRichPlugin.util";

// Relative imports, and no `@lexical/*` anywhere: the util reads serialized JSON so the guard is
// testable without the sibling node packages, whose dev ESM builds trip bun's loader.

const docOf = (...children: unknown[]) => ({
  root: { type: "root", version: 1, children },
});

const paragraphOf = (...children: unknown[]) => ({ type: "paragraph", version: 1, children });
const textOf = (text: string) => ({ type: "text", version: 1, text });

describe("agentRichPlugin.util", () => {
  describe("isEmptyRichContent", () => {
    it("treats every vintage of blank content as empty", () => {
      expect(isEmptyRichContent(null)).toBe(true);
      expect(isEmptyRichContent([])).toBe(true);
      expect(isEmptyRichContent({})).toBe(true);
      expect(isEmptyRichContent(contentFromText(""))).toBe(true);
      expect(isEmptyRichContent(docOf(paragraphOf()))).toBe(true);
    });

    it("is not empty once a person has typed", () => {
      expect(isEmptyRichContent(contentFromText("hello"))).toBe(false);
    });

    it("is not empty when a textless block still carries meaning", () => {
      expect(isEmptyRichContent(docOf({ type: "akan-image", version: 1 }))).toBe(false);
    });

    it("counts whitespace as blank", () => {
      expect(isEmptyRichContent(contentFromText("  \n  "))).toBe(true);
    });
  });

  describe("lossyNodesOf", () => {
    it("finds a mention nested inside a paragraph", () => {
      const content = docOf(paragraphOf(textOf("cc "), { type: "akan-mention", version: 1 }));
      expect(lossyNodesOf(content)).toEqual([{ label: "mention", count: 1 }]);
    });

    it("counts a table once, not its rows and cells", () => {
      const content = docOf({
        type: "table",
        version: 1,
        children: [
          { type: "tablerow", version: 1, children: [{ type: "tablecell", version: 1, children: [] }] },
          { type: "tablerow", version: 1, children: [{ type: "tablecell", version: 1, children: [] }] },
        ],
      });
      expect(lossyNodesOf(content)).toEqual([{ label: "table", count: 1 }]);
    });

    it("counts a toggle once, not its title and content", () => {
      const content = docOf({
        type: "akan-collapsible",
        version: 1,
        children: [
          { type: "akan-collapsible-title", version: 1, children: [] },
          { type: "akan-collapsible-content", version: 1, children: [] },
        ],
      });
      expect(lossyNodesOf(content)).toEqual([{ label: "toggle", count: 1 }]);
    });

    it("leaves mermaid out — it has its own transformer", () => {
      expect(lossyNodesOf(docOf({ type: "akan-mermaid", version: 1 }))).toEqual([]);
    });

    it("leaves the nodes markdown does carry out", () => {
      const content = docOf(
        { type: "heading", tag: "h1", version: 1, children: [textOf("Title")] },
        { type: "quote", version: 1, children: [textOf("said")] },
        { type: "code", version: 1, children: [textOf("run()")] },
        { type: "horizontalrule", version: 1 },
      );
      expect(lossyNodesOf(content)).toEqual([]);
    });

    it("reports the most numerous loss first", () => {
      const content = docOf(
        { type: "akan-image", version: 1 },
        { type: "akan-image", version: 1 },
        paragraphOf({ type: "akan-mention", version: 1 }),
        { type: "akan-image", version: 1 },
      );
      expect(lossyNodesOf(content)).toEqual([
        { label: "image", count: 3 },
        { label: "mention", count: 1 },
      ]);
    });

    it("reads a legacy array-shaped value without throwing", () => {
      expect(lossyNodesOf([{ type: "akan-image" }])).toEqual([{ label: "image", count: 1 }]);
    });
  });

  describe("lossSentence", () => {
    it("pluralizes each count", () => {
      expect(lossSentence([{ label: "image", count: 3 }])).toBe("3 images");
      expect(lossSentence([{ label: "table", count: 1 }])).toBe("1 table");
      expect(
        lossSentence([
          { label: "image", count: 2 },
          { label: "mention", count: 1 },
        ]),
      ).toBe("2 images, 1 mention");
    });
  });

  describe("richBlocksOf", () => {
    it("indexes the top-level blocks and collapses each one's text", () => {
      const content = docOf(
        { type: "heading", tag: "h1", version: 1, children: [textOf("Scope\n  of Work")] },
        paragraphOf(textOf("The vendor "), textOf("shall deliver.")),
        { type: "akan-image", version: 1 },
      );
      expect(richBlocksOf(content)).toEqual([
        { index: 0, type: "heading", text: "Scope of Work" },
        { index: 1, type: "paragraph", text: "The vendor shall deliver." },
        { index: 2, type: "akan-image", text: "" },
      ]);
    });

    it("does not descend past a block — a nested paragraph is not addressable", () => {
      const content = docOf({ type: "quote", version: 1, children: [paragraphOf(textOf("inner"))] });
      expect(richBlocksOf(content)).toEqual([{ index: 0, type: "quote", text: "inner" }]);
    });

    it("returns nothing for content of any blank vintage", () => {
      expect(richBlocksOf(null)).toEqual([]);
      expect(richBlocksOf({})).toEqual([]);
      expect(richBlocksOf([])).toEqual([]);
    });
  });

  describe("richBlockListing", () => {
    it("says so when the field is empty", () => {
      expect(richBlockListing(docOf())).toBe("0 blocks. The field is empty.");
    });

    it("prints one addressable line per block", () => {
      const content = docOf(paragraphOf(textOf("first")), { type: "akan-image", version: 1 });
      expect(richBlockListing(content)).toBe(["2 blocks:", "0 paragraph first", "1 akan-image (no text)"].join("\n"));
    });

    it("names the indices it could not fit rather than dropping them silently", () => {
      const long = "x".repeat(400);
      const listing = richBlockListing(docOf(...Array.from({ length: 200 }, () => paragraphOf(textOf(long)))));
      expect(listing).toContain("200 blocks:");
      expect(listing).toMatch(/… \d+ more, at indices \d+-199\.$/);
    });

    it("truncates a long block instead of the listing", () => {
      const listing = richBlockListing(docOf(paragraphOf(textOf("y".repeat(500)))));
      expect(listing.split("\n")[1]).toBe(`0 paragraph ${"y".repeat(160)}`);
    });
  });
});
