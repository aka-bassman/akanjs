import type { Database, SQLQueryBindings, Statement } from "bun:sqlite";
import type { AkanSqlClient, AkanSqlStatement } from "../types";

export class BunSqliteStatement implements AkanSqlStatement {
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

export class BunSqliteClient implements AkanSqlClient {
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
