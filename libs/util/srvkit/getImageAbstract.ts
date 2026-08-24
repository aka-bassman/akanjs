type SharpFactory = typeof import("sharp");

let sharpLoad: Promise<SharpFactory> | null = null;

function loadSharp(): Promise<SharpFactory> {
  sharpLoad ??= import("sharp").then((mod) => {
    const loaded = mod as unknown as { default?: SharpFactory } & SharpFactory;
    return loaded.default ?? loaded;
  });
  return sharpLoad;
}

async function readImageBuffer(source: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(source)) return source;
  if (source.startsWith("file://")) return Buffer.from(await Bun.file(source.replace("file://", "")).arrayBuffer());
  if (source.startsWith("/") && !source.startsWith("/api/") && (await Bun.file(source).exists())) {
    return Buffer.from(await Bun.file(source).arrayBuffer());
  }
  if (!source.includes("://") && !source.startsWith("/") && (await Bun.file(source).exists())) {
    return Buffer.from(await Bun.file(source).arrayBuffer());
  }
  const response = await fetch(encodeURI(source), { signal: AbortSignal.timeout(15_000) });
  return Buffer.from(await response.arrayBuffer());
}

export const getImageAbstract = async (
  source: string | Buffer,
): Promise<{ abstractData?: string; imageSize?: [number, number] }> => {
  const abstract: { abstractData?: string; imageSize?: [number, number] } = {};
  try {
    const buffer = await readImageBuffer(source);
    const sharp = await loadSharp();
    const image = sharp(buffer);

    try {
      const { width, height } = await image.metadata();
      if (width && height) abstract.imageSize = [width, height];
    } catch (_) {}

    try {
      const { data, info } = await image
        .resize(10, 10, { fit: "inside" })
        .blur(1)
        .toBuffer({ resolveWithObject: true });
      abstract.abstractData = `data:image/${info.format};base64,${data.toString("base64")}`;
    } catch (_) {}
  } catch (_) {}
  return abstract;
};
