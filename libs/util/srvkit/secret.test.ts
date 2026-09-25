import { afterEach, describe, expect, test } from "bun:test";
import { assertJwtSecretConfigured, generateJwtSecret, resolveJwtSecret } from "./secret";

describe("assertJwtSecretConfigured", () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAllow = process.env.AKAN_ALLOW_DERIVED_JWT_SECRET;

  afterEach(() => {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalAllow === undefined) delete process.env.AKAN_ALLOW_DERIVED_JWT_SECRET;
    else process.env.AKAN_ALLOW_DERIVED_JWT_SECRET = originalAllow;
  });

  test("refuses a derived secret anywhere but a developer's machine", () => {
    delete process.env.JWT_SECRET;
    delete process.env.AKAN_ALLOW_DERIVED_JWT_SECRET;
    expect(() => assertJwtSecretConfigured({ operationMode: "cloud" })).toThrow("util.error.jwtSecretRequired");
    expect(() => assertJwtSecretConfigured({ operationMode: "local" })).not.toThrow();
  });

  test("accepts a secret from either channel, or an explicit acceptance of the risk", () => {
    delete process.env.AKAN_ALLOW_DERIVED_JWT_SECRET;
    process.env.JWT_SECRET = "from-env";
    expect(() => assertJwtSecretConfigured({ operationMode: "cloud" })).not.toThrow();
    delete process.env.JWT_SECRET;
    expect(() => assertJwtSecretConfigured({ operationMode: "cloud", configuredSecret: "from-config" })).not.toThrow();
    process.env.AKAN_ALLOW_DERIVED_JWT_SECRET = "1";
    expect(() => assertJwtSecretConfigured({ operationMode: "cloud" })).not.toThrow();
  });
});

describe("resolveJwtSecret", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  test("prefers JWT_SECRET env over configured and generated secrets", () => {
    process.env.JWT_SECRET = "from-env";
    expect(resolveJwtSecret("akasys", "local", "from-config", "repo")).toBe("from-env");
  });

  test("uses configured secret when JWT_SECRET is unset", () => {
    delete process.env.JWT_SECRET;
    expect(resolveJwtSecret("akasys", "local", "from-config", "repo")).toBe("from-config");
  });

  test("falls back to generateJwtSecret with the same seed", () => {
    delete process.env.JWT_SECRET;
    expect(resolveJwtSecret("akasys", "local", undefined, "repo")).toBe(generateJwtSecret("akasys", "local", "repo"));
  });
});
