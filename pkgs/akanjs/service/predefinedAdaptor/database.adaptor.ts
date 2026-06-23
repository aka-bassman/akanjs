import { Database, type SQLQueryBindings, type Statement } from "bun:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { InArgs, InValue, Client as LibsqlClient } from "@libsql/client";
import { type BaseEnv, DEFAULT_VALUE, dayjs, FIELD_META, type PromiseOrObject } from "akanjs/base";
import { type ConstantModel, getDefault } from "akanjs/constant";
import {
  createDocumentId,
  type DatabaseModel,
  type DocumentQuery,
  type DocumentQueryNode,
  type DocumentSchema,
  type DocumentUpdate,
  type DocumentUpdateOptions,
  documentQueryHelper,
  encodeDocumentValue,
  type SchemaOf,
  sanitizeJson,
} from "akanjs/document";
import type { Sql } from "postgres";
import { adapt } from "../adapt";
import { resolveDefaultSqliteFile } from "./sqlitePath";

export interface SqliteDatabaseConfig {
  filePath?: string;
  journalMode?: "WAL" | "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "OFF";
  busyTimeoutMs?: number;
  synchronous?: "OFF" | "NORMAL" | "FULL" | "EXTRA";
  foreignKeys?: boolean;
  cacheSize?: number;
  tempStore?: "DEFAULT" | "FILE" | "MEMORY";
}

export interface LibsqlDatabaseConfig {
  url?: string;
  authToken?: string;
}

export interface PostgresDatabaseConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

export interface DatabaseConfig {
  driver?: "sqlite" | "libsql" | "postgres";
  sqlite?: SqliteDatabaseConfig;
  libsql?: LibsqlDatabaseConfig;
  postgres?: PostgresDatabaseConfig;
}

export interface DocumentStore {
  ensure(): Promise<void>;
  create(data: DocumentRecord): Promise<any>;
  clone(data: DocumentRecord & { id: string }): Promise<any>;
  update(id: string, patch: DocumentRecord): Promise<any>;
  remove(id: string): Promise<any>;
  updateOneByQuery(
    query: DocumentQuery,
    update: DocumentUpdate,
    options?: DocumentUpdateOptions,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number; upsertedId: string | null }>;
  updateManyByQuery(
    query: DocumentQuery,
    update: DocumentUpdate,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  deleteManyByQuery(
    query: DocumentQuery,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  bulkWrite(
    operations: { updateOne: { filter: DocumentQuery; update: DocumentUpdate; upsert?: boolean } }[],
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number; upsertedId: string | null }>;
  find(query?: DocumentQuery, options?: FindManyOptions): Promise<any[]>;
  findIds(
    query?: DocumentQuery,
    options?: { sort?: SortOption; skip?: number | null; limit?: number | null; sample?: number },
  ): Promise<string[]>;
  findOne(query?: DocumentQuery, options?: FindOneOptions): Promise<any | null>;
  findId(
    query?: DocumentQuery,
    options?: { sort?: SortOption; skip?: number | null; sample?: boolean },
  ): Promise<string | null>;
  pickOne(query?: DocumentQuery, options?: FindOneOptions): Promise<any>;
  pickById(id: string): Promise<any>;
  exists(query?: DocumentQuery): Promise<string | null>;
  count(query?: DocumentQuery): Promise<number>;
  insight(query?: DocumentQuery): Promise<any>;
  hydrate(data: DocumentRecord, originalData?: DocumentRecord): any;
}

export interface SqlResultRows<Row = Record<string, unknown>> {
  rows: Row[];
}

export interface AkanSqlStatement {
  run(...params: unknown[]): Promise<unknown>;
  get<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row | null>;
  all<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row[]>;
}

export interface AkanSqlClient {
  execute(sql: string, params?: unknown[] | Record<string, unknown>): Promise<unknown>;
  prepare(sql: string): AkanSqlStatement;
  close(): Promise<void>;
}

export interface DatabaseAdaptor {
  getConnection(): AkanSqlClient;
  getStore(constant: ConstantModel, database: DatabaseModel, schema: DocumentSchema): DocumentStore;
  transaction<T>(fn: () => PromiseOrObject<T>): Promise<T>;
}

interface SqliteEnv extends BaseEnv {
  workspaceRoot?: string;
  database?: DatabaseConfig;
}

interface TransactionContext {
  afterCommit: (() => PromiseOrObject<void>)[];
}

const BASE_COLUMNS = new Set(["id", "createdAt", "updatedAt", "removedAt"]);
const RESERVED_RE = /^sqlite_|^_akan_meta$/i;
const REF_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const toSafeRefName = (value: string) => value.replace(/[^A-Za-z0-9_]+/g, "_").replace(/_+/g, "_");
type DocumentRecord = Record<string, unknown>;
type MutableDocumentRecord = Record<string, unknown>;
type FieldMap = Record<string, { getProps: () => Record<string, unknown>; [key: string]: unknown }>;
type SortOption = Record<string, 1 | -1> | null | undefined;
type ProjectionOption = Partial<Record<string, boolean>> | null | undefined;
type FindManyOptions = {
  sort?: SortOption;
  skip?: number | null;
  limit?: number | null;
  sample?: number;
  select?: ProjectionOption;
};
type FindOneOptions = { sort?: SortOption; skip?: number | null; sample?: boolean; select?: ProjectionOption };
type QueryOperatorName = Exclude<
  DocumentQueryNode,
  { kind: "all" } | { kind: "any" } | { kind: "not" } | { kind: "raw" }
>["op"];
interface SqliteDocumentRow {
  id: string;
  createdAt: number | string;
  updatedAt: number | string;
  removedAt?: number | string | null;
  _doc: string;
}
type ProjectedSqliteDocumentRow = Omit<SqliteDocumentRow, "_doc"> & Record<string, unknown>;

interface DocumentDatabaseOwner {
  getConnection(): AkanSqlClient;
  getMeta(key: string): Promise<string | undefined> | string | undefined;
  setMeta(key: string, value: string): Promise<void>;
  afterCommit(fn: () => PromiseOrObject<void>): Promise<void>;
}

class BunSqliteStatement implements AkanSqlStatement {
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

class BunSqliteClient implements AkanSqlClient {
  constructor(readonly db: Database) {}
  async execute(sql: string, params: unknown[] | Record<string, unknown> = []) {
    const values = Array.isArray(params) ? params : Object.values(params);
    return this.db.query(sql).run(...(values as SQLQueryBindings[]));
  }
  prepare(sql: string): AkanSqlStatement {
    return new BunSqliteStatement(this.db.query(sql));
  }
  async close() {
    this.db.close();
  }
}

class LibsqlStatement implements AkanSqlStatement {
  constructor(
    private readonly client: LibsqlClient,
    private readonly sql: string,
  ) {}
  async run(...params: unknown[]) {
    const args = toLibsqlArgs(params);
    return await this.client.execute({ sql: this.sql, args });
  }
  async get<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row | null> {
    const args = toLibsqlArgs(params);
    const result = await this.client.execute({ sql: this.sql, args });
    return (result.rows[0] as Row | undefined) ?? null;
  }
  async all<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row[]> {
    const args = toLibsqlArgs(params);
    const result = await this.client.execute({ sql: this.sql, args });
    return result.rows as Row[];
  }
}

class LibsqlAkanClient implements AkanSqlClient {
  constructor(readonly client: LibsqlClient) {}
  async execute(sql: string, params: unknown[] | Record<string, unknown> = []) {
    return await this.client.execute({ sql, args: toLibsqlArgs(Array.isArray(params) ? params : [params]) });
  }
  prepare(sql: string): AkanSqlStatement {
    return new LibsqlStatement(this.client, sql);
  }
  async close() {
    this.client.close();
  }
}

class PostgresStatement implements AkanSqlStatement {
  constructor(
    private readonly client: Sql,
    private readonly sql: string,
  ) {}
  async run(...params: unknown[]) {
    const { sql, params: positionalParams } = toPostgresSql(this.sql, params);
    return await this.client.unsafe(sql, positionalParams as any[]);
  }
  async get<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row | null> {
    const rows = await this.all<Row>(...params);
    return rows[0] ?? null;
  }
  async all<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row[]> {
    const { sql, params: positionalParams } = toPostgresSql(this.sql, params);
    return (await this.client.unsafe(sql, positionalParams as any[])) as Row[];
  }
}

class PostgresAkanClient implements AkanSqlClient {
  constructor(readonly client: Sql) {}
  async execute(sql: string, params: unknown[] | Record<string, unknown> = []) {
    return await this.client.unsafe(sql, Array.isArray(params) ? (params as any[]) : Object.values(params));
  }
  prepare(sql: string): AkanSqlStatement {
    return new PostgresStatement(this.client, sql);
  }
  async close() {
    await this.client.end();
  }
}

const quoteIdent = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Buffer);
const toLibsqlValue = (value: unknown): InValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean" ||
    value instanceof Date ||
    value instanceof Uint8Array ||
    value instanceof ArrayBuffer
  ) {
    return value;
  }
  if (value instanceof Buffer) return new Uint8Array(value);
  return JSON.stringify(value);
};
const toLibsqlArgs = (params: unknown[]): InArgs => {
  if (params.length === 1 && isPlainObject(params[0])) {
    return Object.fromEntries(Object.entries(params[0]).map(([key, value]) => [key, toLibsqlValue(value)]));
  }
  return params.map(toLibsqlValue);
};
const toPostgresSql = (sql: string, params: unknown[]) => {
  if (params.length === 1 && isPlainObject(params[0])) {
    const named = params[0];
    const values: unknown[] = [];
    const text = sql.replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, (token) => {
      values.push(named[token.slice(1)]);
      return `$${values.length}`;
    });
    return { sql: text, params: values };
  }
  let index = 0;
  return {
    sql: sql.replace(/\?/g, () => `$${++index}`),
    params,
  };
};
const jsonPath = (path: string) =>
  `$.${path
    .split(".")
    .map((part) => part.replaceAll('"', '\\"'))
    .join(".")}`;
const encodeSqlValue = (value: unknown) => encodeDocumentValue(value);
// Dates are persisted as epoch ms, but legacy rows may hold ISO strings; accept both.
const decodeDateValue = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number") return dayjs(value);
  const epoch = Number(value);
  return Number.isNaN(epoch) ? dayjs(value as never) : dayjs(epoch);
};
const QUERY_OPERATOR_KEYS = new Set([
  "eq",
  "ne",
  "oneOf",
  "notOneOf",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "exists",
  "missing",
  "empty",
  "has",
  "contains",
]);

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const descriptorHash = async (value: unknown) => {
  const bytes = new TextEncoder().encode(stableJson(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

class QueryCompiler {
  constructor(private readonly fields: FieldMap) {}

  compile(query?: DocumentQuery): { where: string; params: unknown[] } {
    if (!query || (typeof query === "object" && !Array.isArray(query) && Object.keys(query).length === 0)) {
      return { where: "1 = 1", params: [] };
    }
    const compiled = this.compileNode(query);
    return { where: compiled.sql || "1 = 1", params: compiled.params };
  }

  orderBy(sort: Record<string, 1 | -1> = { createdAt: -1 }) {
    return Object.entries(sort)
      .map(([path, direction]) => `${this.fieldExpr(path)} ${direction === 1 ? "ASC" : "DESC"}`)
      .join(", ");
  }

  fieldExpr(path: string) {
    this.assertPath(path);
    return BASE_COLUMNS.has(path) ? quoteIdent(path) : `json_extract("_doc", ${JSON.stringify(jsonPath(path))})`;
  }

  private compileNode(query: DocumentQuery): { sql: string; params: unknown[] } {
    if (this.isQueryNode(query)) {
      if (query.kind === "all" || query.kind === "any") {
        const parts = query.queries.map((sub) => this.compileNode(sub)).filter((part) => part.sql);
        if (!parts.length) return { sql: "1 = 1", params: [] };
        const joiner = query.kind === "all" ? " AND " : " OR ";
        return {
          sql: `(${parts.map((part) => part.sql).join(joiner)})`,
          params: parts.flatMap((part) => part.params),
        };
      }
      if (query.kind === "not") {
        const part = this.compileNode(query.query);
        return { sql: `NOT (${part.sql})`, params: part.params };
      }
      if (query.kind === "raw") {
        if (/[;]/.test(query.sql)) throw new Error("Raw SQL query fragments must be a single statement fragment");
        return { sql: `(${query.sql})`, params: query.params };
      }
      throw new Error("Operator nodes must be attached to a document path");
    }
    const parts = Object.entries(query).flatMap(([path, value]) => {
      if (path.startsWith("$")) throw new Error(`Mongo-style query operator is not supported: ${path}`);
      if (value === undefined) throw new Error(`Undefined query value is not allowed: ${path}`);
      return [this.compileField(path, value)];
    });
    if (!parts.length) return { sql: "1 = 1", params: [] };
    return {
      sql: `(${parts.map((part) => part.sql).join(" AND ")})`,
      params: parts.flatMap((part) => part.params),
    };
  }

  private compileField(path: string, value: unknown): { sql: string; params: unknown[] } {
    this.assertPath(path);
    const field = this.fields[path]?.getProps?.() ?? this.fields[path];
    const expr = this.fieldExpr(path);
    if (this.isQueryNode(value)) {
      if (value.kind !== "op") return this.compileNode({ [path]: value } as DocumentQuery);
      switch (value.op) {
        case "eq":
          return value.value === null
            ? { sql: `${expr} IS NULL`, params: [] }
            : { sql: `${expr} = ?`, params: [encodeSqlValue(value.value)] };
        case "ne":
          return value.value === null
            ? { sql: `${expr} IS NOT NULL`, params: [] }
            : { sql: `${expr} != ?`, params: [encodeSqlValue(value.value)] };
        case "oneOf": {
          const values = (value.value as unknown[]) ?? [];
          if (!values.length) return { sql: "0 = 1", params: [] };
          if (field?.isArray) {
            const parts = values.map((item) => this.compileArrayHas(path, item));
            return {
              sql: `(${parts.map((part) => part.sql).join(" OR ")})`,
              params: parts.flatMap((part) => part.params),
            };
          }
          return { sql: `${expr} IN (${values.map(() => "?").join(", ")})`, params: values.map(encodeSqlValue) };
        }
        case "notOneOf": {
          const values = (value.value as unknown[]) ?? [];
          if (!values.length) return { sql: "1 = 1", params: [] };
          if (field?.isArray) {
            const parts = values.map((item) => this.compileArrayHas(path, item));
            return {
              sql: `NOT (${parts.map((part) => part.sql).join(" OR ")})`,
              params: parts.flatMap((part) => part.params),
            };
          }
          return { sql: `${expr} NOT IN (${values.map(() => "?").join(", ")})`, params: values.map(encodeSqlValue) };
        }
        case "gt":
        case "gte":
        case "lt":
        case "lte": {
          const operators = { gt: ">", gte: ">=", lt: "<", lte: "<=" } as const;
          return { sql: `${expr} ${operators[value.op]} ?`, params: [encodeSqlValue(value.value)] };
        }
        case "between": {
          const [from, to] = value.value as [unknown, unknown];
          return { sql: `(${expr} >= ? AND ${expr} <= ?)`, params: [encodeSqlValue(from), encodeSqlValue(to)] };
        }
        case "exists":
          return BASE_COLUMNS.has(path)
            ? { sql: `${expr} IS NOT NULL`, params: [] }
            : { sql: `json_type("_doc", ?) IS NOT NULL`, params: [jsonPath(path)] };
        case "missing":
          return BASE_COLUMNS.has(path)
            ? { sql: `${expr} IS NULL`, params: [] }
            : { sql: `json_type("_doc", ?) IS NULL`, params: [jsonPath(path)] };
        case "empty":
          return BASE_COLUMNS.has(path)
            ? { sql: `${expr} IS NULL`, params: [] }
            : {
                sql: `(json_type("_doc", ?) IS NULL OR json_type("_doc", ?) = 'null')`,
                params: [jsonPath(path), jsonPath(path)],
              };
        case "has":
          return this.compileArrayHas(path, value.value);
        case "contains":
          return { sql: `${expr} LIKE ?`, params: [`%${String(value.value)}%`] };
      }
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const operators = value as Record<string, unknown>;
      const keys = Object.keys(operators);
      const legacyKey = keys.find((key) => key.startsWith("$"));
      if (legacyKey) throw new Error(`Mongo-style query operator is not supported on ${path}: ${legacyKey}`);
      if (keys.some((key) => QUERY_OPERATOR_KEYS.has(key))) {
        const parts = keys.flatMap((key) => {
          if (!QUERY_OPERATOR_KEYS.has(key)) return [];
          if (key === "exists")
            return [this.compileField(path, { kind: "op", op: operators.exists ? "exists" : "missing" })];
          if (key === "missing")
            return [this.compileField(path, { kind: "op", op: operators.missing ? "missing" : "exists" })];
          if (key === "empty")
            return [this.compileField(path, { kind: "op", op: operators.empty ? "empty" : "exists" })];
          return [this.compileField(path, { kind: "op", op: key as QueryOperatorName, value: operators[key] })];
        });
        return {
          sql: `(${parts.map((part) => part.sql).join(" AND ")})`,
          params: parts.flatMap((part) => part.params),
        };
      }
    }
    if (field?.isArray && !Array.isArray(value)) return this.compileArrayHas(path, value);
    return value === null
      ? { sql: `${expr} IS NULL`, params: [] }
      : { sql: `${expr} = ?`, params: [encodeSqlValue(value)] };
  }

  private compileArrayHas(path: string, value: unknown): { sql: string; params: unknown[] } {
    const arrayPath = BASE_COLUMNS.has(path)
      ? quoteIdent(path)
      : `json_extract("_doc", ${JSON.stringify(jsonPath(path))})`;
    return {
      sql: `EXISTS (SELECT 1 FROM json_each(${arrayPath}) WHERE json_each.value = ?)`,
      params: [encodeSqlValue(value)],
    };
  }

  private assertPath(path: string) {
    const root = path.split(".")[0];
    if (BASE_COLUMNS.has(root)) return;
    if (!this.fields[root]) throw new Error(`Unknown document field path: ${path}`);
  }

  private isQueryNode(value: unknown): value is DocumentQueryNode {
    return !!value && typeof value === "object" && "kind" in value;
  }
}

export class SqliteDocumentStore {
  readonly schema: DocumentSchema;
  readonly table: string;
  readonly compiler: QueryCompiler;
  #insertStmt: AkanSqlStatement | null = null;
  #readStmtCache = new Map<string, AkanSqlStatement>();

  constructor(
    private readonly owner: DocumentDatabaseOwner,
    readonly constant: ConstantModel,
    readonly database: DatabaseModel,
    schema: DocumentSchema,
  ) {
    this.schema = schema;
    this.table = database.refName;
    this.compiler = new QueryCompiler(database.doc[FIELD_META] as unknown as FieldMap);
  }

  async ensure() {
    this.assertValidRefName(this.table);
    const db = this.owner.getConnection();
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${quoteIdent(this.table)} (
        "id" TEXT PRIMARY KEY NOT NULL,
        "createdAt" INTEGER NOT NULL,
        "updatedAt" INTEGER NOT NULL,
        "removedAt" INTEGER,
        "_doc" TEXT NOT NULL
      )`,
    );
    await this.owner.setMeta(
      `table:${this.table}`,
      await descriptorHash({ table: this.table, columns: ["id", "createdAt", "updatedAt", "removedAt", "_doc"] }),
    );
    for (const [idx, index] of this.schema.indexes.entries()) {
      const name = index.name ?? `${this.table}_${Object.keys(index.fields).map(toSafeRefName).join("_")}_${idx}`;
      this.assertValidRefName(name);
      const hash = await descriptorHash(index);
      const metaKey = `index:${this.table}:${name}`;
      const existing = await this.owner.getMeta(metaKey);
      if (existing && existing !== hash) throw new Error(`Index descriptor mismatch: ${name}`);
      const expressions = Object.entries(index.fields).map(([field, mode]) =>
        mode === "text" ? this.compiler.fieldExpr(field) : this.compiler.fieldExpr(field),
      );
      const unique = index.unique ? "UNIQUE " : "";
      await db.execute(
        `CREATE ${unique}INDEX IF NOT EXISTS ${quoteIdent(name)} ON ${quoteIdent(this.table)} (${expressions.join(", ")})`,
      );
      await this.owner.setMeta(metaKey, hash);
    }
  }

  async create(data: DocumentRecord) {
    const now = Date.now();
    const id = data.id ?? createDocumentId(now);
    const doc = this.hydrate(
      this.prepareDocument({
        ...data,
        id,
        createdAt: data.createdAt ?? dayjs(now),
        updatedAt: data.updatedAt ?? dayjs(now),
      }),
    );
    await this.runHooks("save", "create", doc, "pre");
    await this.runHooks("create", "create", doc, "pre");
    const row = this.toRow(doc);
    await this.insertStmt().run(row.id, row.createdAt, row.updatedAt, row.removedAt, row._doc);
    await this.runHooks("create", "create", doc, "post");
    await this.runHooks("save", "create", doc, "post");
    return doc;
  }

  async clone(data: DocumentRecord & { id: string }) {
    return this.create(data);
  }

  async update(id: string, patch: DocumentRecord) {
    const current = await this.pickByIdForWrite(id);
    return await this.writeUpdatedDocument(id, { ...current, ...patch, id, updatedAt: dayjs() }, current);
  }

  async remove(id: string) {
    return this.update(id, { removedAt: dayjs() });
  }

  async updateOneByQuery(query: DocumentQuery, update: DocumentUpdate, options: DocumentUpdateOptions = {}) {
    const doc = await this.findOneForWrite(query);
    if (!doc) {
      if (!options.upsert) return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: null };
      const inserted = await this.create(this.applyDocumentUpdate(this.extractInsertBase(query), update, true));
      return { acknowledged: true, matchedCount: 0, modifiedCount: 1, upsertedId: inserted.id };
    }
    await this.writeUpdatedDocument(doc.id as string, this.applyDocumentUpdate(doc, update), doc);
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedId: null };
  }

  async updateManyByQuery(query: DocumentQuery, update: DocumentUpdate) {
    const docs = await this.findForWrite(query);
    for (const doc of docs)
      await this.writeUpdatedDocument(doc.id as string, this.applyDocumentUpdate(doc, update), doc);
    return { acknowledged: true, matchedCount: docs.length, modifiedCount: docs.length };
  }

  async deleteManyByQuery(query: DocumentQuery) {
    return this.updateManyByQuery(query, { set: { removedAt: dayjs() } });
  }

  async bulkWrite(operations: { updateOne: { filter: DocumentQuery; update: DocumentUpdate; upsert?: boolean } }[]) {
    let matchedCount = 0;
    let modifiedCount = 0;
    let upsertedId: string | null = null;
    for (const operation of operations) {
      const result = await this.updateOneByQuery(operation.updateOne.filter, operation.updateOne.update, {
        upsert: operation.updateOne.upsert,
      });
      matchedCount += result.matchedCount;
      modifiedCount += result.modifiedCount;
      upsertedId ??= result.upsertedId ?? null;
    }
    return { acknowledged: true, matchedCount, modifiedCount, upsertedId };
  }

  async find(query?: DocumentQuery, options: FindManyOptions = {}) {
    const { where, params } = this.safeQuery(query);
    const limitValue = Number(options.limit ?? 0);
    const skipValue = Number(options.skip ?? 0);
    const limit = limitValue ? ` LIMIT ${limitValue}` : "";
    const offset = skipValue ? ` OFFSET ${skipValue}` : "";
    const order = options.sample ? "ORDER BY random()" : `ORDER BY ${this.compiler.orderBy(options.sort ?? undefined)}`;
    const projection = this.resolveProjection(options.select);
    if (projection) {
      const rows = await this.prepareReadStmt(
        `SELECT ${this.projectionSql(projection)} FROM ${quoteIdent(this.table)} WHERE ${where} ${order}${limit}${offset}`,
      ).all<ProjectedSqliteDocumentRow>(...params);
      return rows.map((row) => this.hydrate(this.fromProjectedRow(row, projection)));
    }
    const rows = await this.prepareReadStmt(
      `SELECT * FROM ${quoteIdent(this.table)} WHERE ${where} ${order}${limit}${offset}`,
    ).all<SqliteDocumentRow>(...params);
    return rows.map((row) => this.hydrate(this.fromRow(row)));
  }

  async findIds(
    query?: DocumentQuery,
    options: { sort?: SortOption; skip?: number | null; limit?: number | null; sample?: number } = {},
  ) {
    const { where, params } = this.safeQuery(query);
    const limitValue = Number(options.limit ?? 0);
    const skipValue = Number(options.skip ?? 0);
    const limit = limitValue ? ` LIMIT ${limitValue}` : "";
    const offset = skipValue ? ` OFFSET ${skipValue}` : "";
    const order = options.sample ? "ORDER BY random()" : `ORDER BY ${this.compiler.orderBy(options.sort ?? undefined)}`;
    const rows = await this.prepareReadStmt(
      `SELECT "id" FROM ${quoteIdent(this.table)} WHERE ${where} ${order}${limit}${offset}`,
    ).all<{ id: string }>(...params);
    return rows.map((row) => row.id);
  }

  async findOne(query?: DocumentQuery, options: FindOneOptions = {}) {
    return (await this.find(query, { ...options, limit: 1, sample: options.sample ? 1 : undefined })).at(0) ?? null;
  }

  async findId(query?: DocumentQuery, options: { sort?: SortOption; skip?: number | null; sample?: boolean } = {}) {
    return (await this.findIds(query, { ...options, limit: 1, sample: options.sample ? 1 : undefined })).at(0) ?? null;
  }

  async pickOne(query?: DocumentQuery, options: FindOneOptions = {}) {
    const doc = await this.findOne(query, options);
    if (!doc) throw new Error(`No Document (${this.table}): ${JSON.stringify(query)}`);
    return doc;
  }

  async pickById(id: string) {
    const doc = await this.findOne({ id } as DocumentQuery);
    if (!doc) throw new Error(`No Document (${this.table}): ${id}`);
    return doc;
  }

  async exists(query?: DocumentQuery) {
    return this.findId(query);
  }

  async count(query?: DocumentQuery) {
    const { where, params } = this.safeQuery(query);
    const row = await this.prepareReadStmt(
      `SELECT count(*) as count FROM ${quoteIdent(this.table)} WHERE ${where}`,
    ).get<{ count: number }>(...params);
    return row?.count ?? 0;
  }

  async insight(query?: DocumentQuery) {
    const insightFields = this.constant.insight[FIELD_META] as unknown as FieldMap;
    const result: DocumentRecord = {};
    for (const [key, field] of Object.entries(insightFields)) {
      const props = field.getProps();
      if (!props.accumulate) {
        result[key] = props.default;
      } else if (
        typeof props.accumulate === "object" &&
        !Object.keys(props.accumulate as Record<string, unknown>).some((key) => key.startsWith("$"))
      ) {
        result[key] = await this.count(documentQueryHelper.all(query ?? {}, props.accumulate as DocumentQuery));
      } else {
        result[key] = await this.count(query);
      }
    }
    return result;
  }

  async search(
    searchText: string | undefined | null,
    options: { skip?: number | null; limit?: number | null; sort?: SortOption } = {},
  ) {
    const textFields = this.schema.indexes.flatMap((index) =>
      Object.entries(index.fields)
        .filter(([, mode]) => mode === "text")
        .map(([field]) => field),
    );
    const query =
      searchText && textFields.length
        ? documentQueryHelper.any(
            ...textFields.map((field) =>
              documentQueryHelper.raw(`${this.compiler.fieldExpr(field)} LIKE ?`, [`%${searchText}%`]),
            ),
          )
        : {};
    const docs = await this.find(query, options);
    const count = await this.count(query);
    return { docs, count };
  }

  private safeQuery(query?: DocumentQuery) {
    return this.compiler.compile(documentQueryHelper.all(documentQueryHelper.empty("removedAt"), query ?? {}));
  }

  private prepareDocument(data: DocumentRecord) {
    const fields = this.database.doc[FIELD_META] as unknown as FieldMap;
    const doc: MutableDocumentRecord = {};
    for (const [key, field] of Object.entries(fields)) {
      const props = field.getProps();
      const value = data[key];
      if (value === undefined) {
        if (props.default !== undefined && props.default !== null) {
          doc[key] = typeof props.default === "function" ? props.default(data) : props.default;
        } else if (!props.nullable && !["removedAt"].includes(key)) {
          if (["id", "createdAt", "updatedAt"].includes(key)) continue;
          throw new Error(`Missing required field: ${key}`);
        }
      } else if (value === null && !props.nullable) {
        throw new Error(`Field is not nullable: ${key}`);
      } else {
        doc[key] = value;
      }
      if (doc[key] !== undefined && doc[key] !== null) {
        doc[key] = this.normalizeWriteValue(doc[key], props);
      }
      if (props.enum && doc[key] !== undefined && doc[key] !== null) {
        const values = Array.isArray(doc[key]) ? doc[key] : [doc[key]];
        const fieldEnum = props.enum as { has: (value: unknown) => boolean } | undefined;
        const invalidValue = fieldEnum ? values.find((value: unknown) => !fieldEnum.has(value)) : undefined;
        if (invalidValue !== undefined) throw new Error(`Invalid enum value for ${key}: ${invalidValue}`);
      }
      const validate = props.validate as ((value: unknown, doc: MutableDocumentRecord) => boolean) | undefined;
      if (validate && doc[key] !== undefined && doc[key] !== null && !validate(doc[key], doc)) {
        throw new Error(`Invalid field value: ${key}`);
      }
    }
    return { ...data, ...doc };
  }

  private extractInsertBase(query: DocumentQuery): Record<string, unknown> {
    if (!query || typeof query !== "object" || Array.isArray(query) || "kind" in query) return {};
    return Object.fromEntries(
      Object.entries(query).flatMap(([key, value]) => {
        if (["all", "any"].includes(key) || key.startsWith("$")) return [];
        if (value === null || ["string", "number", "boolean"].includes(typeof value)) return [[key, value]];
        return [];
      }),
    );
  }

  private applyDocumentUpdate(source: DocumentRecord, update: DocumentUpdate, isInsert = false) {
    const legacyKey = Object.keys(update).find((key) => key.startsWith("$"));
    if (legacyKey) throw new Error(`Mongo-style update operator is not supported: ${legacyKey}`);
    const doc = { ...source };
    const setPath = (path: string, value: unknown) => {
      const parts = path.split(".");
      let target: MutableDocumentRecord = doc;
      for (const part of parts.slice(0, -1)) {
        target[part] ??= {};
        target = target[part] as MutableDocumentRecord;
      }
      target[parts.at(-1) as string] = value;
    };
    const unsetPath = (path: string) => {
      const parts = path.split(".");
      let target: MutableDocumentRecord = doc;
      for (const part of parts.slice(0, -1)) {
        if (!target[part] || typeof target[part] !== "object") return;
        target = target[part] as MutableDocumentRecord;
      }
      delete target[parts.at(-1) as string];
    };
    const addToSet = (path: string, value: unknown) => {
      const current = path.split(".").reduce<unknown>((obj, key) => (obj as DocumentRecord | undefined)?.[key], doc) as
        | unknown[]
        | undefined;
      const next = Array.isArray(current) ? current : [];
      if (!next.some((item) => stableJson(item) === stableJson(value))) setPath(path, [...next, value]);
    };
    const pull = (path: string, value: unknown) => {
      const current = path.split(".").reduce<unknown>((obj, key) => (obj as DocumentRecord | undefined)?.[key], doc) as
        | unknown[]
        | undefined;
      if (Array.isArray(current))
        setPath(
          path,
          current.filter((item) => stableJson(item) !== stableJson(value)),
        );
    };
    const push = (path: string, value: unknown) => {
      const current = path.split(".").reduce<unknown>((obj, key) => (obj as DocumentRecord | undefined)?.[key], doc) as
        | unknown[]
        | undefined;
      setPath(path, [...(Array.isArray(current) ? current : []), value]);
    };
    if (update.set) {
      Object.entries(update.set).forEach(([path, value]) => {
        setPath(path, value);
      });
    }
    if (update.unset) (Array.isArray(update.unset) ? update.unset : Object.keys(update.unset)).forEach(unsetPath);
    if (update.addToSet) {
      Object.entries(update.addToSet).forEach(([path, value]) => {
        addToSet(path, value);
      });
    }
    if (update.pull) {
      Object.entries(update.pull).forEach(([path, value]) => {
        pull(path, value);
      });
    }
    if (update.push) {
      Object.entries(update.push).forEach(([path, value]) => {
        push(path, value);
      });
    }
    if (update.inc) {
      Object.entries(update.inc).forEach(([path, value]) => {
        const current = path.split(".").reduce<unknown>((obj, key) => (obj as DocumentRecord | undefined)?.[key], doc);
        setPath(path, Number(current ?? 0) + value);
      });
    }
    if (isInsert && update.setOnInsert) {
      Object.entries(update.setOnInsert).forEach(([path, value]) => {
        setPath(path, value);
      });
    }
    const operatorKeys = new Set(["set", "unset", "addToSet", "pull", "push", "inc", "setOnInsert"]);
    const direct = Object.fromEntries(Object.entries(update).filter(([key]) => !operatorKeys.has(key)));
    Object.assign(doc, direct);
    return doc;
  }

  private toRow(doc: DocumentRecord) {
    const payload = { ...doc };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.removedAt;
    return {
      id: doc.id,
      createdAt: Number(encodeSqlValue(doc.createdAt ?? dayjs())),
      updatedAt: Number(encodeSqlValue(doc.updatedAt ?? dayjs())),
      removedAt: doc.removedAt ? Number(encodeSqlValue(doc.removedAt)) : null,
      _doc: JSON.stringify(sanitizeJson(payload)),
    };
  }

  private fromRow(row: SqliteDocumentRow) {
    const payload = this.decodeDocumentPayload(JSON.parse(row._doc));
    return {
      id: row.id,
      createdAt: dayjs(Number(row.createdAt)),
      updatedAt: dayjs(Number(row.updatedAt)),
      removedAt: row.removedAt ? dayjs(Number(row.removedAt)) : undefined,
      ...payload,
    };
  }

  private normalizeProjection(select: ProjectionOption): string[] | null {
    if (!select) return null;
    const fields = Object.entries(select)
      .filter(([, included]) => included)
      .map(([field]) => field);
    return [...new Set(fields.filter((field) => field !== "_doc"))];
  }

  private resolveProjection(select: ProjectionOption): string[] | null {
    const projection = this.normalizeProjection(select);
    if (projection !== null) return projection;
    return this.defaultProjection();
  }

  private defaultProjection(): string[] | null {
    const fields = this.database.doc[FIELD_META] as unknown as FieldMap;
    const entries = Object.entries(fields).filter(([key]) => !BASE_COLUMNS.has(key));
    if (!entries.some(([, field]) => field.getProps().select === false)) return null;
    return entries.flatMap(([key, field]) => (field.getProps().select === false ? [] : [key]));
  }

  private projectionSql(fields: string[]) {
    const jsonFields = fields.filter((field) => !BASE_COLUMNS.has(field));
    const baseColumns = [...BASE_COLUMNS].map((field) => quoteIdent(field));
    const jsonColumns = jsonFields.map(
      (field, idx) => `${this.compiler.fieldExpr(field)} AS ${quoteIdent(this.projectionAlias(idx))}`,
    );
    return [...baseColumns, ...jsonColumns].join(", ");
  }

  private projectionAlias(idx: number) {
    return `__akan_projection_${idx}`;
  }

  private fromProjectedRow(row: ProjectedSqliteDocumentRow, fields: string[]) {
    const doc: DocumentRecord = {
      id: row.id,
      createdAt: dayjs(Number(row.createdAt)),
      updatedAt: dayjs(Number(row.updatedAt)),
      removedAt: row.removedAt ? dayjs(Number(row.removedAt)) : undefined,
    };
    const jsonFields = fields.filter((field) => !BASE_COLUMNS.has(field));
    for (const [idx, field] of jsonFields.entries()) {
      const value = this.parseProjectedValue(row[this.projectionAlias(idx)]);
      const props = (this.database.doc[FIELD_META] as unknown as FieldMap)[field]?.getProps?.();
      if (value === null && !props?.nullable) {
        if (props?.default != null) {
          doc[field] =
            typeof props.default === "function" ? (props.default as (data: unknown) => unknown)(doc) : props.default;
        } else {
          doc[field] =
            ((props as Record<string, unknown>).modelRef as { [DEFAULT_VALUE]?: unknown })?.[DEFAULT_VALUE] ?? null;
        }
      } else {
        doc[field] = props ? this.decodeFieldValue(value, props) : value;
      }
    }
    return doc;
  }

  private async findForWrite(query?: DocumentQuery, options: FindManyOptions = {}) {
    const { where, params } = this.safeQuery(query);
    const limitValue = Number(options.limit ?? 0);
    const skipValue = Number(options.skip ?? 0);
    const limit = limitValue ? ` LIMIT ${limitValue}` : "";
    const offset = skipValue ? ` OFFSET ${skipValue}` : "";
    const order = options.sample ? "ORDER BY random()" : `ORDER BY ${this.compiler.orderBy(options.sort ?? undefined)}`;
    const rows = await this.prepareReadStmt(
      `SELECT * FROM ${quoteIdent(this.table)} WHERE ${where} ${order}${limit}${offset}`,
    ).all<SqliteDocumentRow>(...params);
    return rows.map((row) => this.hydrate(this.fromRow(row)));
  }

  private async findOneForWrite(query?: DocumentQuery, options: FindOneOptions = {}) {
    return (
      (await this.findForWrite(query, { ...options, limit: 1, sample: options.sample ? 1 : undefined })).at(0) ?? null
    );
  }

  private async pickByIdForWrite(id: string) {
    const doc = await this.findOneForWrite({ id } as DocumentQuery);
    if (!doc) throw new Error(`No Document (${this.table}): ${id}`);
    return doc;
  }

  private async writeUpdatedDocument(id: string, data: DocumentRecord, originalData: DocumentRecord) {
    const doc = this.hydrate(this.prepareDocument({ ...data, id, updatedAt: dayjs() }), originalData);
    await this.runHooks("save", "update", doc, "pre");
    await this.runHooks("update", "update", doc, "pre");
    const row = this.toRow(doc);
    await this.owner
      .getConnection()
      .prepare(
        `UPDATE ${quoteIdent(this.table)} SET "createdAt" = ?, "updatedAt" = ?, "removedAt" = ?, "_doc" = ? WHERE "id" = ?`,
      )
      .run(row.createdAt, row.updatedAt, row.removedAt, row._doc, id);
    await this.runHooks("update", "update", doc, "post");
    await this.runHooks("save", "update", doc, "post");
    return doc;
  }

  private parseProjectedValue(value: unknown) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return value;
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  private decodeDocumentPayload(payload: Record<string, unknown>) {
    const fields = this.database.doc[FIELD_META] as unknown as FieldMap;
    const result: Record<string, unknown> = {};
    for (const [key, fieldMeta] of Object.entries(fields)) {
      if (BASE_COLUMNS.has(key)) continue;
      const props = fieldMeta.getProps();
      const value = payload[key];
      if (value === undefined) {
        const def = props.default;
        if (def != null) {
          result[key] = typeof def === "function" ? (def as (data: unknown) => unknown)(payload) : def;
        } else if (props.nullable) {
          result[key] = null;
        } else {
          result[key] =
            ((props as Record<string, unknown>).modelRef as { [DEFAULT_VALUE]?: unknown })?.[DEFAULT_VALUE] ?? null;
        }
      } else {
        result[key] = this.decodeFieldValue(value, props);
      }
    }
    for (const [key, value] of Object.entries(payload)) {
      if (key in result || BASE_COLUMNS.has(key)) continue;
      const props = fields[key]?.getProps?.();
      result[key] = props ? this.decodeFieldValue(value, props) : value;
    }
    return result;
  }

  private decodeFieldValue(value: unknown, props: Record<string, unknown>): unknown {
    if (value === undefined || value === null) return value;
    if (props.isMap) {
      const entries = value instanceof Map ? [...value.entries()] : Object.entries(value as Record<string, unknown>);
      return new Map(entries.map(([key, item]) => [key, this.decodeMapValue(item, props)]));
    }
    if (props.modelRef === Date) {
      if (Array.isArray(value)) return value.map((item) => (item === null ? item : decodeDateValue(item)));
      return decodeDateValue(value);
    }
    if (Array.isArray(value)) return value.map((item) => this.decodeNestedValue(item, props));
    return this.decodeNestedValue(value, props);
  }

  private decodeMapValue(value: unknown, props: Record<string, unknown>) {
    if (value === undefined || value === null) return value;
    if (props.of === Date) return decodeDateValue(value);
    return value;
  }

  private decodeNestedValue(value: unknown, props: Record<string, unknown>): unknown {
    if (!value || typeof value !== "object") return value;
    if (!props.isClass || !props.isScalar) return value;
    const scalarFields = (props.modelRef as { [FIELD_META]?: FieldMap } | undefined)?.[FIELD_META];
    if (!scalarFields) return value;
    const source = value as Record<string, unknown>;
    const defaults = getDefault(scalarFields as never) as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, fieldMeta] of Object.entries(scalarFields)) {
      const nestedProps = fieldMeta.getProps();
      const nested = source[key];
      result[key] = nested === undefined ? defaults[key] : this.decodeFieldValue(nested, nestedProps);
    }
    for (const [key, nested] of Object.entries(source)) {
      if (!(key in result)) result[key] = nested;
    }
    return result;
  }

  private normalizeWriteValue(value: unknown, props: Record<string, unknown>): unknown {
    if (value === undefined || value === null) return value;
    if (props.modelRef === Date) {
      if (Array.isArray(value))
        return value.map((item) => (item === null || item === undefined ? item : dayjs(item as never)));
      return dayjs(value as never);
    }
    if (!props.isClass || !props.isScalar) return value;
    if (Array.isArray(value)) return value.map((item) => this.fillScalarDefaults(item, props));
    return this.fillScalarDefaults(value, props);
  }

  private fillScalarDefaults(value: unknown, props: Record<string, unknown>): unknown {
    if (!value || typeof value !== "object") return value;
    const scalarFields = (props.modelRef as { [FIELD_META]?: FieldMap } | undefined)?.[FIELD_META];
    if (!scalarFields) return value;
    const defaults = getDefault(scalarFields as never) as Record<string, unknown>;
    const result = { ...(value as Record<string, unknown>) };
    for (const [key, fieldMeta] of Object.entries(scalarFields)) {
      const nestedProps = fieldMeta.getProps();
      if (result[key] === undefined) result[key] = defaults[key];
      else result[key] = this.normalizeWriteValue(result[key], nestedProps);
    }
    return result;
  }

  hydrate(data: DocumentRecord, originalData: DocumentRecord = data) {
    const store = this;
    const original = JSON.parse(JSON.stringify(sanitizeJson(originalData) ?? {})) as Record<string, unknown>;
    const isNew = !originalData.id;
    const hydratedData = isNew ? this.prepareDocument(data) : data;
    const doc = Object.assign(Object.create(this.database.doc.prototype), hydratedData);
    Object.defineProperties(doc, {
      set: {
        value(patch: DocumentRecord) {
          Object.assign(this, patch);
          return this;
        },
      },
      save: {
        async value() {
          return this.id ? store.update(this.id, this) : store.create(this);
        },
      },
      refresh: {
        async value() {
          Object.assign(this, await store.pickById(this.id));
          return this;
        },
      },
      isModified: {
        value(field?: string) {
          if (isNew) return true;
          if (!field) return JSON.stringify(sanitizeJson(this)) !== JSON.stringify(original);
          return JSON.stringify(sanitizeJson(this[field])) !== JSON.stringify(original[field]);
        },
      },
      toJSON: {
        value() {
          return sanitizeJson(this);
        },
      },
      toObject: {
        value() {
          return sanitizeJson(this);
        },
      },
    });
    return doc;
  }

  private async runHooks(
    saveType: "save" | "create" | "update" | "remove",
    crudType: "create" | "update" | "remove",
    doc: DocumentRecord,
    phase: "pre" | "post",
  ) {
    const hooks = phase === "pre" ? this.schema.preHooks.get(saveType) : this.schema.postHooks.get(saveType);
    for (const hook of hooks ?? []) {
      const run = () => hook.call(doc, () => undefined, crudType);
      if (phase === "post") await this.owner.afterCommit(run);
      else await run();
    }
  }

  private insertStmt() {
    this.#insertStmt ??= this.owner
      .getConnection()
      .prepare(
        `INSERT INTO ${quoteIdent(this.table)} ("id", "createdAt", "updatedAt", "removedAt", "_doc") VALUES (?, ?, ?, ?, ?)`,
      );
    return this.#insertStmt;
  }

  private prepareReadStmt(sql: string) {
    const cached = this.#readStmtCache.get(sql);
    if (cached) return cached;
    // Keep the cache bounded; list/find query shapes repeat heavily, while ad-hoc filters should not grow forever.
    if (this.#readStmtCache.size >= 128) {
      const oldest = this.#readStmtCache.keys().next().value;
      if (oldest) this.#readStmtCache.delete(oldest);
    }
    const stmt = this.owner.getConnection().prepare(sql);
    this.#readStmtCache.set(sql, stmt);
    return stmt;
  }

  private assertValidRefName(refName: string) {
    if (!REF_NAME_RE.test(refName) || RESERVED_RE.test(refName))
      throw new Error(`Invalid database identifier: ${refName}`);
  }
}
export class SqliteDatabase
  extends adapt("sqliteDatabase", ({ env }) => ({
    config: env((env: SqliteEnv) => {
      const appName = env.appName ?? "akan";
      const environment = env.environment ?? "local";
      const defaultFile = resolveDefaultSqliteFile({
        appName,
        fileName: `${appName}-${environment}.db`,
        isProduction: process.env.NODE_ENV === "production",
        operationMode: env.operationMode,
        workspaceRoot: env.workspaceRoot,
      });
      return {
        journalMode: "WAL",
        busyTimeoutMs: 5000,
        synchronous: "NORMAL",
        foreignKeys: true,
        ...env.database?.sqlite,
        filePath: env.database?.sqlite?.filePath ?? process.env.SQLITE_DATABASE_PATH ?? defaultFile,
      } satisfies Required<
        Pick<SqliteDatabaseConfig, "filePath" | "journalMode" | "busyTimeoutMs" | "synchronous" | "foreignKeys">
      > &
        SqliteDatabaseConfig;
    }),
  }))
  implements DatabaseAdaptor
{
  #db!: Database;
  #client!: BunSqliteClient;
  #stores = new Map<string, SqliteDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();

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
  }

  override async onDestroy() {
    this.#db?.run("PRAGMA wal_checkpoint(TRUNCATE)");
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqliteDocumentStore(this, constant, database, schema as DocumentSchema);
    this.#stores.set(database.refName, store);
    void store.ensure();
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
  extends adapt("libsqlDatabase", ({ env }) => ({
    config: env((env: SqliteEnv) => {
      const appName = env.appName ?? "akan";
      const environment = env.environment ?? "local";
      const defaultFile = resolveDefaultSqliteFile({
        appName,
        fileName: `${appName}-${environment}.db`,
        isProduction: process.env.NODE_ENV === "production",
        operationMode: env.operationMode,
        workspaceRoot: env.workspaceRoot,
      });
      return {
        url:
          env.database?.libsql?.url ??
          process.env.LIBSQL_URL ??
          process.env.LIBSQL_URI ??
          `file:${env.database?.sqlite?.filePath ?? process.env.SQLITE_DATABASE_PATH ?? defaultFile}`,
        authToken: env.database?.libsql?.authToken ?? process.env.LIBSQL_AUTH_TOKEN,
      } satisfies LibsqlDatabaseConfig;
    }),
  }))
  implements DatabaseAdaptor
{
  #client!: LibsqlAkanClient;
  #stores = new Map<string, SqliteDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();

  override async onInit() {
    const url = this.config.url ?? "file:local.db";
    if (url.startsWith("file:")) await mkdir(path.dirname(url.slice(5)), { recursive: true });
    const { createClient } = await import("@libsql/client");
    this.#client = new LibsqlAkanClient(createClient({ url, authToken: this.config.authToken }));
    await this.#client.execute(
      `CREATE TABLE IF NOT EXISTS "_akan_meta" ("key" TEXT PRIMARY KEY NOT NULL, "value" TEXT NOT NULL, "updatedAt" INTEGER NOT NULL)`,
    );
  }

  override async onDestroy() {
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqliteDocumentStore(this, constant, database, schema as DocumentSchema);
    this.#stores.set(database.refName, store);
    void store.ensure();
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
  #stores = new Map<string, SqliteDocumentStore>();
  #transaction = new AsyncLocalStorage<TransactionContext>();

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
    await this.#client?.close();
  }

  getConnection() {
    return this.#client;
  }

  getStore(constant: ConstantModel, database: DatabaseModel, schema: SchemaOf) {
    const existing = this.#stores.get(database.refName);
    if (existing) return existing;
    const store = new SqliteDocumentStore(this, constant, database, schema as DocumentSchema);
    this.#stores.set(database.refName, store);
    void store.ensure();
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
