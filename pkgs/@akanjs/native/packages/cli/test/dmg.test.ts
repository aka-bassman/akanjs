import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Real, writeBplist } from "../src/lib/bplist.ts";
import { buildDmg, DMG_DEFAULTS, dmgRecords, validateDmg } from "../src/lib/dmg.ts";
import { readDsStore, writeDsStore } from "../src/lib/dsStore.ts";
import { exec, execOrThrow } from "../src/lib/exec.ts";
import { aliasRecord, hfsTime } from "../src/lib/macAlias.ts";

// The macOS installer's window (desktop.dmg): a .DS_Store, its plists and the background's alias, written without
// Finder, then a real disk image built, mounted and read back.

const iconAt = (blob: Uint8Array) => {
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  return { x: view.getUint32(0), y: view.getUint32(4) };
};

/** An HFS+ volume header ("H+", version 4) sits 1024 bytes into its partition; its createDate is at offset 16. */
const volumeHeaderCreateDate = (image: Uint8Array) => {
  for (let offset = 1024; offset + 512 <= image.length; offset += 512)
    if (image[offset] === 0x48 && image[offset + 1] === 0x2b && image[offset + 2] === 0 && image[offset + 3] === 4)
      return new DataView(image.buffer, image.byteOffset + offset).getUint32(16);
  throw new Error("no HFS+ volume header in the image");
};

describe("desktop.dmg config", () => {
  test("without one the window is akan-native's background with the icons on its arrow", () => {
    const problems: string[] = [];
    const layout = validateDmg(undefined, "/app", problems);
    expect(problems).toEqual([]);
    expect(layout.background?.image).toEndWith("native/macos/dmg/background.png");
    expect(layout.background?.image2x).toEndWith("native/macos/dmg/background@2x.png");
    expect(existsSync(layout.background?.image ?? "")).toBe(true);
    expect(existsSync(layout.background?.image2x ?? "")).toBe(true);
    expect(layout).toMatchObject({ app: DMG_DEFAULTS.app, applications: DMG_DEFAULTS.applications, iconSize: 128 });
  });

  test("names what it refuses, and false leaves a plain window", () => {
    const problems: string[] = [];
    validateDmg(
      {
        background: "missing.png",
        background2x: "also.png",
        iconSize: 0,
        app: { x: 1 } as never,
        window: { width: -1 },
      },
      "/nowhere",
      problems,
    );
    expect(problems).toEqual([
      'desktop.dmg.background must be an image file (got "missing.png")',
      'desktop.dmg.background2x must be an image file (got "also.png")',
      "desktop.dmg.window.width must be a positive number of points (got -1)",
      "desktop.dmg.iconSize must be a positive number of points (got 0)",
      'desktop.dmg.app must be { x, y }, the icon\'s center in points (got {"x":1})',
    ]);
    expect(validateDmg({ background: false }, "/app", []).background).toBeNull();
  });
});

describe(".DS_Store", () => {
  test("reads back every record, sorted the way Finder looks them up", () => {
    const file = writeDsStore([
      { name: "Zed.app", code: "Iloc", value: { type: "blob", value: Uint8Array.of(1, 2) } },
      { name: ".", code: "vSrn", value: { type: "long", value: 1 } },
      { name: "applications", code: "Iloc", value: { type: "blob", value: Uint8Array.of(3) } },
      { name: ".", code: "icvl", value: { type: "type", value: "icnv" } },
    ]);
    expect(new TextDecoder().decode(file.subarray(4, 8))).toBe("Bud1");
    expect(readDsStore(file).map(({ name, code }) => `${name}/${code}`)).toEqual([
      "./icvl",
      "./vSrn",
      "applications/Iloc",
      "Zed.app/Iloc",
    ]);
  });

  test("a window's records place each icon at its center and keep the window's size under its title bar", () => {
    const layout = validateDmg({ app: { x: 100, y: 120 }, applications: { x: 400, y: 120 } }, "/app", []);
    const records = dmgRecords(layout, { appName: "Demo.app", size: { width: 500, height: 300 } });
    const byKey = new Map(records.map((record) => [`${record.name}/${record.code}`, record.value]));
    const demo = byKey.get("Demo.app/Iloc");
    const applications = byKey.get("Applications/Iloc");
    expect(demo?.type === "blob" ? iconAt(demo.value) : null).toEqual({ x: 100, y: 120 });
    expect(applications?.type === "blob" ? iconAt(applications.value) : null).toEqual({ x: 400, y: 120 });
  });
});

describe.skipIf(process.platform !== "darwin")("plists Finder reads (macOS)", () => {
  test("bplist00 that plutil accepts, reals kept real and bytes as data", async () => {
    const dir = mkdtempSync(join(tmpdir(), "akan-bplist-"));
    try {
      const file = join(dir, "x.plist");
      writeFileSync(
        file,
        writeBplist({
          WindowBounds: "{{200, 120}, {660, 428}}",
          ShowToolbar: false,
          iconSize: new Real(128),
          d: Uint8Array.of(1, 2),
        }),
      );
      expect((await execOrThrow(["plutil", "-lint", file], { echo: false })).stdout).toContain("OK");
      const { stdout } = await execOrThrow(["plutil", "-p", file], { echo: false });
      expect(stdout).toContain('"WindowBounds" => "{{200, 120}, {660, 428}}"');
      expect(stdout).toContain('"ShowToolbar" => false');
      expect(stdout).toContain("length = 2, bytes = 0x0102");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the background's alias record", () => {
  test("a 150-byte version 2 header naming the volume and the file, then the paths Finder falls back to", () => {
    const record = aliasRecord({
      volumeName: "Demo",
      volumeCreated: 3_874_124_489,
      volumePath: "/Volumes/Demo",
      kind: "file",
      name: "background.tiff",
      cnid: 21,
      created: new Date("2026-10-06T00:00:00Z"),
      parentName: ".background",
      parentCnid: 20,
      cnidPath: [20],
      posixPath: "/.background/background.tiff",
    });
    const view = new DataView(record.buffer);
    expect(view.getUint16(4)).toBe(record.length);
    expect(view.getUint16(6)).toBe(2);
    expect(new TextDecoder().decode(record.subarray(11, 11 + (record[10] ?? 0)))).toBe("Demo");
    expect(view.getUint32(38)).toBe(3_874_124_489);
    expect(new TextDecoder().decode(record.subarray(42, 44))).toBe("H+");
    expect(view.getUint32(46)).toBe(20);
    expect(new TextDecoder().decode(record.subarray(51, 51 + (record[50] ?? 0)))).toBe("background.tiff");
    expect(view.getUint32(114)).toBe(21);
    const text = new TextDecoder().decode(record.subarray(150));
    expect(text).toContain("/.background/background.tiff");
    expect(text).toContain("/Volumes/Demo");
    expect(view.getInt16(record.length - 4)).toBe(-1);
  });

  test("HFS time counts from 1904", () => {
    expect(hfsTime(new Date("1970-01-01T00:00:00Z"))).toBe(2_082_844_800);
  });
});

describe.skipIf(process.platform !== "darwin")("a built disk image (macOS)", () => {
  test("opens on the background with the icons placed, shows the app's icon, hides its own files, takes a signature", async () => {
    const work = mkdtempSync(join(tmpdir(), "akan-dmg-"));
    const mount = join(work, "mounted");
    let aliasVolumeDate = 0;
    try {
      const app = join(work, "Demo.app");
      mkdirSync(join(app, "Contents", "MacOS"), { recursive: true });
      writeFileSync(join(app, "Contents", "Info.plist"), "<plist><dict/></plist>");
      writeFileSync(join(app, "Contents", "MacOS", "Demo"), "#!/bin/sh\n");
      const icon = join(work, "AppIcon.icns");
      writeFileSync(icon, new TextEncoder().encode("icns"));
      const dmg = join(work, "Demo.dmg");
      const layout = validateDmg({ app: { x: 160, y: 180 }, applications: { x: 500, y: 180 } }, work, []);
      await buildDmg(app, dmg, "Demo", join(work, "gen"), { layout, volumeIcon: icon });

      expect((await execOrThrow(["hdiutil", "imageinfo", dmg], { echo: false })).stdout).toContain("UDZO");
      await execOrThrow(["codesign", "-s", "-", dmg], { echo: false });
      expect((await exec(["codesign", "--verify", dmg], { echo: false })).code).toBe(0);

      mkdirSync(mount);
      await execOrThrow(["hdiutil", "attach", dmg, "-nobrowse", "-noautoopen", "-readonly", "-mountpoint", mount], {
        echo: false,
      });
      try {
        expect(statSync(join(mount, ".background", "background.tiff")).size).toBeGreaterThan(0);
        expect(readFileSync(join(mount, ".VolumeIcon.icns"), "utf8")).toBe("icns");
        const records = readDsStore(new Uint8Array(readFileSync(join(mount, ".DS_Store"))));
        const byKey = new Map(records.map((record) => [`${record.name}/${record.code}`, record.value]));
        const demo = byKey.get("Demo.app/Iloc");
        const applications = byKey.get("Applications/Iloc");
        expect(demo?.type === "blob" ? iconAt(demo.value) : null).toEqual({ x: 160, y: 180 });
        expect(applications?.type === "blob" ? iconAt(applications.value) : null).toEqual({ x: 500, y: 180 });
        const icvp = byKey.get("./icvp");
        const icvpFile = join(work, "icvp.plist");
        writeFileSync(icvpFile, icvp?.type === "blob" ? icvp.value : new Uint8Array());
        const aliasBase64 = await execOrThrow(
          ["plutil", "-extract", "backgroundImageAlias", "raw", "-o", "-", icvpFile],
          { echo: false },
        );
        aliasVolumeDate = new DataView(Buffer.from(aliasBase64.stdout.trim(), "base64").buffer).getUint32(38);
        const finderInfo = (await execOrThrow(["xattr", "-px", "com.apple.FinderInfo", mount], { echo: false })).stdout;
        expect(finderInfo.replace(/\s/g, "").slice(16, 20)).toBe("0400");
        const flags = (await execOrThrow(["ls", "-lOa", mount], { echo: false })).stdout;
        for (const name of [".background", ".VolumeIcon.icns", ".DS_Store", ".fseventsd"])
          expect(flags.split("\n").find((line) => line.endsWith(` ${name}`))).toContain("hidden");
        expect(readFileSync(join(mount, ".fseventsd", "no_log"), "utf8")).toBe("");
      } finally {
        await exec(["hdiutil", "detach", mount, "-force"], { echo: false });
      }
      //? The alias must carry the volume header's creation date, or Finder takes another mounted volume of the name.
      const raw = join(work, "raw.dmg");
      await execOrThrow(["hdiutil", "convert", dmg, "-format", "UDRW", "-o", raw], { echo: false });
      expect(aliasVolumeDate).toBe(volumeHeaderCreateDate(new Uint8Array(readFileSync(raw))));
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }, 120_000);
});
