import type { LibConfig } from "akanjs";

const config: LibConfig = {
  // public/excalidraw.css loads these by URL, so no `fonts` declaration names them.
  assets: { keepFonts: ["fonts/Assistant-*.woff2"] },
};

export default config;
