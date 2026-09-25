import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * Which `Bun.WebView` backend the preview probe runs on, and what an image needs to carry one.
 *
 * `webkit` is the macOS system framework — zero install, and it throws on every other platform — so anywhere
 * else the probe drives Chrome. The generated akan image installs `ca-certificates` and `tzdata` and nothing
 * else, which is why the install steps are named here instead of being reinvented per image.
 */
export class PreviewChrome {
  /** Read by `Bun.WebView` itself; listed so the availability check agrees with what the launcher will do. */
  static readonly pathEnvKey = "BUN_CHROME_PATH";

  /** Set this to drive Chrome on macOS too, e.g. to reproduce what a pod sees. */
  static readonly backendEnvKey = "AKAN_CODE_WEBVIEW_BACKEND";

  /** The executables Bun looks for on PATH before giving up. */
  static readonly executables = [
    "chromium",
    "chromium-browser",
    "google-chrome-stable",
    "google-chrome",
    "brave-browser",
    "microsoft-edge",
    "chrome",
  ];

  /**
   * macOS keeps browsers in app bundles, off PATH, and Bun looks inside these before reporting none.
   *
   * The list has to match Bun's or the two disagree in the expensive direction: refusing to probe on a machine
   * whose browser the launcher would have found.
   */
  static readonly appBundles = [
    "Google Chrome.app/Contents/MacOS/Google Chrome",
    "Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "Chromium.app/Contents/MacOS/Chromium",
    "Brave Browser.app/Contents/MacOS/Brave Browser",
    "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];

  static get backend(): "webkit" | "chrome" {
    const declared = process.env[PreviewChrome.backendEnvKey];
    if (declared === "webkit" || declared === "chrome") return declared;
    return process.platform === "darwin" ? "webkit" : "chrome";
  }

  static executable() {
    const declared = process.env[PreviewChrome.pathEnvKey];
    if (declared) return declared;
    for (const name of PreviewChrome.executables) {
      const found = Bun.which(name);
      if (found) return found;
    }
    if (process.platform !== "darwin") return undefined;
    for (const root of ["/Applications", path.join(homedir(), "Applications")])
      for (const bundle of PreviewChrome.appBundles) {
        const candidate = path.join(root, bundle);
        if (existsSync(candidate)) return candidate;
      }
    return undefined;
  }

  static get available() {
    return PreviewChrome.backend === "webkit" ? process.platform === "darwin" : !!PreviewChrome.executable();
  }

  /**
   * The `backend` value to construct a view with.
   *
   * Two flags are added on the Chrome path, and Bun adds neither:
   * - Chromium refuses to run as uid 0 unless its sandbox is off, and uid 0 is the ordinary uid in a container.
   * - Docker gives a container 64MB of `/dev/shm` by default, below what Chromium's renderer allocates, and the
   *   crash it produces looks like a page that never loads rather than a resource limit.
   */
  static backendOption() {
    if (PreviewChrome.backend === "webkit") return "webkit";
    const argv = ["--disable-dev-shm-usage"];
    if (process.getuid?.() === 0) argv.push("--no-sandbox");
    return { type: "chrome" as const, argv };
  }

  /**
   * `RUN` bodies for an image whose agent has to look at the page it just changed — an akan app's
   * `docker.preRuns`, or a coding-agent pod.
   *
   * The font packages are not decoration: a container with no fonts renders every glyph as a box, so a
   * screenshot says nothing and the "text is the same colour as its background" probe reads a blank page.
   * `fonts-noto-cjk` is what keeps a Korean UI legible.
   */
  static readonly dockerRuns = [
    "apt-get update && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-color-emoji fonts-noto-cjk && rm -rf /var/lib/apt/lists/*",
  ];

  static unavailableReason() {
    if (PreviewChrome.available) return undefined;
    if (PreviewChrome.backend === "webkit")
      return `The webkit WebView backend exists only on macOS. Set ${PreviewChrome.backendEnvKey}=chrome and install a browser.`;
    return [
      "The page preview needs a browser and this machine has none on PATH.",
      `Install one (${PreviewChrome.dockerRuns[0]}) or point ${PreviewChrome.pathEnvKey} at an existing Chrome.`,
    ].join(" ");
  }
}
