import "../test/registerDom";
import { afterEach, describe, expect, mock, test } from "bun:test";
import { act } from "react";
import { mount } from "../store/mount.fixture";
import { useCodepush } from "./useCodepush";

const originalFetch = globalThis.fetch;
const originalAlert = window.alert;

const installCapacitor = (bundleVersion = "builtin") => {
  globalThis.__AKAN_CAPACITOR_IMPORTS__ = undefined;
  Object.defineProperty(globalThis, "Capacitor", {
    value: {
      Plugins: {
        App: { getInfo: async () => ({ id: "com.example.app", version: "1.2.3", build: "7" }) },
        Device: { getInfo: async () => ({ platform: "ios", isVirtual: false, osVersion: "17.0" }) },
        CapacitorUpdater: {
          getPluginVersion: async () => ({ version: "5.6.9" }),
          getDeviceId: async () => ({ deviceId: "device-1" }),
          current: async () => ({ bundle: { version: bundleVersion }, native: "1.2.3" }),
          getBuiltinVersion: async () => ({ version: "1.2.3" }),
        },
      },
    },
    configurable: true,
  });
};

const renderCodepush = (serverUrl: string) => {
  const hook: { current?: ReturnType<typeof useCodepush> } = {};
  const Probe = () => {
    hook.current = useCodepush({ serverUrl });
    return null;
  };
  const unmount = mount(<Probe />);
  return { hook, unmount };
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  window.alert = originalAlert;
  Object.defineProperty(globalThis, "Capacitor", { value: undefined, configurable: true });
  globalThis.__AKAN_CAPACITOR_IMPORTS__ = undefined;
});

describe("useCodepush", () => {
  test("checks for a release without interrupting the user", async () => {
    installCapacitor();
    const alert = mock(() => undefined);
    window.alert = alert;
    globalThis.fetch = mock(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const { hook, unmount } = renderCodepush("https://api.example.com");
    let release: unknown = null;
    await act(async () => {
      release = await hook.current?.checkNewRelease();
    });
    expect(release).toBeUndefined();
    expect(alert).not.toHaveBeenCalled();
    unmount();
  });

  test("reports the running bundle's version once it has checked", async () => {
    installCapacitor();
    globalThis.fetch = mock(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const { hook, unmount } = renderCodepush("https://api.example.com");
    expect(hook.current?.version).toBe("");
    await act(async () => {
      await hook.current?.checkNewRelease();
    });
    expect(hook.current?.version).toBe("1.2.3");
    unmount();
  });

  test("reports a downloaded bundle's own version rather than the app's", async () => {
    installCapacitor("1.2.5");
    globalThis.fetch = mock(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const { hook, unmount } = renderCodepush("https://api.example.com");
    await act(async () => {
      await hook.current?.checkNewRelease();
    });
    expect(hook.current?.version).toBe("1.2.5");
    unmount();
  });
});
