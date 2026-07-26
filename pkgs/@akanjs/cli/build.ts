import path from "node:path";
import { $ } from "bun";

const CLI_DIR = import.meta.dir;
const PACKAGE_DIR = CLI_DIR;
const DEVKIT_DIR = path.resolve(CLI_DIR, "../devkit");
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? process.cwd();
const OUT_DIR = process.env.DIST_DIR ?? `${WORKSPACE_ROOT}/dist/pkgs/@akanjs/cli`;

const build = async () => {
  try {
    const packageJson = await Bun.file(`${PACKAGE_DIR}/package.json`).json();
    await $`rm -rf ${OUT_DIR}`;
    const buildResult = await Bun.build({
      entrypoints: [
        `${CLI_DIR}/index.ts`,
        `${DEVKIT_DIR}/incrementalBuilder/incrementalBuilder.proc.ts`,
        `${DEVKIT_DIR}/incrementalBuilder/buildBatch.proc.ts`,
        `${DEVKIT_DIR}/typecheck/typecheck.proc.ts`,
      ],
      // Required, not cosmetic: with `splitting: false` Bun inlines every dynamically imported module
      // into the entry and hoists its external `import` statements to the top of the file, so the
      // lazy imports that keep `typescript`, @trapezedev/project, @langchain/* and the tailwind stack
      // out of the dev host would all load eagerly anyway.
      splitting: true,
      target: "bun",
      outdir: OUT_DIR,
      // Chunks must sit next to the entry, not in a subdirectory: code that resolves bundled assets
      // through `import.meta.dir` (e.g. the `templates/` and `guidelines/` lookups) would otherwise
      // look for them under `chunks/`.
      naming: { entry: "[name].js", chunk: "[name]-[hash].js" },
      external: Object.keys({ ...packageJson.dependencies, ...packageJson.peerDependencies }).filter(
        (name) => name !== "@akanjs/devkit",
      ),
      plugins: [],
    });
    if (!buildResult.success) throw new AggregateError(buildResult.logs, "CLI build failed");
    await $`rm -rf ${OUT_DIR}/templates ${OUT_DIR}/guidelines`;
    await $`cp -R ${CLI_DIR}/templates ${OUT_DIR}/templates`;
    await $`cp -R ${CLI_DIR}/guidelines ${OUT_DIR}/guidelines`;
    const distPackageJson = {
      ...packageJson,
      bin: { akan: "./index.js", akan2: "./index.js" },
      exports: {
        ".": { import: "./index.js", default: "./index.js" },
        "./package.json": "./package.json",
      },
    };
    await Bun.write(`${OUT_DIR}/package.json`, JSON.stringify(distPackageJson, null, 2));
    // Generated here rather than at first run: without it the entry has to import every command module
    // to discover which one owns `argv[2]`, and a dev sandbox may only ever run `akan start` once.
    const { CommandManifest } = await import("./commandManifest");
    await Bun.write(`${OUT_DIR}/${CommandManifest.fileName}`, JSON.stringify(await CommandManifest.generate()));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

build();
