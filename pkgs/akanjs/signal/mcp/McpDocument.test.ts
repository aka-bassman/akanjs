import { describe, expect, test } from "bun:test";
import { Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import type { SerializedSignal } from "../types";
import { McpDocument } from "./McpDocument";

class McpTagInput extends via((field) => ({ label: field(String) })) {}
class McpTagObject extends via(McpTagInput, (field) => ({ weight: field(Int, { default: 0 }) })) {}
class LightMcpTag extends via(McpTagObject, ["label"] as const, () => ({})) {}
class McpTag extends via(McpTagObject, LightMcpTag, () => ({})) {}
class McpTagInsight extends via(McpTag, () => ({})) {}
ConstantRegistry.buildModel("mcpTag", McpTagInput, McpTagObject, McpTag, LightMcpTag, McpTagInsight, {});

class McpPostInput extends via((field) => ({
  title: field(String),
  tag: field(McpTag).optional(),
  // Legal to send and never sent back — `resolveReturn` strips it — so the two schema sides must disagree here.
  draftKey: field.secret(String).optional(),
})) {}
class McpPostObject extends via(McpPostInput, (field) => ({ views: field(Int, { default: 0 }) })) {}
class LightMcpPost extends via(McpPostObject, ["title"] as const, () => ({})) {}
class McpPost extends via(McpPostObject, LightMcpPost, () => ({})) {}
class McpPostInsight extends via(McpPost, (field) => ({ total: field(Int, { default: 0 }) })) {}
ConstantRegistry.buildModel("mcpPost", McpPostInput, McpPostObject, McpPost, LightMcpPost, McpPostInsight, {});

const signal = (): Record<string, SerializedSignal> => ({
  mcpPost: {
    prefix: "mcpPost",
    mcp: { get: true },
    getGuards: ["Public"],
    cruGuards: ["Admin"],
    slice: {
      // The root slice `slice()` generates: its one argument is a raw query descriptor typed `Any`.
      "": { args: [{ type: "search", name: "query", refName: "Any" }], guards: ["Public"], mcp: { expose: true } },
      byAuthor: {
        args: [{ type: "search", name: "authorId", refName: "ID", nullable: true }],
        guards: ["Public"],
        mcp: { expose: true },
      },
      // What `init().param("from", Date).search("periodTypes", …)` actually serializes to — a slice's params are
      // required and are not `search`, which is the shape a search-only fixture never exercises.
      inPeriod: {
        args: [
          { type: "param", name: "from", refName: "Date" },
          { type: "search", name: "periodTypes", refName: "String", arrDepth: 1, nullable: true },
        ],
        guards: ["Public"],
        mcp: { expose: true },
      },
      internalOnly: { args: [], guards: ["Admin"] },
    },
    endpoint: {
      countMcpPosts: { type: "query", args: [], returns: { refName: "Int" }, mcp: { expose: true } },
      findMcpPost: {
        type: "query",
        args: [],
        returns: { refName: "mcpPost", modelType: "full", nullable: true },
        guards: ["Public"],
        mcp: { expose: true },
      },
      searchMcpPosts: {
        type: "query",
        args: [],
        returns: { refName: "mcpPost", modelType: "light", arrDepth: 1, nullable: true },
        guards: ["Public"],
        mcp: { expose: true },
      },
      undeclaredMcpPost: { type: "query", args: [], returns: { refName: "String" } },
      // Asks to be addressable, which only the generated reads have a uri shape for.
      summaryMcpPost: {
        type: "query",
        args: [{ type: "search", name: "status", refName: "String", nullable: true }],
        returns: { refName: "String" },
        guards: ["Public"],
        mcp: { expose: true, resource: true },
      },
      rawMcpPost: { type: "query", args: [], returns: { refName: "Any" }, mcp: { expose: true } },
      publishMcpPost: {
        type: "mutation",
        args: [],
        returns: { refName: "Boolean" },
        guards: ["Admin"],
        mcp: { expose: true },
      },
      // Takes the model on the way in and gives it back on the way out — the one tool that publishes both halves.
      draftMcpPost: {
        type: "mutation",
        args: [{ type: "body", name: "data", refName: "mcpPost", modelType: "input" }],
        returns: { refName: "mcpPost", modelType: "full" },
        guards: ["Admin"],
        mcp: { expose: true },
      },
      unguardedMcpPost: { type: "mutation", args: [], returns: { refName: "Boolean" }, mcp: { expose: true } },
      importMcpPost: {
        type: "mutation",
        args: [{ type: "body", name: "payload", refName: "Any" }],
        returns: { refName: "Boolean" },
        guards: ["Admin"],
        mcp: { expose: true },
      },
      reviewMcpPost: {
        type: "prompt",
        args: [
          { type: "param", name: "mcpPostId", refName: "ID" },
          { type: "search", name: "tone", refName: "String", nullable: true },
        ],
        returns: { refName: "Any" },
        guards: ["Public"],
        mcp: { expose: true },
      },
      unguardedPrompt: { type: "prompt", args: [], returns: { refName: "Any" }, mcp: { expose: true } },
      undeclaredPrompt: { type: "prompt", args: [], returns: { refName: "Any" }, guards: ["Public"] },
      bodyPrompt: {
        type: "prompt",
        args: [{ type: "body", name: "data", refName: "mcpPost", modelType: "input" }],
        returns: { refName: "Any" },
        guards: ["Public"],
        mcp: { expose: true },
      },
      tagsPrompt: {
        type: "prompt",
        args: [{ type: "search", name: "tags", refName: "String", arrDepth: 1, nullable: true }],
        returns: { refName: "Any" },
        guards: ["Public"],
        mcp: { expose: true },
      },
      rawArgPrompt: {
        type: "prompt",
        args: [{ type: "search", name: "filter", refName: "Any", nullable: true }],
        returns: { refName: "Any" },
        guards: ["Public"],
        mcp: { expose: true },
      },
      // Asks to be addressable *and* is keyed like a generated list, so the uri shape resolved and the option then
      // fell out at the prompt branch — the one place an unhonoured `resource: true` was neither refused nor kept.
      mcpPostListDigest: {
        type: "prompt",
        args: [],
        returns: { refName: "Any" },
        guards: ["Public"],
        mcp: { expose: true, resource: true },
      },
    },
  },
});

const names = (doc: McpDocument) => doc.tools.map((tool) => tool.name);

describe("McpDocument", () => {
  test("publishes only what opted in", () => {
    expect(names(new McpDocument(signal()))).toEqual([
      "countMcpPosts",
      "draftMcpPost",
      "findMcpPost",
      "lightMcpPost",
      "mcpPost",
      "mcpPostInsight",
      "mcpPostInsightByAuthor",
      "mcpPostInsightInPeriod",
      "mcpPostList",
      "mcpPostListByAuthor",
      "mcpPostListInPeriod",
      "publishMcpPost",
      "searchMcpPosts",
      "summaryMcpPost",
    ]);
  });

  test("readOnly drops every mutation whatever it opted into", () => {
    // The deployment-level valve, not the exposure decision: `publishMcpPost` opted in and is guarded.
    const exposed = names(new McpDocument(signal(), { readOnly: true }));
    expect(exposed).not.toContain("publishMcpPost");
    expect(exposed).toContain("mcpPostList");
  });

  test("refuses shapes MCP cannot carry even after they opt in", () => {
    const exposed = names(new McpDocument(signal()));
    // `Any` has no schema to publish, and an unguarded mutation is an accident every time.
    expect(exposed).not.toContain("rawMcpPost");
    expect(exposed).not.toContain("unguardedMcpPost");
    // An `Any` arg is left out of the schema, so one that must be filled leaves a tool that can only fail.
    expect(exposed).not.toContain("importMcpPost");
    // Never opted in at all.
    expect(exposed).not.toContain("undeclaredMcpPost");
    expect(exposed).not.toContain("createMcpPost");
    expect(exposed).toContain("publishMcpPost");
  });

  test("says why an endpoint that opted in was kept out instead of dropping it silently", () => {
    // The rejections above are fail-closed by design and were also silent: a deliberate `expose: true` vanished
    // from the catalogue with nowhere to look but the framework source. The server prints these at boot.
    const refusals = Object.fromEntries(new McpDocument(signal()).refusals.map(({ key, reason }) => [key, reason]));
    expect(Object.keys(refusals).sort()).toEqual([
      "bodyPrompt",
      "importMcpPost",
      "mcpPostListDigest",
      "rawArgPrompt",
      "rawMcpPost",
      "summaryMcpPost",
      "tagsPrompt",
      "unguardedMcpPost",
    ]);
    expect(refusals.rawMcpPost).toContain("`Any`");
    expect(refusals.unguardedMcpPost).toContain("`[Public]` is having none");
    // Names the argument: "it has an `Any` argument" still leaves an author hunting for which one.
    expect(refusals.importMcpPost).toContain("`payload`");
    expect(refusals.bodyPrompt).toContain("flat string map");
    // Nothing that never opted in is reported — silence there is what opting in means.
    expect(refusals.undeclaredMcpPost).toBeUndefined();
  });

  test("names a published entry that declares no guards without refusing it", () => {
    // Access identical to an explicit `[Public]`, so refusing it would be wrong — but one of the two is a decision
    // somebody made, and a named slice inherits no `get:` from the slice call, which is how the other happens.
    const doc = new McpDocument(signal());
    expect(doc.unguarded).toEqual(["countMcpPosts"]);
    // `[Public]` spelled out stays quiet, and so does a prompt: an unguarded one is warned about where it is
    // resolved, because its GET route is mounted whether or not the app enables MCP.
    expect(doc.unguarded).not.toContain("mcpPostListByAuthor");
    expect(doc.unguarded).not.toContain("unguardedPrompt");
  });

  test("keeps hidden and secret field names out of the output schema and in the input schema", () => {
    // `resolveReturn` strips both from every response, so an output schema naming them promises a property no
    // answer carries — and on a real model the names are the leak: `password`, `accountId`, `phone` published as
    // readable. The input side is a different shape and legitimately takes them.
    const doc = new McpDocument(signal());
    const draft = doc.tools.find((tool) => tool.name === "draftMcpPost");
    const input = draft?.inputSchema.$defs as Record<string, { properties: object }>;
    const output = draft?.outputSchema?.$defs as Record<string, { properties: object }>;
    expect(Object.keys(input.McpPostInput.properties)).toContain("draftKey");
    expect(Object.keys(output.McpPost.properties)).not.toContain("draftKey");
    expect(Object.keys(output.McpPost.properties)).toContain("title");
  });

  test("reports the read-only valve as a refusal like any other", () => {
    // The reason this switch defaults off is that a second switch silently unlisting a deliberately exposed
    // endpoint gives its author no way to see why. It now says so rather than relying on the default.
    const refusal = new McpDocument(signal(), { readOnly: true }).refusals.find(({ key }) => key === "publishMcpPost");
    expect(refusal?.reason).toContain("read-only");
  });

  test("leaves an Any argument out of the schema instead of publishing an empty one", () => {
    const doc = new McpDocument(signal());
    const list = doc.tools.find((tool) => tool.name === "mcpPostList");
    // The root list's `query` is a raw database query descriptor. `Any` publishes as `{}`, which tells a model
    // nothing — the same reason an `Any` return is refused — and a value sent for it is refused by name at the
    // server, like any other argument the published schema does not carry.
    expect(Object.keys(list?.inputSchema.properties as object)).toEqual(["skip", "limit", "sort"]);
    expect(doc.resourceTemplates.map((template) => template.uriTemplate)).toContain(
      "akan://mcpPost/list{?skip,limit,sort}",
    );
  });

  test("carries dictionary text into title, description and argument descriptions", () => {
    const text: Record<string, string> = {
      "mcpPost.signal.mcpPostListByAuthor": "Posts By Author",
      "mcpPost.signal.mcpPostListByAuthor.desc": "Lists the posts an author wrote",
      "mcpPost.signal.mcpPostListByAuthor.arg.authorId.desc": "Author to filter by",
    };
    const doc = new McpDocument(signal(), { resolveDescription: (key) => text[key] });
    const tool = doc.tools.find((candidate) => candidate.name === "mcpPostListByAuthor");
    if (!tool) throw new Error("mcpPostListByAuthor is not in the catalogue");
    expect(tool.title).toBe("Posts By Author");
    expect(tool.description).toBe("Lists the posts an author wrote");
    expect((tool.inputSchema.properties as Record<string, { description?: string }>).authorId.description).toBe(
      "Author to filter by",
    );
  });

  test("titles the model's own list and insight from the model rather than from the framework's placeholder", () => {
    // `slice()` generates the `""` slice and `baseSliceDictionary` fills its text last, so these two would
    // otherwise publish as "Slice List - Universal" — a placeholder in the field a model picks a tool by, with
    // nowhere for the module author to write over it.
    const text: Record<string, string> = {
      "mcpPost.modelName": "Post",
      "mcpPost.modelDesc": "An article somebody wrote",
      "mcpPost.signal.mcpPostList": "Slice List - Universal",
      "mcpPost.signal.mcpPostList.desc": "Slice List - Universal Slice",
      "mcpPost.signal.mcpPostInsight": "Slice Insight - Universal",
    };
    const doc = new McpDocument(signal(), { resolveDescription: (key) => text[key] });
    expect(doc.tools.find((tool) => tool.name === "mcpPostList")).toMatchObject({
      title: "Post",
      description: "An article somebody wrote",
    });
    expect(doc.tools.find((tool) => tool.name === "mcpPostInsight")?.title).toBe("Post");
    // A named slice is the author's own text and is left alone.
    expect(doc.tools.find((tool) => tool.name === "mcpPostListByAuthor")?.title).toBeUndefined();
    expect(doc.resourceTemplates.find((template) => template.name === "mcpPostList")?.title).toBe("Post");
  });

  test("adds what the model is to the generated CRUD text, which only says the verb", () => {
    // `getBaseSignalDictionary` writes "Get Post" as both title and description and is assigned last, so these
    // five have no author-writable text either. Appended rather than substituted: on `removeMcpPost` a bare model
    // description would read as if the tool returned one.
    const text: Record<string, string> = {
      "mcpPost.modelDesc": "An article somebody wrote",
      "mcpPost.signal.mcpPost": "Get Post",
      "mcpPost.signal.mcpPost.desc": "Get Post",
      "mcpPost.signal.lightMcpPost.desc": "Get light version of Post",
    };
    const doc = new McpDocument(signal(), { resolveDescription: (key) => text[key] });
    expect(doc.tools.find((tool) => tool.name === "mcpPost")).toMatchObject({
      title: "Get Post",
      description: "Get Post — An article somebody wrote",
    });
    expect(doc.tools.find((tool) => tool.name === "lightMcpPost")?.description).toBe(
      "Get light version of Post — An article somebody wrote",
    );
    // A custom endpoint is the author's own text and is left exactly as written.
    expect(doc.tools.find((tool) => tool.name === "countMcpPosts")?.description).toBeUndefined();
  });

  test("marks path args required and leaves every search arg optional", () => {
    const doc = new McpDocument(signal());
    const single = doc.tools.find((tool) => tool.name === "mcpPost");
    expect(single?.inputSchema.required).toEqual(["mcpPostId"]);
    const list = doc.tools.find((tool) => tool.name === "mcpPostListByAuthor");
    // `skip`/`limit`/`sort` are generated without a nullable flag; reading one would demand them.
    expect(Object.keys(list?.inputSchema.properties as object)).toEqual(["authorId", "skip", "limit", "sort"]);
    expect(list?.inputSchema.required).toBeUndefined();
    // A slice may declare required params of its own, and those do have to be demanded.
    expect(doc.tools.find((tool) => tool.name === "mcpPostListInPeriod")?.inputSchema.required).toEqual(["from"]);
  });

  test("closes each tool's schema over the models it mentions", () => {
    const doc = new McpDocument(signal());
    const tool = doc.tools.find((candidate) => candidate.name === "mcpPost");
    expect(tool?.outputSchema?.$ref).toBe("#/$defs/McpPost");
    // A `$ref` may not be dereferenced over the network, so every model travels inside the tool that names it.
    expect(Object.keys(tool?.outputSchema?.$defs as object)).toEqual(["McpPost", "McpTag"]);
  });

  test("wraps an array result so structuredContent stays an object", () => {
    const doc = new McpDocument(signal());
    const list = doc.tools.find((tool) => tool.name === "mcpPostList");
    expect(list?.outputSchema).toMatchObject({
      type: "object",
      required: ["items"],
      properties: { items: { type: "array", items: { $ref: "#/$defs/LightMcpPost" } } },
    });
    const endpoint = { type: "query", args: [], returns: { refName: "mcpPost", modelType: "light", arrDepth: 1 } };
    expect(McpDocument.structuredContent(endpoint as never, [{ id: "1" }])).toEqual({ items: [{ id: "1" }] });
  });

  test("omits outputSchema for a scalar return so no structured result is promised", () => {
    const doc = new McpDocument(signal());
    const count = doc.tools.find((tool) => tool.name === "countMcpPosts");
    expect(count?.outputSchema).toBeUndefined();
    expect(McpDocument.structuredContent({ returns: { refName: "Int" } } as never, 3)).toBeUndefined();
  });

  test("promises no schema for a return whose empty answer is null", () => {
    // `structuredContent` is an object, so `null` cannot ride there any more than an array can. Declaring an
    // `outputSchema` obliges every result to match it, and the first call that finds nothing would break that
    // promise — the official client SDK parses the result against the schema and throws on a successful call.
    const doc = new McpDocument(signal());
    const endpoint = { returns: { refName: "mcpPost", modelType: "full", nullable: true } };
    expect(doc.tools.find((tool) => tool.name === "findMcpPost")?.outputSchema).toBeUndefined();
    expect(McpDocument.structuredContent(endpoint as never, null)).toBeUndefined();
    // A found one still travels structured; only the empty answer has nowhere to go.
    expect(McpDocument.structuredContent(endpoint as never, { id: "1" })).toEqual({ id: "1" });
    // A nullable *list* keeps its schema: the wrapper is an object whatever rides inside it.
    const list = doc.tools.find((tool) => tool.name === "searchMcpPosts");
    expect(list?.outputSchema).toMatchObject({ type: "object", required: ["items"] });
  });

  test("derives read-only annotations for a query", () => {
    const doc = new McpDocument(signal());
    expect(doc.tools.find((tool) => tool.name === "mcpPost")?.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  test("addresses the single and list reads but not an aggregate", () => {
    const doc = new McpDocument(signal());
    expect(doc.resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      "akan://mcpPost/light/{mcpPostId}",
      "akan://mcpPost/{mcpPostId}",
      "akan://mcpPost/list{?skip,limit,sort}",
      "akan://mcpPost/list/byAuthor{?authorId,skip,limit,sort}",
      // A slice's required params belong in the template too: without them the uri addresses a read that can
      // only fail. `parse` reads every query key back, so both kinds round-trip through form expansion.
      "akan://mcpPost/list/inPeriod{?from,periodTypes,skip,limit,sort}",
    ]);
    // An insight is an aggregate with nothing to point a uri at.
    expect(doc.resourceTemplates.some((template) => template.name.includes("Insight"))).toBe(false);
    expect(doc.resources).toEqual([]);
  });

  test("withholds a template a custom endpoint asked for rather than pointing it at the model", () => {
    // `resource: true` needs a uri, and `#uriTemplate` knows only the shapes the framework generates. Falling back
    // to the model's own published `akan://mcpPost/{mcpPostId}` twice — once under `summaryMcpPost` — where `parse`
    // sends it to `mcpPost` regardless, so the advertised read answered somebody else's endpoint or nothing, and
    // its own `status` argument was nowhere in the uri at all.
    const doc = new McpDocument(signal());
    expect(names(doc)).toContain("summaryMcpPost");
    expect(doc.resourceTemplates.map((template) => template.name)).not.toContain("summaryMcpPost");
    expect(doc.resourceTemplates.filter((t) => t.uriTemplate === "akan://mcpPost/{mcpPostId}")).toHaveLength(1);
    expect(doc.resolveResource("akan://mcpPost/6712ab34cd56ef7890123456")?.exposed.key).toBe("mcpPost");
    const refusal = doc.refusals.find(({ key }) => key === "summaryMcpPost");
    expect(refusal?.reason).toContain("no template");
  });

  test("refuses a prompt argument a flat string map cannot carry, whatever its type", () => {
    // `prompts/get` sends one string per name and no schema beside it. A list argument would silently cap at one
    // value; an `Any` has nowhere left to be described, which the tool path solves by leaving it out of a schema
    // a prompt does not have.
    const refusals = Object.fromEntries(new McpDocument(signal()).refusals.map(({ key, reason }) => [key, reason]));
    expect(refusals.tagsPrompt).toContain("`tags`");
    expect(refusals.tagsPrompt).toContain("more than one value");
    expect(refusals.rawArgPrompt).toContain("`filter`");
    expect(refusals.rawArgPrompt).toContain("no schema");
    // The same two types are fine on a tool, which publishes a real schema for them.
    expect(names(new McpDocument(signal()))).toContain("mcpPostListInPeriod");
  });

  test("names what it published with no description of its own", () => {
    // The scanner cannot answer this: it reads source, where `expose` is visible only as a literal in the builder
    // call, and where the model `.desc()` a generated entry borrows is not that entry's description at all.
    const text: Record<string, string> = {
      "mcpPost.signal.countMcpPosts.desc": "Counts every post",
      "mcpPost.signal.mcpPost": "Get Post",
      "mcpPost.signal.mcpPost.desc": "Get Post",
    };
    const undescribed = Object.fromEntries(
      new McpDocument(signal(), { resolveDescription: (key) => text[key] }).undescribed.map(({ key, reason }) => [
        key,
        reason,
      ]),
    );
    expect(undescribed.countMcpPosts).toBeUndefined();
    // "Get Post" is the framework's own text, and there is no model `.desc()` to append to it.
    expect(undescribed.mcpPost).toContain("`mcpPost` has no `.desc()`");
    expect(undescribed.mcpPostList).toContain("`mcpPost` has no `.desc()`");
    expect(undescribed.findMcpPost).toContain("no dictionary `.desc()`");
    // A prompt is chosen by its description exactly as a tool is.
    expect(undescribed.reviewMcpPost).toBeDefined();
    // Nothing refused is in here — it was never published.
    expect(undescribed.unguardedMcpPost).toBeUndefined();
    // Writing the model's own description is what clears all six generated entries at once.
    const described = new McpDocument(signal(), {
      resolveDescription: (key) => ({ ...text, "mcpPost.modelDesc": "An article somebody wrote" })[key],
    });
    expect(described.undescribed.map(({ key }) => key)).not.toContain("mcpPost");
    expect(described.undescribed.map(({ key }) => key)).not.toContain("mcpPostList");
  });

  test("resolves a uri only when its endpoint was advertised", () => {
    const doc = new McpDocument(signal());
    expect(doc.resolveResource("akan://mcpPost/6712ab34cd56ef7890123456")?.exposed.key).toBe("mcpPost");
    // Never advertised: an opted-out endpoint has to be unreachable, not merely refused later by its guards.
    expect(doc.resolveResource("akan://mcpTag/6712ab34cd56ef7890123456")).toBeNull();
    expect(doc.resolveResource("akan://mcpPost/list/internalOnly")).toBeNull();
  });

  test("refuses a resource template on a prompt rather than computing one and dropping it", () => {
    // A prompt is not a tool, so `resources/read` can never resolve to one. The key here matches a generated list,
    // which is what made the uri resolvable and the silence possible: the old branch order computed the template
    // and then `continue`d past the map it would have been stored in.
    const doc = new McpDocument(signal());
    expect(doc.findPrompt("mcpPostListDigest")).toBeDefined();
    expect(doc.resourceTemplates.map((template) => template.name)).not.toContain("mcpPostListDigest");
    expect(doc.resolveResource("akan://mcpPost/list/digest")).toBeNull();
    expect(doc.refusals.find(({ key }) => key === "mcpPostListDigest")?.reason).toContain("not honoured on a prompt");
  });

  test("lists a prompt with its arguments, and never as a tool", () => {
    const doc = new McpDocument(signal());
    expect(doc.prompts.map((prompt) => prompt.name)).toEqual(["mcpPostListDigest", "reviewMcpPost", "unguardedPrompt"]);
    // A prompt rides the `Any` carrier, which `#isExposable` refuses — the split has to happen before it.
    expect(names(doc)).not.toContain("reviewMcpPost");
    expect(doc.findPrompt("reviewMcpPost")?.prompt.arguments).toEqual([
      { name: "mcpPostId", required: true },
      { name: "tone", required: false },
    ]);
  });

  test("exposes a prompt on the same terms as a query", () => {
    const doc = new McpDocument(signal());
    // An empty guard list means public here exactly as it does for a query; opting in is the decision.
    expect(doc.findPrompt("unguardedPrompt")).toBeDefined();
    expect(doc.findPrompt("undeclaredPrompt")).toBeUndefined();
    // `prompts/get` sends a flat string map, so there is nowhere to put a body.
    expect(doc.findPrompt("bodyPrompt")).toBeUndefined();
  });

  test("carries dictionary text into a prompt and its arguments", () => {
    const text: Record<string, string> = {
      "mcpPost.signal.reviewMcpPost": "Review Post",
      "mcpPost.signal.reviewMcpPost.desc": "Drafts a review of one post",
      "mcpPost.signal.reviewMcpPost.arg.mcpPostId.desc": "Post to review",
    };
    const doc = new McpDocument(signal(), { resolveDescription: (key) => text[key] });
    expect(doc.findPrompt("reviewMcpPost")?.prompt).toMatchObject({
      title: "Review Post",
      description: "Drafts a review of one post",
      arguments: [{ name: "mcpPostId", description: "Post to review", required: true }, { name: "tone" }],
    });
  });

  test("orders the catalogue deterministically", () => {
    // Clients cache the list and an LLM prompt cache keys on its exact text.
    expect(names(new McpDocument(signal()))).toEqual(names(new McpDocument(signal())));
  });
});
