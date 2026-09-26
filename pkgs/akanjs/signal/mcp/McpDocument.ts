import { isMcpDescribableArg, mcpHintsOf, mcpRefusalOf } from "akanjs/common";
import { FetchClient } from "akanjs/fetch";
import { type AgentCandidate, AgentCatalogue, type AgentRefusal, type AgentUndescribed } from "../agent";
import { type JsonSchema, JsonSchemaBuilder } from "../schema";
import type { SerializedArg, SerializedEndpoint, SerializedSignal } from "../types";
import { McpUriTemplate } from "./McpUriTemplate";
import type { McpResource, McpResourceTemplate, McpTool, McpToolAnnotations } from "./mcpProtocol";

export interface McpDocumentOptions {
  resolveDescription?: (key: string) => string | undefined;
  excludeSignals?: string[];
  /** Drops every mutation from the catalogue whatever its guards allow. Off by default. */
  readOnly?: boolean;
  /**
   * `shallow` (default) names each nested model instead of inlining it, `full` inlines the closure, `none` publishes
   * no `outputSchema` (results still ship as `structuredContent`).
   */
  outputSchema?: McpOutputSchemaMode;
}

export type McpOutputSchemaMode = "full" | "shallow" | "none";

type McpSchemaSide = "input" | "output";

export interface McpExposedEndpoint {
  refName: string;
  key: string;
  endpoint: SerializedEndpoint;
}

export type McpRefusal = AgentRefusal;
export type McpUndescribed = AgentUndescribed;

export interface McpSignalCost {
  refName: string;
  entries: number;
  bytes: number;
}

export interface McpListingCost {
  bytes: number;
  bySignal: McpSignalCost[];
}

export class McpDocument {
  /** The spec types `structuredContent` as an object, so a list result is wrapped under this key. */
  static readonly listKey = "items";

  readonly tools: McpTool[];
  readonly resourceTemplates: McpResourceTemplate[];
  /** Every readable thing is addressed by a template, so there are no fixed resources to enumerate. */
  readonly resources: McpResource[] = [];
  readonly refusals: McpRefusal[];
  readonly undescribed: McpUndescribed[];
  readonly #schema = new JsonSchemaBuilder({ refPrefix: "#/$defs/", nullable: "type", face: "agent" });
  readonly #modelSchemas = new Map<McpSchemaSide, Record<string, JsonSchema>>();
  readonly #options: McpDocumentOptions;
  readonly #catalogue: AgentCatalogue;
  readonly #byToolName = new Map<string, McpExposedEndpoint>();
  readonly #templates = new Map<string, string>();
  #cost: McpListingCost | null = null;

  constructor(serializedSignal: Record<string, SerializedSignal>, options: McpDocumentOptions = {}) {
    this.#options = options;
    this.#catalogue = new AgentCatalogue(options);
    const tools = this.#collect(serializedSignal);
    this.refusals = this.#catalogue.refusals;
    this.tools = tools.map((item) => this.#tool(item));
    this.resourceTemplates = tools.flatMap((item) => {
      const uriTemplate = this.#templates.get(item.key);
      return uriTemplate ? [this.#template(item, uriTemplate)] : [];
    });
    // Read last: resolving the tool and template texts above is what fills it.
    this.undescribed = this.#catalogue.undescribed;
  }

  get listingCost(): McpListingCost {
    if (this.#cost) return this.#cost;
    const bySignal = new Map<string, McpSignalCost>();
    const add = (refName: string, entry: unknown) => {
      const cost = bySignal.get(refName) ?? { refName, entries: 0, bytes: 0 };
      cost.entries += 1;
      cost.bytes += JSON.stringify(entry).length;
      bySignal.set(refName, cost);
    };
    for (const tool of this.tools) add(this.#byToolName.get(tool.name)?.refName ?? tool.name, tool);
    const costs = [...bySignal.values()].sort((a, b) => b.bytes - a.bytes);
    this.#cost = { bytes: costs.reduce((sum, cost) => sum + cost.bytes, 0), bySignal: costs };
    return this.#cost;
  }

  findTool(name: string): McpExposedEndpoint | undefined {
    return this.#byToolName.get(name);
  }

  resourceUri(key: string, args: Record<string, unknown>): string | undefined {
    const template = this.#templates.get(key);
    return template ? McpUriTemplate.expand(template, args) : undefined;
  }

  /** Only a published template resolves: an opted-out endpoint must be unreachable, not merely refused by guards. */
  resolveResource(uri: string) {
    const target = McpUriTemplate.parse(uri);
    if (!target || !this.#templates.has(target.endpointKey)) return null;
    const exposed = this.#byToolName.get(target.endpointKey);
    return exposed ? { exposed, args: target.args } : null;
  }

  static structuredContent(endpoint: SerializedEndpoint, value: unknown) {
    if (!endpoint.returns.modelType) return undefined;
    if (endpoint.returns.arrDepth) return { [McpDocument.listKey]: value };
    // `null` cannot be `structuredContent` (an object), so an empty nullable return ships as the text block alone.
    return value === null || value === undefined ? undefined : value;
  }

  #collect(serializedSignal: Record<string, SerializedSignal>): McpExposedEndpoint[] {
    const tools: McpExposedEndpoint[] = [];
    for (const candidate of AgentCatalogue.candidates(serializedSignal, {
      excludeSignals: this.#options.excludeSignals,
    })) {
      const item: McpExposedEndpoint = {
        refName: candidate.refName,
        key: candidate.key,
        endpoint: candidate.endpoint,
      };
      const reason = mcpRefusalOf(item.endpoint, {
        refName: item.refName,
        key: item.key,
        readOnly: this.#options.readOnly,
      });
      if (reason) {
        this.#catalogue.refuse(item.key, reason);
        continue;
      }
      if (!this.#catalogue.claim(item.key)) continue;
      // A custom endpoint gets no template: `parse` would route the model's `akan://x/{xId}` to the model's own read.
      const uriTemplate = McpDocument.#addressable(candidate)
        ? McpDocument.#uriTemplate(item.refName, item.key, item.endpoint)
        : undefined;
      this.#byToolName.set(item.key, item);
      if (uriTemplate) this.#templates.set(item.key, uriTemplate);
      tools.push(item);
    }
    return tools;
  }

  static #addressable({ origin, refName, key, baseVerb }: AgentCandidate): boolean {
    if (origin === "base") return baseVerb === "get";
    if (origin === "slice") return key.startsWith(`${refName}List`);
    return false;
  }

  #tool({ refName, key, endpoint }: McpExposedEndpoint): McpTool {
    const { paramArgs, searchArgs, bodyArgs } = FetchClient.classifyHttpArgs(endpoint.args);
    // MCP hands over one flat named object, so path, query and body args are all just properties of it.
    const args = [...paramArgs, ...searchArgs, ...bodyArgs].filter(isMcpDescribableArg);
    const properties = Object.fromEntries(args.map((arg) => [arg.name, this.#argSchema(refName, key, arg)]));
    // A search arg is never required: the generated `skip`/`limit`/`sort` are serialized without a nullable flag.
    const required = [...paramArgs, ...bodyArgs]
      .filter((arg) => isMcpDescribableArg(arg) && !arg.nullable)
      .map((arg) => arg.name);
    const outputSchema = this.#outputSchema(endpoint);
    return {
      name: key,
      ...this.#catalogue.entryTexts(refName, key),
      inputSchema: {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
        ...this.#defs(properties, "input"),
      },
      ...(outputSchema ? { outputSchema } : {}),
      annotations: mcpHintsOf(key, endpoint) satisfies McpToolAnnotations,
    };
  }

  #outputSchema(endpoint: SerializedEndpoint) {
    if (this.#options.outputSchema === "none") return undefined;
    // An `outputSchema` obliges every result to match it as an object, which a scalar or an empty (`null`) single
    // return cannot; a nullable list can, inside its `{ items }` wrapper.
    if (!endpoint.returns.modelType) return undefined;
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
    return { ...schema, ...this.#defs(schema, "output") };
  }

  #defs(seed: unknown, side: McpSchemaSide) {
    const defs = this.#schema.referencedSchemas(seed, this.#modelSchemasOf(side));
    // The spec forbids dereferencing a `$ref` over the network, so every model a tool mentions travels inside it.
    return Object.keys(defs).length ? { $defs: defs } : {};
  }

  // A request asks for a relation's id, which is what the wire carries.
  #modelSchemasOf(side: McpSchemaSide) {
    const cached = this.#modelSchemas.get(side);
    if (cached) return cached;
    const schemas =
      side === "input"
        ? this.#schema.allModelSchemas({ relations: "id", idPattern: false })
        : this.#schema.allModelSchemas({
            // `resolveReturn` strips hidden/secret fields, and on a model like `user` their names alone are the leak.
            readable: true,
            relations: this.#options.outputSchema === "full" ? "inline" : "named",
            idPattern: false,
          });
    this.#modelSchemas.set(side, schemas);
    return schemas;
  }

  #argSchema(refName: string, key: string, arg: SerializedArg) {
    const description = this.#options.resolveDescription?.(`${refName}.signal.${key}.arg.${arg.name}.desc`);
    return {
      ...this.#schema.arg(arg),
      ...(description ? { description } : {}),
      ...(arg.example !== undefined ? { examples: [arg.example] } : {}),
    };
  }

  #template({ refName, key }: McpExposedEndpoint, uriTemplate: string): McpResourceTemplate {
    return {
      uriTemplate,
      name: key,
      ...this.#catalogue.entryTexts(refName, key),
      mimeType: "application/json",
    };
  }

  static #uriTemplate(refName: string, key: string, endpoint: SerializedEndpoint) {
    if (key === refName) return McpUriTemplate.model(refName);
    const listPrefix = `${refName}List`;
    if (!key.startsWith(listPrefix)) return undefined;
    const suffix = key.slice(listPrefix.length);
    // Read the args off the endpoint: pagination comes from the client generator, and a slice's required params
    // must be in the uri too — both travel as form-style query expansion, which `McpUriTemplate.parse` reads back.
    const argNames = endpoint.args
      .filter((arg) => (arg.type === "param" || arg.type === "search") && isMcpDescribableArg(arg))
      .map((arg) => arg.name);
    return McpUriTemplate.list(refName, suffix ? `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}` : "", argNames);
  }
}
