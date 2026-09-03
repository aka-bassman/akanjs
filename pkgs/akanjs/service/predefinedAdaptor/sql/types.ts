import type { PromiseOrObject } from "akanjs/base";
import type { ConstantModel } from "akanjs/constant";
import type {
  DatabaseModel,
  DocumentQuery,
  DocumentQueryNode,
  DocumentSchema,
  DocumentUpdateInput,
  DocumentUpdateOperator,
  DocumentUpdateOptions,
} from "akanjs/document";
import type { SearchIndex } from "../searchIndex";

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

export interface SearchConfig {
  enabled?: boolean;
  tokenizer?: string;
}

export interface DatabaseConfig {
  driver?: "sqlite" | "libsql" | "postgres";
  sqlite?: SqliteDatabaseConfig;
  libsql?: LibsqlDatabaseConfig;
  postgres?: PostgresDatabaseConfig;
  search?: SearchConfig;
}

export interface DocumentStore {
  ensure(): Promise<void>;
  create(data: DocumentRecord): Promise<any>;
  clone(data: DocumentRecord & { id: string }): Promise<any>;
  update(id: string, patch: DocumentRecord): Promise<any>;
  remove(id: string): Promise<any>;
  updateOneByQuery(
    query: DocumentQuery,
    update: DocumentUpdateInput,
    options?: DocumentUpdateOptions,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number; upsertedId: string | null }>;
  updateManyByQuery(
    query: DocumentQuery,
    update: DocumentUpdateInput,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  removeManyByQuery(
    query: DocumentQuery,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  removeOneByQuery(
    query: DocumentQuery,
  ): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number; upsertedId: string | null }>;
  bulkWrite(
    operations: { updateOne: { filter: DocumentQuery; update: DocumentUpdateInput; upsert?: boolean } }[],
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
  hydrate(data: DocumentRecord, originalData?: DocumentRecord, options?: { track?: boolean }): any;
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
  // Declared here so a service holding `plug(DatabaseAdaptorRole)` can reach `suspend`/`resume` around a bulk
  // import without casting. `null` on adaptors that have no text search, which is how callers tell them apart.
  getSearchIndex(): SearchIndex | null;
}

export interface SqliteEnv {
  workspaceRoot?: string;
  database?: DatabaseConfig;
}

export interface TransactionContext {
  afterCommit: (() => PromiseOrObject<void>)[];
}

export const BASE_COLUMNS = new Set(["id", "createdAt", "updatedAt", "removedAt"]);
export const RESERVED_RE = /^sqlite_|^_akan_meta$|^search_doc$|^search_fts$/i;
export const REF_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
export const toSafeRefName = (value: string) => value.replace(/[^A-Za-z0-9_]+/g, "_").replace(/_+/g, "_");
export type DocumentRecord = Record<string, unknown>;
export type MutableDocumentRecord = Record<string, unknown>;
export type FieldMap = Record<string, { getProps: () => Record<string, unknown>; [key: string]: unknown }>;
export type SortOption = Record<string, 1 | -1> | null | undefined;
export type ProjectionOption = Partial<Record<string, boolean>> | null | undefined;
export type FindManyOptions = {
  sort?: SortOption;
  skip?: number | null;
  limit?: number | null;
  sample?: number;
  select?: ProjectionOption;
};
export type FindOneOptions = { sort?: SortOption; skip?: number | null; sample?: boolean; select?: ProjectionOption };
export type WriteHookOptions = { runSaveHooks?: boolean; crudType?: "update" | "remove" };
export type QueryOperatorName = Extract<DocumentQueryNode, { kind: "op" }>["op"];
export interface SqliteDocumentRow {
  id: string;
  createdAt: number | string;
  updatedAt: number | string;
  removedAt?: number | string | null;
  _doc: string;
}
export type ProjectedSqliteDocumentRow = Omit<SqliteDocumentRow, "_doc"> & Record<string, unknown>;

export interface DocumentDatabaseOwner {
  getConnection(): AkanSqlClient;
  getSearchIndex(): SearchIndex | null;
  getMeta(key: string): Promise<string | undefined> | string | undefined;
  setMeta(key: string, value: string): Promise<void>;
  afterCommit(fn: () => PromiseOrObject<void>): Promise<void>;
}

export const QUERY_OPERATOR_KEYS = new Set([
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

export interface SqlFrag {
  sql: string;
  params: unknown[];
}

// `ref` names both the model table and the `search_doc."ref"` value — the mirror keys rows by table name.
export interface SearchJoinProps {
  alias: string;
  ref: string;
  match: string;
  weights: number[];
}

export interface SearchJoin extends SqlFrag {
  alias: string;
}

export interface CompiledQuery {
  where: string;
  params: unknown[];
  joins: SearchJoin[];
}

export interface CompileContext {
  joins: SearchJoin[];
  conjunctive: boolean;
}

// A `SqlDialect` owns every dialect-specific SQL fragment so the compilers stay dialect-agnostic. Leaf query
// operators and update operators are compiled fully here (SQL + params) — the accumulator string returned by
// `applyUpdate` lets updates fold into a single nested JSON expression that the database applies atomically.
// SQLite/libsql share JSON1 syntax; Postgres uses the jsonb operator/function family.
export interface SqlDialect {
  readonly name: "sqlite" | "postgres";
  timestampType(): string;
  docColumnType(): string;
  docColumn(): string;
  docValuePlaceholder(): string;
  extract(path: string): string;
  projectExpr(path: string): string;
  decodeProjected(value: unknown): unknown;
  eq(path: string, value: unknown): SqlFrag;
  ne(path: string, value: unknown): SqlFrag;
  compare(path: string, op: "gt" | "gte" | "lt" | "lte", value: unknown): SqlFrag;
  between(path: string, from: unknown, to: unknown): SqlFrag;
  inList(path: string, values: unknown[]): SqlFrag;
  notInList(path: string, values: unknown[]): SqlFrag;
  exists(path: string): SqlFrag;
  missing(path: string): SqlFrag;
  empty(path: string): SqlFrag;
  arrayHas(path: string, value: unknown): SqlFrag;
  contains(path: string, value: unknown): SqlFrag;
  searchJoin(props: SearchJoinProps): SqlFrag;
  applyUpdate(acc: string, op: DocumentUpdateOperator, path: string, value: unknown): SqlFrag;
  affectedRows(result: unknown): number;
}

export type QueryLeafOps = Pick<
  SqlDialect,
  | "eq"
  | "ne"
  | "compare"
  | "between"
  | "inList"
  | "notInList"
  | "exists"
  | "missing"
  | "empty"
  | "arrayHas"
  | "contains"
>;

// Base columns (`id`/`createdAt`/`updatedAt`/`removedAt`) are real SQL columns, not JSON paths, so they compile the
// same way on every dialect.
export const MODIFICATION_STATE = Symbol("akan.document.modificationState");

export interface ModificationState {
  isNew: boolean;
  original: Record<string, unknown>;
}
