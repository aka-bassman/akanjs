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

    try {
      const { width, height } = await new Bun.Image(buffer).metadata();
      if (width && height) abstract.imageSize = [width, height];
    } catch (_) {}

    try {
      // A Bun.Image chain mutates its own instance and there is no `clone()`, so the thumbnail needs
      // its own. Blur is not available either — at 10px the upscale in the browser supplies it.
      abstract.abstractData = await new Bun.Image(buffer).resize(10).png().dataurl();
    } catch (_) {}
  } catch (_) {}
  return abstract;
};
