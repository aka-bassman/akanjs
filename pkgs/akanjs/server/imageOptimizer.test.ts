import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ImageOptimizer } from "./imageOptimizer";
import type { AkanImageConfig } from "./types";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const hex = (text: string) => Buffer.from(text.replace(/\s+/g, ""), "hex");
const gifFrame = "21f904010000 0000 2c00000000010001000000 020244010000";
const animatedGif = hex(`47494638396101000100 8000 00 000000 ffffff${gifFrame}${gifFrame}3b`);

const root = path.join(tmpdir(), `akan-image-optimizer-${process.pid}`);
let optimizer: ImageOptimizer;

const request = (url: string, width: number, accept: string) =>
  new Request(`http://local.akan/_akan/image?url=${encodeURIComponent(url)}&w=${width}&q=75`, { headers: { accept } });

const upstreamImage = async () => {
  const photo = await Bun.file(path.join(root, "public/photo.png")).bytes();
  let served = 0;
  const upstream = Bun.serve({
    port: 0,
    fetch: async () => {
      served += 1;
      await Bun.sleep(20);
      return new Response(photo, { headers: { "content-type": "image/png" } });
    },
  });
  return {
    url: `http://localhost:${upstream.port}/photo.png`,
    hits: () => served,
    stop: () => upstream.stop(true),
  };
};

const remoteOptimizer = (cacheDir: string, config: Partial<AkanImageConfig> = {}) =>
  new ImageOptimizer({
    publicDir: path.join(root, "public"),
    cacheDir: path.join(root, cacheDir),
    prodMode: true,
    config: { remotePatterns: [{ protocol: "http", hostname: "localhost" }], ...config },
  });

describe("ImageOptimizer", () => {
  beforeAll(async () => {
    await Bun.write(path.join(root, "public/photo.png"), await new Bun.Image(onePixelPng).resize(64).png().bytes());
    await Bun.write(path.join(root, "public/loop.gif"), animatedGif);
    await Bun.write(path.join(root, "public/logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    optimizer = new ImageOptimizer({
      publicDir: path.join(root, "public"),
      cacheDir: path.join(root, "cache"),
      prodMode: true,
    });
  });
  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test("re-encodes a png to webp when the client accepts it", async () => {
    const res = await optimizer.handle(request("/photo.png", 32, "image/webp,image/*"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Vary")).toBe("Accept");
    expect(await new Bun.Image(Buffer.from(await res.arrayBuffer())).metadata()).toMatchObject({
      width: 32,
      format: "webp",
    });
  });

  test("keeps the source format when the client accepts nothing better", async () => {
    const res = await optimizer.handle(request("/photo.png", 32, "text/html"));

    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(await new Bun.Image(Buffer.from(await res.arrayBuffer())).metadata()).toMatchObject({ width: 32 });
  });

  test("never enlarges past the source", async () => {
    const res = await optimizer.handle(request("/photo.png", 256, "image/webp"));
    const meta = await new Bun.Image(Buffer.from(await res.arrayBuffer())).metadata();

    expect(meta.width).toBe(64);
  });

  test("passes an animated gif through untouched", async () => {
    const res = await optimizer.handle(request("/loop.gif", 32, "image/webp,image/*"));

    expect(res.headers.get("Content-Type")).toBe("image/gif");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(animatedGif);
  });

  test("refuses svg unless the app opted in", async () => {
    const res = await optimizer.handle(request("/logo.svg", 32, "image/webp"));

    expect(res.status).toBe(400);
  });

  test("answers 304 for a matching if-none-match", async () => {
    const first = await optimizer.handle(request("/photo.png", 32, "image/webp"));
    const etag = first.headers.get("ETag") ?? "";
    const req = request("/photo.png", 32, "image/webp");
    req.headers.set("if-none-match", etag);

    expect((await optimizer.handle(req)).status).toBe(304);
  });

  test("downgrades an avif-only config to webp where no OS codec exists", async () => {
    // The `bun` backend is what a Linux container runs, and it has no AV1 encoder. Forcing it here
    // means the downgrade is covered on a macOS dev machine too, where `system` would have encoded.
    const backend = Bun.Image.backend;
    Bun.Image.backend = "bun";
    try {
      const avifOnly = new ImageOptimizer({
        publicDir: path.join(root, "public"),
        cacheDir: path.join(root, "cache-avif"),
        prodMode: true,
        config: { formats: ["image/avif"] },
      });
      const res = await avifOnly.handle(request("/photo.png", 32, "image/avif,image/webp,image/*"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/webp");
    } finally {
      Bun.Image.backend = backend;
    }
  });

  test("collapses concurrent requests for one image into a single fetch and encode", async () => {
    const { url, hits, stop } = await upstreamImage();
    try {
      const remote = remoteOptimizer("cache-remote");
      const all = await Promise.all(Array.from({ length: 8 }, () => remote.handle(request(url, 32, "image/webp"))));

      expect(all.map((res) => res.status)).toEqual(Array(8).fill(200));
      expect(new Set(all.map((res) => res.headers.get("ETag"))).size).toBe(1);
      expect(hits()).toBe(1);
    } finally {
      stop();
    }
  });

  test("serves a warm remote image without touching the origin", async () => {
    const { url, hits, stop } = await upstreamImage();
    try {
      const remote = remoteOptimizer("cache-warm-remote");
      const etags: (string | null)[] = [];
      for (let i = 0; i < 4; i += 1) {
        const res = await remote.handle(request(url, 32, "image/webp"));
        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/webp");
        etags.push(res.headers.get("ETag"));
      }

      expect(hits()).toBe(1);
      expect(new Set(etags).size).toBe(1);
    } finally {
      stop();
    }
  });

  test("refetches a remote image once its ttl has run out", async () => {
    const { url, hits, stop } = await upstreamImage();
    try {
      const remote = remoteOptimizer("cache-expiring-remote", { minimumCacheTTL: 0 });
      for (let i = 0; i < 3; i += 1) expect((await remote.handle(request(url, 32, "image/webp"))).status).toBe(200);

      expect(hits()).toBe(3);
    } finally {
      stop();
    }
  });

  test("refetches a remote image every time under akan start", async () => {
    const { url, hits, stop } = await upstreamImage();
    try {
      const dev = new ImageOptimizer({
        publicDir: path.join(root, "public"),
        cacheDir: path.join(root, "cache-dev-remote"),
        prodMode: false,
        config: { remotePatterns: [{ protocol: "http", hostname: "localhost" }] },
      });
      for (let i = 0; i < 3; i += 1) expect((await dev.handle(request(url, 32, "image/webp"))).status).toBe(200);

      expect(hits()).toBe(3);
    } finally {
      stop();
    }
  });

  test("serves every request when image work is capped to one at a time", async () => {
    const capped = new ImageOptimizer({
      publicDir: path.join(root, "public"),
      cacheDir: path.join(root, "cache-capped"),
      prodMode: true,
      config: { maxConcurrency: 1 },
    });
    const widths = [32, 48, 64, 96, 128, 256, 384];
    const all = await Promise.all(widths.map((width) => capped.handle(request("/photo.png", width, "image/webp"))));

    expect(all.map((res) => res.status)).toEqual(widths.map(() => 200));
    expect(new Set(all.map((res) => res.headers.get("Content-Type")))).toEqual(new Set(["image/webp"]));
  });
});
