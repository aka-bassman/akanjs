import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { Spin } from "./Spin";

async function renderToText(node: ReactNode): Promise<string> {
  return new Response(await renderToReadableStream(node)).text();
}

describe("Loading.Spin", () => {
  test("colors the wrapper so the icon inherits it", async () => {
    const html = await renderToText(<Spin />);
    expect(html).toContain("text-primary/70");
    expect(html).toContain("text-xl");
    expect(html).toMatch(/<svg[^>]*class="animate-spin"/);
  });

  test("lets className replace the tone and the size", async () => {
    const html = await renderToText(<Spin className="text-sm text-success" />);
    expect(html).not.toContain("text-primary/70");
    expect(html).not.toContain("text-xl");
    expect(html).toContain("text-success");
    expect(html).toContain("text-sm");
  });

  test("names no color at all for tone=current, so a filled surface's foreground reaches the icon", async () => {
    const html = await renderToText(<Spin tone="current" />);
    expect(html).not.toContain("text-primary");
    expect(html).toMatch(/<svg[^>]*class="animate-spin"/);
  });

  test("draws a numeric size at that many pixels instead of a font-size step", async () => {
    const html = await renderToText(<Spin size={50} />);
    expect(html).toContain("font-size:50px");
    expect(html).not.toContain("text-xl");
  });

  test("leaves a custom indicator's own color alone", async () => {
    const html = await renderToText(<Spin indicator={<span className="text-accent">dots</span>} />);
    expect(html).not.toContain("text-primary/70");
    expect(html).toContain("text-accent");
  });
});
