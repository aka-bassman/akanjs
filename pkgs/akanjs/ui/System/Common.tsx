import "dayjs/locale/ko";

import type { RootLayoutProps, WebAppManifest } from "akanjs/client";
import type { AkanTheme } from "akanjs/fetch";
import type { ReactNode } from "react";

export interface ProviderProps {
  className?: string;
  appName: string;
  params: RootLayoutProps["params"];
  head?: ReactNode;
  /** Emitted as a data URL. */
  manifest?: WebAppManifest;
  /** App-specific public client config (`env/env.client.ts`) merged over the framework's own `getEnv()`. */
  env?: object;
  theme?: AkanTheme;
  prefix?: string;
  children: ReactNode | ReactNode[];
  layoutStyle?: "mobile" | "web";
  /** Defaults to local operation mode in CSR. */
  reconnect?: boolean;
  /** Connects the client WebSocket runtime once the browser loads. */
  wsConnect?: boolean;
  /** SSR only: the active-locale dictionary that seeds the client Translator. */
  dictionary?: Record<string, Record<string, unknown>>;
  /** SSR server only: every locale seeds the RSC-worker Translator, and only the active one reaches the client. */
  allDictionary?: Record<string, Record<string, Record<string, unknown>>>;
  /** Root route component for CSR page loading. */
  of: (props: unknown) => ReactNode | null;
}

export const Common = () => {
  return null;
};

export function ManifestLink({ manifest }: { manifest?: WebAppManifest }) {
  if (!manifest) return null;
  return <link rel="manifest" href={createManifestDataUrl(manifest)} />;
}

export function createManifestDataUrl(manifest: WebAppManifest): string {
  const json = JSON.stringify(toManifestJson(manifest));
  return `data:application/manifest+json;base64,${encodeBase64Utf8(json)}`;
}

export function toManifestJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toManifestJson);
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [camelToSnake(key), toManifestJson(entryValue)]),
  );
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") return btoa(binary);

  const buffer = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from: (bytes: Uint8Array) => {
          toString: (encoding: "base64") => string;
        };
      };
    }
  ).Buffer;
  if (buffer) return buffer.from(bytes).toString("base64");
  throw new Error("Base64 encoding is not available in this runtime");
}
