import { lookup } from "node:dns/promises";
import { TrustedProxy } from "akanjs/common";
import { OAuthRedirect } from "./OAuthRedirect";
import type { OAuthClientRecord, OAuthRedirectPolicy } from "./oauthTypes";

export interface OAuthClientIdMetadataResult {
  client: OAuthClientRecord;
  /** From `Cache-Control` max-age (else `defaultTtlMs`), clamped to `minTtlMs`..`maxTtlMs`. */
  ttlMs: number;
}

export type OAuthAddressLookup = (hostname: string) => Promise<{ address: string }[]>;

export type OAuthDocumentFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface OAuthClientIdMetadataFetchOptions extends OAuthRedirectPolicy {
  fetchImpl?: OAuthDocumentFetch;
  /** SSRF check: every resolved address must be public. Default: system resolver; `false` trusts the name alone. */
  resolve?: OAuthAddressLookup | false;
}

// draft-ietf-oauth-client-id-metadata-document: an HTTPS `client_id` hosts the client's own registration.
export class OAuthClientIdMetadata {
  static readonly maxBytes = 64 * 1024;
  static readonly timeoutMs = 5_000;
  static readonly defaultTtlMs = 3_600_000;
  static readonly minTtlMs = 60_000;
  static readonly maxTtlMs = 86_400_000;

  /** §3: an `https` URL with a path component, and nothing a URL could smuggle credentials or a fragment in. */
  static isDocumentUrl(clientId: string): boolean {
    const url = OAuthRedirect.parse(clientId);
    return !!url && url.protocol === "https:" && url.pathname !== "/" && !url.username && !url.password;
  }

  // SSRF: fetch never shows the resolved address, so this judges the name; `resolvesPublicly` checks the addresses,
  // and the DNS-rebinding window between that lookup and the fetch is left to the egress policy, as the draft says.
  static isFetchable(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    if (url.port) return false;
    if (host.startsWith("[") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
    if (!host.includes(".")) return false;
    return !/\.(?:localhost|local|internal|lan|home|arpa)$/.test(host);
  }

  // Closes a public name parked on a private address, which `isFetchable` cannot see.
  static async resolvesPublicly(hostname: string, resolve: OAuthAddressLookup = OAuthClientIdMetadata.#lookup) {
    try {
      const addresses = await resolve(hostname);
      return addresses.length > 0 && addresses.every(({ address }) => !TrustedProxy.isPrivateAddress(address));
    } catch {
      return false;
    }
  }

  static async fetch(
    clientId: string,
    { fetchImpl = fetch as OAuthDocumentFetch, resolve, ...policy }: OAuthClientIdMetadataFetchOptions = {},
  ): Promise<OAuthClientIdMetadataResult | null> {
    const url = OAuthRedirect.parse(clientId);
    if (!url || !OAuthClientIdMetadata.isDocumentUrl(clientId) || !OAuthClientIdMetadata.isFetchable(url)) return null;
    if (resolve !== false && !(await OAuthClientIdMetadata.resolvesPublicly(url.hostname, resolve))) return null;
    const res = await fetchImpl(url, {
      headers: { accept: "application/json" },
      // A redirect could re-point the fetch anywhere, including inward; the document lives where the id says.
      redirect: "error",
      signal: AbortSignal.timeout(OAuthClientIdMetadata.timeoutMs),
    }).catch(() => null);
    if (!res?.ok) return null;
    if (Number(res.headers.get("content-length")) > OAuthClientIdMetadata.maxBytes) return null;
    const text = await res.text().catch(() => "");
    if (!text || text.length > OAuthClientIdMetadata.maxBytes) return null;
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }
    const client = OAuthClientIdMetadata.validate(clientId, json, policy);
    return client ? { client, ttlMs: OAuthClientIdMetadata.#ttl(res.headers.get("cache-control")) } : null;
  }

  // §4 MUSTs, plus public clients only: `private_key_jwt` needs a JWKS the token endpoint does not read.
  static validate(clientId: string, json: unknown, policy: OAuthRedirectPolicy = {}): OAuthClientRecord | null {
    if (!json || typeof json !== "object" || Array.isArray(json)) return null;
    const doc = json as Record<string, unknown>;
    if (doc.client_id !== clientId) return null;
    if (typeof doc.client_name !== "string" || !doc.client_name.trim()) return null;
    const redirectUris = doc.redirect_uris;
    if (!Array.isArray(redirectUris) || !redirectUris.length) return null;
    if (!redirectUris.every((uri) => typeof uri === "string" && OAuthRedirect.isRegistrable(uri, policy))) return null;
    if ((doc.token_endpoint_auth_method ?? "none") !== "none") return null;
    const grantTypes = Array.isArray(doc.grant_types)
      ? doc.grant_types.filter((g) => typeof g === "string")
      : undefined;
    return {
      clientId,
      clientName: doc.client_name.trim(),
      redirectUris: redirectUris as string[],
      grantTypes: grantTypes?.length ? grantTypes : ["authorization_code"],
      tokenEndpointAuthMethod: "none",
      source: "metadataDocument",
    };
  }

  // Same deadline as the fetch: a resolver that hangs is a fetch that hangs.
  static readonly #lookup: OAuthAddressLookup = async (hostname) =>
    await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error("DNS lookup timed out")), OAuthClientIdMetadata.timeoutMs).unref(),
      ),
    ]);

  static #ttl(cacheControl: string | null): number {
    const maxAge = /max-age=(\d+)/.exec(cacheControl ?? "")?.[1];
    const ms = maxAge ? Number(maxAge) * 1000 : OAuthClientIdMetadata.defaultTtlMs;
    return Math.min(Math.max(ms, OAuthClientIdMetadata.minTtlMs), OAuthClientIdMetadata.maxTtlMs);
  }
}
