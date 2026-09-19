import {
  type AkanRouterStateV1,
  type AkanRscPatchMetadata,
  appendAkanRouterStateRequestHeaders,
  readAkanRscPatchMetadataResponseHeaders,
} from "./routeState";

type RscNavigate = (href: string, options?: { replace?: boolean; scrollToTop?: boolean }) => Promise<void> | void;

export type RscClientFetchResponseResult =
  | { type: "response"; response: Response }
  | { type: "patch"; response: Response; patch: AkanRscPatchMetadata }
  | { type: "not-found" }
  | { type: "redirected"; status?: number };

export async function fetchRscNavigationResponse(
  href: string,
  options: {
    buildId?: number;
    currentRouterState: AkanRouterStateV1 | null;
    navigate?: RscNavigate;
    sendRouterState?: boolean;
    shouldApplyNavigation?: () => boolean;
  },
): Promise<RscClientFetchResponseResult> {
  const shouldApplyNavigation = options.shouldApplyNavigation ?? (() => true);
  const endpoint = new URL("/__rsc", window.location.origin);
  endpoint.searchParams.set("url", href);
  if (options.buildId !== undefined) endpoint.searchParams.set("buildId", String(options.buildId));
  const headers = new Headers({ Accept: "text/x-component", "Cache-Control": "no-cache" });
  if (options.sendRouterState !== false) appendAkanRouterStateRequestHeaders(headers, options.currentRouterState);
  const response = await fetch(endpoint, {
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const redirect = response.headers.get("X-Akan-Redirect");
  if (redirect) {
    const method = response.headers.get("X-Akan-Redirect-Method");
    const statusHeader = response.headers.get("X-Akan-Redirect-Status");
    const status = statusHeader ? Number(statusHeader) : undefined;
    if (shouldApplyNavigation()) await options.navigate?.(redirect, { replace: method !== "push", scrollToTop: true });
    return { type: "redirected", status };
  }
  // The RSC endpoint answers a target that resolves to nothing with `0:null` under a 404 — a Flight payload whose
  // root is literally null. Decoded like any other it commits an empty tree over the whole document, so the status
  // has to be read before the body reaches the decoder.
  if (response.status === 404) {
    await response.body?.cancel();
    return { type: "not-found" };
  }
  if (response.headers.get("X-Akan-Rsc-Partial") === "patch") {
    const patch = readAkanRscPatchMetadataResponseHeaders(response.headers);
    if (options.sendRouterState === false) throw new Error("[rscClient] RSC full fallback returned a patch response");
    if (!patch) {
      await response.body?.cancel();
      return fetchRscNavigationResponse(href, {
        ...options,
        sendRouterState: false,
      });
    }
    return { type: "patch", response, patch };
  }
  return { type: "response", response };
}
