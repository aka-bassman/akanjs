import { Readable } from "node:stream";
import { type AkanTheme, pushRequestFallback, requestStorage } from "akanjs/fetch";
import { type ReactNode, use } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { createFromNodeStream } from "react-server-dom-webpack/client.node";
import type { SsrChunkRegistryStats, SsrFromRscInput } from "./ssrTypes";

export class SsrFromRscRenderer {
  static readonly #chunkRegistryStats: SsrChunkRegistryStats = {
    ssrChunkRegistrySize: 0,
    ssrChunkLoadCount: 0,
    ssrChunkCacheHitCount: 0,
  };

  // Inline bootstrap that runs as a classic script BEFORE any <script type="module">.
  // - Installs the webpack runtime shims that react-server-dom-webpack/client.browser
  //   needs at module initialization time.
  // - Creates a tiny queue so <script>self.__RSC_PUSH__(...)</script> tags
  //   emitted after the HTML shell can be buffered until rscClient picks them up.
  static readonly #clientBootstrap = `(function(){
  var registry = new Map();
  function load(id) {
    var cached = registry.get(id);
    if (cached) return cached;
    var p = import(id);
    registry.set(id, p);
    return p;
  }
  self.__webpack_chunk_load__ = load;
  self.__webpack_require__ = function(id) {
    var p = registry.get(id);
    if (!p) throw new Error("[rscClient] module not loaded: " + id);
    return p;
  };
  self.__webpack_require__.u = function(chunkId) { return chunkId; };
  self.__webpack_get_script_filename__ = function(chunkId) { return chunkId; };
  self.__RSC_CHUNKS__ = [];
  self.__RSC_CLOSED__ = false;
  self.__RSC_PUSH__ = function(b64){ self.__RSC_CHUNKS__.push(b64); };
  self.__RSC_CLOSE__ = function(){ self.__RSC_CLOSED__ = true; };
})();`;

  static readonly #themeInitScript = `<script>(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);
    if (m) return;
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();</script>`;

  static {
    SsrFromRscRenderer.#installWebpackShims();
  }

  static getChunkRegistryStats(): SsrChunkRegistryStats {
    return { ...SsrFromRscRenderer.#chunkRegistryStats };
  }

  async render(input: SsrFromRscInput): Promise<ReadableStream<Uint8Array>> {
    // Split the RSC stream: one branch drives the server-side SSR render, the
    // other is relayed to the client as inline <script> tags for hydration.
    const [rscForSsr, rscForClient] = input.rscStream.tee();

    const ssrNodeStream = Readable.fromWeb(rscForSsr as never);
    const thenable = createFromNodeStream(ssrNodeStream, input.ssrManifest) as Promise<ReactNode>;

    function Root(): ReactNode {
      return use(thenable);
    }

    const bootstrap = input.extraBootstrapInline
      ? `${SsrFromRscRenderer.#clientBootstrap}\n${input.extraBootstrapInline}`
      : SsrFromRscRenderer.#clientBootstrap;

    const renderHtml = () =>
      renderToReadableStream(<Root />, {
        bootstrapScriptContent: bootstrap,
      });
    const htmlStream =
      input.request && requestStorage ? await requestStorage.run(input.request, renderHtml) : await renderHtml();

    const withHeadScripts = SsrFromRscRenderer.#injectHeadScriptsIntoHead(htmlStream, {
      importmap: input.importmap,
      bootstrapModules: input.bootstrapModules,
      theme: input.theme,
      injectThemeInitScript: input.injectThemeInitScript,
    });

    return SsrFromRscRenderer.#appendRscScriptsAfterHtml(
      withHeadScripts,
      SsrFromRscRenderer.#sanitizeFlightForClient(rscForClient),
      input.bootstrapModules,
      input.request,
    );
  }

  static #installWebpackShims(): void {
    const g = globalThis as unknown as {
      __rsc_ssr_shims_installed__?: boolean;
      __webpack_chunk_load__?: (id: string) => Promise<void>;
      __webpack_require__?: (id: string) => Record<string, unknown>;
    };
    if (g.__rsc_ssr_shims_installed__) return;
    g.__rsc_ssr_shims_installed__ = true;

    // SSR-side webpack runtime shims. We use dynamic `import()` rather than
    // `require()` because client component chunks may transitively use
    // top-level await, which Bun's `require()` refuses to load.
    //
    // `chunks`/`id` entries in the ssrManifest are absolute filesystem paths
    // to server-importable client chunks. These may differ from the browser
    // chunks referenced by the Flight client manifest because the browser build
    // can rely on import maps while this SSR pass is loaded directly by Bun.
    // HMR cache-busting is filename-based: each rebuild emits a new
    // content-hashed chunk filename, which means a new import
    // specifier, which bypasses Bun's module cache naturally. The
    // `?v=<digits>` stripping below is defensive for any caller that still
    // appends a version query to keep the pre-existing registry keys stable.
    const registry = new Map<string, Record<string, unknown>>();
    g.__webpack_chunk_load__ = async (chunkId: string) => {
      if (registry.has(chunkId)) {
        SsrFromRscRenderer.#chunkRegistryStats.ssrChunkCacheHitCount += 1;
        return;
      }
      const mod = (await import(chunkId)) as Record<string, unknown>;
      registry.set(chunkId, mod);
      const canonical = chunkId.replace(/\?v=\d+$/, "");
      registry.set(canonical, mod);
      SsrFromRscRenderer.#chunkRegistryStats.ssrChunkLoadCount += 1;
      SsrFromRscRenderer.#chunkRegistryStats.ssrChunkRegistrySize = registry.size;
    };
    g.__webpack_require__ = (id: string) => {
      const mod = registry.get(id);
      if (!mod) {
        throw new Error(`[ssrFromRsc] module not loaded yet: ${id}`);
      }
      return mod;
    };
  }

  /**
   * Splice bootstrap-only head scripts immediately after the `<head>` opening
   * tag in the outgoing HTML stream.
   *
   * We do this as a stream transform (rather than as a React child inside
   * `<head>`) so importmaps are acquired before any modulepreload can start.
   * The spec is strict: once the browser starts a module script fetch for a
   * preload, the document's "allow-import-maps" bit flips to false and no
   * further importmap can be acquired.
   *
   * The transform operates on UTF-8 bytes until it has spliced the tag, then
   * becomes a pure passthrough to avoid any further per-chunk overhead.
   */
  static #injectHeadScriptsIntoHead(
    stream: ReadableStream<Uint8Array>,
    options: {
      importmap?: Record<string, string>;
      bootstrapModules?: string[];
      theme?: AkanTheme;
      injectThemeInitScript?: boolean;
    },
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const { importmap, bootstrapModules, theme, injectThemeInitScript } = options;
    const htmlTheme = theme && theme !== "css" && theme !== "system" ? theme : undefined;
    const importmapTag =
      importmap && Object.keys(importmap).length > 0
        ? `<script type="importmap">${JSON.stringify({ imports: importmap })}</script>`
        : "";
    const modulePreloadTags = SsrFromRscRenderer.#createBootstrapModulePreloadTags(bootstrapModules);
    const shouldInjectThemeScript = theme === "system" || (theme === undefined && injectThemeInitScript);
    const themeInitTag = shouldInjectThemeScript ? SsrFromRscRenderer.#themeInitScript : "";
    const tags = `${themeInitTag}${importmapTag}${modulePreloadTags}`;
    if (!tags && !htmlTheme) return stream;
    const htmlOpenRe = /<html(\s[^>]*)?>/i;
    const headOpenRe = /<head(\s[^>]*)?>/i;
    let buffered = "";
    let injected = false;

    const withHtmlTheme = (html: string): string => {
      if (!htmlTheme) return html;
      return html.replace(htmlOpenRe, (tag) => {
        if (/\sdata-theme\s*=/.test(tag)) return tag;
        return tag.replace(/>$/, ` data-theme="${SsrFromRscRenderer.#escapeHtmlAttr(htmlTheme)}">`);
      });
    };

    return stream.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          if (injected) {
            controller.enqueue(chunk);
            return;
          }
          buffered += decoder.decode(chunk, { stream: true });
          const m = headOpenRe.exec(buffered);
          if (!m) return;
          const end = m.index + m[0].length;
          const before = withHtmlTheme(buffered.slice(0, end));
          const after = buffered.slice(end);
          controller.enqueue(encoder.encode(before + tags + after));
          buffered = "";
          injected = true;
        },
        flush(controller) {
          if (injected) {
            const tail = decoder.decode();
            if (tail) controller.enqueue(encoder.encode(tail));
            return;
          }
          // `<head>` never appeared — e.g. error shell. Emit buffered bytes
          // verbatim so we don't swallow the document.
          const tail = decoder.decode();
          const rest = withHtmlTheme(buffered + tail);
          if (rest) controller.enqueue(encoder.encode(rest));
        },
      }),
    );
  }

  static #escapeHtmlAttr(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  static #createBootstrapModulePreloadTags(bootstrapModules?: string[]): string {
    if (!bootstrapModules?.length) return "";
    return bootstrapModules
      .map((src) => `<link rel="modulepreload" href="${SsrFromRscRenderer.#escapeHtmlAttr(src)}">`)
      .join("");
  }

  static #createBootstrapModuleScriptTags(bootstrapModules?: string[]): string {
    if (!bootstrapModules?.length) return "";
    return bootstrapModules
      .map((src) => `<script type="module" src="${SsrFromRscRenderer.#escapeHtmlAttr(src)}"></script>`)
      .join("");
  }

  // React-server-dom-webpack/server emits a Flight hint of the form
  // `:HL["<href>","stylesheet"]\n` for every `<link rel="stylesheet">` in the
  // server tree. That string is forwarded verbatim to the browser which then
  // calls `ReactDOM.preload(href, "stylesheet")`, creating an invalid
  // `<link rel="preload" as="stylesheet">` (valid preload `as` is `"style"`).
  // The SSR-side Fizz dispatcher happens to tolerate this, but Chromium logs
  // `<link rel=preload> must have a valid "as" value`. Rewrite the hint for
  // the browser-bound stream to use the spec-correct `"style"`; the SSR-bound
  // tee is left untouched so we don't alter React's server behavior.
  static #sanitizeFlightForClient(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    // Matches just the trailing `,"stylesheet"]` of an HL hint line. The href is
    // left alone; only the `as` slot is rewritten.
    const hlStylesheetRe = /(:HL\["[^"\\]*(?:\\.[^"\\]*)*",)"stylesheet"(\])/g;

    return stream.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          if (!text.includes(`"stylesheet"`)) {
            controller.enqueue(chunk);
            return;
          }
          controller.enqueue(encoder.encode(text.replace(hlStylesheetRe, `$1"style"$2`)));
        },
        flush(controller) {
          const tail = decoder.decode();
          if (tail) controller.enqueue(encoder.encode(tail));
        },
      }),
    );
  }

  static #appendRscScriptsAfterHtml(
    htmlStream: ReadableStream<Uint8Array>,
    rscClientStream: ReadableStream<Uint8Array>,
    bootstrapModules?: string[],
    request?: Request,
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const bootstrapModuleScripts = SsrFromRscRenderer.#createBootstrapModuleScriptTags(bootstrapModules);

    return new ReadableStream<Uint8Array>({
      start(controller) {
        let errored = false;
        const fail = (err: unknown) => {
          if (errored) return;
          errored = true;
          controller.error(err);
        };

        const pump = async () => {
          const reader = htmlStream.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (errored) return;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }

          // Do not let React emit async bootstrap module scripts in the middle
          // of the Fizz stream. Cached modules can otherwise execute before
          // `$RC(...)` restores streamed Suspense segments into the DOM.
          if (bootstrapModuleScripts && !errored) controller.enqueue(encoder.encode(bootstrapModuleScripts));

          // Inline RSC scripts must not be interleaved with arbitrary HTML bytes:
          // Fizz may split inside SVG path data or attributes, corrupting markup.
          const rscReader = rscClientStream.getReader();
          try {
            while (true) {
              const { value, done } = await rscReader.read();
              if (done) break;
              if (errored) return;
              const b64 = Buffer.from(value).toString("base64");
              controller.enqueue(encoder.encode(`<script>self.__RSC_PUSH__(${JSON.stringify(b64)})</script>`));
            }
          } finally {
            rscReader.releaseLock();
          }
          if (!errored) {
            controller.enqueue(encoder.encode(`<script>self.__RSC_CLOSE__()</script>`));
            controller.close();
          }
        };

        const runPump = () => {
          const cleanup = request ? pushRequestFallback(request) : undefined;
          return pump()
            .catch(fail)
            .finally(() => cleanup?.());
        };
        if (request && requestStorage) void requestStorage.run(request, runPump);
        else void runPump();
      },
    });
  }
}
