import path from "node:path";
import { getEnv } from "../../base/baseEnv";
import { defaultSqliteFile } from "../../service/predefinedAdaptor/sqlitePath";
import type { SnapshotSources } from "./snapshotTypes";

// A path set only in `env.server.ts` is invisible here: the solo server passes the adaptor's own answer instead,
// and a gateway deployment names it with SQLITE_DATABASE_PATH / AKAN_SOLID_DB_PATH.
export class SqliteFiles {
  static fromEnv(): SnapshotSources {
    const { databaseMode } = getEnv();
    const workspaceRoot = process.env.AKAN_WORKSPACE_ROOT;
    const main = process.env.SQLITE_DATABASE_PATH ?? defaultSqliteFile("", workspaceRoot);
    //* Only `single` keeps queue and cache in the solid file; `multiple` moved them to Redis.
    const solid =
      databaseMode === "single" ? (process.env.AKAN_SOLID_DB_PATH ?? defaultSqliteFile("_solid", workspaceRoot)) : null;
    return { main: path.resolve(main), solid: solid ? path.resolve(solid) : null };
  }

  static snapshotDir(sources: SnapshotSources) {
    return process.env.AKAN_OPS_SNAPSHOT_DIR ?? path.join(path.dirname(sources.main), "snapshots");
  }
}
