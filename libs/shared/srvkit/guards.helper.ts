import type { Me, Self } from "@libs/shared/common";
import type { SignalContext } from "akanjs/signal";
import { Err } from "../lib/dict";
import type { SerAccount } from "./account";

export const allow = (
  context: SignalContext,
  account: SerAccount<{ self?: Self; me?: Me }> | null,
  roles: ("user" | "admin" | "superAdmin")[],
) => {
  // An anonymous caller is `{ appName, environment }` with neither identity, not `null`. 401 rather than the
  // default 400: it is the status an MCP client reads as "obtain a token", and the one the resource-server challenge
  // is issued on; a caller who is signed in and merely lacks the role gets 403 below.
  if (!account?.self && !account?.me)
    throw new Err("shared.error.noAuthenticationAccount", undefined, { statusCode: 401 });
  for (const role of roles) {
    if (role === "user" && !account.self?.removedAt && account.self?.roles.includes("user")) return true;
    else if (role === "admin" && !account.me?.removedAt && account.me?.roles.includes("admin")) return true;
    else if (role === "superAdmin" && !account.me?.removedAt && account.me?.roles.includes("superAdmin")) return true;
  }
  const yourRoles = [...(account.self?.roles ?? []), ...(account.me?.roles ?? [])].join(", ");
  const noRolesSuffix = !account.self?.roles.length && !account.me?.roles.length ? " (No Roles)" : "";
  throw new Err(
    "shared.error.noAuthenticationWithRoles",
    { key: context.key, roles: roles.join(", "), yourRoles: `${yourRoles}${noRolesSuffix}` },
    { statusCode: 403 },
  );
};
