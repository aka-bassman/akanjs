import "../test/registerDom";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import type { RouteRender } from "akanjs/client";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RenderLayer } from "./RenderLayer";

class UnreachableErr extends Error {
  constructor() {
    super("base.error.serverUnreachable");
  }
}

beforeAll(() => {
  process.env.AKAN_PUBLIC_APP_NAME = "test";
  process.env.AKAN_PUBLIC_REPO_NAME = "akanjs";
  process.env.AKAN_PUBLIC_SERVE_DOMAIN = "akanjs.com";
});

let mounted: { root: Root; container: HTMLElement } | null = null;
const mount = async (renders: RouteRender[]) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted = { root, container };
  await act(async () => {
    root.render(<RenderLayer renders={renders} index={0} params={{}} searchParams={{}} />);
  });
  return container;
};
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

afterEach(async () => {
  if (!mounted) return;
  const { root, container } = mounted;
  await act(async () => root.unmount());
  container.remove();
  mounted = null;
});

describe("RenderLayer", () => {
  test("a page whose render cannot reach the server says so and renders again on retry", async () => {
    let calls = 0;
    const page: RouteRender = {
      kind: "page",
      isAsync: true,
      render: async () => {
        calls += 1;
        if (calls === 1) throw new UnreachableErr();
        return <main>loaded</main>;
      },
    };
    const container = await mount([page]);
    await settle();

    expect(container.querySelector("[role=alert]")?.textContent).toContain("base.error.serverUnreachable");
    const retry = container.querySelector("button");
    expect(retry).not.toBeNull();

    await act(async () => retry?.click());
    await settle();

    expect(calls).toBe(2);
    expect(container.querySelector("[role=alert]")).toBeNull();
    expect(container.textContent).toBe("loaded");
  });
});
