import { getEnv } from "akanjs/base";
import { fetch } from "akanjs/client";
import { type AgentRunner, httpRunner } from "use-agentic";

/**
 * Runs each assistant turn against the app's own `runAgentTurn` route — service signals mount unprefixed, so the
 * URL is `<serverHttpUri>/runAgentTurn` — through the shared `httpRunner`, which negotiates streaming via
 * `accept`: a server that streams answers SSE and the text arrives as it is generated; one that does not answers
 * the same JSON turn. The client runtime's fetch proxy is only probed for whether the endpoint exists (the util
 * lib ships one) and for the signed-in JWT; cookies ride the same-origin request on their own. The endpoint is a
 * stateless relay; the loop and every tool execution stay in this browser session.
 */
export const fetchRunner = (options: { fetcher?: typeof globalThis.fetch } = {}): AgentRunner => ({
  async *run(request) {
    const client = fetch as { runAgentTurn?: unknown; instance?: { jwt?: string | null } };
    if (typeof client.runAgentTurn !== "function") {
      yield { type: "error", message: "No runAgentTurn endpoint is mounted on this app, so the agent cannot answer." };
      return;
    }
    const runner = httpRunner({
      url: `${getEnv().serverHttpUri}/runAgentTurn`,
      headers: (): Record<string, string> => {
        const jwt = client.instance?.jwt;
        return jwt ? { authorization: `Bearer ${jwt}` } : {};
      },
      ...(options.fetcher ? { fetcher: options.fetcher } : {}),
    });
    yield* runner.run(request);
  },
});
