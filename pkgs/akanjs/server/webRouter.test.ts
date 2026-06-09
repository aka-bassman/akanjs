import { describe, expect, test } from "bun:test";
import { DEFAULT_AKAN_I18N } from "akanjs/common";
import {
  cacheHtmlWhileStreaming,
  cancelStreamForHeadResponse,
  createRscNavigationStreamResponse,
  createRscRedirectResponse,
  createRscStreamResponse,
  normalizeRscTargetUrlForHostBasePath,
} from "./webRouter";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("WebRouter RSC target normalization", () => {
  test("maps public host paths to the hidden basePath route for RSC navigation", () => {
    const target = new URL("https://akanjs.com/en/docs/intro/quickstart");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: "akanjs",
      i18n: DEFAULT_AKAN_I18N,
    });

    expect(normalized.url.href).toBe("https://akanjs.com/en/akanjs/docs/intro/quickstart");
    expect(normalized.basePath).toBe("akanjs");
  });

  test("maps debug public paths by matching configured basePath route seeds", () => {
    const target = new URL("https://akanjs-debug.akanjs.com/en/references/cli/overview");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: null,
      basePaths: ["office", "akanjs", "soft"],
      i18n: DEFAULT_AKAN_I18N,
      seedEntries: [
        {
          routeId: "/:lang/akanjs/references/cli/overview",
          pattern: "/:lang/akanjs/references/cli/overview",
          seeds: [],
        },
      ],
    });

    expect(normalized.url.href).toBe("https://akanjs-debug.akanjs.com/en/akanjs/references/cli/overview");
    expect(normalized.basePath).toBe("akanjs");
  });

  test("does not duplicate an already internal basePath route", () => {
    const target = new URL("https://akanjs.com/en/akanjs/docs/intro/quickstart");

    const normalized = normalizeRscTargetUrlForHostBasePath(target, {
      basePath: "akanjs",
      i18n: DEFAULT_AKAN_I18N,
    });

    expect(normalized.url.href).toBe("https://akanjs.com/en/akanjs/docs/intro/quickstart");
    expect(normalized.basePath).toBe("akanjs");
  });
});

describe("WebRouter RSC redirect response", () => {
  test("uses the Akan RSC redirect envelope with status metadata", async () => {
    const response = createRscRedirectResponse("/target", "push", 308);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Akan-Redirect")).toBe("/target");
    expect(response.headers.get("X-Akan-Redirect-Method")).toBe("push");
    expect(response.headers.get("X-Akan-Redirect-Status")).toBe("308");
    await expect(response.json()).resolves.toEqual({
      type: "redirect",
      location: "/target",
      method: "push",
      status: 308,
    });
  });
});

describe("WebRouter RSC stream response", () => {
  test("preserves 404 status for not-found Flight payloads", async () => {
    const response = createRscStreamResponse("flight", 404);

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.text()).resolves.toBe("flight");
  });

  test("turns late redirects into the RSC redirect envelope", async () => {
    const response = await createRscNavigationStreamResponse({
      type: "stream",
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('0:E{"digest":"AKAN_REDIRECT"}\n'));
          controller.close();
        },
      }),
      lateControl: Promise.resolve({ type: "redirect", location: "/target", method: "replace", status: 307 }),
      cancel: () => {},
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Akan-Redirect")).toBe("/target");
    expect(response.headers.get("X-Akan-Redirect-Method")).toBe("replace");
    await expect(response.json()).resolves.toEqual({
      type: "redirect",
      location: "/target",
      method: "replace",
      status: 307,
    });
  });

  test("buffers RSC navigation Flight until P7 streaming decode lands", async () => {
    const response = await createRscNavigationStreamResponse({
      type: "stream",
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("flight"));
          controller.close();
        },
      }),
      status: 404,
      lateControl: Promise.resolve(null),
      cancel: () => {},
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/x-component; charset=utf-8");
    await expect(response.text()).resolves.toBe("flight");
  });
});

describe("WebRouter HTML cache streaming", () => {
  test("passes through the first chunk before caching the completed HTML", async () => {
    let cachedHtml = "";
    const stream = cacheHtmlWhileStreaming(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode("<html>first"));
          await sleep(20);
          controller.enqueue(encoder.encode("second</html>"));
          controller.close();
        },
      }),
      (html) => {
        cachedHtml = html;
      },
    );
    const reader = stream.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(decoder.decode(first.value)).toBe("<html>first");
    expect(cachedHtml).toBe("");

    let rest = "";
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      rest += decoder.decode(next.value);
    }

    expect(rest).toBe("second</html>");
    expect(cachedHtml).toBe("<html>firstsecond</html>");
  });

  test("cancels the unused HTML stream for HEAD responses", async () => {
    let cancelledReason: unknown;
    const reason = new Error("HEAD response does not consume body");
    const stream = new ReadableStream<Uint8Array>({
      cancel(actualReason) {
        cancelledReason = actualReason;
      },
    });

    cancelStreamForHeadResponse(stream, reason);
    await sleep(0);

    expect(cancelledReason).toBe(reason);
  });
});
