import { describe, expect, test } from "bun:test";
import {
  createInlineRscScript,
  createSoftRedirectScript,
  ExpectedLateRedirectStderrSuppressor,
  encodeInlineRscChunk,
  interleaveRscScriptsWithHtml,
  SsrChunkRegistry,
  sanitizeFlightForClientStream,
} from "./ssrFromRscRenderer";

const encoder = new TextEncoder();
const rscBootstrap = `<script>self.__RSC_CHUNKS__=[];self.__RSC_PUSH__=function(type,data){self.__RSC_CHUNKS__.push([type,data]);};</script>`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function textStream(chunks: Array<{ text: string; delayMs?: number }>): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        if (chunk.delayMs) await sleep(chunk.delayMs);
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });
}

function byteStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function withCapturedStderr<T>(fn: () => Promise<T>): Promise<{ result: T; output: string; restored: boolean }> {
  const originalWrite = process.stderr.write;
  let output = "";
  const captureWrite = ((chunk: unknown, ...args: unknown[]) => {
    output +=
      typeof chunk === "string" ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk).toString() : String(chunk);
    const callback = args.find((arg): arg is () => void => typeof arg === "function");
    callback?.();
    return true;
  }) as typeof process.stderr.write;
  process.stderr.write = captureWrite;
  try {
    const result = await fn();
    return { result, output, restored: process.stderr.write === captureWrite };
  } finally {
    process.stderr.write = originalWrite;
  }
}

describe("SsrChunkRegistry", () => {
  test("evicts least recently used chunk groups while preserving aliases", () => {
    const registry = new SsrChunkRegistry<Record<string, string>>(4);
    const modA = { name: "a" };
    const modB = { name: "b" };
    const modC = { name: "c" };

    registry.set(["/a.js?v=1", "/a.js"], modA);
    registry.set(["/b.js?v=1", "/b.js"], modB);
    expect(registry.size).toBe(4);

    expect(registry.get("/a.js")).toBe(modA);
    registry.set(["/c.js?v=1", "/c.js"], modC);

    expect(registry.size).toBe(4);
    expect(registry.evictionCount).toBe(1);
    expect(registry.get("/a.js?v=1")).toBe(modA);
    expect(registry.get("/b.js")).toBeUndefined();
    expect(registry.get("/b.js?v=1")).toBeUndefined();
    expect(registry.get("/c.js")).toBe(modC);
  });
});

describe("inline RSC chunks", () => {
  test("encodes valid UTF-8 chunks as strings", () => {
    const bytes = new TextEncoder().encode("hello 한글");

    expect(encodeInlineRscChunk(bytes)).toEqual([1, "hello 한글"]);
  });

  test("falls back to base64 for invalid UTF-8 chunks", () => {
    expect(encodeInlineRscChunk(new Uint8Array([0xff]))).toEqual([3, "/w=="]);
  });

  test("escapes script-breaking UTF-8 payloads", () => {
    const script = createInlineRscScript(new TextEncoder().encode(`</script><!--\u2028\u2029`));

    expect(script).toContain("self.__RSC_PUSH__(1,");
    expect(script).not.toContain("</script><!--");
    expect(script).toContain("\\u003c/script\\u003e\\u003c!--\\u2028\\u2029");
  });

  test("replaces Akan redirect error rows for browser-bound Flight", async () => {
    const raw = [
      ':HL["/style.css","stylesheet"]\n',
      'c7:D{"time":1}\n',
      'c7:E{"digest":"AKAN_REDIRECT","name":"AkanRedirectError","message":"Redirect to /target"}\n',
    ].join("");
    const stream = textStream([{ text: raw.slice(0, 20) }, { text: raw.slice(20) }]);
    const output = await new Response(sanitizeFlightForClientStream(stream)).text();

    expect(output).toContain(':HL["/style.css","style"]');
    expect(output).toContain("c7:null\n");
    expect(output).not.toContain("AKAN_REDIRECT");
    expect(output).not.toContain("AkanRedirectError");
  });

  test("preserves non UTF-8 rows while sanitizing adjacent text rows", async () => {
    const invalidRow = new Uint8Array([0xff, 0x00, 0x0a]);
    const stylesheetRow = encoder.encode(':HL["/style.css","stylesheet"]\n');
    const output = new Uint8Array(
      await new Response(sanitizeFlightForClientStream(byteStream([invalidRow, stylesheetRow]))).arrayBuffer(),
    );
    const rewrittenStylesheetRow = encoder.encode(':HL["/style.css","style"]\n');

    expect([...output.slice(0, invalidRow.byteLength)]).toEqual([...invalidRow]);
    expect([...output.slice(invalidRow.byteLength)]).toEqual([...rewrittenStylesheetRow]);
  });

  test("sanitizes complete rows split across arbitrary byte boundaries", async () => {
    const raw = encoder.encode(
      [
        'a:D{"text":"한글 😀"}\n',
        ':HL["/style.css","stylesheet"]\n',
        'c7:E{"digest":"AKAN_REDIRECT","name":"AkanRedirectError","message":"Redirect"}\n',
      ].join(""),
    );
    const output = await new Response(
      sanitizeFlightForClientStream(byteStream([raw.slice(0, 7), raw.slice(7, 31), raw.slice(31)])),
    ).text();

    expect(output).toContain('a:D{"text":"한글 😀"}\n');
    expect(output).toContain(':HL["/style.css","style"]\n');
    expect(output).toContain("c7:null\n");
    expect(output).not.toContain("AKAN_REDIRECT");
  });

  test("preserves non-redirect error rows for React Flight error handling", async () => {
    const raw = [
      'nf:E{"digest":"AKAN_NOT_FOUND","name":"AkanNotFoundError","message":"Not Found"}\n',
      'er:E{"digest":"AKAN_RENDER_ERROR","name":"Error","message":"Boom"}\n',
    ].join("");
    const output = await new Response(sanitizeFlightForClientStream(textStream([{ text: raw }]))).text();

    expect(output).toBe(raw);
  });
});

describe("inline RSC interleaving", () => {
  test("flushes ready RSC scripts between HTML chunks", async () => {
    const html = textStream([
      { text: `<main>one${rscBootstrap}`, delayMs: 5 },
      { text: "two</main>", delayMs: 20 },
    ]);
    const rsc = textStream([{ text: "A" }]);
    const output = await new Response(interleaveRscScriptsWithHtml(html, rsc)).text();
    const firstHtmlIndex = output.indexOf("<main>one");
    const scriptIndex = output.indexOf(createInlineRscScript(encoder.encode("A")));
    const secondHtmlIndex = output.indexOf("two</main>");

    expect(firstHtmlIndex).toBeGreaterThanOrEqual(0);
    expect(output.indexOf(rscBootstrap)).toBeGreaterThan(firstHtmlIndex);
    expect(scriptIndex).toBeGreaterThan(firstHtmlIndex);
    expect(secondHtmlIndex).toBeGreaterThan(scriptIndex);
  });

  test("does not wait for delayed RSC chunks before flushing HTML", async () => {
    const html = textStream([{ text: `<main>one${rscBootstrap}` }, { text: "two</main>" }]);
    const rsc = textStream([{ text: "late", delayMs: 20 }]);
    const output = await new Response(interleaveRscScriptsWithHtml(html, rsc)).text();
    const firstHtmlIndex = output.indexOf("<main>one");
    const secondHtmlIndex = output.indexOf("two</main>");
    const scriptIndex = output.indexOf(createInlineRscScript(encoder.encode("late")));

    expect(firstHtmlIndex).toBeGreaterThanOrEqual(0);
    expect(secondHtmlIndex).toBeGreaterThan(firstHtmlIndex);
    expect(scriptIndex).toBeGreaterThan(secondHtmlIndex);
    expect(output).toContain("<script>self.__RSC_CLOSE__()</script>");
  });

  test("keeps bootstrap module scripts before the final RSC drain", async () => {
    const bootstrap = `<script type="module" src="/rsc-client.js"></script>`;
    const html = textStream([{ text: `<main>shell${rscBootstrap}</main>` }]);
    const rsc = textStream([{ text: "final", delayMs: 20 }]);
    const output = await new Response(
      interleaveRscScriptsWithHtml(html, rsc, { bootstrapModuleScripts: bootstrap }),
    ).text();
    const htmlIndex = output.indexOf("<main>shell");
    const bootstrapIndex = output.indexOf(bootstrap);
    const scriptIndex = output.indexOf(createInlineRscScript(encoder.encode("final")));
    const closeIndex = output.indexOf("<script>self.__RSC_CLOSE__()</script>");

    expect(htmlIndex).toBeGreaterThanOrEqual(0);
    expect(bootstrapIndex).toBeGreaterThan(htmlIndex);
    expect(scriptIndex).toBeGreaterThan(bootstrapIndex);
    expect(closeIndex).toBeGreaterThan(scriptIndex);
  });

  test("emits late redirect as a soft redirect script at an HTML chunk boundary", async () => {
    const redirect = {
      type: "redirect" as const,
      location: "/login?next=%2Fdashboard",
      method: "replace" as const,
      status: 307 as const,
    };
    const lateControl = sleep(8).then(() => redirect);
    const html = textStream([
      { text: "<main>shell", delayMs: 5 },
      { text: `${rscBootstrap}content</main>`, delayMs: 20 },
      { text: "<footer>tail</footer>", delayMs: 20 },
    ]);
    const rsc = textStream([{ text: "flight" }]);
    const output = await new Response(interleaveRscScriptsWithHtml(html, rsc, { lateControl })).text();
    const firstHtmlIndex = output.indexOf("<main>shell");
    const redirectIndex = output.indexOf(createSoftRedirectScript(redirect));
    const secondHtmlIndex = output.indexOf("content</main>");
    const thirdHtmlIndex = output.indexOf("<footer>tail</footer>");

    expect(firstHtmlIndex).toBeGreaterThanOrEqual(0);
    expect(secondHtmlIndex).toBeGreaterThan(firstHtmlIndex);
    expect(redirectIndex).toBeGreaterThan(secondHtmlIndex);
    expect(thirdHtmlIndex).toBeGreaterThan(redirectIndex);
    expect(output).toContain(createInlineRscScript(encoder.encode("flight")));
    expect(output).toContain("<script>self.__RSC_CLOSE__()</script>");
  });

  test("flushes complete RSC stream after a late redirect", async () => {
    const redirect = {
      type: "redirect" as const,
      location: "/login",
      method: "replace" as const,
      status: 307 as const,
    };
    const html = textStream([{ text: `<main>shell${rscBootstrap}</main>` }]);
    const rsc = textStream([{ text: "before" }, { text: "after", delayMs: 15 }]);
    const output = await new Response(
      interleaveRscScriptsWithHtml(html, rsc, { lateControl: sleep(5).then(() => redirect) }),
    ).text();
    const redirectIndex = output.indexOf(createSoftRedirectScript(redirect));
    const beforeIndex = output.indexOf(createInlineRscScript(encoder.encode("before")));
    const afterIndex = output.indexOf(createInlineRscScript(encoder.encode("after")));
    const closeIndex = output.indexOf("<script>self.__RSC_CLOSE__()</script>");

    expect(redirectIndex).toBeGreaterThanOrEqual(0);
    expect(beforeIndex).toBeGreaterThanOrEqual(0);
    expect(afterIndex).toBeGreaterThan(beforeIndex);
    expect(closeIndex).toBeGreaterThan(afterIndex);
  });

  test("bounds pending RSC scripts while preserving HTML-first flushing", async () => {
    let maxPending = 0;
    const html = textStream([
      { text: `<main>first${rscBootstrap}`, delayMs: 20 },
      { text: "second</main>", delayMs: 20 },
    ]);
    const rsc = textStream([{ text: "A" }, { text: "B" }, { text: "C" }]);
    const output = await new Response(
      interleaveRscScriptsWithHtml(html, rsc, {
        maxPendingRscScripts: 1,
        onPendingRscScriptsSize: (size) => {
          maxPending = Math.max(maxPending, size);
        },
      }),
    ).text();

    expect(maxPending).toBeLessThanOrEqual(1);
    expect(output.indexOf("<main>first")).toBeGreaterThanOrEqual(0);
    expect(output).toContain(createInlineRscScript(encoder.encode("A")));
    expect(output).toContain(createInlineRscScript(encoder.encode("B")));
    expect(output).toContain(createInlineRscScript(encoder.encode("C")));
    expect(output).toContain("second</main>");
  });
});

describe("late redirect stderr suppression", () => {
  const benignConnectionClosed = [
    '4673 |       reportGlobalError(weakResponse, Error("Connection closed."));\n',
    "error: Connection closed.\n",
    "    at close (/repo/node_modules/react-server-dom-webpack/cjs/react-server-dom-webpack-client.node.development.js:4673:39)\n\n",
  ].join("");

  test("suppresses benign RSDW connection-close output for late redirects", async () => {
    const { output, restored } = await withCapturedStderr(async () => {
      const suppressor = ExpectedLateRedirectStderrSuppressor.start(
        Promise.resolve({ type: "redirect", location: "/login", method: "replace", status: 307 }),
      );
      process.stderr.write(benignConnectionClosed);
      await sleep(30);
      suppressor?.stop();
    });

    expect(output).toBe("");
    expect(restored).toBe(true);
  });

  test("passes through non-benign stderr output", async () => {
    const { output } = await withCapturedStderr(async () => {
      const suppressor = ExpectedLateRedirectStderrSuppressor.start(
        Promise.resolve({ type: "redirect", location: "/login", method: "replace", status: 307 }),
      );
      process.stderr.write("real application error\n");
      await sleep(30);
      suppressor?.stop();
    });

    expect(output).toBe("real application error\n");
  });

  test("does not suppress connection-close output without a late redirect", async () => {
    const { output } = await withCapturedStderr(async () => {
      const suppressor = ExpectedLateRedirectStderrSuppressor.start(Promise.resolve(null));
      process.stderr.write(benignConnectionClosed);
      await sleep(30);
      suppressor?.stop();
    });

    expect(output).toBe(benignConnectionClosed);
  });

  test("does not install the process-wide stderr hook in production by default", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousSuppress = process.env.AKAN_SUPPRESS_LATE_REDIRECT_STDERR;
    process.env.NODE_ENV = "production";
    delete process.env.AKAN_SUPPRESS_LATE_REDIRECT_STDERR;
    try {
      const { output } = await withCapturedStderr(async () => {
        const suppressor = ExpectedLateRedirectStderrSuppressor.start(
          Promise.resolve({ type: "redirect", location: "/login", method: "replace", status: 307 }),
        );
        expect(suppressor).toBeNull();
        process.stderr.write(benignConnectionClosed);
        await sleep(30);
      });

      expect(output).toBe(benignConnectionClosed);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
      if (previousSuppress === undefined) delete process.env.AKAN_SUPPRESS_LATE_REDIRECT_STDERR;
      else process.env.AKAN_SUPPRESS_LATE_REDIRECT_STDERR = previousSuppress;
    }
  });
});
