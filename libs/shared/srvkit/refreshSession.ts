import { dayjs } from "akanjs/base";

import { Err } from "../lib/dict";

interface RefreshSessionCache {
  get(namespace: string, key: string): Promise<unknown>;
  set(
    namespace: string,
    key: string,
    value: unknown,
    option?: { expireAt?: Date | ReturnType<typeof dayjs> },
  ): Promise<unknown>;
}

export interface RefreshSession {
  id: string;
  subject: "user" | "admin";
  subjectId: string;
  refreshTokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  rotatedAt?: string;
  replacedBy?: string;
  userAgent?: string;
  /** The OAuth client the session was issued to; a refresh presented by any other client is refused. */
  clientId?: string;
  /** Absent on sessions written before it was recorded. */
  createdAt?: string;
}

interface CreateRefreshSessionInput {
  subject: RefreshSession["subject"];
  subjectId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  clientId?: string;
}

const sessionNamespace = "refreshSessionByTokenHash";
const ownerNamespace = "refreshSessionHashes";

const getOwnerKey = (subject: RefreshSession["subject"], subjectId: string) => `${subject}:${subjectId}`;

const getSession = async (cache: RefreshSessionCache, refreshTokenHash: string) => {
  return (await cache.get(sessionNamespace, refreshTokenHash)) as RefreshSession | undefined;
};

const setSession = async (cache: RefreshSessionCache, session: RefreshSession) => {
  await cache.set(sessionNamespace, session.refreshTokenHash, session, { expireAt: dayjs(session.expiresAt) });
};

const addOwnerSessionHash = async (cache: RefreshSessionCache, session: RefreshSession) => {
  const ownerKey = getOwnerKey(session.subject, session.subjectId);
  const sessionHashes = ((await cache.get(ownerNamespace, ownerKey)) as string[] | undefined) ?? [];
  await cache.set(ownerNamespace, ownerKey, [...new Set([...sessionHashes, session.refreshTokenHash])], {
    expireAt: dayjs(session.expiresAt),
  });
};

export const createRefreshSession = async (cache: RefreshSessionCache, input: CreateRefreshSessionInput) => {
  const session: RefreshSession = {
    id: crypto.randomUUID(),
    subject: input.subject,
    subjectId: input.subjectId,
    refreshTokenHash: input.refreshTokenHash,
    expiresAt: input.expiresAt.toISOString(),
    userAgent: input.userAgent,
    clientId: input.clientId,
    createdAt: dayjs().toISOString(),
  };
  await setSession(cache, session);
  await addOwnerSessionHash(cache, session);
  return session;
};

export const getRefreshSession = async (cache: RefreshSessionCache, refreshTokenHash: string) =>
  await getSession(cache, refreshTokenHash);

/**
 * The subject's live sessions: not revoked, not expired, and not a token that has already been rotated away. Two
 * live entries may share an `id` — a rotation inside the grace window leaves siblings — and both belong to the one
 * grant that id names.
 */
export const listRefreshSessions = async (
  cache: RefreshSessionCache,
  subject: RefreshSession["subject"],
  subjectId: string,
  now = dayjs(),
) => {
  const ownerKey = getOwnerKey(subject, subjectId);
  const sessionHashes = ((await cache.get(ownerNamespace, ownerKey)) as string[] | undefined) ?? [];
  const sessions = await Promise.all(sessionHashes.map(async (sessionHash) => await getSession(cache, sessionHash)));
  return sessions.filter(
    (session): session is RefreshSession =>
      !!session && !session.revokedAt && !session.replacedBy && !dayjs(session.expiresAt).isBefore(now),
  );
};

/**
 * How long a rotated token is still honoured when a caller asks for a grace window. An OAuth client that holds one
 * token in two places — Claude Code opens its MCP connection twice at startup — refreshes twice within a second,
 * and the second refresh is not theft: inside the window it is answered with a rotation of its own, past it the
 * reuse revokes the family (OAuth 2.1 §6.1 leaves detection to the server; Auth0's reuse interval and Okta's grace
 * period make the same trade). Off by default, so a browser session keeps strict single-use; the window is measured
 * from the first rotation, so it cannot be kept open by re-presenting.
 */
export const refreshRotationGraceMs = 30_000;

export interface RotateRefreshSessionOptions {
  graceMs?: number;
  now?: ReturnType<typeof dayjs>;
  /**
   * What a detected reuse revokes. `account` (the default, and the browser session's policy) signs the subject out
   * everywhere. `lineage` revokes only the sessions sharing the reused token's `id` — the one grant, in OAuth 2.1
   * §6.1's sense — so a stale token replayed by one MCP client cannot log the browser and every other client out.
   */
  reuseRevokes?: "account" | "lineage";
}

export const rotateRefreshSession = async (
  cache: RefreshSessionCache,
  refreshTokenHash: string,
  nextRefreshTokenHash: string,
  nextExpiresAt: Date,
  { graceMs = 0, now = dayjs(), reuseRevokes = "account" }: RotateRefreshSessionOptions = {},
) => {
  const session = await getSession(cache, refreshTokenHash);
  if (!session) throw new Err("shared.error.invalidRefreshToken");
  if (session.revokedAt) throw new Err("shared.error.revokedRefreshToken");
  if (dayjs(session.expiresAt).isBefore(now)) throw new Err("shared.error.expiredRefreshToken");
  if (session.rotatedAt && now.diff(dayjs(session.rotatedAt)) >= graceMs) {
    if (reuseRevokes === "lineage")
      await revokeRefreshSessionBySid(cache, session.subject, session.subjectId, session.id);
    else await revokeRefreshSessions(cache, session.subject, session.subjectId);
    throw new Err("shared.error.refreshTokenReuseDetected");
  }

  const rotatedSession = {
    ...session,
    rotatedAt: session.rotatedAt ?? now.toISOString(),
    replacedBy: nextRefreshTokenHash,
  };
  const nextSession = {
    ...session,
    refreshTokenHash: nextRefreshTokenHash,
    expiresAt: nextExpiresAt.toISOString(),
  };
  delete nextSession.rotatedAt;
  delete nextSession.replacedBy;

  await setSession(cache, rotatedSession);
  await setSession(cache, nextSession);
  await addOwnerSessionHash(cache, nextSession);
  return nextSession;
};

export const revokeRefreshSessionBySid = async (
  cache: RefreshSessionCache,
  subject: RefreshSession["subject"],
  subjectId: string,
  sessionId?: string,
) => {
  if (!sessionId) return;
  const ownerKey = getOwnerKey(subject, subjectId);
  const sessionHashes = ((await cache.get(ownerNamespace, ownerKey)) as string[] | undefined) ?? [];
  await Promise.all(
    sessionHashes.map(async (sessionHash) => {
      const session = await getSession(cache, sessionHash);
      if (session?.id !== sessionId || session.revokedAt) return;
      await setSession(cache, { ...session, revokedAt: dayjs().toISOString() });
    }),
  );
};

export const revokeRefreshSessions = async (
  cache: RefreshSessionCache,
  subject: RefreshSession["subject"],
  subjectId: string,
) => {
  const ownerKey = getOwnerKey(subject, subjectId);
  const sessionHashes = ((await cache.get(ownerNamespace, ownerKey)) as string[] | undefined) ?? [];
  await Promise.all(
    sessionHashes.map(async (sessionHash) => {
      const session = await getSession(cache, sessionHash);
      if (!session || session.revokedAt) return;
      await setSession(cache, { ...session, revokedAt: dayjs().toISOString() });
    }),
  );
};
