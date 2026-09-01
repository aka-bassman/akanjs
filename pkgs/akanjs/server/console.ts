import type { BaseEnv } from "akanjs/base";
import type { Adaptor, Service } from "akanjs/service";
import type { ServerSignal } from "akanjs/signal";
import type { AkanServer } from "./akanServer";
import { AkanConsoleSession } from "./consoleSession";

export * from "./consoleEvaluator";

export interface AkanConsoleOptions {
  prompt?: string;
  globals?: Record<string, unknown>;
  input?: typeof process.stdin;
  output?: typeof process.stdout;
}

export interface AkanConsoleContext extends Record<string, unknown> {
  server: AkanServer;
  env: AkanServer["env"];
  get: AkanServer["get"];
  service: <T = Service>(refName: string) => T;
  signal: <T = ServerSignal>(refName: string) => T;
  adaptor: <T = Adaptor>(refName: string) => T;
  methods: (value: unknown) => string[];
  debug: () => ReturnType<AkanServer["inspectConsole"]>;
}

export const assertAkanConsoleAllowed = (
  env: Pick<BaseEnv, "environment" | "operationMode"> = {
    environment: (process.env.AKAN_PUBLIC_ENV ?? "debug") as BaseEnv["environment"],
    operationMode: (process.env.AKAN_PUBLIC_OPERATION_MODE ?? "cloud") as BaseEnv["operationMode"],
  },
) => {
  const isProductionLike =
    env.environment === "main" ||
    env.operationMode === "cloud" ||
    env.operationMode === "edge" ||
    process.env.NODE_ENV === "production";
  if (!isProductionLike || process.env.AKAN_CONSOLE === "1") return;

  throw new Error(
    [
      "Akan console is disabled for production-like environments.",
      "Run with AKAN_CONSOLE=1 only for the exec command that opens the console.",
      "Example: AKAN_CONSOLE=1 bun console.js",
    ].join("\n"),
  );
};

export const getAkanConsoleMethods = (value: unknown): string[] => {
  const names = new Set<string>();
  let proto =
    typeof value === "function"
      ? value.prototype
      : value && (typeof value === "object" || typeof value === "function")
        ? Object.getPrototypeOf(value)
        : null;

  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === "constructor") continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      if (typeof descriptor?.value === "function") names.add(name);
    }
    proto = Object.getPrototypeOf(proto);
  }

  return [...names].sort((a, b) => a.localeCompare(b));
};

export const createAkanConsoleContext = (
  server: AkanServer,
  globals: Record<string, unknown> = {},
): AkanConsoleContext => {
  const context = {
    server,
    env: server.env,
    get: server.get.bind(server) as AkanServer["get"],
    service: server.getService.bind(server),
    signal: server.getSignal.bind(server),
    adaptor: server.getAdaptor.bind(server),
    methods: getAkanConsoleMethods,
    debug: () => server.inspectConsole(),
    ...globals,
  };
  return context;
};

export const startAkanConsole = async (server: AkanServer, options: AkanConsoleOptions = {}) => {
  const session = new AkanConsoleSession({
    context: createAkanConsoleContext(server, options.globals),
    prompt: options.prompt ?? `akan:${server.name}> `,
    banner: `Akan console started for ${server.name}. Type .help for commands.\n`,
    input: options.input,
    output: options.output,
  });
  await session.run();
};
