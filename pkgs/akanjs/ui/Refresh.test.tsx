import "../test/registerDom";
import { describe, expect, test } from "bun:test";
import path from "node:path";
import { act } from "react";
import { Refresh } from "./Refresh";
import { mount } from "./testHelpers.fixture";

const mountRefresh = (onRefresh: () => Promise<void>) => {
  const { container, unmount } = mount(
    <Refresh onRefresh={onRefresh}>
      <p>list</p>
    </Refresh>,
  );
  return { content: container.querySelector("p")?.parentElement as HTMLElement, unmount };
};

const touch = (target: HTMLElement, type: string, pageY?: number) =>
  act(async () => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "touches", { value: pageY === undefined ? [] : [{ pageY }] });
    target.dispatchEvent(event);
  });

const drag = async (target: HTMLElement, fromY: number, toY: number) => {
  await touch(target, "touchstart", fromY);
  await touch(target, "touchmove", toY);
  await touch(target, "touchend");
};

describe("Refresh", () => {
  test("bundles with no dependency beyond react and react-icons", async () => {
    const built = await Bun.build({
      entrypoints: [path.join(import.meta.dir, "Refresh.tsx")],
      target: "browser",
      format: "esm",
      packages: "external",
    });
    const output = (await Promise.all(built.outputs.map((artifact) => artifact.text()))).join("\n");
    const specifiers = [...output.matchAll(/(?:from\s*|import\(\s*)["']([^"']+)["']/g)].map((match) => match[1]);

    expect(built.success).toBe(true);
    expect(specifiers.filter((specifier) => !/^react(\/|$)|^react-icons\//.test(specifier ?? ""))).toEqual([]);
  });

  test("a pull past the threshold refreshes once; a short pull does not", async () => {
    let refreshed = 0;
    const { content, unmount } = mountRefresh(async () => {
      refreshed += 1;
    });

    await drag(content, 0, 30);
    expect(refreshed).toBe(0);

    await drag(content, 0, 80);
    expect(refreshed).toBe(1);
    unmount();
  });

  test("an upward drag never refreshes", async () => {
    let refreshed = 0;
    const { content, unmount } = mountRefresh(async () => {
      refreshed += 1;
    });

    await drag(content, 100, 20);
    expect(refreshed).toBe(0);
    unmount();
  });
});
