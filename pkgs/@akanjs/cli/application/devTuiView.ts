import type { DevSupervisor, DevSupervisorView } from "./devSupervisor";

/**
 * Loaded through `await import()` and never referenced statically: `ink` costs ~9MB resident on import
 * and `entryModuleGraph.test.ts` fails the build if the CLI entry can reach it eagerly.
 */
export const createDevTuiView = async (supervisor: DevSupervisor): Promise<DevSupervisorView> => {
  const { DevTui } = await import("./devTui");
  return new DevTui(supervisor);
};
