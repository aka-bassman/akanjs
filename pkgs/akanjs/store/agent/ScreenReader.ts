const skipTags = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "IFRAME",
  "SVG",
  "CANVAS",
  "VIDEO",
  "AUDIO",
  "OBJECT",
  "EMBED",
]);
const headingLevels = { H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6 } as const;
const blockTags = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DD",
  "DETAILS",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "HEADER",
  "HR",
  "LEGEND",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "SECTION",
  "SUMMARY",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "UL",
]);

/**
 * Serializes what the page is rendering into compact text an agent can answer questions from: headings keep their
 * level, links keep their href, controls keep their value and `data-akan-*` annotation. The agent's own UI is
 * marked `data-agent-ui` and skipped, so a turn never re-reads its own transcript, and a password value is never
 * read — the screen shows dots, so the DOM holds more than the user sees.
 */
export class ScreenReader {
  static readonly limit = 8000;

  static read(root?: HTMLElement | null): string {
    if (typeof document === "undefined") return "No rendered document is available.";
    const reader = new ScreenReader();
    const title = document.title.trim();
    if (title) reader.#lines.push(`Page: ${title}`);
    reader.#walk(root ?? document.body);
    reader.#flush();
    const text = reader.#lines.join("\n").trim();
    if (text.length <= ScreenReader.limit) return text || "The page is rendering nothing readable.";
    return `${text.slice(0, ScreenReader.limit)}… [truncated ${text.length - ScreenReader.limit} more characters]`;
  }

  #lines: string[] = [];
  #buffer = "";
  #length = 0;

  #walk(node: Node): void {
    if (this.#length > ScreenReader.limit * 2) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ");
      if (text.trim()) this.#buffer += text;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();
    if (skipTags.has(tag)) return;
    if (el.hasAttribute("data-agent-ui") || el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true")
      return;
    if (typeof el.checkVisibility === "function" && !el.checkVisibility()) return;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      this.#control(el, tag);
      return;
    }
    if (tag === "IMG") {
      const alt = el.getAttribute("alt");
      if (alt) this.#buffer += ` [image: ${alt}]`;
      return;
    }
    if (tag === "BR") {
      this.#flush();
      return;
    }
    if (tag === "PRE") {
      this.#pre(el);
      return;
    }
    if (tag === "A") {
      this.#anchor(el);
      return;
    }
    if (tag === "BUTTON" || el.getAttribute("role") === "button") {
      this.#button(el);
      return;
    }
    const level = headingLevels[tag as keyof typeof headingLevels];
    if (level) {
      this.#flush();
      this.#walkChildren(el);
      this.#flush(`${"#".repeat(level)} `);
      return;
    }
    if (tag === "LI") {
      this.#flush();
      this.#walkChildren(el);
      this.#flush("- ");
      return;
    }
    if (tag === "TD" || tag === "TH") {
      if (this.#buffer.trim()) this.#buffer += " |";
      this.#walkChildren(el);
      return;
    }
    if (blockTags.has(tag)) {
      this.#flush();
      this.#walkChildren(el);
      this.#flush();
      return;
    }
    this.#walkChildren(el);
  }

  #walkChildren(el: HTMLElement) {
    for (const child of el.childNodes) this.#walk(child);
  }

  #anchor(el: HTMLElement) {
    const href = el.getAttribute("href") ?? "";
    const before = this.#buffer;
    this.#walkChildren(el);
    const text = this.#buffer.slice(before.length).replace(/\s+/g, " ").trim();
    if (href && href !== "#" && !href.startsWith("javascript:") && text !== href) this.#buffer += ` (${href})`;
  }

  #button(el: HTMLElement) {
    const before = this.#buffer;
    this.#walkChildren(el);
    const inner = this.#buffer.slice(before.length).replace(/\s+/g, " ").trim();
    this.#buffer = before;
    const label = inner || el.getAttribute("aria-label") || "";
    const action = el.getAttribute("data-akan-action");
    if (label || action) this.#buffer += ` [button: ${label}${action ? ` → ${action}` : ""}]`;
  }

  #control(el: HTMLElement, tag: string) {
    const input = el as HTMLInputElement;
    const type = (el.getAttribute("type") ?? (tag === "INPUT" ? "text" : tag.toLowerCase())).toLowerCase();
    if (type === "hidden") return;
    const name =
      el.getAttribute("data-akan-state") ??
      el.getAttribute("aria-label") ??
      el.getAttribute("placeholder") ??
      el.getAttribute("name") ??
      type;
    if (type === "password") {
      this.#buffer += ` [input ${name}]`;
      return;
    }
    if (type === "checkbox" || type === "radio") {
      this.#buffer += ` [${type} ${name}: ${input.checked ? "on" : "off"}]`;
      return;
    }
    const raw =
      tag === "SELECT"
        ? ((el as unknown as HTMLSelectElement).selectedOptions?.[0]?.textContent ??
          (el as unknown as HTMLSelectElement).value)
        : input.value;
    const value = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    this.#buffer += ` [${tag === "SELECT" ? "select" : "input"} ${name}: ${JSON.stringify(value)}]`;
  }

  #pre(el: HTMLElement) {
    this.#flush();
    const raw = (el.textContent ?? "").trim();
    if (!raw) return;
    const rows = raw.split("\n");
    this.#lines.push(
      "```",
      ...rows.slice(0, 30),
      ...(rows.length > 30 ? [`… ${rows.length - 30} more lines`] : []),
      "```",
    );
    this.#length += raw.length;
  }

  #flush(prefix = "") {
    const text = this.#buffer.replace(/\s+/g, " ").trim();
    this.#buffer = "";
    if (!text) return;
    this.#lines.push(prefix + text);
    this.#length += prefix.length + text.length;
  }
}
