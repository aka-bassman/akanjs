import type { HttpMutationMethod, SerializedArg } from "akanjs/signal";

export interface ErrorResponsePayload {
  error: string;
  statusCode?: number;
  data?: Record<string, unknown>;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

export interface RestoredError extends Error {
  error?: string;
  statusCode?: number;
  data?: unknown;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

export interface ErrorConstructor {
  fromJSON: (payload: ErrorResponsePayload) => RestoredError;
}

interface FetchOptions {
  headers?: Record<string, string>;
  baseUrl?: string;
}

const jsonContentType = /^application\/(?:[\w.+-]+\+)?json\b/i;

const transportErrorKeyMap = {
  408: "base.error.gatewayTimeout",
  502: "base.error.serverUnavailable",
  503: "base.error.serverUnavailable",
  504: "base.error.gatewayTimeout",
} as const;

const serverUnreachableKey = "base.error.serverUnreachable";
const unexpectedResponseKey = "base.error.unexpectedResponse";
const transportDetailLimit = 200;

export class HttpClient {
  readonly baseUrl: string;
  constructor(
    baseUrl: string,
    private ErrorCls?: ErrorConstructor,
  ) {
    this.baseUrl = baseUrl;
  }

  setErrorConstructor(ErrorCls?: ErrorConstructor) {
    this.ErrorCls = ErrorCls;
  }
  #resolveBaseUrl(baseUrl?: string) {
    return (baseUrl ?? this.baseUrl).replace(/\/$/, "");
  }
  #resolveUrl(url: string, options: FetchOptions) {
    return `${this.#resolveBaseUrl(options.baseUrl)}${url}`;
  }
  // Accept describes the response, not the body: a proxy that sees no `Accept: application/json` cannot
  // tell this call from a browser navigation, and answers a dead upstream with its own HTML page.
  static #makeHeaders(headers: Record<string, string>, options: FetchOptions) {
    return { Accept: "application/json", ...headers, ...options.headers };
  }
  async get<Returns = unknown>(url: string, options: FetchOptions = {}): Promise<Returns> {
    return await this.#request<Returns>(this.#resolveUrl(url, options), {
      headers: HttpClient.#makeHeaders({ "Content-Type": "application/json" }, options),
    });
  }
  #makeReqContent(data: FormData | Record<string, unknown>): { body: BodyInit; headers: Record<string, string> } {
    // FormData: do not set Content-Type — fetch adds multipart boundary; a bare
    // "multipart/form-data" without boundary makes servers throw ERR_FORMDATA_PARSE_ERROR.
    if (data instanceof FormData) return { body: data, headers: {} };
    return { body: JSON.stringify(data), headers: { "Content-Type": "application/json" } };
  }
  async send<Returns = unknown>(
    method: HttpMutationMethod,
    url: string,
    data: FormData | Record<string, unknown>,
    options: FetchOptions = {},
  ): Promise<Returns> {
    const { body, headers } = this.#makeReqContent(data);
    return await this.#request<Returns>(this.#resolveUrl(url, options), {
      method,
      body,
      headers: HttpClient.#makeHeaders(headers, options),
    });
  }
  async put<Returns = unknown>(
    url: string,
    data: FormData | Record<string, unknown>,
    options: FetchOptions = {},
  ): Promise<Returns> {
    return await this.send<Returns>("PUT", url, data, options);
  }
  async post<Returns = unknown>(
    url: string,
    data: FormData | Record<string, unknown>,
    options: FetchOptions = {},
  ): Promise<Returns> {
    return await this.send<Returns>("POST", url, data, options);
  }
  async delete<Returns = unknown>(url: string, options: FetchOptions = {}): Promise<Returns> {
    return await this.#request<Returns>(this.#resolveUrl(url, options), {
      method: "DELETE",
      headers: HttpClient.#makeHeaders({ "Content-Type": "application/json" }, options),
    });
  }

  async #request<Returns>(url: string, init: RequestInit): Promise<Returns> {
    const res = await this.#fetch(url, init);
    return await this.#readJsonResponse<Returns>(res);
  }

  /**
   * `fetch` rejects only when no response arrived at all — a refused connection, a DNS failure, a socket
   * dropped mid-flight. That is the server being unreachable, not an error this API reported, so it is
   * restored as one rather than surfacing the runtime's own `TypeError: Failed to fetch`.
   */
  async #fetch(url: string, init: RequestInit) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      throw this.#restoreError({ error: serverUnreachableKey, details: String(error) }, 503);
    }
  }

  async #readJsonResponse<Returns>(res: Response): Promise<Returns> {
    const body = await this.#readBody(res);
    if (res.ok) return body as Returns;
    throw this.#restoreError(body, res.status);
  }

  /**
   * A proxy answers a restarting upstream with a page of its own — nginx's `504 Gateway Time-out` HTML,
   * the federation gateway's plain-text 503. That body is not this API's, so parsing it would surface the
   * parser's complaint (`Unexpected token '<'`) instead of the fact that the server is down.
   */
  async #readBody(res: Response) {
    if (jsonContentType.test(res.headers.get("content-type") ?? "")) {
      try {
        return (await res.json()) as unknown;
      } catch (error) {
        throw this.#transportError(res.status, String(error));
      }
    }
    const raw = await res.text();
    const parsed = HttpClient.#parseJson(raw);
    if (parsed === undefined) throw this.#transportError(res.status, raw);
    return parsed;
  }

  // A body without the JSON content-type may still be ours — a proxy can strip the header.
  static #parseJson(raw: string): unknown {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  #transportError(status: number, detail: string): RestoredError {
    const error = transportErrorKeyMap[status as keyof typeof transportErrorKeyMap] ?? unexpectedResponseKey;
    return this.#restoreError({ error, data: { status }, details: detail.slice(0, transportDetailLimit) }, status);
  }

  #restoreError(body: unknown, fallbackStatusCode: number): RestoredError {
    const payload =
      body && typeof body === "object" && "error" in body
        ? ({ statusCode: fallbackStatusCode, ...(body as Record<string, unknown>) } as ErrorResponsePayload)
        : ({ error: String(body), statusCode: fallbackStatusCode } satisfies ErrorResponsePayload);
    if (this.ErrorCls) return this.ErrorCls.fromJSON(payload);
    const error = new Error(payload.error);
    Object.assign(error, payload);
    return error;
  }
  static makePath(key: string, paramArgs: SerializedArg[], prefix?: string) {
    const paramPath = paramArgs.length > 0 ? `/${paramArgs.map((arg) => `:${arg.name}`).join("/")}` : "";
    return `${prefix ? `/${prefix}` : ""}/${key}${paramPath}`;
  }
  static makeUrl(path: string, searchArgs: SerializedArg[], argMap: Map<string, unknown>) {
    const searchParams = new URLSearchParams();
    searchArgs.forEach((arg) => {
      const argValue = argMap.get(arg.name);
      if (argValue === null || argValue === undefined) return;
      // `Any` carries a structure the query string has no spelling for; `String(value)` would send
      // "[object Object]". `HttpExecutionContext` parses it back with the same rule.
      if (arg.refName === "Any") {
        // A value JSON has no spelling for — a function, a symbol — stringifies to the JS `undefined`, which
        // `set` would write as the literal text "undefined" and the reader would reject as malformed JSON.
        // An arg it cannot carry is an arg it does not carry.
        const encoded = JSON.stringify(argValue);
        if (encoded !== undefined) searchParams.set(arg.name, encoded);
      } else if (arg.arrDepth && Array.isArray(argValue))
        argValue.forEach((value) => {
          searchParams.append(arg.name, String(value));
        });
      else searchParams.set(arg.name, String(argValue));
    });
    const searchPath = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
    const paramedPath = path.replace(/:(\w+)/g, (match, p1) => {
      const value = argMap.get(p1);
      return value === null || value === undefined ? match : String(value);
    });
    return `${paramedPath}${searchPath}`;
  }
  // `<input type="file">.files` is a FileList, not an array: appending it as one value would send
  // the literal "[object FileList]" instead of the files.
  static #toUploadValues(argValue: unknown): (Blob | string)[] {
    if (Array.isArray(argValue)) return argValue as (Blob | string)[];
    if (typeof FileList !== "undefined" && argValue instanceof FileList) return Array.from(argValue);
    return [argValue as Blob | string];
  }
  static makeBody(bodyArgs: SerializedArg[], uploadArgs: SerializedArg[], argMap: Map<string, unknown>) {
    if (uploadArgs.length > 0) {
      const formData = new FormData();
      uploadArgs.forEach((arg) => {
        const argValue = argMap.get(arg.name);
        if (arg.nullable && (argValue === null || argValue === undefined)) return;
        if (!arg.nullable && (argValue === null || argValue === undefined))
          throw new Error(`Argument ${arg.name} is required`);
        HttpClient.#toUploadValues(argValue).forEach((value) => {
          formData.append(arg.name, value);
        });
      });
      bodyArgs.forEach((arg) => {
        const argValue = argMap.get(arg.name);
        if (arg.nullable && (argValue === null || argValue === undefined)) return;
        if (!arg.nullable && (argValue === null || argValue === undefined))
          throw new Error(`Argument ${arg.name} is required`);
        formData.append(arg.name, typeof argValue === "string" ? argValue : JSON.stringify(argValue));
      });
      return formData;
    } else {
      const body: Record<string, unknown> = {};
      bodyArgs.forEach((arg) => {
        const argValue = argMap.get(arg.name);
        if (!arg.nullable && (argValue === null || argValue === undefined))
          throw new Error(`Argument ${arg.name} is required`);
        body[arg.name] = argValue;
      });
      return body;
    }
  }
}
