import { CloudApi, GlobalConfig, type TunnelGrant } from "@akanjs/devkit/cloud";
import type { App, Workspace } from "@akanjs/devkit/commandDecorators";
import { TunnelAgent } from "akanjs/server/tunnel";

export interface TunnelShareOptions {
  workspace: Workspace;
  host?: string;
  port?: number;
  ttlMinutes?: number;
  onLost?: (reason: string) => void;
}

/**
 * One app shared on a public URL: the control plane issues the hostname and the connector token, and the agent
 * holds the link open from here. The agent lives in this process rather than in a binary the user installs —
 * that is the whole point of the feature, so there is no step between `akan tunnel` and a URL to paste.
 */
export class TunnelShare {
  readonly #api: CloudApi;
  readonly #agent: TunnelAgent;
  readonly grant: TunnelGrant;
  #closed = false;

  private constructor(api: CloudApi, agent: TunnelAgent, grant: TunnelGrant) {
    this.#api = api;
    this.#agent = agent;
    this.grant = grant;
  }

  static async open(app: App, { workspace, host, port, ttlMinutes, onLost }: TunnelShareOptions) {
    const api = await CloudApi.fromHost(workspace, host ?? GlobalConfig.akanCloudHost);
    const grant = await api.requestTunnel({ name: app.name, ...(ttlMinutes ? { ttlMinutes } : {}) });
    const origin = `http://localhost:${port ?? (await app.getDevPort())}`;
    const agent = new TunnelAgent({
      gatewayUrl: grant.gatewayUrl,
      token: grant.token,
      hostnames: [grant.hostname],
      origin,
      name: app.name,
      ...(onLost ? { onLost } : {}),
    });
    await agent.start();
    return new TunnelShare(api, agent, grant);
  }

  get url() {
    return this.grant.url;
  }

  /** Stops the agent and hands the hostname back, so a share does not outlive the process that opened it. */
  async close() {
    if (this.#closed) return;
    this.#closed = true;
    await this.#agent.stop("cli exited");
    try {
      await this.#api.revokeTunnel(this.grant.code);
    } catch {
      // The share expires on its own TTL, and failing to release it must not stop the CLI from exiting.
    }
  }
}
