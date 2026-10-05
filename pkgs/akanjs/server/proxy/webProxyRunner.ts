import { SignalContext } from "../../signal/signalContext";
import {
  WEB_PROXY_RESULT,
  type WebProxy,
  type WebProxyMatcher,
  type WebProxyRegistration,
  type WebProxyResult,
  type WebProxyReturn,
  type WebProxyRunResult,
} from "./types";

export const copyBunRequestFields = (target: Request, source: Request): Request => {
  SignalContext.carryClientIp(target, source);
  const sourceWithParams = source as Request & { params?: Record<string, string> };
  if (sourceWithParams.params) {
    Object.defineProperty(target, "params", {
      configurable: true,
      enumerable: true,
      value: sourceWithParams.params,
      writable: true,
    });
  }
  return target;
};

export class WebProxyRunner {
  readonly #proxies: Array<{ proxy: WebProxy; matcher?: WebProxyMatcher }>;

  static create(registrations: WebProxyRegistration[] = []): WebProxyRunner | null {
    if (registrations.length === 0) return null;
    return new WebProxyRunner(registrations);
  }

  constructor(registrations: WebProxyRegistration[] = []) {
    this.#proxies = registrations.map(WebProxyRunner.#normalizeRegistration);
  }

  async run(input: Request): Promise<WebProxyRunResult> {
    let request = input;
    for (const { proxy, matcher } of this.#proxies) {
      if (!WebProxyRunner.#matches(request, matcher)) continue;
      const result = await proxy.use(request as Bun.BunRequest);
      if (result instanceof Response) return { request, response: result };
      if (WebProxyRunner.#isResult(result)) {
        request = WebProxyRunner.#applyResult(request, result);
      } else {
        request = copyBunRequestFields(request, input);
      }
    }
    return { request };
  }

  static #normalizeRegistration(registration: WebProxyRegistration): { proxy: WebProxy; matcher?: WebProxyMatcher } {
    if (typeof registration === "function") return { proxy: new registration() };
    return { proxy: new registration.proxy(), matcher: registration.matcher };
  }

  static #matches(request: Request, matcher?: WebProxyMatcher): boolean {
    if (!matcher) return WebProxyRunner.#matchesDefault(request);
    if (typeof matcher === "function") return matcher(request);
    const pathname = new URL(request.url).pathname;
    if (typeof matcher === "string")
      return pathname === matcher || pathname.startsWith(`${matcher.replace(/\/$/, "")}/`);
    return matcher.test(pathname);
  }

  static #matchesDefault(request: Request): boolean {
    const { pathname } = new URL(request.url);
    if (pathname === "/__csr" || pathname === "/_akan/hmr") return false;
    if (pathname.startsWith("/_akan/client/") || pathname.startsWith("/_akan/styles/")) return false;
    if (pathname === "/favicon.ico" || /\.[a-z0-9]+$/i.test(pathname)) return false;
    return true;
  }

  static #isResult(value: WebProxyReturn): value is WebProxyResult {
    return Boolean(value && typeof value === "object" && WEB_PROXY_RESULT in value);
  }

  static #applyResult(request: Request, result: WebProxyResult): Request {
    const headers = result.request?.headers;
    if (result.type === "rewrite") return WebProxyRunner.#cloneRequest(request, { url: result.url, headers });
    return WebProxyRunner.#cloneRequest(request, { headers });
  }

  static #cloneRequest(request: Request, init: { url?: string | URL; headers?: HeadersInit }): Request {
    if (!init.url && !init.headers) return request;
    const cloned = new Request(init.url ?? request.url, {
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      cache: request.cache,
      credentials: request.credentials,
      headers: init.headers ?? request.headers,
      integrity: request.integrity,
      keepalive: request.keepalive,
      method: request.method,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });
    copyBunRequestFields(cloned, request);
    return cloned;
  }
}
