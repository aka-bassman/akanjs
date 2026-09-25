import { describe, expect, test } from "bun:test";
import { ID } from "akanjs/base";
import type { ReactNode } from "react";
import { layout, page } from "../client/route/routeBuilders";
import { createRequestStore, recordRequestQuery, requestStorage } from "../fetch/requestStorage";
import { RouteTreeBuilder } from "./routeTreeBuilder";
import { RscPagePrompts } from "./rscPagePrompts";

const itemId = "507f1f77bcf86cd799439011";

const record = (key: string, args: Record<string, unknown>, value: Promise<unknown>, modelType?: string) =>
  recordRequestQuery({ key, args, returns: { refName: modelType ? "item" : "String", modelType }, value });

const routes = new RouteTreeBuilder({
  "./__root_layout.tsx": async () => ({ default: ({ children }: { children: ReactNode }) => children }),
  "./item/[itemId]/_layout.tsx": async () => ({
    default: layout().render(({ children }) => {
      record("self", {}, Promise.resolve("me"));
      return children;
    }),
  }),
  "./item/[itemId]/_index.tsx": async () => ({
    default: page()
      .param("itemId", ID, { desc: "The item." })
      .search("tags", [String])
      .prompt("briefItem", "Brief one item.")
      .render(async (args) => {
        record("item", { itemId: args.itemId }, Promise.resolve({ id: args.itemId }), "full");
        record("tagsOf", { tags: args.tags }, Promise.reject(new Error("nope")));
        return null;
      }),
  }),
  "./plain.tsx": async () => ({ default: page().render(() => null) }),
  "./gate.tsx": async () => ({
    default: page()
      .prompt("gate", "Gated.")
      .render(() => {
        throw Object.assign(new Error("redirect"), { digest: "AKAN_REDIRECT", location: "/signin" });
      }),
  }),
  "./owned.tsx": async () => ({
    default: page()
      .prompt("owned", "Somebody else's.")
      .render(() => {
        throw Object.assign(new Error("Access denied by guard"), { statusCode: 403 });
      }),
  }),
}).build();

const prompts = new RscPagePrompts({
  routes: () => routes,
  run: (request, _routeId, fn) => {
    if (!requestStorage) throw new Error("no request storage");
    return requestStorage.run(createRequestStore(request), fn);
  },
  defaultLocale: () => "en",
});

describe("RscPagePrompts", () => {
  test("lists the pages that declared a prompt, alphabetically, with their arguments and route", async () => {
    expect(await prompts.list()).toEqual([
      {
        name: "briefItem",
        description: "Brief one item.",
        arguments: [
          { name: "itemId", description: "The item.", required: true },
          { name: "tags", description: "Comma-separated list.", required: false },
        ],
        pattern: "/:lang/item/:itemId",
      },
      { name: "gate", description: "Gated.", arguments: [], pattern: "/:lang/gate" },
      { name: "owned", description: "Somebody else's.", arguments: [], pattern: "/:lang/owned" },
    ]);
    // Cached against the route array: the same routes answer the same entries without reloading a module.
    expect(await prompts.list()).toBe(await prompts.list());
  });

  test("runs layouts and page in one request scope and hands back what they fetched", async () => {
    const run = await prompts.run({
      name: "briefItem",
      arguments: { itemId, tags: "a, b" },
      headers: [["authorization", "Bearer t"]],
    });
    expect(run).toMatchObject({ ok: true, url: `http://127.0.0.1/en/item/${itemId}?tags=a&tags=b` });
    if (!run.ok) return;
    // Layout first, then the page; a query that failed keeps its place with the failure instead of the value.
    expect(run.records.map((entry) => entry.key)).toEqual(["self", "item", "tagsOf"]);
    expect(run.records[1]).toEqual({
      key: "item",
      args: { itemId },
      returns: { refName: "item", modelType: "full" },
      value: { id: itemId },
    });
    expect(run.records[2]).toMatchObject({ key: "tagsOf", args: { tags: ["a", "b"] }, error: "nope" });
    expect("value" in run.records[2]).toBe(false);
  });

  test("refuses by the page's own declaration before anything runs", async () => {
    expect(await prompts.run({ name: "briefItem", arguments: {}, headers: [] })).toEqual({
      ok: false,
      reason: "argument",
      message: 'Missing required argument "itemId".',
    });
    expect(await prompts.run({ name: "briefItem", arguments: { itemId: "nope" }, headers: [] })).toEqual({
      ok: false,
      reason: "argument",
      message: 'Invalid argument "itemId": expected ID.',
    });
    expect(await prompts.run({ name: "nope", arguments: {}, headers: [] })).toEqual({
      ok: false,
      reason: "unknown",
      message: "Unknown prompt: nope.",
    });
  });

  test("reads a redirect thrown by the page body as a refusal, by digest", async () => {
    const run = await prompts.run({ name: "gate", arguments: {}, headers: [] });
    expect(run).toMatchObject({ ok: false, reason: "redirect" });
    if (run.ok) return;
    expect(run.message).toContain("/signin");
  });

  test("reads a guard's refusal of a query inside the body as the screen refusing the caller", async () => {
    expect(await prompts.run({ name: "owned", arguments: {}, headers: [] })).toEqual({
      ok: false,
      reason: "forbidden",
      message: "A query the screen makes refused the caller (403).",
    });
  });

  test("names two pages that claim one prompt", async () => {
    const twice = new RouteTreeBuilder({
      "./__root_layout.tsx": async () => ({ default: ({ children }: { children: ReactNode }) => children }),
      "./a.tsx": async () => ({
        default: page()
          .prompt("same", "A.")
          .render(() => null),
      }),
      "./b.tsx": async () => ({
        default: page()
          .prompt("same", "B.")
          .render(() => null),
      }),
    }).build();
    const source = new RscPagePrompts({ routes: () => twice, run: (_req, _id, fn) => fn(), defaultLocale: () => "en" });
    await expect(source.list()).rejects.toThrow('prompt "same" is declared by both');
  });
});
