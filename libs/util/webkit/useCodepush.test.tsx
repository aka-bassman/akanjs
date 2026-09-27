import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const hookStates: unknown[] = [];
let hookIndex = 0;

beforeAll(() => {
  mock.module("react", () => ({
    useState: <T,>(initial: T) => {
      const index = hookIndex++;
      if (!(index in hookStates)) hookStates[index] = initial;
      const setState = (next: T) => {
        hookStates[index] = next;
      };
      return [hookStates[index] as T, setState] as const;
    },
  }));
});

const installCapacitor = () => {
  globalThis.__AKAN_CAPACITOR_IMPORTS__ = undefined;
  Object.defineProperty(globalThis, "Capacitor", {
    value: {
      Plugins: {
        App: { getInfo: async () => ({ id: "com.example.app", version: "1.2.3", build: "7" }) },
        Device: { getInfo: async () => ({ platform: "ios", isVirtual: false, osVersion: "17.0" }) },
        CapacitorUpdater: {
          getDeviceId: async () => ({ deviceId: "device-1" }),
          current: async () => ({ bundle: { version: "builtin" }, native: "1.2.3" }),
          getBuiltinVersion: async () => ({ version: "1.2.3" }),
        },
      },
    },
    configurable: true,
  });
};

const renderCodepush = async () => {
  const { useCodepush } = await import("./useCodepush");
  return {
    get current() {
      hookIndex = 0;
      return useCodepush({ serverUrl: "https://api.example.com" });
    },
  };
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
  Object.defineProperty(globalThis, "Capacitor", { value: undefined, configurable: true });
  globalThis.__AKAN_CAPACITOR_IMPORTS__ = undefined;
  hookStates.length = 0;
});

describe("useCodepush", () => {
  test("checks for a release without interrupting the user", async () => {
    installCapacitor();
    const alert = mock(() => undefined);
    Object.defineProperty(globalThis, "window", { value: { alert }, configurable: true });
    globalThis.fetch = mock(async () => Response.json(null)) as unknown as typeof fetch;
    const hook = await renderCodepush();
    expect(await hook.current.checkNewRelease()).toBeUndefined();
    expect(alert).not.toHaveBeenCalled();
  });
});
