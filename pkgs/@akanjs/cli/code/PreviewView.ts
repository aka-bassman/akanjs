import { PreviewChrome } from "./PreviewChrome";

export interface PreviewProbeResult {
  url: string;
  title: string;
  consoleErrors: string[];
  pageErrors: string[];
  /** Cheap structural smells that read as "the page is broken" without anyone looking at it. */
  domFindings: string[];
  screenshot?: string;
}

interface WebViewLike {
  navigate(url: string): Promise<void>;
  evaluate(expression: string): Promise<unknown>;
  screenshot(options: { encoding: "base64" }): Promise<string>;
  close(): void | Promise<void>;
  readonly title: string;
}

/**
 * Opens a page headlessly and reports what is wrong with it.
 *
 * `Bun.WebView` rather than a downloaded browser: on macOS the `webkit` backend is the system framework, so
 * there is no Chromium to fetch and no executable path to track, and everywhere else it drives whatever Chrome
 * the image carries. It is marked experimental, which is why the whole surface is behind this adapter — a Bun
 * minor that changes it should break one file.
 *
 * Which backend, and what an image needs for it, is {@link PreviewChrome}.
 */
export class PreviewView {
  static get available() {
    return typeof (Bun as unknown as { WebView?: unknown }).WebView === "function" && PreviewChrome.available;
  }

  /** Why `available` is false, for a host that should say so rather than skip the check in silence. */
  static unavailableReason() {
    if (typeof (Bun as unknown as { WebView?: unknown }).WebView !== "function")
      return "This Bun build has no WebView, so the page preview is off.";
    return PreviewChrome.unavailableReason();
  }

  static async probe(url: string, { screenshot = false, width = 1280, height = 800 } = {}) {
    const logs: string[] = [];
    const view = PreviewView.#open({ width, height, onConsole: (line) => logs.push(line) });
    try {
      await view.navigate(url);
      const result: PreviewProbeResult = {
        url,
        title: view.title,
        consoleErrors: logs.filter((line) => line.startsWith("error") || line.startsWith("warn")),
        pageErrors: PreviewView.#strings(await view.evaluate(pageErrorsExpression)),
        domFindings: PreviewView.#strings(await view.evaluate(domFindingsExpression)),
      };
      if (screenshot) result.screenshot = await view.screenshot({ encoding: "base64" });
      return result;
    } finally {
      await view.close();
    }
  }

  static #open({ width, height, onConsole }: { width: number; height: number; onConsole: (line: string) => void }) {
    const Ctor = (Bun as unknown as { WebView: new (options: unknown) => WebViewLike }).WebView;
    return new Ctor({
      width,
      height,
      dataStore: "ephemeral",
      backend: PreviewChrome.backendOption(),
      // The console option is a callback taking `(type, ...args)`, not an object of console methods.
      console: (type: string, ...args: unknown[]) => onConsole(`${type} ${args.map(String).join(" ")}`),
    });
  }

  static #strings(value: unknown) {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
  }
}

/**
 * `evaluate` takes an expression, not a statement list — `const x = 1; x` is a `SyntaxError` — so each probe is
 * wrapped in an IIFE. Only one may be in flight per view.
 */
const pageErrorsExpression = `(() => {
  const found = [];
  const root = document.getElementById("__next") || document.body;
  const rendered = root ? Array.from(root.children).filter((el) => !["SCRIPT", "STYLE", "TEMPLATE", "LINK", "NOSCRIPT"].includes(el.tagName)) : [];
  if (!rendered.length && !(root && root.innerText && root.innerText.trim())) found.push("The page body rendered empty.");
  const overlay = document.querySelector("[data-nextjs-dialog], .error-overlay, #akan-error");
  if (overlay) found.push("An error overlay is on the page: " + overlay.textContent.slice(0, 400));
  return found;
})()`;

const domFindingsExpression = `(() => {
  const found = [];
  const all = Array.from(document.querySelectorAll("body *"));
  const overflowing = all.filter((el) => el.scrollWidth > document.documentElement.clientWidth + 8);
  if (overflowing.length) found.push(overflowing.length + " element(s) overflow the viewport horizontally, first: " + (overflowing[0].tagName + "." + overflowing[0].className).slice(0, 120));
  const invisibleText = all.filter((el) => {
    if (!el.textContent || !el.textContent.trim()) return false;
    const style = getComputedStyle(el);
    return style.color === style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)";
  });
  if (invisibleText.length) found.push(invisibleText.length + " element(s) render text in the same colour as their background.");
  const unresolved = all.filter((el) => /(^|\\s)(bg|text|border)-(base-100|base-content|primary-content|error)(\\s|$)/.test(el.className || ""));
  if (unresolved.length) found.push(unresolved.length + " element(s) use a dropped daisyUI colour slot that renders no CSS.");
  return found;
})()`;
