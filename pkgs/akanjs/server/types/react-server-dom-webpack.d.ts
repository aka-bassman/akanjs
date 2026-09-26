// Upstream ships no types. No top-level import/export here, or these ambient module declarations stop being global.

declare module "react-server-dom-webpack/server.node" {
  export interface ClientReferenceManifestEntry {
    id: string;
    chunks: string[];
    name: string;
    async?: boolean;
  }

  export type ClientManifest = Record<string, ClientReferenceManifestEntry>;

  export function renderToReadableStream(
    model: unknown,
    clientManifest?: ClientManifest,
    options?: {
      environmentName?: string;
      filterStackFrame?: (url: string, functionName: string) => boolean;
      onError?: (error: unknown) => string | undefined;
      onPostpone?: (reason: string) => void;
      identifierPrefix?: string;
      temporaryReferences?: unknown;
      signal?: AbortSignal;
    },
  ): Promise<ReadableStream<Uint8Array>>;

  export function registerClientReference<T>(proxyImplementation: T, id: string, exportName: string): T;

  export function registerServerReference<T>(reference: T, id: string, exportName: string | null): T;

  export function decodeReply<T = unknown>(
    body: string | FormData,
    webpackMap?: unknown,
    options?: { temporaryReferences?: unknown },
  ): Promise<T>;
}

declare module "react-server-dom-webpack/client.node" {
  import type { ReactNode } from "react";

  export interface SSRManifestEntry {
    id: string;
    chunks: string[];
    name: string;
    async?: boolean;
  }

  export interface SSRManifest {
    moduleLoading: { prefix: string; crossOrigin?: string } | null;
    moduleMap: Record<string, Record<string, SSRManifestEntry>>;
  }

  export function createFromNodeStream<T = ReactNode>(
    stream: NodeJS.ReadableStream,
    ssrManifest: SSRManifest,
    options?: {
      nonce?: string;
      encodeFormAction?: unknown;
      temporaryReferences?: unknown;
      findSourceMapURL?: (fileName: string) => string | null;
      replayConsoleLogs?: boolean;
      environmentName?: string;
    },
  ): PromiseLike<T>;
}

declare module "react-server-dom-webpack/client.browser" {
  import type { ReactNode } from "react";

  interface ClientOptions {
    serverConsumerManifest?: unknown;
    nonce?: string;
    encodeFormAction?: unknown;
    temporaryReferences?: unknown;
    findSourceMapURL?: (fileName: string) => string | null;
    replayConsoleLogs?: boolean;
    environmentName?: string;
  }

  export function createFromReadableStream<T = ReactNode>(
    stream: ReadableStream<Uint8Array>,
    options?: ClientOptions,
  ): PromiseLike<T>;

  export function createFromFetch<T = ReactNode>(response: Promise<Response>, options?: ClientOptions): PromiseLike<T>;

  export function encodeReply(
    value: unknown,
    options?: { temporaryReferences?: unknown; signal?: AbortSignal },
  ): Promise<string | FormData>;
}
