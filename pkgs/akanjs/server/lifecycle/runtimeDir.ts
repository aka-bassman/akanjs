import path from "node:path";

// Shared by the gateway and a solo server: switching modes must not move the child sockets or the rotating log.
export const resolveRuntimeDir = (runtimeDir?: string): string =>
  path.resolve(
    runtimeDir ??
      process.env.AKAN_RUNTIME_DIR ??
      (process.env.NODE_ENV === "production"
        ? path.resolve(process.cwd(), "runtime")
        : path.resolve(process.cwd(), "local", "apps", process.env.AKAN_PUBLIC_APP_NAME ?? "unknown", "runtime")),
  );
