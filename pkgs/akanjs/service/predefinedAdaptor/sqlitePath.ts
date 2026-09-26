import path from "node:path";
import { getEnv } from "akanjs/base";

interface ResolveDefaultSqliteFileOptions {
  appName: string;
  fileName: string;
  isProduction: boolean;
  operationMode?: string;
  workspaceRoot?: string;
}

export const resolveDefaultSqliteFile = ({
  appName,
  fileName,
  isProduction,
  operationMode,
  workspaceRoot,
}: ResolveDefaultSqliteFileOptions) => {
  const sqliteDir = process.env.AKAN_SQLITE_DIR;
  if (sqliteDir) return path.join(sqliteDir, fileName);
  const isLocalOperation = (operationMode ?? process.env.AKAN_PUBLIC_OPERATION_MODE) === "local";
  if (isProduction && !isLocalOperation) return path.join(process.cwd(), "sqlite", fileName);
  return path.join(workspaceRoot ?? process.cwd(), "local", "apps", appName, fileName);
};

// Called lazily: `getEnv()` throws without a runtime identity, which a caller naming its own file must not need.
export const defaultSqliteFile = (suffix: string, workspaceRoot?: string) => {
  const { appName, environment, operationMode } = getEnv();
  return resolveDefaultSqliteFile({
    appName,
    fileName: `${appName}-${environment}${suffix}.db`,
    isProduction: process.env.NODE_ENV === "production",
    operationMode,
    workspaceRoot,
  });
};
