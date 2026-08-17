import { capitalize, isMcpDescribableArg, mcpBaseVerbOf, mcpHintsOf, mcpRefusalOf } from "akanjs/common";
import { FetchClient } from "akanjs/fetch";
import { type JsonSchema, JsonSchemaBuilder } from "../schema";
import type { McpOption, SerializedArg, SerializedEndpoint, SerializedSignal } from "../types";
import { McpUriTemplate } from "./McpUriTemplate";
import type { McpPrompt, McpResource, McpResourceTemplate, McpTool, McpToolAnnotations } from "./mcpProtocol";

export interface McpDocumentOptions {
  resolveDescription?: (key: string) => string | undefined;
  excludeSignals?: string[];
  /**
   * Drops every mutation from the catalogue regardless of what it opted into. Off by default: the endpoint's own
   * `mcp: { expose: true }` plus its guards are the decision, and a second switch that silently unlists a
   * deliberately exposed endpoint gives its author no way to see why. This is the read-only-deployment valve.
   */
  readOnly?: boolean;
}

export interface McpExposedEndpoint {
  refName: string;
  key: string;
  endpoint: SerializedEndpoint;
  mcp: McpOption;
}

/**
 * An opt-in the catalogue did not honour, with the reason it did not — the whole endpoint, or only the resource
 * template it asked for.
 */
export interface McpRefusal {
  key: string;
  reason: string;
}

/** A published entry carrying no description its author wrote, and what to write so that it does. */
export interface McpUndescribed {
  key: string;
  reason: string;
}

/**
 * Turns the serialized signal registry into the three MCP catalogues and answers the lookups `tools/call` and
 * `resources/read` need. Pure: no IO and no DI — the sibling of `createOpenApiDocument`.
 */
export class McpDocument {
  /**
   * An array cannot be `structuredContent` — the spec types it as an object — so a list result is wrapped under
   * this key and `outputSchema` is shaped to match. Both halves must agree, which is why they live together.
   */
  static readonly listKey = "items";

  readonly tools: McpTool[];
  readonly prompts: McpPrompt[];
  readonly resourceTemplates: McpResourceTemplate[];
  /** Every readable thing is addressed by a template, so there are no fixed resources to enumerate. */
  readonly resources: McpResource[] = [];
  /**
   * What opted in and was refused anyway. Collected rather than merely dropped so the server can say so at boot:
   * the rejections below are fail-closed by design, and an author whose deliberate `expose: true` vanished from
   * the catalogue otherwise has nowhere to look but the framework source.
   */
  readonly refusals: McpRefusal[];
  /**
   * What is published with no description of its own. Description is the one field a model picks a tool by, so an
   * entry without one is a broken tool rather than an untidy one — and `akan quality scan` cannot answer this: it
   * reads source, where `expose` is visible only as a literal in the builder call, and where the model `.desc()`
   * every generated entry borrows is not written as a description of the entry at all.
   */
  readonly undescribed: McpUndescribed[];
  /**
   * Published tools whose endpoint declares no guards at all. Not a refusal — the access is the same as an
   * explicit `[Public]`, and reads are legitimately public — but the two are a different act, and only one of them
   * is a decision someone made. A slice's `guards: { get: … }` reaches the root slice and base CRUD and never a
   * named slice, so a named slice that opted into MCP is the shape that silently arrives here.
   *
   * Prompts are left out: one with no guards is already warned about where it is resolved, because its GET route
   * is mounted whether or not the app enables MCP.
   */
  readonly unguarded: string[];

  readonly #schema = new JsonSchemaBuilder({ refPrefix: "#/$defs/" });
  #allSchemas: Record<string, JsonSchema> | null = null;
  #readSchemas: Record<string, JsonSchema> | null = null;
  readonly #options: McpDocumentOptions;
  readonly #byToolName = new Map<string, McpExposedEndpoint>();
  readonly #byPromptName = new Map<string, { exposed: McpExposedEndpoint; prompt: McpPrompt }>();
  /** Keyed by endpoint key: what is addressable, and by exactly which uri. */
  readonly #templates = new Map<string, string>();
  /** Keyed so an entry read twice — once as a tool and again as a template — is reported once. */
  readonly #undescribedByKey = new Map<string, string>();

  constructor(serializedSignal: Record<string, SerializedSignal>, options: McpDocumentOptions = {}) {
    this.#options = options;
    const { tools, prompts, refusals, unguarded } = this.#collect(serializedSignal);
    this.refusals = refusals;
    this.unguarded = unguarded;
    this.tools = tools.map((item) => this.#tool(item));
    this.prompts = prompts.map((item) => {
      const prompt = this.#prompt(item);
      this.#byPromptName.set(item.key, { exposed: item, prompt });
      return prompt;
    });
    this.resourceTemplates = tools.flatMap((item) => {
      const uriTemplate = this.#templates.get(item.key);
      return uriTemplate ? [this.#template(item, uriTemplate)] : [];
    });
    // Last: every branch above resolves text, and this is what they left behind.
    this.undescribed = [...this.#undescribedByKey].map(([key, reason]) => ({ key, reason }));
  }

  findTool(name: string): McpExposedEndpoint | undefined {
    return this.#byToolName.get(name);
  }

  /** Returns the catalogue entry alongside the endpoint: `prompts/get` validates against the published one. */
  findPrompt(name: string) {
    return this.#byPromptName.get(name);
  }

  /**
   * Resolves a URI only when the endpoint behind it was published as a template. An endpoint that was never
   * advertised has to fail here rather than fall through to its guards: opting out of MCP means keeping a thing
   * off the wire entirely, not merely making it refuse.
   */
  resolveResource(uri: string) {
    const target = McpUriTemplate.parse(uri);
    if (!target || !this.#templates.has(target.endpointKey)) return null;
    const exposed = this.#byToolName.get(target.endpointKey);
    return exposed ? { exposed, args: target.args } : null;
  }

  static structuredContent(endpoint: SerializedEndpoint, value: unknown) {
    if (!endpoint.returns.modelType) return undefined;
    if (endpoint.returns.arrDepth) return { [McpDocument.listKey]: value };
    // A nullable return that found nothing has nowhere to ride: `structuredContent` is an object, so `null` is as
    // unshippable there as an array is. It goes out as the text block alone — `#outputSchema` declines to promise
    // a structured result for this shape, so nothing is left unmatched by leaving it off.
    return value === null || value === undefined ? undefined : value;
  }

  #collect(serializedSignal: Record<string, SerializedSignal>): {
    tools: McpExposedEndpoint[];
    prompts: McpExposedEndpoint[];
    refusals: McpRefusal[];
    unguarded: string[];
  } {
    const excluded = new Set(this.#options.excludeSignals ?? ["base"]);
    const collected: McpExposedEndpoint[] = [];
    for (const [refName, signal] of Object.entries(serializedSignal)) {
      if (excluded.has(refName)) continue;
      for (const [key, endpoint] of Object.entries(FetchClient.getBaseEndpoint(refName, signal))) {
        const verb = mcpBaseVerbOf(refName, key);
        if (!verb || !signal.mcp?.[verb]) continue;
        collected.push({ refName, key, endpoint, mcp: { expose: true, resource: verb === "get" } });
      }
      for (const [suffix, slice] of Object.entries(signal.slice ?? {})) {
        if (!slice.mcp?.expose) continue;
        for (const [key, endpoint] of Object.entries(FetchClient.getEndpointFromSlice(refName, suffix, slice))) {
          // Only the list side is addressable; an insight is an aggregate with nothing to point a URI at.
          const resource = slice.mcp.resource !== false && key.startsWith(`${refName}List`);
          collected.push({ refName, key, endpoint, mcp: { ...slice.mcp, resource } });
        }
      }
      for (const [key, endpoint] of Object.entries(signal.endpoint)) {
        if (!endpoint.mcp?.expose) continue;
        collected.push({ refName, key, endpoint, mcp: endpoint.mcp });
      }
    }
    // Deterministic order: clients cache the list, and an LLM prompt cache keys on its exact text.
    const sorted = collected.sort((a, b) => a.refName.localeCompare(b.refName) || a.key.localeCompare(b.key));
    const tools: McpExposedEndpoint[] = [];
    const prompts: McpExposedEndpoint[] = [];
    const refusals: McpRefusal[] = [];
    const unguarded: string[] = [];
    const seen = new Set<string>();
    for (const item of sorted) {
      // A name must be unique within the server, across tools and prompts alike. Keys are globally unique by
      // construction, so a collision means two signals disagree — keep the first in sorted order so the
      // catalogue stays stable either way.
      if (seen.has(item.key)) {
        refusals.push({ key: item.key, reason: "another endpoint is already published under this name." });
        continue;
      }
      // Fail-closed and shared with the API explorer, so the reason an author reads is the rule that ran.
      const reason = mcpRefusalOf(item.endpoint, { readOnly: this.#options.readOnly });
      if (reason) {
        refusals.push({ key: item.key, reason });
        continue;
      }
      seen.add(item.key);
      if (item.endpoint.type === "prompt") {
        // A prompt is never addressable: `resources/read` resolves a template to a tool, and a prompt is not one.
        // Refused by kind rather than by key shape — a prompt keyed like a generated list (`xListY`) computed a uri
        // and then dropped it on the way out, which was the last place an option went quietly unhonoured.
        if (item.mcp.resource)
          refusals.push({
            key: item.key,
            reason: "`resource: true` is not honoured on a prompt: only a read publishes a resource template.",
          });
        prompts.push(item);
        continue;
      }
      // `resource: true` asks for a uri, and only the reads the framework generates have one — `#uriTemplate` knows
      // those key shapes and nothing else. Falling back to the model's own, which this did, published
      // `akan://x/{xId}` under a custom endpoint's name: the same uri the model's own `get` publishes, which
      // `parse` then routes to *that* endpoint, so every read of the advertised template answered somebody else or
      // nothing at all. The tool is unaffected, so only the template is withheld — and said out loud, because an
      // option that is quietly not honoured is the same silence the refusal list exists to end.
      const uriTemplate = item.mcp.resource
        ? McpDocument.#uriTemplate(item.refName, item.key, item.endpoint)
        : undefined;
      if (item.mcp.resource && !uriTemplate)
        refusals.push({
          key: item.key,
          reason: "`resource: true` needs the uri shape only a generated read has, so it carries no template.",
        });
      this.#byToolName.set(item.key, item);
      if (uriTemplate) this.#templates.set(item.key, uriTemplate);
      if (!item.endpoint.guards?.length) unguarded.push(item.key);
      tools.push(item);
    }
    return { tools, prompts, refusals, unguarded };
  }

  #tool({ refName, key, endpoint, mcp }: McpExposedEndpoint): McpTool {
    const { paramArgs, searchArgs, bodyArgs } = FetchClient.classifyHttpArgs(endpoint.args);
    // MCP hands over one flat named object, so path, query and body args are all just properties of it.
    const args = [...paramArgs, ...searchArgs, ...bodyArgs].filter(isMcpDescribableArg);
    const properties = Object.fromEntries(args.map((arg) => [arg.name, this.#argSchema(refName, key, arg)]));
    // A search arg is optional by construction, the way OpenAPI marks only path params required — the generated
    // `skip`/`limit`/`sort` are serialized without a nullable flag, so reading one here would demand them.
    const required = [...paramArgs, ...bodyArgs]
      .filter((arg) => isMcpDescribableArg(arg) && !arg.nullable)
      .map((arg) => arg.name);
    const outputSchema = this.#outputSchema(endpoint);
    return {
      name: key,
      ...this.#entryTexts(refName, key),
      inputSchema: {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
        ...this.#defs(properties),
      },
      ...(outputSchema ? { outputSchema } : {}),
      annotations: mcpHintsOf(key, endpoint, mcp) satisfies McpToolAnnotations,
    };
  }

  /**
   * A prompt's arguments are a flat string map on the wire, so there is no schema to publish — only names,
   * descriptions and which ones must be filled. A `param` is a path segment and always required; a `search` is
   * the only way to declare an optional one.
   */
  #prompt({ refName, key, endpoint }: McpExposedEndpoint): McpPrompt {
    const args = endpoint.args.filter((arg) => arg.type === "param" || arg.type === "search");
    return {
      name: key,
      ...this.#entryTexts(refName, key),
      ...(args.length
        ? {
            arguments: args.map((arg) => {
              const description = this.#options.resolveDescription?.(`${refName}.signal.${key}.arg.${arg.name}.desc`);
              return {
                name: arg.name,
                ...(description ? { description } : {}),
                required: arg.type === "param",
              };
            }),
          }
        : {}),
    };
  }

  #outputSchema(endpoint: SerializedEndpoint) {
    // A scalar return ships as text only: `structuredContent` must be an object, and declaring an `outputSchema`
    // obliges the server to produce a result that matches it.
    if (!endpoint.returns.modelType) return undefined;
    // Same obligation, and a nullable single return cannot keep it: the empty answer is `null`, which is not an
    // object and so cannot be `structuredContent` at all. A schema here would be a promise broken by the first
    // call that finds nothing — clients reject that harder than they miss a schema. A nullable *list* is fine,
    // because the wrapper `{ items: … }` is an object whatever rides inside it.
    if (endpoint.returns.nullable && !endpoint.returns.arrDepth) return undefined;
    const returns = this.#schema.returns(endpoint.returns);
    const schema = endpoint.returns.arrDepth
      ? {
          type: "object",
          properties: { [McpDocument.listKey]: returns },
          required: [McpDocument.listKey],
          additionalProperties: false,
        }
      : returns;
    // `readable` because this describes what comes back: `resolveReturn` strips every `hidden` and `secret` field,
    // so publishing their names here promises a property no answer will ever carry — and on a model like `user`,
    // the names alone (`password`, `accountId`) are the whole leak. Input keeps them: they are legal to send.
    return { ...schema, ...this.#defs(schema, { readable: true }) };
  }

  #defs(seed: unknown, { readable = false } = {}) {
    const defs = this.#schema.referencedSchemas(seed, this.#modelSchemas(readable));
    // A tool schema has to resolve on its own: the spec forbids dereferencing a `$ref` over the network, so every
    // model a tool mentions travels inside that tool rather than in a shared component section.
    return Object.keys(defs).length ? { $defs: defs } : {};
  }

  /**
   * Every registered model, built once per shape for the whole document. Narrowing runs twice per tool — input
   * schema and output schema — so deriving the full set inside each call rebuilt every model in the app 2N times.
   */
  #modelSchemas(readable: boolean) {
    if (!readable) {
      this.#allSchemas ??= this.#schema.allModelSchemas();
      return this.#allSchemas;
    }
    this.#readSchemas ??= this.#schema.allModelSchemas({ readable: true });
    return this.#readSchemas;
  }

  #argSchema(refName: string, key: string, arg: SerializedArg) {
    const description = this.#options.resolveDescription?.(`${refName}.signal.${key}.arg.${arg.name}.desc`);
    return {
      ...this.#schema.arg(arg),
      ...(description ? { description } : {}),
      ...(arg.example !== undefined ? { examples: [arg.example] } : {}),
    };
  }

  #texts(titleKey: string, descKey = `${titleKey}.desc`) {
    const title = this.#options.resolveDescription?.(titleKey);
    const description = this.#options.resolveDescription?.(descKey);
    return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
  }

  /**
   * Every entry the framework generates borrows the model's own words, because none of them has any of its own.
   *
   * `slice()` generates the root slice under the empty key and `baseSliceDictionary` fills its text, so
   * `<model>List` and `<model>Insight` publish as "Slice List - Universal" whatever the dictionary says. The five
   * base CRUD entries are no better off: `getBaseSignalDictionary` writes "Get Banner" as both title and
   * description, and both are assigned last, so a module author has nowhere to write over either one.
   *
   * That matters more here than anywhere else — description is the one field a model picks a tool by, and "Get
   * Banner" says nothing about what a Banner is. So the model's `.desc()` is appended rather than substituted:
   * on `removeBanner` a bare model description would read as if the tool returned one. And when the model has no
   * `.desc()` either, the entry is recorded as undescribed — its only possible text is missing, and that is the
   * one thing a source scanner cannot see.
   */
  #entryTexts(refName: string, key: string) {
    const borrowed = `its only text is the model's own, and \`${refName}\` has no \`.desc()\` to lend it.`;
    if (key === `${refName}List` || key === `${refName}Insight`) {
      const texts = this.#texts(`${refName}.modelName`, `${refName}.modelDesc`);
      if (!texts.description) this.#undescribedByKey.set(key, borrowed);
      return texts;
    }
    const texts = this.#texts(`${refName}.signal.${key}`);
    if (!mcpBaseVerbOf(refName, key)) {
      if (!texts.description)
        this.#undescribedByKey.set(key, "it has no dictionary `.desc()`, so an agent has its name and nothing else.");
      return texts;
    }
    const modelDesc = this.#options.resolveDescription?.(`${refName}.modelDesc`);
    if (!modelDesc) this.#undescribedByKey.set(key, borrowed);
    const generated = texts.description ?? texts.title;
    return modelDesc ? { ...texts, description: generated ? `${generated} — ${modelDesc}` : modelDesc } : texts;
  }

  #template({ refName, key }: McpExposedEndpoint, uriTemplate: string): McpResourceTemplate {
    return {
      uriTemplate,
      name: key,
      ...this.#entryTexts(refName, key),
      mimeType: "application/json",
    };
  }

  static #uriTemplate(refName: string, key: string, endpoint: SerializedEndpoint) {
    if (key === refName) return McpUriTemplate.model(refName);
    if (key === `light${capitalize(refName)}`) return McpUriTemplate.light(refName);
    const listPrefix = `${refName}List`;
    if (!key.startsWith(listPrefix)) return undefined;
    const suffix = key.slice(listPrefix.length);
    // Pagination args are added by the client generator rather than the slice, so read them off the endpoint.
    // `param` args count too: a slice may declare required ones (`init().param("from", Date)`), and a template
    // that omits them addresses a read that can only fail. Both kinds travel as form-style query expansion,
    // which is exactly what `McpUriTemplate.parse` reads back.
    const argNames = endpoint.args
      .filter((arg) => (arg.type === "param" || arg.type === "search") && isMcpDescribableArg(arg))
      .map((arg) => arg.name);
    return McpUriTemplate.list(refName, suffix ? `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}` : "", argNames);
  }
}
