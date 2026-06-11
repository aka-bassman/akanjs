import path from "node:path";
import type { BunPlugin } from "bun";
import type { PageEntry } from "../artifact/implicitRootLayout";
import { resolveSsrPageEntriesForApp } from "../artifact/implicitRootLayout";
import type { App } from "../commandDecorators";
import { createBarrelImportsPlugin } from "../transforms/barrelImportsPlugin";
import { createExternalizeFrameworkPlugin } from "../transforms/externalizeFrameworkPlugin";
import { transformUseClient } from "../transforms/rscUseClientTransform";
import { createUseClientBundlePlugin } from "../transforms/useClientBundlePlugin";
import { PagesEntrySourceGenerator } from "./pagesEntrySourceGenerator";

export interface BuildPagesBundleResult {
  /** Absolute path to the emitted `pages-[hash].js`. */
  bundlePath: string;
  /**
   * Monotonic build identifier. Bun.build emits a fresh filename whenever
   * any input changes, but importers still benefit from a `?v=<buildId>`
   * query-string cache bust — `buildId` is that value.
   */
  buildId: number;
  splitting: boolean;
  entryBytes: number;
  outputBytes: number;
  outputCount: number;
  chunkCount: number;
}

const VIRTUAL_PAGES_ENTRY = "akan-pages-entry";

/**
 * Build the server-side pages bundle. The RSC worker loads the result with
 * `await import(bundlePath?v=buildId)`.
 */
export class PagesBundleBuilder {
  #app: App;
  #command: "build" | "start";
  #pageEntries?: PageEntry[];
  #started = Date.now();

  constructor(app: App, command: "build" | "start" = "start", pageEntries?: PageEntry[]) {
    this.#app = app;
    this.#command = command;
    this.#pageEntries = pageEntries;
  }

  async build(): Promise<BuildPagesBundleResult> {
    const akanConfig = await this.#app.getConfig();
    const resolvedEntries =
      this.#pageEntries ?? (await resolveSsrPageEntriesForApp(this.#app, await this.#app.getPageKeys()));
    const entrySource = PagesEntrySourceGenerator.generate(resolvedEntries);
    const workspaceRoot = this.#app.workspace.workspaceRoot;
    const result = await Bun.build({
      entrypoints: [VIRTUAL_PAGES_ENTRY],
      outdir: `${this.#artifactDir}/server`,
      target: "bun",
      format: "esm",
      splitting: this.#splitting,
      minify: this.#command === "build",
      naming: {
        entry: "pages-[hash].[ext]",
        chunk: "chunks/[name]-[hash].[ext]",
        asset: "assets/[name]-[hash].[ext]",
      },
      define: this.#define(),
      plugins: [
        PagesBundleBuilder.createPagesEntryPlugin(entrySource),
        PagesBundleBuilder.createServerCssStubPlugin(),
        await createExternalizeFrameworkPlugin({ app: this.#app, extra: akanConfig.externalLibs }),
        akanConfig.barrelImports.length > 0
          ? await createBarrelImportsPlugin(this.#app, {
              pipeAfter: (source, args) =>
                transformUseClient(source, {
                  path: args.path,
                  workspaceRoot,
                }),
            })
          : createUseClientBundlePlugin({ workspaceRoot }),
      ],
    });

    if (!result.success) throw new AggregateError(result.logs, "[PagesBundleBuilder] Bun.build failed");

    const entryArtifact = result.outputs.find((a) => a.kind === "entry-point");
    if (!entryArtifact) throw new Error("[PagesBundleBuilder] Bun.build emitted no entry-point artifact");

    const bundlePath = path.resolve(entryArtifact.path);
    const buildId = Date.now();
    const outputBytes = result.outputs.reduce((sum, output) => sum + output.size, 0);
    const chunkCount = result.outputs.filter((output) => output.kind === "chunk").length;
    this.#app.verbose(
      `[PagesBundleBuilder] ${path.basename(bundlePath)} emitted in ${Date.now() - this.#started}ms splitting=${this.#splitting} entry=${entryArtifact.size} bytes outputs=${result.outputs.length} chunks=${chunkCount} total=${outputBytes} bytes`,
    );
    return {
      bundlePath,
      buildId,
      splitting: this.#splitting,
      entryBytes: entryArtifact.size,
      outputBytes,
      outputCount: result.outputs.length,
      chunkCount,
    };
  }

  get #artifactDir(): string {
    return `${this.#command === "build" ? this.#app.dist.cwdPath : this.#app.cwdPath}/.akan/artifact`;
  }

  get #splitting(): boolean {
    return process.env.AKAN_SERVER_PAGES_SPLITTING === "1";
  }

  #define(): Record<string, string> {
    const nodeEnv = this.#command === "build" ? "production" : (process.env.NODE_ENV ?? "development");
    return {
      "process.env.NODE_ENV": JSON.stringify(nodeEnv),
      "process.env.AKAN_PUBLIC_RENDER_ENV": JSON.stringify("ssr"),
      ...Object.fromEntries(
        Object.entries(this.#app.getPublicEnv()).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
      ),
    };
  }

  static createPagesEntryPlugin(source: string): BunPlugin {
    return {
      name: "akan-pages-entry",
      setup(build) {
        build.onResolve({ filter: /^akan-pages-entry$/ }, () => ({
          path: VIRTUAL_PAGES_ENTRY,
          namespace: "akan-virtual",
        }));
        build.onLoad({ filter: /^akan-pages-entry$/, namespace: "akan-virtual" }, () => ({
          contents: source,
          loader: "tsx",
        }));
      },
    };
  }

  static createServerCssStubPlugin(): BunPlugin {
    return {
      name: "akan-server-css-stub",
      setup(build) {
        build.onLoad({ filter: /\.css$/ }, () => ({
          contents: "",
          loader: "js",
        }));
      },
    };
  }
}
