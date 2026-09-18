import type { Workspace } from "../commandDecorators";
import type { AccessToken, AccessTokenDto, HostConfig } from "./constants";
import { GlobalConfig } from "./globalConfig";

class HttpClient {
  readonly baseUrl: string;
  readonly headers: Record<string, string> = {};
  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.headers = headers;
  }
  async get<T>(url: string, { headers }: { headers?: Record<string, string> } = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...headers,
      },
    });
    return await response.json();
  }
  async getFile(url: string, localPath: string, headers?: Record<string, string>): Promise<void> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: { ...this.headers, ...headers },
    });
    if (!response.ok) throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    await Bun.write(localPath, response);
  }
  async post<T>(url: string, data: unknown, { headers }: { headers?: Record<string, string> } = {}): Promise<T> {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData
        ? { ...this.headers, ...headers }
        : { "Content-Type": "application/json", ...this.headers, ...headers },
    });
    return await response.json();
  }
  setHeaders(headers: Record<string, string>) {
    Object.assign(this.headers, headers);
    return this;
  }
}

/**
 * A share the control plane just issued. `token` is the connector credential — whoever holds it can become the
 * origin behind `hostname`, so it is never written to disk or logged, only handed to the agent in memory.
 */
export interface TunnelGrant {
  code: string;
  hostname: string;
  url: string;
  /** The gateway to dial, as `wss://tunnel.akanjs.com`. The control plane names it; the CLI never assumes one. */
  gatewayUrl: string;
  token: string;
  expiresAt: string | null;
}

export interface TunnelSummary {
  code: string;
  hostname: string;
  url: string;
  name: string | null;
  createdAt: string;
  expiresAt: string | null;
  connected: boolean;
}

export class CloudApi {
  readonly #api: HttpClient;
  #accessToken: AccessToken | null = null;
  #workspace: Workspace;
  host: string;
  url: string;

  static async fromHost(workspace: Workspace, host?: string) {
    const hostConfig = await GlobalConfig.getHostConfig(host);
    return new CloudApi(workspace, hostConfig);
  }
  constructor(workspace: Workspace, hostConfig: HostConfig) {
    this.#workspace = workspace;
    this.#accessToken = hostConfig.auth?.accessToken ?? null;
    this.host = hostConfig.host;
    this.url = `${this.host}/api`;
    this.#api = new HttpClient(this.url);
    if (this.#accessToken && !GlobalConfig.needRefreshToken(this.#accessToken))
      this.#api.setHeaders({
        Authorization: `Bearer ${this.#accessToken.jwt}`,
      });
  }

  async uploadEnv(devProjectId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append("devProjectId", devProjectId);
    formData.append("file", file);
    const data = await this.#api.post<boolean>(`/uploadEnv/${devProjectId}`, formData);
    return data;
  }
  async downloadEnv(devProjectId: string): Promise<unknown> {
    const localPath = `${this.#workspace.workspaceRoot}/local/env.tar`;
    await this.#api.getFile(`/downloadEnv/${devProjectId}`, localPath);
    return localPath;
  }
  async getRemoteAuthToken(remoteId: string): Promise<AccessToken | null> {
    try {
      const accessToken = await this.#api.get<AccessTokenDto>(`/getRemoteAuthToken/${remoteId}`);
      this.#accessToken = GlobalConfig.toAccessToken(accessToken);
      this.#api.setHeaders({
        Authorization: `Bearer ${this.#accessToken.jwt}`,
      });
      return this.#accessToken;
    } catch (_) {
      return null;
    }
  }
  async #ensureAccessTokenLive({
    allowUnauthorized = false,
  }: {
    allowUnauthorized?: boolean;
  } = {}): Promise<AccessToken> {
    if (!this.#accessToken) throw new Error("No access token");
    const needRefresh = GlobalConfig.needRefreshToken(this.#accessToken);
    if (!needRefresh) return this.#accessToken;
    const refreshToken = this.#accessToken?.refreshToken;
    if (!refreshToken) throw new Error("No refresh token");
    return await this.refreshAuthToken(refreshToken);
  }
  async refreshAuthToken(refreshToken: string): Promise<AccessToken> {
    const response = await this.#api.post<AccessTokenDto>(`/refreshAuthToken`, { refreshToken });
    this.#accessToken = GlobalConfig.toAccessToken(response);
    this.#api.setHeaders({ Authorization: `Bearer ${this.#accessToken.jwt}` });
    return this.#accessToken;
  }
  async requestTunnel(input: { name: string; ttlMinutes?: number }): Promise<TunnelGrant> {
    return await this.#api.post<TunnelGrant>(`/requestTunnel`, input);
  }
  /** The generated name of the model's own `inSelf` slice: a hand-written `listTunnels` would collide with it. */
  async tunnelListInSelf(): Promise<TunnelSummary[]> {
    return await this.#api.get<TunnelSummary[]>(`/tunnelListInSelf`);
  }
  /** Hands the grant back. The CLI calls this "stop", which is what the operator is doing, not what it does. */
  async revokeTunnel(code: string): Promise<boolean> {
    return await this.#api.post<boolean>(`/revokeTunnel`, { code });
  }
  async getRemoteSelf(): Promise<{ id: string; nickname: string } | null> {
    try {
      const data = await this.#api.get<{ id: string; nickname: string }>(`/getRemoteSelf`);
      return data;
    } catch {
      return null;
    }
  }
}
