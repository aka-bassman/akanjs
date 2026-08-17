import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AbstractDoc } from "./abstractDoc";
import { AkanQualityScanner, type QualityScanResult } from "./qualityScanner";

const tempRoots: string[] = [];

const makeWorkspace = async (files: Record<string, string>) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "akan-quality-scanner-"));
  tempRoots.push(root);
  for (const [filePath, content] of Object.entries({ ".gitignore": "node_modules\n", ...files })) {
    const absolutePath = path.join(root, filePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }
  return root;
};

const abstractOf = (lineNum: number) =>
  ["# post Abstract", ...Array.from({ length: lineNum - 1 }, (_, idx) => `- rule ${idx}`)].join("\n");

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("AkanQualityScanner abstract rule", () => {
  test("warns on an abstract over the line limit and points at akan compact", async () => {
    const root = await makeWorkspace({
      "apps/demo/lib/post/post.abstract.md": abstractOf(AbstractDoc.maxLines + 1),
      "apps/demo/lib/post/post.constant.ts": "export class Post {}\n",
      "libs/shared/lib/user/user.abstract.md": abstractOf(AbstractDoc.maxLines),
      "libs/shared/lib/user/user.constant.ts": "export class User {}\n",
    });

    const result = await new AkanQualityScanner().scan(root);
    const warnings = result.warnings.filter((warning) => warning.rule === "akan.file.abstract-max-lines");

    expect(result.scannedFiles).toBe(4);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.file).toBe("apps/demo/lib/post/post.abstract.md");
    expect(warnings[0]?.message).toContain(`${AbstractDoc.maxLines + 1} lines`);
    expect(warnings[0]?.fix).toContain("akan compact");
  });
});

const staticMarkup = (elementNum: number) =>
  Array.from({ length: elementNum }, (_, idx) => `      <p className="text-sm">row ${idx}</p>`).join("\n");

const rulesOf = (result: QualityScanResult, rule: string) => result.warnings.filter((warning) => warning.rule === rule);

describe("AkanQualityScanner ssr rules", () => {
  test("flags a client file that uses no client-only capability", async () => {
    const root = await makeWorkspace({
      "apps/demo/ui/Plain.tsx": `"use client";\nexport const Plain = () => <div>plain</div>;\n`,
      "apps/demo/ui/Interactive.tsx": `"use client";\nexport const Interactive = () => <button onClick={() => null}>go</button>;\n`,
      "apps/demo/ui/Hooked.tsx": `"use client";\nimport { useState } from "react";\nexport const Hooked = () => {\n  const [open] = useState(false);\n  return <div>{open ? "y" : "n"}</div>;\n};\n`,
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.ssr.unnecessary-use-client");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.file).toBe("apps/demo/ui/Plain.tsx");
  });

  test("keeps the directive on a third-party wrapper and on an index_ boundary", async () => {
    const root = await makeWorkspace({
      "apps/demo/ui/Chart.tsx": `"use client";\nimport { Bar } from "react-chartjs-2";\nexport const Chart = () => <Bar data={{}} />;\n`,
      "apps/demo/ui/Lazy/index_.tsx": `"use client";\nexport { Inner } from "./Inner";\n`,
    });

    expect(rulesOf(await new AkanQualityScanner().scan(root), "akan.ssr.unnecessary-use-client")).toHaveLength(0);
  });

  test("flags a static component and a mostly-static component inside a client file", async () => {
    const root = await makeWorkspace({
      "apps/demo/ui/Panels.tsx": [
        `"use client";`,
        `import { useState } from "react";`,
        `export const StaticPanel = () => (`,
        `  <section>`,
        staticMarkup(5),
        `  </section>`,
        `);`,
        `export const MixedPanel = () => {`,
        `  const [open, setOpen] = useState(false);`,
        `  return (`,
        `    <section>`,
        staticMarkup(12),
        `      <span>{open ? "open" : "shut"}</span>`,
        `    </section>`,
        `  );`,
        `};`,
        "",
      ].join("\n"),
    });

    const result = await new AkanQualityScanner().scan(root);
    const staticWarnings = rulesOf(result, "akan.ssr.client-static-component");
    const mixedWarnings = rulesOf(result, "akan.ssr.client-static-markup");

    expect(staticWarnings).toHaveLength(1);
    expect(staticWarnings[0]?.message).toContain("StaticPanel");
    expect(staticWarnings[0]?.fix).toContain("server file");
    expect(mixedWarnings).toHaveLength(1);
    expect(mixedWarnings[0]?.message).toContain("MixedPanel");
  });

  test("flags a mount-only load but not a reactive one", async () => {
    const root = await makeWorkspace({
      "apps/demo/lib/post/Post.Zone.tsx": [
        `"use client";`,
        `import { useEffect } from "react";`,
        `export const List = ({ tag }: { tag: string }) => {`,
        `  useEffect(() => {`,
        `    void st.do.initPostInPublic();`,
        `  }, []);`,
        `  useEffect(() => {`,
        `    void st.do.getPostListInTag(tag);`,
        `  }, [tag]);`,
        `  return <div>{tag}</div>;`,
        `};`,
        "",
      ].join("\n"),
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.ssr.client-mount-load");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("st.do.initPostInPublic");
    expect(warnings[0]?.fix).toContain("init/view");
  });

  test("flags useState in a Template", async () => {
    const root = await makeWorkspace({
      "apps/demo/lib/post/Post.Template.tsx": `"use client";\nimport { useState } from "react";\nexport const General = () => {\n  const [draft, setDraft] = useState("");\n  return <input value={draft} onChange={(e) => setDraft(e.target.value)} />;\n};\n`,
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.ssr.template-client-state");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.fix).toContain("st.do.setFieldOnX");
  });

  test("flags a module that renders only from client files", async () => {
    const root = await makeWorkspace({
      "apps/demo/lib/post/Post.Zone.tsx": [
        `"use client";`,
        `import { useState } from "react";`,
        `export const Card = () => {`,
        `  const [open] = useState(false);`,
        `  return (`,
        `    <section>`,
        staticMarkup(14),
        `      <span>{open ? "open" : "shut"}</span>`,
        `    </section>`,
        `  );`,
        `};`,
        "",
      ].join("\n"),
      "libs/shared/lib/user/User.Zone.tsx": `"use client";\nimport { st } from "@libs/shared/client";\nexport const Self = () => <User.View.General user={st.use.self()} />;\n`,
      "libs/shared/lib/user/User.View.tsx": `export const General = ({ name }: { name: string }) => <div>{name}</div>;\n`,
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.ssr.module-missing-server-view");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("apps/demo/lib/post");
  });

  test("measures the server render share per scope and for the workspace", async () => {
    const root = await makeWorkspace({
      "apps/demo/ui/Server.tsx": `export const Server = () => (\n  <section>\n    <p>a</p>\n    <p>b</p>\n  </section>\n);\n`,
      "libs/shared/ui/Client.tsx": `"use client";\nexport const Client = () => <button onClick={() => null}>go</button>;\n`,
    });

    const { ssrBalance } = await new AkanQualityScanner().scan(root);

    expect(ssrBalance.map((entry) => entry.scope)).toEqual(["apps/demo", "libs/shared", "workspace"]);
    expect(ssrBalance[0]).toMatchObject({ serverMass: 3, clientMass: 0, serverShare: 1 });
    expect(ssrBalance[1]).toMatchObject({ serverMass: 0, clientMass: 1 });
    expect(ssrBalance[2]).toMatchObject({ scope: "workspace", serverMass: 3, clientMass: 1 });
  });
});

const signalOf = (entries: string) =>
  [
    `import { endpoint, slice } from "akanjs/signal";`,
    `export class PostSlice extends slice(srv.post, { guards: {}, mcp: { get: true } }, (init) => ({`,
    entries,
    `})) {}`,
    "",
  ].join("\n");

describe("AkanQualityScanner mcp rules", () => {
  test("flags an exposed endpoint whose dictionary entry carries no desc", async () => {
    const root = await makeWorkspace({
      "libs/shared/lib/post/post.signal.ts": [
        `import { endpoint } from "akanjs/signal";`,
        `export class PostEndpoint extends endpoint(srv.post, ({ query }) => ({`,
        `  publishPost: query(Boolean, { guards: [Admin], mcp: { expose: true } }).exec(() => true),`,
        `  archivePost: query(Boolean, { guards: [Admin], mcp: { expose: true } }).exec(() => true),`,
        `  quietPost: query(Boolean, { guards: [Admin] }).exec(() => true),`,
        `})) {}`,
        "",
      ].join("\n"),
      "libs/shared/lib/post/post.dictionary.ts": [
        `export const dictionary = modelDictionary(["en", "ko"]).endpoint((fn) => ({`,
        `  publishPost: fn(["Publish", "게시"]).desc(["Publishes a post", "글을 게시합니다"]),`,
        `  archivePost: fn(["Archive", "보관"]).arg((t) => ({`,
        `    postId: t(["Post", "글"]).desc(["Post to archive", "보관할 글"]),`,
        `  })),`,
        `}));`,
        "",
      ].join("\n"),
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.mcp.missing-description");

    // `archivePost` describes only its argument, which says nothing about when to reach for the tool.
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("archivePost");
    expect(warnings[0]?.line).toBe(4);
    expect(warnings[0]?.fix).toContain(".desc(");
  });

  test("accepts a slice described on its own entry or on the endpoint it generates", async () => {
    const root = await makeWorkspace({
      "libs/shared/lib/post/post.signal.ts": signalOf(
        [
          `  inPublic: init({ mcp: { expose: true } }).exec(function () { return this.postService.queryInPublic(); }),`,
          `  inTag: init({ mcp: { expose: true } }).exec(function () { return this.postService.queryInTag(); }),`,
          `  inDraft: init({ mcp: { expose: true } }).exec(function () { return this.postService.queryInDraft(); }),`,
        ].join("\n"),
      ),
      "libs/shared/lib/post/post.dictionary.ts": [
        `export const dictionary = modelDictionary(["en", "ko"])`,
        `  .slice((fn) => ({`,
        `    inPublic: fn(["In Public", "공개"]).desc(["Public posts", "공개된 글"]),`,
        `    inTag: fn(["In Tag", "태그"]),`,
        `    inDraft: fn(["In Draft", "초안"]),`,
        `  }))`,
        `  .endpoint((fn) => ({`,
        `    postListInTag: fn(["Post List In Tag", "태그별 글"]).desc(["Posts under a tag", "태그에 속한 글"]),`,
        `  }));`,
        "",
      ].join("\n"),
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.mcp.missing-description");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("inDraft");
  });

  test("flags an exposure that declares no guards, whatever the slice call declared", async () => {
    const root = await makeWorkspace({
      "libs/shared/lib/post/post.signal.ts": signalOf(
        [
          `  inPublic: init({ guards: [Public], mcp: { expose: true } }).exec(function () { return this.postService.queryInPublic(); }),`,
          `  inTag: init({ mcp: { expose: true } }).exec(function () { return this.postService.queryInTag(); }),`,
          `  inDraft: init({ ...sharedOption, mcp: { expose: true } }).exec(function () { return this.postService.queryInDraft(); }),`,
        ].join("\n"),
      ),
      "libs/shared/lib/post/post.dictionary.ts": `export const dictionary = modelDictionary(["en", "ko"]);\n`,
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.mcp.unguarded-exposure");

    // `inPublic` decided; `inDraft` may have inherited a `guards` from the spread, so it is unreadable, not missing.
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain("inTag");
    expect(warnings[0]?.fix).toContain("guards: [Public]");
  });

  test("stays silent on a module that exposes nothing to MCP", async () => {
    const root = await makeWorkspace({
      "libs/shared/lib/post/post.signal.ts": signalOf(
        `  inPublic: init().exec(function () { return this.postService.queryInPublic(); }),`,
      ),
      "libs/shared/lib/post/post.dictionary.ts": `export const dictionary = modelDictionary(["en", "ko"]);\n`,
    });

    expect(rulesOf(await new AkanQualityScanner().scan(root), "akan.mcp.missing-description")).toHaveLength(0);
  });
});

describe("AkanQualityScanner layout rules", () => {
  test("flags an unknown app root file but not a facet entrypoint", async () => {
    const root = await makeWorkspace({
      "apps/demo/client.ts": "export const client = 1;\n",
      "apps/demo/helper.ts": "export const helper = 1;\n",
    });

    const warnings = rulesOf(await new AkanQualityScanner().scan(root), "akan.layout.app-root-file");

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.file).toBe("apps/demo/helper.ts");
  });
});
