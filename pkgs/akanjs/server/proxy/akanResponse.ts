import { WEB_PROXY_RESULT, type WebProxyNextInit, type WebProxyResult } from "./types";

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
