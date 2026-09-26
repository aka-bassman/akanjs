import type { Cls, PromiseOrObject } from "akanjs/base";

export const WEB_PROXY_RESULT = Symbol.for("akanjs/web-proxy-result");

export type WebProxyNextInit = {
  request?: {
    headers?: HeadersInit;
  };
};

export type WebProxyResult =
  | {
      readonly [WEB_PROXY_RESULT]: true;
      readonly type: "next";
      readonly request?: {
        readonly headers?: HeadersInit;
      };
    }
  | {
      readonly [WEB_PROXY_RESULT]: true;
      readonly type: "rewrite";
      readonly url: string | URL;
      readonly request?: {
        readonly headers?: HeadersInit;
      };
    };

export type WebProxyReturn = Response | WebProxyResult | undefined;

export interface WebProxy {
  use(request: Bun.BunRequest): PromiseOrObject<WebProxyReturn>;
}

export type WebProxyCls = Cls<WebProxy, { readonly refName: string }>;
export type WebProxyMatcher = string | RegExp | ((request: Request) => boolean);
export type WebProxyRegistration = WebProxyCls | { proxy: WebProxyCls; matcher?: WebProxyMatcher };

export interface WebProxyRunResult {
  request: Request;
  response?: Response;
}

export class AkanResponse {
  static next(init: WebProxyNextInit = {}): WebProxyResult {
    return { [WEB_PROXY_RESULT]: true, type: "next", request: init.request };
  }

  static redirect(url: string | URL, status = 307): Response {
    return Response.redirect(url, status);
  }

  static rewrite(url: string | URL, init: WebProxyNextInit = {}): WebProxyResult {
    return { [WEB_PROXY_RESULT]: true, type: "rewrite", url, request: init.request };
  }
}
