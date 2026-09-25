import type { McpPromptArgument } from "./mcpProtocol";

/** One `page().prompt(name, description)` as the catalogue lists it, with the route it was declared on. */
export interface PagePromptEntry {
  name: string;
  description: string;
  arguments: McpPromptArgument[];
  /** The matched route pattern (`/:lang/project/:projectId`), which is also what names the screen to a model. */
  pattern: string;
}

/** One `fetch.*` query the page made while its body ran, with the answer it received. */
export interface PagePromptRecord {
  key: string;
  args: Record<string, unknown>;
  returns: { refName: string; modelType?: string; arrDepth?: number; nullable?: boolean };
  value?: unknown;
  error?: string;
}

/** `forbidden` is a data call inside the body refused with 401/403: the screen is not this caller's, like a redirect. */
export type PagePromptRefusal = "unknown" | "argument" | "redirect" | "forbidden" | "not-found" | "error";

export type PagePromptRun =
  | { ok: true; url: string; records: PagePromptRecord[] }
  | { ok: false; reason: PagePromptRefusal; message: string };

export interface PagePromptRunInput {
  name: string;
  /** `prompts/get` sends a flat string map; the page's own declaration types each value. */
  arguments: Record<string, string>;
  /** The caller's request headers the page run should carry — the bearer token above all. */
  headers: [string, string][];
  /** The locale segment the synthetic URL starts with; the route needs one whether or not the page reads it. */
  language?: string;
}

/**
 * Where page prompts come from. Pages live in the RSC worker, a process apart from the one that serves `/mcp`,
 * so the MCP router speaks to them through this rather than by importing route modules of its own.
 */
export interface PagePromptSource {
  list(): Promise<PagePromptEntry[]>;
  run(input: PagePromptRunInput): Promise<PagePromptRun>;
}
