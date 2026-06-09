import type { AkanTheme } from "akanjs/fetch";

export interface SsrManifestEntry {
  id: string;
  chunks: string[];
  name: string;
  async?: boolean;
}

export interface SsrManifest {
  moduleLoading: { prefix: string; crossOrigin?: string } | null;
  moduleMap: Record<string, Record<string, SsrManifestEntry>>;
}

export interface SsrChunkRegistryStats {
  ssrChunkRegistrySize: number;
  ssrChunkLoadCount: number;
  ssrChunkCacheHitCount: number;
  ssrChunkEvictionCount: number;
}

export interface SsrFromRscInput {
  request?: Request;
  rscStream: ReadableStream<Uint8Array>;
  ssrManifest: SsrManifest;
  bootstrapModules?: string[];
  /** Extra inline JS appended to the framework's bootstrap script. The HMR
   * dev client lives here so the browser wires up its reload channel before
   * any application module evaluates. */
  extraBootstrapInline?: string;
  /**
   * Bare specifier -> served URL mapping for the `<script type="importmap">`
   * the HTML stream should prepend to `<head>`. Used so per-route client
   * chunks (which externalize `react`, `react-dom/client`, ...) resolve
   * those specifiers to the base build's vendor entries at load time,
   * guaranteeing one React instance across rscClient and every route
   * chunk.
   *
   * Injection happens via a stream transform, not React children, because the
   * spec is strict: import maps must be acquired before any module script fetch
   * starts, including modulepreload. Akan writes bootstrap module preloads
   * directly after this importmap and delays the executable module script until
   * the Fizz HTML stream has completed.
   */
  importmap?: Record<string, string>;
  theme?: AkanTheme;
  injectThemeInitScript?: boolean;
}
