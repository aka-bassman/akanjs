import type { App } from "../commandDecorators";

export const bundleDefine = (app: App, command: "build" | "start", renderEnv: "ssr" | "csr") => {
  const nodeEnv = command === "build" ? "production" : (process.env.NODE_ENV ?? "development");
  return {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
    "process.env.AKAN_PUBLIC_RENDER_ENV": JSON.stringify(renderEnv),
    ...Object.fromEntries(
      Object.entries(app.getPublicEnv()).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    ),
  };
};
