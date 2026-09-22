import { McpOAuth } from "./McpOAuth";

/**
 * The loopback address the authorization server redirects back to.
 *
 * A native client has no url of its own, so the redirect goes to a server this process runs for the length of
 * one sign-in. It binds `127.0.0.1` rather than `0.0.0.0`: the code in that redirect is a credential, and a
 * port open to the network is a port anything on the network can race the browser to.
 */
export class McpOAuthLoopback {
  readonly #server: ReturnType<typeof Bun.serve>;
  readonly #port: number;
  #resolve: ((params: URLSearchParams) => void) | undefined;
  readonly #answer: Promise<URLSearchParams>;

  private constructor(port: number) {
    this.#port = port;
    this.#answer = new Promise<URLSearchParams>((resolve) => {
      this.#resolve = resolve;
    });
    this.#server = Bun.serve({
      port,
      hostname: "127.0.0.1",
      fetch: (request) => this.#handle(request),
    });
  }

  /**
   * Binds the port a client was registered against, or the first free one from the list.
   *
   * A registration names its `redirect_uri` exactly, so a second sign-in that landed on a different port would
   * be refused by the server — which is why the port that worked is stored with the client rather than chosen
   * afresh. When it cannot be had, the caller registers again against whatever this did bind.
   */
  static bind(preferred?: number) {
    const ports = preferred ? [preferred, ...McpOAuth.ports.filter((port) => port !== preferred)] : McpOAuth.ports;
    const failures: string[] = [];
    for (const port of ports) {
      try {
        return new McpOAuthLoopback(port);
      } catch (error) {
        failures.push(`${port}: ${String(error)}`);
      }
    }
    throw new Error(`No loopback port was free for the sign-in — ${failures.join(", ")}`);
  }

  get redirectUri() {
    return `http://127.0.0.1:${this.#port}${McpOAuth.callbackPath}`;
  }

  /** The query the browser came back with, or a timeout — a sign-in nobody finishes must give the port back. */
  async wait() {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("The sign-in was not completed in time.")), McpOAuth.timeoutMs).unref?.(),
    );
    return await Promise.race([this.#answer, timeout]);
  }

  close() {
    this.#server.stop(true);
  }

  #handle(request: Request) {
    const url = new URL(request.url);
    if (url.pathname !== McpOAuth.callbackPath) return new Response("Not found", { status: 404 });
    this.#resolve?.(url.searchParams);
    const failed = url.searchParams.get("error");
    // The page is the only thing the person sees at the end of the flow, so it says which window to go back to.
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>akan code</title><body style="font:16px system-ui;padding:3rem">
<h1>${failed ? "Sign-in failed" : "Signed in"}</h1>
<p>${failed ? `The authorization server said: ${Bun.escapeHTML(failed)}` : "You can close this tab and go back to the terminal."}</p>`,
      { status: failed ? 400 : 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
}
