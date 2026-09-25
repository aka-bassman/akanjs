import path from "node:path";
import { FileSys } from "./fileSys";

interface StoredSelection {
  apps: string[];
}

/**
 * The apps the last interactive pick chose, so `akan start` + Enter repeats a multi-app session instead
 * of re-ticking it. Advisory only: a missing, unreadable or stale file just means nothing is pre-ticked.
 */
export class AppSelectionMemory {
  static pathIn(workspaceRoot: string) {
    return path.join(workspaceRoot, "local", ".akan", "lastStart.json");
  }
  static async read(workspaceRoot: string): Promise<string[]> {
    const stored = await Bun.file(AppSelectionMemory.pathIn(workspaceRoot))
      .json()
      .catch(() => null);
    const apps = (stored as StoredSelection | null)?.apps;
    return Array.isArray(apps) ? apps.filter((name): name is string => typeof name === "string") : [];
  }
  static async write(workspaceRoot: string, apps: string[]) {
    await FileSys.writeJson(AppSelectionMemory.pathIn(workspaceRoot), { apps } satisfies StoredSelection).catch(
      () => undefined,
    );
  }
}
