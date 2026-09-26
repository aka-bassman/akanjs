import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { lazy } from "./lazy";

const renderToText = async (node: ReactNode) => new Response(await renderToReadableStream(node)).text();

const deferredLoader = () => {
  let resolve!: () => void;
  const gate = new Promise<void>((r) => {
    resolve = r;
  });
  return {
    release: resolve,
    load: async () => {
      await gate;
      return { default: () => <p>loaded</p> };
    },
  };
};

describe("lazy", () => {
  test("without the flag the chunk suspends past the component, leaving nothing of its own behind", async () => {
    const { load, release } = deferredLoader();
    const Bare = lazy(load, { loading: () => <span>placeholder</span> }) as () => ReactNode;
    const html = renderToText(
      <main>
        <h1>shell</h1>
        <Bare />
      </main>,
    );
    release();

    expect(await html).not.toContain("placeholder");
    expect(await html).toContain("loaded");
  });

  test("with the flag the fallback renders in place and the shell is untouched", async () => {
    const { load, release } = deferredLoader();
    const Guarded = lazy(load, { suspense: true, loading: () => <span>placeholder</span> }) as () => ReactNode;
    const html = renderToText(
      <main>
        <h1>shell</h1>
        <Guarded />
      </main>,
    );
    release();
    const text = await html;

    expect(text).toContain("shell");
    expect(text).toContain("placeholder");
    expect(text).toContain("loaded");
  });

  test("a flagged component with no `loading` falls back to nothing rather than to its parent", async () => {
    const { load, release } = deferredLoader();
    const Guarded = lazy(load, { suspense: true }) as () => ReactNode;
    const html = renderToText(
      <main>
        <h1>shell</h1>
        <Guarded />
      </main>,
    );
    release();
    const text = await html;

    expect(text).toContain("shell");
    expect(text).toContain("loaded");
  });
});
