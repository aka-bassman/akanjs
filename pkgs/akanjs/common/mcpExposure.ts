import { capitalize } from "./capitalize";

/**
 * What MCP says about one endpoint: whether it is published, why it is not, and the hints it carries.
 *
 * Structurally typed like the rest of `common/` so the same rules answer on both sides — the server builds its
 * catalogue from them and the browser API explorer badges an endpoint from them. A second implementation would
 * eventually disagree, and an audit surface that disagrees with the catalogue is worse than none.
 *
 * Every rejection returns the sentence an author reads, at boot in the server log and in the explorer. Fail-closed
 * with no reason leaves an author whose endpoint is missing from the catalogue nowhere to look but the source.
 */
export interface McpExposureEndpoint {
  type: string;
  returns: { refName: string };
  args: { name: string; refName: string; type: string; arrDepth?: number; nullable?: boolean }[];
  guards?: string[];
  fileUpload?: boolean;
  mcp?: boolean;
  /** `false` when a guard declares `static agents = false`: no model may ever pass, whatever else the guards say. */
  agents?: boolean;
}

export interface McpExposureOption {
  /** The model the endpoint belongs to and the name it is published under: one rule reads the key, not the shape. */
  refName: string;
  key: string;
  /**
   * The read-only deployment valve, which is server configuration. The browser explorer cannot know it and so
   * badges what the code decided; the boot log is where a read-only deployment says what it dropped.
   */
  readOnly?: boolean;
}

/** `Any` publishes as the empty schema, which tells a model nothing — so it is left out rather than described. */
export const isMcpDescribableArg = (arg: { refName: string }) => arg.refName !== "Any";

/** Which CRUD verb a generated endpoint key is, or `null` when the key is not one of the five. */
export const mcpBaseVerbOf = (refName: string, key: string) => {
  const cap = capitalize(refName);
  if (key === refName || key === `light${cap}`) return "get" as const;
  if (key === `create${cap}`) return "create" as const;
  if (key === `update${cap}`) return "update" as const;
  if (key === `remove${cap}`) return "remove" as const;
  return null;
};

/**
 * The hints a client renders beside a tool. Hints only — clients are told to distrust them, so they inform a UI
 * and never stand in for a guard. `openWorldHint` is always false: every endpoint reaches this app's own
 * database, not the wider internet.
 */
export const mcpHintsOf = (key: string, endpoint: { type: string }) => {
  const readOnly = endpoint.type === "query";
  const destructive = !readOnly && /^(remove|delete)/.test(key);
  return {
    readOnlyHint: readOnly,
    destructiveHint: destructive,
    idempotentHint: readOnly || /^(set|update)/.test(key),
    openWorldHint: false,
  };
};

/** The sentence explaining why this endpoint is not in the catalogue, or `null` when it is. */
export const mcpRefusalOf = (
  endpoint: McpExposureEndpoint,
  { refName, key, readOnly }: McpExposureOption,
): string | null => {
  // First, because it is the one answer nobody has to derive: somebody stated it. Curation, not authorization —
  // HTTP serves this endpoint exactly as before, and its guards are still what decide who may call it.
  if (endpoint.mcp === false)
    return "it declares `mcp: false`, so it is deliberately off the agent shelf. HTTP still serves it.";
  // Also stated, one level down: a guard that admits no model. Publishing the entry would offer every agent a tool
  // it can only be refused, and hiding it per caller at listing time would still leave it in the document.
  if (endpoint.agents === false)
    return `its guards (${(endpoint.guards ?? []).join(", ")}) admit no agent — an act reserved for a person, so it is off the agent shelf. HTTP still serves it.`;
  // The whole exposure policy, and the first gate because it applies to every kind. Publishing follows the guards:
  // an endpoint with none has had no decision made about who may reach it, and a catalogue entry is the one place
  // that omission stops being invisible. `guards: [Public]` is the same access, written down, and publishes.
  if (!endpoint.guards?.length)
    return "it declares no guards, and exposure follows them — write `guards: [Public]` if anonymous access is the intent.";
  // `light<Model>` reads the same document as `<Model>` under the same guards, in a shape trimmed for a page's
  // payload rather than for a model. Publishing both spends two entries of every catalogue listing on one read.
  if (key === `light${capitalize(refName)}`)
    return `it reads the same document as \`${refName}\` in a smaller shape — call \`${refName}\` instead.`;
  if (endpoint.type === "pubsub" || endpoint.type === "message")
    return `\`${endpoint.type}\` rides the websocket, and its internal arguments read a socket an MCP request does not have.`;
  if (readOnly && endpoint.type !== "query")
    return "this deployment is read-only, which drops every endpoint that is not a query.";
  if (endpoint.returns.refName === "Any" || endpoint.returns.refName === "Upload")
    return `a return typed \`${endpoint.returns.refName}\` cannot be described to a model.`;
  if (endpoint.returns.refName === "Binary")
    return "a return typed `Binary` is raw bytes, which cost a model its window and tell it nothing.";
  if (endpoint.fileUpload || endpoint.args.some((arg) => arg.refName === "Upload"))
    return "a file upload has no MCP representation.";
  if (endpoint.type === "mutation" && !endpoint.guards.some((name) => name !== "Public"))
    return "a mutation needs a real guard — `[Public]` is having none, spelled out.";
  const opaque = endpoint.args.find((arg) => !isMcpDescribableArg(arg) && arg.type !== "search" && !arg.nullable);
  if (opaque)
    return `its required argument \`${opaque.name}\` is typed \`Any\`, which is left out of the published schema — expose a named filter slice instead.`;
  return null;
};
