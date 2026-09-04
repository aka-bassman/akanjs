import "../../test/registerDom";
import { describe, expect, test } from "bun:test";
import { act, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server.browser";

import Stream from "./Stream";

const mount = (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
};

/** A suspending first render has to settle inside an awaited `act`, or React warns and commits nothing. */
const mountAsync = async (node: ReactNode) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return {
    container,
    flush: async () => {
      await act(async () => {});
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const renderHtml = async (node: ReactNode) => {
  const stream = await renderToReadableStream(node, { onError: () => undefined });
  await stream.allReady;
  return await new Response(stream).text();
};

interface CatchProps {
  children: ReactNode;
}
class Catch extends Component<CatchProps, { message: string | null }> {
  override state = { message: null as string | null };
  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) };
  }
  override componentDidCatch(_error: unknown, _info: ErrorInfo) {}
  override render() {
    return this.state.message ? <span>{`caught: ${this.state.message}`}</span> : this.props.children;
  }
}

describe("Load.Stream", () => {
  test("renders a resolved value inline, with no fallback in the first commit", () => {
    const { container, unmount } = mount(
      <Stream of={{ label: "resolved" }} fallback={<span>pending</span>}>
        {(value) => <span>{value.label}</span>}
      </Stream>,
    );
    expect(container.textContent).toBe("resolved");
    unmount();
  });

  test("renders the fallback while a thenable is pending, then the value", async () => {
    let settle!: (value: { label: string }) => void;
    const promise = new Promise<{ label: string }>((resolve) => {
      settle = resolve;
    });
    const { container, flush, unmount } = await mountAsync(
      <Stream of={promise} fallback={<span>pending</span>}>
        {(value) => <span>{value.label}</span>}
      </Stream>,
    );
    expect(container.textContent).toBe("pending");
    settle({ label: "arrived" });
    await flush();
    expect(container.textContent).toBe("arrived");
    await unmount();
  });

  test("renders nothing while pending when the fallback is null", async () => {
    const { container, unmount } = await mountAsync(
      <Stream of={new Promise<{ label: string }>(() => undefined)} fallback={null}>
        {(value) => <span>{value.label}</span>}
      </Stream>,
    );
    expect(container.textContent).toBe("");
    await unmount();
  });

  test("server-renders a resolved value into the shell", async () => {
    const html = await renderHtml(
      <Stream of={{ label: "in-shell" }} fallback={<span>pending</span>}>
        {(value) => <span>{value.label}</span>}
      </Stream>,
    );
    expect(html).toContain("in-shell");
    expect(html).not.toContain("pending");
  });

  // The regression this stage exists for: resolving in an effect ships the fallback and nothing else, leaving
  // the markup to the browser.
  test("server-renders a pending thenable's value once it lands", async () => {
    const html = await renderHtml(
      <Stream of={Promise.resolve({ label: "streamed" })} fallback={<span>pending</span>}>
        {(value) => <span>{value.label}</span>}
      </Stream>,
    );
    expect(html).toContain("streamed");
  });

  test("lets a resolved sibling reach the shell while a pending one arrives later in the stream", async () => {
    let release!: (value: { label: string }) => void;
    const held = new Promise<{ label: string }>((resolve) => {
      release = resolve;
    });
    const stream = await renderToReadableStream(
      <div>
        <Stream of={{ label: "shell-now" }} fallback={<span>pending-a</span>}>
          {(value) => <span>{value.label}</span>}
        </Stream>
        <Stream of={held} fallback={<span>pending-b</span>}>
          {(value) => <span>{value.label}</span>}
        </Stream>
      </div>,
    );
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const first = decoder.decode((await reader.read()).value);
    expect(first).toContain("shell-now");
    expect(first).toContain("pending-b");
    expect(first).not.toContain("streamed-later");

    release({ label: "streamed-later" });
    let rest = "";
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) rest += decoder.decode(chunk.value);
    expect(rest).toContain("streamed-later");
  });

  /**
   * The shape the bug report hit: the page's own queries succeed, the shell goes out with the fallback, and the
   * boundary's data fails afterwards. React can no longer turn that into a status code, so the contract is that
   * the boundary degrades to a client render and the stream still closes — nothing may escape as a rejection
   * the process has to answer for.
   */
  test("a thenable that rejects after the shell degrades the boundary, not the stream", async () => {
    const seen: unknown[] = [];
    const collect = (reason: unknown) => seen.push(reason);
    process.on("unhandledRejection", collect);
    try {
      let fail!: (error: Error) => void;
      const held = new Promise<{ label: string }>((_, reject) => {
        fail = reject;
      });
      const errors: string[] = [];
      const stream = await renderToReadableStream(
        <div>
          <span>shell-now</span>
          <Stream of={held} fallback={<span>pending-b</span>}>
            {(value) => <span>{value.label}</span>}
          </Stream>
        </div>,
        { onError: (error) => void errors.push(error instanceof Error ? error.message : String(error)) },
      );
      stream.allReady.catch(() => {});
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      const first = decoder.decode((await reader.read()).value);
      expect(first).toContain("shell-now");
      expect(first).toContain("pending-b");

      fail(new Error("slice load failed"));
      let rest = "";
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read())
        rest += decoder.decode(chunk.value);

      expect(errors).toContain("slice load failed");
      expect(rest).toContain("$RX");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(seen).toEqual([]);
    } finally {
      process.off("unhandledRejection", collect);
    }
  });

  test("a rejected thenable reaches the nearest error boundary", async () => {
    const failing = Promise.reject(new Error("load failed"));
    const { container, flush, unmount } = await mountAsync(
      <Catch>
        <Stream of={failing} fallback={<span>pending</span>}>
          {() => <span>never</span>}
        </Stream>
      </Catch>,
    );
    await flush();
    expect(container.textContent).toBe("caught: load failed");
    await unmount();
  });
});
