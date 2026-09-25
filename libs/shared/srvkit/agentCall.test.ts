import { describe, expect, test } from "bun:test";
import type { SignalContext } from "akanjs/signal";
import type { SerAccount } from "./account";
import { isAgentCall, isAgentToken } from "./agentCall";
import { Person } from "./guards";
import { AgentCall } from "./internalArgs";

const context = (origin: string, account: object | null) =>
  ({ origin, get: () => account }) as unknown as SignalContext;
type Fixture = SerAccount<{ self?: { id: string; roles: string[] } }>;
const browserSession: Fixture = { appName: "probe", environment: "testing", self: { id: "u1", roles: ["user"] } };
const agentToken: Fixture = {
  ...browserSession,
  aud: "https://app.example.com/mcp",
  client_id: "dcr_claude",
  sub: "user:u1",
};

describe("isAgentToken", () => {
  test("reads the claims only an OAuth-minted token carries", () => {
    expect(isAgentToken(agentToken)).toBe(true);
    expect(isAgentToken({ aud: ["https://app.example.com/mcp"] })).toBe(true);
    expect(isAgentToken({ client_id: "dcr_claude" })).toBe(true);
    expect(isAgentToken(browserSession)).toBe(false);
    expect(isAgentToken({ aud: "", client_id: "" })).toBe(false);
    expect(isAgentToken({ aud: [""] })).toBe(false);
    expect(isAgentToken(null)).toBe(false);
    expect(isAgentToken(undefined)).toBe(false);
  });
});

describe("isAgentCall / AgentCall / Person", () => {
  test("an MCP call is an agent's whoever signed it, and an agent token is an agent's on any transport", () => {
    expect(isAgentCall(context("mcp", browserSession))).toBe(true);
    expect(isAgentCall(context("mcp", null))).toBe(true);
    expect(isAgentCall(context("http", agentToken))).toBe(true);
    expect(isAgentCall(context("websocket", agentToken))).toBe(true);
    expect(isAgentCall(context("http", browserSession))).toBe(false);
    expect(isAgentCall(context("http", null))).toBe(false);
  });

  test("the internal arg and the guard read the same verdict from opposite sides", () => {
    const arg = new AgentCall();
    const person = new Person();
    expect(arg.getArg(context("mcp", browserSession))).toBe(true);
    expect(person.canPass(context("mcp", browserSession))).toBe(false);
    expect(arg.getArg(context("http", browserSession))).toBe(false);
    expect(person.canPass(context("http", browserSession))).toBe(true);
    // `agents = false` takes the endpoint out of the catalogue document; account scope refuses a call regardless.
    expect(Person.agents).toBe(false);
    expect(Person.scope).toBe("account");
    expect(Person.name).toBe("Person");
  });
});
