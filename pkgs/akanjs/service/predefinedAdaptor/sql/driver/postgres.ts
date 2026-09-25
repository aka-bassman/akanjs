import type { Sql } from "postgres";

/** `unsafe` takes its own parameter union; everything reaching here was already SQL-encoded upstream. */
const bindings = (params: unknown[] | Record<string, unknown>) => {
  const values = Array.isArray(params) ? params : Object.values(params);
  return values as NonNullable<Parameters<Sql["unsafe"]>[1]>;
};

import type { AkanSqlClient, AkanSqlStatement } from "../types";
import { toPostgresSql } from "../values";

export class PostgresStatement implements AkanSqlStatement {
  constructor(
    private readonly client: Sql,
    private readonly sql: string,
  ) {}
  async run(...params: unknown[]) {
    const { sql, params: positionalParams } = toPostgresSql(this.sql, params);
    return await this.client.unsafe(sql, bindings(positionalParams));
  }
  async get<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row | null> {
    const rows = await this.all<Row>(...params);
    return rows[0] ?? null;
  }
  async all<Row = Record<string, unknown>>(...params: unknown[]): Promise<Row[]> {
    const { sql, params: positionalParams } = toPostgresSql(this.sql, params);
    return (await this.client.unsafe(sql, bindings(positionalParams))) as Row[];
  }
}

export class PostgresAkanClient implements AkanSqlClient {
  constructor(readonly client: Sql) {}
  async execute(sql: string, params: unknown[] | Record<string, unknown> = []) {
    return await this.client.unsafe(sql, bindings(params));
  }
  prepare(sql: string): AkanSqlStatement {
    return new PostgresStatement(this.client, sql);
  }
  async close() {
    await this.client.end();
  }
}
