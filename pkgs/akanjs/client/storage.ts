import { getEnv } from "akanjs/base";
import { type CapacitorPreferencesModule, loadCapacitorPreferences } from "./capacitor";

type Preferences = CapacitorPreferencesModule["Preferences"];

const inStorage = async <T>(native: (preferences: Preferences) => Promise<T>, local: () => T) => {
  const env = getEnv();
  if (env.side === "server") return;
  if (env.renderMode === "ssr") return local();
  try {
    const { Preferences } = await loadCapacitorPreferences();
    return await native(Preferences);
  } catch {
    return local();
  }
};

export const storage = {
  getItem: (key: string) =>
    inStorage(
      async (preferences) => (await preferences.get({ key })).value,
      () => localStorage.getItem(key),
    ),
  setItem: (key: string, value: string) =>
    inStorage(
      async (preferences) => {
        await preferences.set({ key, value });
      },
      () => {
        localStorage.setItem(key, value);
      },
    ),
  removeItem: async (key: string) => {
    const env = getEnv();
    if (env.side === "server") return;
    if (env.renderMode === "ssr") {
      localStorage.removeItem(key);
      return;
    }
    try {
      const { Preferences } = await loadCapacitorPreferences();
      return Preferences.remove({ key });
    } catch {
      localStorage.removeItem(key);
      return;
    }
  },
};
