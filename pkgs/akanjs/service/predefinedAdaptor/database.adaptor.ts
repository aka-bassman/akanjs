import { Database } from "bun:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getEnv, type PromiseOrObject } from "akanjs/base";
import type { ConstantModel } from "akanjs/constant";
import type { DatabaseModel, DocumentSchema, SchemaOf } from "akanjs/document";
import { adapt } from "../adapt";
import { ScheduleAdaptorRole } from "./role.adaptor";
import {
  DEFAULT_TOKENIZER,
  OPTIMIZE_CRON,
  OPTIMIZE_CRON_KEY,
  parseSearchEnabled,
  RETRY_INTERVAL_KEY,
  RETRY_INTERVAL_MS,
  SearchIndex,
} from "./searchIndex";
import { PostgresDialect } from "./sql/dialect/postgres";
import { BunSqliteClient } from "./sql/driver/bunSqlite";
import { LibsqlAkanClient } from "./sql/driver/libsql";
import { PostgresAkanClient } from "./sql/driver/postgres";
import { PendingStoreEnsures } from "./sql/PendingStoreEnsures";
import { SqlDocumentStore } from "./sql/SqlDocumentStore";
import type {
  DatabaseAdaptor,
  LibsqlDatabaseConfig,
  PostgresDatabaseConfig,
  SearchConfig,
  SqliteDatabaseConfig,
  SqliteEnv,
  TransactionContext,
} from "./sql/types";
import { resolveDefaultSqliteFile } from "./sqlitePath";

export { PostgresDialect } from "./sql/dialect/postgres";
export { SqliteDialect } from "./sql/dialect/sqlite";
export { SqlDocumentStore } from "./sql/SqlDocumentStore";
/**
 * The three SQL databases an app can mount, and nothing else. The layer underneath them — drivers, dialects,
 * the query and update compilers, and the document store they all share — lives in .
 */
export type {
  AkanSqlClient,
  AkanSqlStatement,
  DatabaseAdaptor,
  DatabaseConfig,
  DocumentDatabaseOwner,
  DocumentStore,
  LibsqlDatabaseConfig,
  PostgresDatabaseConfig,
  SearchConfig,
  SqliteDatabaseConfig,
  SqlResultRows,
} from "./sql/types";

export class SqliteDatabase
  extends adapt("sqliteDatabase", ({ env, plug }) => ({
    scheduler: plug(ScheduleAdaptorRole),
    config: env((env: SqliteEnv) => {
      const defaultFile = () => {
        const { appName, environment, operationMode } = getEnv();
        return resolveDefaultSqliteFile({
          appName,
          fileName: `${appName}-${environment}.db`,
          isProduction: process.env.NODE_ENV === "production",
          operationMode,
          workspaceRoot: env.workspaceRoot,
        });
      };
      return {
        journalMode: "WAL",
        busyTimeoutMs: 5000,
        synchronous: "NORMAL",
        foreignKeys: true,
        ...env.database?.sqlite,
        filePath: env.database?.sqlite?.filePath ?? process.env.SQLITE_DATABASE_PATH ?? defaultFile(),
        search: {
          enabled: env.database?.search?.enabled ?? parseSearchEnabled(process.env.AKAN_SEARCH_ENABLED),
          tokenizer: env.database?.search?.tokenizer ?? process.env.AKAN_SEARCH_TOKENIZER ?? DEFAULT_TOKENIZER,
        },
      } satisfies Required<
        Pick<SqliteDatabaseConfig, "filePath" | "journalMode" | "busyTimeoutMs" | "synchronous" | "foreignKeys">
      > &
        SqliteDatabaseConfig & { search: Required<SearchConfig> };
    }),
  }))
  implements DatabaseAdaptor
{
  #db!: Database;
  #client!: BunSqliteClient;
  #stores = new Map<string, SqlDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();
  #ensures = new PendingStoreEnsures();
  #searchIndex!: SearchIndex;

  override async onInit() {
    await mkdir(path.dirname(this.config.filePath), { recursive: true });
    this.#db = new Database(this.config.filePath, { strict: true, create: true });
    this.#client = new BunSqliteClient(this.#db);
    this.#db.run(`PRAGMA journal_mode = ${this.config.journalMode ?? "WAL"}`);
    this.#db.run(`PRAGMA busy_timeout = ${this.config.busyTimeoutMs ?? 5000}`);
    this.#db.run(`PRAGMA synchronous = ${this.config.synchronous ?? "NORMAL"}`);
    this.#db.run(`PRAGMA foreign_keys = ${this.config.foreignKeys === false ? "OFF" : "ON"}`);
    if (this.config.cacheSize) this.#db.run(`PRAGMA cache_size = ${this.config.cacheSize}`);
    if (this.config.tempStore) this.#db.run(`PRAGMA temp_store = ${this.config.tempStore}`);
    this.#db.run(
      `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
    );
    this.#searchIndex = new SearchIndex(this, this.config.search);
    await this.#searchIndex.ensureSchema();
    this.scheduler.registerCron(OPTIMIZE_CRON_KEY, OPTIMIZE_CRON, async () => {
      await this.#searchIndex.optimize();
    });
    this.scheduler.registerInterval(RETRY_INTERVAL_KEY, RETRY_INTERVAL_MS, async () => {
      await this.#searchIndex.retryPending();
    });
  }

  override async onDestroy() {
    this.scheduler.unregisterCron(OPTIMIZE_CRON_KEY);
    this.scheduler.unregisterInterval(RETRY_INTERVAL_KEY);
    await this.#ensures.settle();
    this.#db?.run("PRAGMA wal_checkpoint(TRUNCATE)");
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  getSearchIndex() {
    return this.#searchIndex;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqlDocumentStore(this, constant, database, schema as DocumentSchema);
    this.#stores.set(database.refName, store);
    this.#ensures.track(store.ensure());
    return store;
  }

  getMeta(key: string) {
    return (this.#db.query(`SELECT "value" FROM "_akan_meta" WHERE "key" = ?`).get(key) as { value: string } | null)
      ?.value;
  }

  async setMeta(key: string, value: string) {
    this.#db
      .query(
        `INSERT INTO "_akan_meta" ("key", "value", "updatedAt") VALUES (?, ?, ?) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", "updatedAt" = excluded."updatedAt"`,
      )
      .run(key, value, Date.now());
  }

  async transaction<T>(fn: () => PromiseOrObject<T>): Promise<T> {
    const active = this.#transaction.getStore();
    if (active) return await fn();
    const context: TransactionContext = { afterCommit: [] };
    return await this.#transaction.run(context, async () => {
      this.#db.run("BEGIN IMMEDIATE");
      try {
        const result = await fn();
        this.#db.run("COMMIT");
        for (const hook of context.afterCommit) await hook();
        return result;
      } catch (err) {
        this.#db.run("ROLLBACK");
        throw err;
      }
    });
  }

  async afterCommit(fn: () => PromiseOrObject<void>) {
    const active = this.#transaction.getStore();
    if (!active) return await fn();
    active.afterCommit.push(fn);
  }

  checkpoint(mode: "PASSIVE" | "FULL" | "RESTART" | "TRUNCATE" = "TRUNCATE") {
    this.#db.run(`PRAGMA wal_checkpoint(${mode})`);
  }

  vacuum() {
    this.#db.run("VACUUM");
  }
}

export class LibsqlDatabase
  extends adapt("libsqlDatabase", ({ env, plug }) => ({
    scheduler: plug(ScheduleAdaptorRole),
    config: env((env: SqliteEnv) => {
      const defaultFile = () => {
        const { appName, environment, operationMode } = getEnv();
        return resolveDefaultSqliteFile({
          appName,
          fileName: `${appName}-${environment}.db`,
          isProduction: process.env.NODE_ENV === "production",
          operationMode,
          workspaceRoot: env.workspaceRoot,
        });
      };
      return {
        url:
          env.database?.libsql?.url ??
          process.env.LIBSQL_URL ??
          process.env.LIBSQL_URI ??
          `file:${env.database?.sqlite?.filePath ?? process.env.SQLITE_DATABASE_PATH ?? defaultFile()}`,
        authToken: env.database?.libsql?.authToken ?? process.env.LIBSQL_AUTH_TOKEN,
        search: {
          enabled: env.database?.search?.enabled ?? parseSearchEnabled(process.env.AKAN_SEARCH_ENABLED),
          tokenizer: env.database?.search?.tokenizer ?? process.env.AKAN_SEARCH_TOKENIZER ?? DEFAULT_TOKENIZER,
        },
      } satisfies LibsqlDatabaseConfig & { search: Required<SearchConfig> };
    }),
  }))
  implements DatabaseAdaptor
{
  #client!: LibsqlAkanClient;
  #stores = new Map<string, SqlDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();
  #ensures = new PendingStoreEnsures();
  #searchIndex!: SearchIndex;

  override async onInit() {
    const url = this.config.url ?? "file:local.db";
    if (url.startsWith("file:")) await mkdir(path.dirname(url.slice(5)), { recursive: true });
    const { createClient } = await import("@libsql/client");
    this.#client = new LibsqlAkanClient(createClient({ url, authToken: this.config.authToken }));
    await this.#client.execute(
      `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
    );
    this.#searchIndex = new SearchIndex(this, this.config.search);
    await this.#searchIndex.ensureSchema();
    this.scheduler.registerCron(OPTIMIZE_CRON_KEY, OPTIMIZE_CRON, async () => {
      await this.#searchIndex.optimize();
    });
    this.scheduler.registerInterval(RETRY_INTERVAL_KEY, RETRY_INTERVAL_MS, async () => {
      await this.#searchIndex.retryPending();
    });
  }

  override async onDestroy() {
    this.scheduler.unregisterCron(OPTIMIZE_CRON_KEY);
    this.scheduler.unregisterInterval(RETRY_INTERVAL_KEY);
    await this.#ensures.settle();
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  getSearchIndex() {
    return this.#searchIndex;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqlDocumentStore(this, constant, database, schema as DocumentSchema);
    this.#stores.set(database.refName, store);
    this.#ensures.track(store.ensure());
    return store;
  }

  async getMeta(key: string) {
    return (await this.#client.prepare(`SELECT "value" FROM "_akan_meta" WHERE "key" = ?`).get<{ value: string }>(key))
      ?.value;
  }

  async setMeta(key: string, value: string) {
    await this.#client
      .prepare(
        `INSERT INTO "_akan_meta" ("key", "value", "updatedAt") VALUES (?, ?, ?) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", "updatedAt" = excluded."updatedAt"`,
      )
      .run(key, value, Date.now());
  }

  async transaction<T>(fn: () => PromiseOrObject<T>): Promise<T> {
    const active = this.#transaction.getStore();
    if (active) return await fn();
    const context: TransactionContext = { afterCommit: [] };
    return await this.#transaction.run(context, async () => {
      await this.#client.execute("BEGIN IMMEDIATE");
      try {
        const result = await fn();
        await this.#client.execute("COMMIT");
        for (const hook of context.afterCommit) await hook();
        return result;
      } catch (err) {
        await this.#client.execute("ROLLBACK");
        throw err;
      }
    });
  }

  async afterCommit(fn: () => PromiseOrObject<void>) {
    const active = this.#transaction.getStore();
    if (!active) return await fn();
    active.afterCommit.push(fn);
  }
}

export class PostgresDatabase
  extends adapt("postgresDatabase", ({ env }) => ({
    config: env((env: SqliteEnv) => {
      return {
        url: env.database?.postgres?.url ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URI,
        host: env.database?.postgres?.host ?? process.env.POSTGRES_HOST ?? "localhost",
        port: env.database?.postgres?.port ?? Number(process.env.POSTGRES_PORT ?? 5432),
        database: env.database?.postgres?.database ?? process.env.POSTGRES_DATABASE ?? "akan",
        user: env.database?.postgres?.user ?? process.env.POSTGRES_USER ?? "akan",
        password: env.database?.postgres?.password ?? process.env.POSTGRES_PASSWORD ?? "akan",
      } satisfies PostgresDatabaseConfig;
    }),
  }))
  implements DatabaseAdaptor
{
  #client!: PostgresAkanClient;
  #stores = new Map<string, SqlDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();
  #ensures = new PendingStoreEnsures();

  override async onInit() {
    const { default: postgres } = await import("postgres");
    const sql = this.config.url
      ? postgres(this.config.url)
      : postgres({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          username: this.config.user,
          password: this.config.password,
        });
    this.#client = new PostgresAkanClient(sql);
    await this.#client.execute(
      `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" BIGINT NOT NULL)`,
    );
  }

  override async onDestroy() {
    await this.#ensures.settle();
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  // Postgres has no fts5; text search is a SQLite/libsql feature until a tsvector dialect exists.
  getSearchIndex() {
    return null;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqlDocumentStore(this, constant, database, schema as DocumentSchema, new PostgresDialect());
    this.#stores.set(database.refName, store);
    this.#ensures.track(store.ensure());
    return store;
  }

  async getMeta(key: string) {
    return (await this.#client.prepare(`SELECT "value" FROM "_akan_meta" WHERE "key" = $1`).get<{ value: string }>(key))
      ?.value;
  }

  async setMeta(key: string, value: string) {
    await this.#client
      .prepare(
        `INSERT INTO "_akan_meta" ("key", "value", "updatedAt") VALUES ($1, $2, $3) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", "updatedAt" = excluded."updatedAt"`,
      )
      .run(key, value, Date.now());
  }

  async transaction<T>(fn: () => PromiseOrObject<T>): Promise<T> {
    const active = this.#transaction.getStore();
    if (active) return await fn();
    const context: TransactionContext = { afterCommit: [] };
    return await this.#transaction.run(context, async () => {
      await this.#client.execute("BEGIN");
      try {
        const result = await fn();
        await this.#client.execute("COMMIT");
        for (const hook of context.afterCommit) await hook();
        return result;
      } catch (err) {
        await this.#client.execute("ROLLBACK");
        throw err;
      }
    });
  }

  async afterCommit(fn: () => PromiseOrObject<void>) {
    const active = this.#transaction.getStore();
    if (!active) return await fn();
    active.afterCommit.push(fn);
  }
}
