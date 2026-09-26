import "../../test/registerDom";
import { beforeAll, describe, expect, test } from "bun:test";
import { mount, setTestEnv } from "../testHelpers.fixture";

const listeners = new Map<string, Set<unknown>>();
const ws = {
  connected: true,
  on: (key: string, callback: unknown) => {
    listeners.set(key, (listeners.get(key) ?? new Set()).add(callback));
  },
  off: (key: string, callback: unknown) => {
    listeners.get(key)?.delete(callback);
  },
};

let Reconnect: typeof import("./Reconnect").Reconnect;

beforeAll(async () => {
  setTestEnv("reconnecttest");
  const { registerClientRuntime } = await import("akanjs/client");
  registerClientRuntime({ usePage: () => ({ l: (key: string) => key }), fetch: { ws } } as never);
  ({ Reconnect } = await import("./Reconnect"));
});

describe("Reconnect", () => {
  test("removes every socket listener it added when it unmounts", () => {
    const { unmount } = mount(<Reconnect />);
    expect(listeners.get("connect")?.size).toBe(1);
    expect(listeners.get("disconnect")?.size).toBe(1);
    unmount();
    expect(listeners.get("connect")?.size).toBe(0);
    expect(listeners.get("disconnect")?.size).toBe(0);
  });
});
