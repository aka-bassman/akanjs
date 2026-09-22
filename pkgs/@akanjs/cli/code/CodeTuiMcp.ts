import type { CodeAgentMcpServerRef, CodeAgentMcpStatus } from "akanjs/common";

export interface CodeTuiMcpView {
  /** What the session actually connected to, fixed when it was created. */
  status: CodeAgentMcpStatus[];
  /** What the file says now, which is not the same list once something has been added or removed. */
  declared: { ref: CodeAgentMcpServerRef; disabled: boolean }[];
  file: string;
  /** Why the file yielded nothing, when it exists and yielded nothing. */
  problem?: string;
}

/**
 * What `/mcp` puts on screen.
 *
 * The two lists it reads are deliberately different: the session's tool allowlist is built once, at creation,
 * so a server added to the file five seconds ago is declared and unreachable at the same time. Showing only
 * one of the lists makes that state look like a server that is broken, or like one that took effect when it
 * did not — which is the whole reason a reload has to be offered rather than assumed.
 */
export class CodeTuiMcp {
  /** Written into a tool name as `mcp__<name>__<tool>`, so two names that sanitize alike shadow each other. */
  static readonly namePattern = /^[a-zA-Z0-9_-]+$/;

  static readonly usage = [
    "/mcp add <name> <command> [args…]   declare a server this session starts",
    "/mcp add <name> <https://…>         declare one it reaches over http",
    "/mcp login <name>                   sign in through the browser (OAuth)",
    "/mcp logout <name>                  forget the token, leaving the server declared",
    "/mcp remove <name>                  undeclare it",
    "/mcp reload                         reopen this session so the file takes effect",
  ];

  static list(view: CodeTuiMcpView) {
    const lines = view.problem ? [view.problem, ""] : [];
    const rows = CodeTuiMcp.#rows(view);
    if (!rows.length)
      return [
        ...lines,
        "No MCP server is declared.",
        "",
        `Declare one here, or paste an editor's \`mcpServers\` block into ${view.file}.`,
        "",
        ...CodeTuiMcp.usage,
      ].join("\n");
    const width = (at: number) => Math.max(...rows.map((row) => (row[at] ?? "").length)) + 2;
    const [name, transport, target] = [width(0), width(1), width(2)];
    return [
      ...lines,
      `${rows.length} server${rows.length === 1 ? "" : "s"} · ${view.file}`,
      "",
      ...rows.map(
        ([a, b, c, d]) =>
          `${(a ?? "").padEnd(name)}${(b ?? "").padEnd(transport)}${(c ?? "").padEnd(target)}${d ?? ""}`,
      ),
      "",
      ...CodeTuiMcp.usage,
    ].join("\n");
  }

  /**
   * One row per server, by name, over the union of the two lists.
   *
   * A server drops out of the file while this session still holds its connection — `/mcp remove` without a
   * reload — and one appears in the file that the session never saw. Both are real, and neither is an error.
   */
  static #rows(view: CodeTuiMcpView) {
    const byName = new Map<string, { ref?: CodeAgentMcpServerRef; disabled?: boolean; live?: CodeAgentMcpStatus }>();
    for (const entry of view.declared) byName.set(entry.ref.name, { ref: entry.ref, disabled: entry.disabled });
    for (const live of view.status) byName.set(live.name, { ...byName.get(live.name), live });
    return [...byName]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, entry]) => {
        const transport = entry.live?.transport ?? entry.ref?.transport ?? "";
        const target = entry.live?.target ?? CodeTuiMcp.targetOf(entry.ref);
        return [name, transport, target, CodeTuiMcp.#stateOf(entry)];
      });
  }

  static #stateOf(entry: { ref?: CodeAgentMcpServerRef; disabled?: boolean; live?: CodeAgentMcpStatus }) {
    if (entry.disabled) return "disabled in the file";
    if (!entry.live) return "declared · /mcp reload to connect";
    // Before the error branch: a 401 is a server answering correctly, and calling it broken sends somebody to
    // debug one that is working exactly as its owner intended.
    if (entry.live.auth === "required") return `sign-in needed · /mcp login ${entry.live.name}`;
    if (entry.live.error) return `unreachable — ${entry.live.error}`;
    const tools = `${entry.live.tools.length} tool${entry.live.tools.length === 1 ? "" : "s"}`;
    if (!entry.ref) return `${tools} · removed from the file`;
    return entry.live.auth === "authorized" ? `${tools} · signed in` : tools;
  }

  static targetOf(ref: CodeAgentMcpServerRef | undefined) {
    if (!ref) return "";
    return ref.url ?? [ref.command, ...(ref.args ?? [])].filter(Boolean).join(" ");
  }

  /** The tools one server published, which is the only answer to "did it actually come up". */
  static tools(status: CodeAgentMcpStatus) {
    if (status.error) return `${status.name} is unreachable — ${status.error}`;
    if (!status.tools.length) return `${status.name} connected and published no tools.`;
    return [`${status.name} · ${status.target}`, "", status.tools.join("\n")].join("\n");
  }
}
