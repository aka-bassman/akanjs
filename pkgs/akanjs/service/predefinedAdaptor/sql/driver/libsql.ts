import type { Client as LibsqlClient } from "@libsql/client";
import type { AkanSqlClient, AkanSqlStatement } from "../types";
import { toLibsqlArgs } from "../values";

export class LibsqlStatement implements AkanSqlStatement {
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

export class LibsqlAkanClient implements AkanSqlClient {
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
