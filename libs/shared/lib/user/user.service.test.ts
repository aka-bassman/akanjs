import { afterEach, beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import { refreshRotationGraceMs } from "@libs/shared/srvkit";
import { dayjs } from "akanjs/base";
import { CacheDatabase } from "akanjs/document";
import { ConformanceEnv } from "akanjs/test";

import type * as db from "../db";
import { UserModel } from "./user.document";
import { UserService } from "./user.service";

const cloudRotation = { graceMs: refreshRotationGraceMs, reuseRevokes: "lineage" } as const;
const user = {
  id: "u1",
  nickname: "cli",
  roles: ["user"],
  images: [],
  profileStatus: "prepare",
  status: "active",
} as unknown as db.User;
const refreshTokenOf = ({ refreshToken }: db.util.AccessToken) => {
  if (!refreshToken) throw new Error("answered without a refresh token");
  return refreshToken;
};

const serviceOn = (cache: CacheDatabase) => {
  const userModel = new UserModel();
  Object.defineProperty(userModel, "userCache", { value: cache });
  Object.defineProperty(userModel, "getActiveUser", { value: async () => user });
  const service = new UserService();
  Object.defineProperty(service, "userModel", { value: userModel });
  Object.defineProperty(service, "securityService", {
    value: {
      createRefreshToken: () => {
        const refreshToken = crypto.randomUUID();
        return {
          refreshToken,
          refreshTokenHash: `hash:${refreshToken}`,
          refreshTokenExpiresAt: dayjs().add(30, "day").toDate(),
        };
      },
      hashRefreshToken: (refreshToken: string) => `hash:${refreshToken}`,
      signAccessToken: async () => ({ jwt: "jwt", expiresAt: dayjs().add(7, "day") }),
    },
  });
  return service;
};

for (const kind of ConformanceEnv.cacheKinds("user refresh token")) {
  describe(`UserService.refreshUserToken on the ${kind} cache`, () => {
    let opened: Awaited<ReturnType<typeof ConformanceEnv.openCache>>;
    let service: UserService;
    beforeEach(async () => {
      opened = await ConformanceEnv.openCache(kind);
      service = serviceOn(new CacheDatabase("user", opened.cache));
    });
    afterEach(async () => {
      setSystemTime();
      await opened.close();
    });

    test("without an option, a token presented again after its rotation signs the account out everywhere", async () => {
      const cli = refreshTokenOf(await service._issueUserToken(user));
      const browser = refreshTokenOf(await service._issueUserToken(user));
      const rotated = refreshTokenOf(await service.refreshUserToken(cli));
      await expect(service.refreshUserToken(cli)).rejects.toThrow("shared.error.refreshTokenReuseDetected");
      await expect(service.refreshUserToken(rotated)).rejects.toThrow("shared.error.revokedRefreshToken");
      await expect(service.refreshUserToken(browser)).rejects.toThrow("shared.error.revokedRefreshToken");
    });

    // Not Promise.all: two presentations that interleave at the cache both pass even without the option.
    test("with the grace option, a token refreshed twice in a row gives both callers a live session", async () => {
      const cli = refreshTokenOf(await service._issueUserToken(user));
      const first = refreshTokenOf(await service.refreshUserToken(cli, undefined, cloudRotation));
      const second = refreshTokenOf(await service.refreshUserToken(cli, undefined, cloudRotation));
      expect(second).not.toBe(first);
      expect((await service.refreshUserToken(first, undefined, cloudRotation)).refreshToken).toBeTruthy();
      expect((await service.refreshUserToken(second, undefined, cloudRotation)).refreshToken).toBeTruthy();
    });

    test("past the window, the reuse revokes only that token's lineage and the other sessions live on", async () => {
      const cli = refreshTokenOf(await service._issueUserToken(user));
      const browser = refreshTokenOf(await service._issueUserToken(user));
      const rotated = refreshTokenOf(await service.refreshUserToken(cli, undefined, cloudRotation));
      setSystemTime(Date.now() + refreshRotationGraceMs + 1000);
      await expect(service.refreshUserToken(cli, undefined, cloudRotation)).rejects.toThrow(
        "shared.error.refreshTokenReuseDetected",
      );
      await expect(service.refreshUserToken(rotated, undefined, cloudRotation)).rejects.toThrow(
        "shared.error.revokedRefreshToken",
      );
      expect((await service.refreshUserToken(browser)).refreshToken).toBeTruthy();
    });
  });
}
