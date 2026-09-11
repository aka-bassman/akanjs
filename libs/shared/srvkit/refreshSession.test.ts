import { describe, expect, test } from "bun:test";
import { dayjs } from "akanjs/base";
import {
  createRefreshSession,
  getRefreshSession,
  listRefreshSessions,
  refreshRotationGraceMs,
  revokeRefreshSessionBySid,
  rotateRefreshSession,
} from "./refreshSession";

const memoryCache = () => {
  const store = new Map<string, unknown>();
  return {
    get: async (namespace: string, key: string) => store.get(`${namespace}:${key}`),
    set: async (namespace: string, key: string, value: unknown) => {
      store.set(`${namespace}:${key}`, value);
    },
  };
};
const expiresAt = () => dayjs().add(30, "day").toDate();

describe("rotateRefreshSession", () => {
  test("rotates once, honours a reuse inside the grace window, and revokes the family past it", async () => {
    const cache = memoryCache();
    await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "h0",
      expiresAt: expiresAt(),
    });
    const first = await rotateRefreshSession(cache, "h0", "h1", expiresAt());
    expect(first.refreshTokenHash).toBe("h1");
    // The same token again, a second later: a client holding it in two places, answered with a sibling.
    const sibling = await rotateRefreshSession(cache, "h0", "h2", expiresAt(), {
      graceMs: refreshRotationGraceMs,
      now: dayjs().add(1, "second"),
    });
    expect(sibling.refreshTokenHash).toBe("h2");
    // Both children are live.
    expect((await rotateRefreshSession(cache, "h1", "h3", expiresAt())).refreshTokenHash).toBe("h3");
    expect((await rotateRefreshSession(cache, "h2", "h4", expiresAt())).refreshTokenHash).toBe("h4");
    // Past the window the reuse is theft: the whole family goes.
    const late = dayjs().add(refreshRotationGraceMs + 1000, "millisecond");
    await expect(
      rotateRefreshSession(cache, "h0", "h5", expiresAt(), { graceMs: refreshRotationGraceMs, now: late }),
    ).rejects.toThrow("shared.error.refreshTokenReuseDetected");
    await expect(rotateRefreshSession(cache, "h3", "h6", expiresAt())).rejects.toThrow(
      "shared.error.revokedRefreshToken",
    );
    await expect(rotateRefreshSession(cache, "h4", "h7", expiresAt())).rejects.toThrow(
      "shared.error.revokedRefreshToken",
    );
  });

  test("measures the window from the first rotation, so re-presenting cannot keep it open", async () => {
    const cache = memoryCache();
    await createRefreshSession(cache, {
      subject: "admin",
      subjectId: "a1",
      refreshTokenHash: "h0",
      expiresAt: expiresAt(),
    });
    await rotateRefreshSession(cache, "h0", "h1", expiresAt());
    const half = dayjs().add(refreshRotationGraceMs / 2, "millisecond");
    await rotateRefreshSession(cache, "h0", "h2", expiresAt(), { graceMs: refreshRotationGraceMs, now: half });
    const past = dayjs().add(refreshRotationGraceMs + 500, "millisecond");
    await expect(
      rotateRefreshSession(cache, "h0", "h3", expiresAt(), { graceMs: refreshRotationGraceMs, now: past }),
    ).rejects.toThrow("shared.error.refreshTokenReuseDetected");
  });

  test("revokes only the reused token's lineage when asked, leaving the subject's other grants alive", async () => {
    const cache = memoryCache();
    await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "h0",
      expiresAt: expiresAt(),
    });
    await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "g0",
      expiresAt: expiresAt(),
    });
    await rotateRefreshSession(cache, "h0", "h1", expiresAt());
    await expect(rotateRefreshSession(cache, "h0", "h2", expiresAt(), { reuseRevokes: "lineage" })).rejects.toThrow(
      "shared.error.refreshTokenReuseDetected",
    );
    // The replayed lineage is gone …
    await expect(rotateRefreshSession(cache, "h1", "h3", expiresAt())).rejects.toThrow(
      "shared.error.revokedRefreshToken",
    );
    // … and the other grant — another client, the browser — still rotates.
    expect((await rotateRefreshSession(cache, "g0", "g1", expiresAt())).refreshTokenHash).toBe("g1");
  });

  test("stays strictly single-use unless a grace window is asked for", async () => {
    const cache = memoryCache();
    await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "h0",
      expiresAt: expiresAt(),
    });
    await rotateRefreshSession(cache, "h0", "h1", expiresAt());
    await expect(rotateRefreshSession(cache, "h0", "h2", expiresAt())).rejects.toThrow(
      "shared.error.refreshTokenReuseDetected",
    );
  });

  test("still refuses an unknown, revoked or expired token", async () => {
    const cache = memoryCache();
    await expect(rotateRefreshSession(cache, "nope", "h1", expiresAt())).rejects.toThrow(
      "shared.error.invalidRefreshToken",
    );
    await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "old",
      expiresAt: dayjs().subtract(1, "day").toDate(),
    });
    await expect(rotateRefreshSession(cache, "old", "h1", expiresAt())).rejects.toThrow(
      "shared.error.expiredRefreshToken",
    );
  });
});

describe("listRefreshSessions", () => {
  test("lists the live heads only: rotated-away, revoked and expired entries drop out", async () => {
    const cache = memoryCache();
    const browser = await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "b0",
      expiresAt: expiresAt(),
    });
    const agent = await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "a0",
      expiresAt: expiresAt(),
      clientId: "dcr_claude",
      userAgent: "Claude Code",
    });
    expect(agent.createdAt).toBeTruthy();
    await rotateRefreshSession(cache, "a0", "a1", expiresAt());
    const expired = await createRefreshSession(cache, {
      subject: "user",
      subjectId: "u1",
      refreshTokenHash: "x0",
      expiresAt: dayjs().subtract(1, "day").toDate(),
      clientId: "dcr_old",
    });
    const live = await listRefreshSessions(cache, "user", "u1");
    expect(live.map((session) => session.refreshTokenHash).sort()).toEqual(["a1", "b0"]);
    // The rotated head keeps the lineage id, which is what a connected-apps list groups by.
    expect(live.find((session) => session.refreshTokenHash === "a1")?.id).toBe(agent.id);
    expect(live.some((session) => session.id === expired.id)).toBe(false);
    await revokeRefreshSessionBySid(cache, "user", "u1", agent.id);
    expect((await listRefreshSessions(cache, "user", "u1")).map((session) => session.id)).toEqual([browser.id]);
    expect((await getRefreshSession(cache, "a1"))?.revokedAt).toBeTruthy();
    // Another subject's list is untouched by all of it.
    expect(await listRefreshSessions(cache, "user", "u2")).toEqual([]);
  });
});
