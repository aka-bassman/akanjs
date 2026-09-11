import type { SignalContext } from "akanjs/signal";
import type { SerAccount } from "./account";

/**
 * Whether an account arrived on a token the OAuth server minted for an agent. Such a token names its client and the
 * MCP resource it was issued for; a browser session carries neither, and `McpAuth` refuses one with no `aud`, so the
 * two claims are the one honest marker a token itself offers.
 */
export const isAgentToken = (account: Partial<SerAccount> | null | undefined): boolean => {
  if (!account) return false;
  if (typeof account.client_id === "string" && account.client_id) return true;
  const { aud } = account;
  if (typeof aud === "string") return !!aud;
  return Array.isArray(aud) && aud.some((value) => typeof value === "string" && !!value);
};

/**
 * Whether a model rather than a person is driving this call: it came through the MCP endpoint, or it rides an
 * agent's token over any other transport. Not authorization — the guards decided who may call — but the fact an
 * endpoint needs where the same action is safe for a person and not for a model, such as sending a customer mail.
 */
export const isAgentCall = (context: SignalContext): boolean =>
  context.origin === "mcp" || isAgentToken(context.get<SerAccount>("account"));
