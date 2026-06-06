import { Database, type SQLQueryBindings, type Statement } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { dayjs, Int } from "akanjs/base";
import { ConstantRegistry, via } from "akanjs/constant";
import { by, type DatabaseCls, DatabaseRegistry, DocumentSchema, from, into } from "akanjs/document";
import { type AkanSqlClient, type AkanSqlStatement, SqliteDocumentStore } from "./database.adaptor";
import { decodeSolidValue, encodeSolidValue, getSolidConfig, toEpochMs } from "./solidSqlite";
import { resolveDefaultSqliteFile } from "./sqlitePath";

const InsightTestStatus = ["active", "failed", "deploying"] as const;
class InsightTestInput extends via((f) => ({
  title: f(String),
  score: f(Int, { default: 0 }),
  status: f(String, { default: "active" }),
  tags: f([String], { default: [] }),
})) {}
class InsightTestObject extends via(InsightTestInput, (f) => ({})) {}
class InsightTestLight extends via(InsightTestObject, ["title"] as const, () => ({})) {}
class InsightTestFull extends via(InsightTestObject, InsightTestLight, () => ({})) {}
class InsightTestInsight extends via(InsightTestFull, (f) => ({
  count: f(Int, { default: 0, accumulate: {} }),
  activeCount: f(Int, { default: 0, accumulate: { status: "active" } }),
  runningCount: f(Int, { default: 0, accumulate: { status: { oneOf: ["active", "deploying"] } } }),
  taggedCount: f(Int, { default: 0, accumulate: { tags: { oneOf: ["featured", "urgent"] } } }),
})) {}
const insightTestConstant = ConstantRegistry.buildModel(
  "sqliteInsightTest",
  InsightTestInput,
  InsightTestObject,
  InsightTestFull,
  InsightTestLight,
  InsightTestInsight,
  { InsightTestInput, InsightTestObject, InsightTestFull, InsightTestLight, InsightTestInsight, InsightTestStatus },
);
class InsightTestFilter extends from(InsightTestFull, () => ({})) {}
class InsightTestDoc extends by(InsightTestFull) {}
class InsightTestModel extends into(InsightTestDoc, InsightTestFilter, insightTestConstant, () => ({})) {}
const insightTestDatabase = DatabaseRegistry.buildModel(
  "sqliteInsightTest",
  InsightTestInput as unknown as DatabaseCls<InstanceType<typeof InsightTestInput>>,
  InsightTestDoc,
  InsightTestModel,
  InsightTestObject,
  InsightTestInsight,
  InsightTestFilter,
);

class TicketHistory extends via((f) => ({
  action: f(String),
  content: f([String], { default: [] }),
  count: f(Int, { default: 0 }),
  flag: f(Boolean, { default: false }),
})) {}
class TicketTestInput extends via((f) => ({
  title: f(String),
  status: f(String, { default: "active" }),
  issuedAt: f(Date).optional(),
  transactionAt: f(Date, { default: dayjs(0) }),
  histories: f([TicketHistory]),
})) {}
class TicketTestObject extends via(TicketTestInput, (f) => ({})) {}
class TicketTestLight extends via(TicketTestObject, ["title"] as const, () => ({})) {}
class TicketTestFull extends via(TicketTestObject, TicketTestLight, () => ({})) {}
class TicketTestInsight extends via(TicketTestFull, (f) => ({
  count: f(Int, { default: 0, accumulate: {} }),
})) {}
const ticketTestConstant = ConstantRegistry.buildModel(
  "sqliteTicketTest",
  TicketTestInput,
  TicketTestObject,
  TicketTestFull,
  TicketTestLight,
  TicketTestInsight,
  { TicketTestInput, TicketTestObject, TicketTestFull, TicketTestLight, TicketTestInsight, TicketHistory },
);
class TicketTestFilter extends from(TicketTestFull, () => ({})) {}
class TicketTestDoc extends by(TicketTestFull) {}
class TicketTestModel extends into(TicketTestDoc, TicketTestFilter, ticketTestConstant, () => ({})) {}
const ticketTestDatabase = DatabaseRegistry.buildModel(
  "sqliteTicketTest",
  TicketTestInput as unknown as DatabaseCls<InstanceType<typeof TicketTestInput>>,
  TicketTestDoc,
  TicketTestModel,
  TicketTestObject,
  TicketTestInsight,
  TicketTestFilter,
);

class TestSqliteStatement implements AkanSqlStatement {
  constructor(private readonly statement: Statement) {}

  async run(...params: unknown[]) {
    return this.statement.run(...(params as SQLQueryBindings[]));
  }

  async get<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row | null> {
    return (this.statement.get(...(params as SQLQueryBindings[])) as Row | null) ?? null;
  }

  async all<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row[]> {
    return this.statement.all(...(params as SQLQueryBindings[])) as Row[];
  }
}

class TestSqliteClient implements AkanSqlClient {
  constructor(readonly db: Database) {}

  async execute(sql: string, params: unknown[] | Record<string, unknown> = []) {
    const values = Array.isArray(params) ? params : Object.values(params);
    return this.db.query(sql).run(...(values as SQLQueryBindings[]));
  }

  prepare(sql: string): AkanSqlStatement {
    return new TestSqliteStatement(this.db.query(sql));
  }

  async close() {
    this.db.close();
  }
}

class TestDatabaseOwner {
  private readonly meta = new Map<string, string>();
  readonly afterCommitCallbacks: (() => unknown)[] = [];

  constructor(private readonly client: AkanSqlClient) {}

  getConnection() {
    return this.client;
  }

  getMeta(key: string) {
    return this.meta.get(key);
  }

  setMeta(key: string, value: string) {
    this.meta.set(key, value);
  }

  async afterCommit(fn: () => unknown) {
    this.afterCommitCallbacks.push(fn);
    await fn();
  }
}

describe("solid sqlite utilities", () => {
  test("encodes and decodes solid values", () => {
    const buffer = Buffer.from("hello");

    expect(encodeSolidValue("value")).toEqual({ type: "string", value: "value" });
    expect(encodeSolidValue(12)).toEqual({ type: "number", value: "12" });
    expect(encodeSolidValue(buffer)).toEqual({ type: "buffer", value: buffer });

    expect(decodeSolidValue<string>("string", "value")).toBe("value");
    expect(decodeSolidValue<number>("number", "12")).toBe(12);
    expect(decodeSolidValue<Buffer>("buffer", buffer)).toEqual(buffer);
    expect(decodeSolidValue<Buffer>("buffer", "hello")).toEqual(buffer);
    expect(decodeSolidValue<string>("string", null)).toBeUndefined();
  });

  test("round-trips structured (object/array) solid values as json", () => {
    // Refresh-session storage writes objects/arrays through the cache, which bun:sqlite
    // cannot bind directly; they must be JSON-encoded so callers get the value back intact.
    const session = { id: "s1", subject: "admin", expiresAt: "2026-01-01T00:00:00.000Z", userAgent: undefined };
    const encodedObj = encodeSolidValue(session);
    expect(encodedObj.type).toBe("json");
    expect(typeof encodedObj.value).toBe("string");
    expect(decodeSolidValue<typeof session>("json", encodedObj.value)).toEqual({
      id: "s1",
      subject: "admin",
      expiresAt: "2026-01-01T00:00:00.000Z",
    });

    const hashes = ["a", "b", "c"];
    const encodedArr = encodeSolidValue(hashes);
    expect(encodedArr.type).toBe("json");
    expect(decodeSolidValue<string[]>("json", encodedArr.value)).toEqual(hashes);

    // Top-level undefined is coerced to JSON null rather than producing an invalid binding.
    expect(encodeSolidValue(undefined)).toEqual({ type: "json", value: "null" });
  });

  test("converts optional expiration values to epoch ms", () => {
    const date = dayjs("2026-01-01T00:00:00.000Z");

    expect(toEpochMs()).toBeNull();
    expect(toEpochMs(null)).toBeNull();
    expect(toEpochMs(1234)).toBe(1234);
    expect(toEpochMs(date)).toBe(date.valueOf());
  });

  test("resolves default sqlite paths and solid config", () => {
    const previousSqliteDir = process.env.AKAN_SQLITE_DIR;
    const previousSolidDbPath = process.env.AKAN_SOLID_DB_PATH;
    const previousOperationMode = process.env.AKAN_PUBLIC_OPERATION_MODE;
    try {
      process.env.AKAN_SQLITE_DIR = "/tmp/akan-sqlite";
      expect(
        resolveDefaultSqliteFile({
          appName: "demo",
          fileName: "demo.db",
          isProduction: false,
          workspaceRoot: "/workspace",
        }),
      ).toBe("/tmp/akan-sqlite/demo.db");

      delete process.env.AKAN_SQLITE_DIR;
      expect(
        resolveDefaultSqliteFile({
          appName: "demo",
          fileName: "demo.db",
          isProduction: false,
          workspaceRoot: "/workspace",
        }),
      ).toBe("/workspace/local/apps/demo/demo.db");

      expect(
        resolveDefaultSqliteFile({
          appName: "demo",
          fileName: "demo.db",
          isProduction: true,
          operationMode: "local",
          workspaceRoot: "/workspace",
        }),
      ).toBe("/workspace/local/apps/demo/demo.db");

      process.env.AKAN_PUBLIC_OPERATION_MODE = "local";
      expect(
        resolveDefaultSqliteFile({
          appName: "demo",
          fileName: "demo.db",
          isProduction: true,
          workspaceRoot: "/workspace",
        }),
      ).toBe("/workspace/local/apps/demo/demo.db");

      expect(
        resolveDefaultSqliteFile({
          appName: "demo",
          fileName: "demo.db",
          isProduction: true,
          operationMode: "cloud",
          workspaceRoot: "/workspace",
        }),
      ).toBe(`${process.cwd()}/sqlite/demo.db`);

      process.env.AKAN_SOLID_DB_PATH = "/tmp/solid.db";
      expect(
        getSolidConfig({
          appName: "demo",
          environment: "test",
          solid: { queueLeaseMs: 7, journalMode: "MEMORY" },
        }).filePath,
      ).toBe("/tmp/solid.db");
      expect(
        getSolidConfig({
          appName: "demo",
          environment: "test",
          solid: { queueLeaseMs: 7, journalMode: "MEMORY" },
        }),
      ).toMatchObject({
        journalMode: "MEMORY",
        queueLeaseMs: 7,
        busyTimeoutMs: 5000,
        synchronous: "NORMAL",
      });
    } finally {
      if (previousSqliteDir === undefined) delete process.env.AKAN_SQLITE_DIR;
      else process.env.AKAN_SQLITE_DIR = previousSqliteDir;
      if (previousSolidDbPath === undefined) delete process.env.AKAN_SOLID_DB_PATH;
      else process.env.AKAN_SOLID_DB_PATH = previousSolidDbPath;
      if (previousOperationMode === undefined) delete process.env.AKAN_PUBLIC_OPERATION_MODE;
      else process.env.AKAN_PUBLIC_OPERATION_MODE = previousOperationMode;
    }
  });

  test("hydrates new documents with schema defaults before save", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, insightTestConstant, insightTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();

      const doc = store.hydrate({ title: "Draft" });

      expect(doc.score).toBe(0);
      expect(doc.status).toBe("active");
      expect(doc.tags).toEqual([]);
      await expect(doc.save()).resolves.toMatchObject({
        title: "Draft",
        score: 0,
        status: "active",
        tags: [],
      });
    } finally {
      await client.close();
    }
  });

  test("fills nested constant defaults inside arrays on save", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, ticketTestConstant, ticketTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();

      const created = await store.create({ title: "Ticket", histories: [{ action: "open" }] });
      expect(created.histories[0]).toMatchObject({ action: "open", content: [], count: 0, flag: false });

      created.histories.push({ action: "close" });
      const saved = await created.save();
      expect(saved.histories[1]).toMatchObject({ action: "close", content: [], count: 0, flag: false });

      const fetched = await store.pickById(created.id);
      expect(fetched.histories[0]).toMatchObject({ action: "open", content: [], count: 0, flag: false });
      expect(fetched.histories[1]).toMatchObject({ action: "close", content: [], count: 0, flag: false });
    } finally {
      await client.close();
    }
  });

  test("fills missing nested and top-level defaults when loading legacy rows", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, ticketTestConstant, ticketTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();

      const now = Date.now();
      // Legacy row: nested `content`/`count`/`flag` and top-level `status` were never persisted.
      const legacyDoc = JSON.stringify({ title: "Legacy", histories: [{ action: "open" }] });
      await client.execute(
        `INSERT INTO "sqliteTicketTest" ("id", "createdAt", "updatedAt", "removedAt", "_doc") VALUES (?, ?, ?, ?, ?)`,
        ["legacy-1", now, now, null, legacyDoc],
      );

      const fetched = await store.pickById("legacy-1");
      expect(fetched.status).toBe("active");
      expect(fetched.histories[0]).toMatchObject({ action: "open", content: [], count: 0, flag: false });
    } finally {
      await client.close();
    }
  });

  test("normalizes date fields to epoch storage regardless of input shape", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, ticketTestConstant, ticketTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();

      const iso = "2026-06-06T13:52:39.747Z";
      // `issuedAt` arrives as an ISO string while `transactionAt` falls back to its dayjs(0) default.
      const created = await store.create({ title: "Dated", issuedAt: iso, histories: [] });
      expect(dayjs.isDayjs(created.issuedAt)).toBe(true);
      expect(created.issuedAt.valueOf()).toBe(dayjs(iso).valueOf());
      expect(created.transactionAt.valueOf()).toBe(0);

      // Both dates must persist as epoch numbers, not a string/number mix.
      const row = await client
        .prepare(`SELECT "_doc" FROM "sqliteTicketTest" WHERE "id" = ?`)
        .get<{ _doc: string }>(created.id);
      const stored = JSON.parse(row?._doc ?? "{}");
      expect(typeof stored.issuedAt).toBe("number");
      expect(stored.issuedAt).toBe(dayjs(iso).valueOf());
      expect(typeof stored.transactionAt).toBe("number");
      expect(stored.transactionAt).toBe(0);

      const fetched = await store.pickById(created.id);
      expect(fetched.issuedAt.valueOf()).toBe(dayjs(iso).valueOf());
      expect(fetched.transactionAt.valueOf()).toBe(0);
    } finally {
      await client.close();
    }
  });

  test("reads legacy ISO-string dates as valid dayjs", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, ticketTestConstant, ticketTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();

      const iso = "2026-06-06T13:52:39.747Z";
      const now = Date.now();
      // Legacy row persisted `issuedAt` as an ISO string instead of epoch ms.
      const legacyDoc = JSON.stringify({ title: "Legacy", issuedAt: iso, histories: [] });
      await client.execute(
        `INSERT INTO "sqliteTicketTest" ("id", "createdAt", "updatedAt", "removedAt", "_doc") VALUES (?, ?, ?, ?, ?)`,
        ["legacy-date-1", now, now, null, legacyDoc],
      );

      const fetched = await store.pickById("legacy-date-1");
      expect(fetched.issuedAt.isValid()).toBe(true);
      expect(fetched.issuedAt.valueOf()).toBe(dayjs(iso).valueOf());
    } finally {
      await client.close();
    }
  });

  test("counts insight fields with document query accumulates", async () => {
    const db = new Database(":memory:", { strict: true, create: true });
    const client = new TestSqliteClient(db);
    const owner = new TestDatabaseOwner(client);
    const store = new SqliteDocumentStore(owner, insightTestConstant, insightTestDatabase, new DocumentSchema());

    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
      );
      await store.ensure();
      await store.create({ title: "Alpha", score: 12, status: "active", tags: ["featured"] });
      await store.create({ title: "Beta", score: 4, status: "failed", tags: ["cold"] });
      await store.create({ title: "Gamma", score: 20, status: "deploying", tags: ["urgent"] });

      await expect(store.insight()).resolves.toEqual({
        count: 3,
        activeCount: 1,
        runningCount: 2,
        taggedCount: 2,
      });
      await expect(store.insight({ score: { gte: 10 } })).resolves.toEqual({
        count: 2,
        activeCount: 1,
        runningCount: 2,
        taggedCount: 2,
      });
    } finally {
      await client.close();
    }
  });
});
