// The disk image `build macos --installer` makes (desktop.dmg in config.ts): the app beside an Applications link,
// opened in a Finder window laid out for the drag, with the app's icon as the mounted disk's.
//
// No Finder and no AppleScript: those need a logged-in GUI session, which CI has not. The window is a .DS_Store
// written directly (dsStore.ts), its background found through an alias record (macAlias.ts) to the picture inside
// the image. A read-write image is laid out while mounted, then converted to the compressed read-only one; the
// caller signs, notarizes and staples that one, so nothing is written into the image after it is signed.

import {
  closeSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import type { DmgConfig } from "../config.ts";
import { Real, writeBplist } from "./bplist.ts";
import { type DsStoreRecord, writeDsStore } from "./dsStore.ts";
import { exec, execOrThrow } from "./exec.ts";
import { aliasRecord } from "./macAlias.ts";
import { PACKAGE_ROOT } from "./root.ts";

interface Point {
  x: number;
  y: number;
}

export interface ResolvedDmg {
  /** Absolute; null for a plain window. */
  background: { image: string; image2x?: string } | null;
  /** The window's size defaults to the background's. */
  window: { x: number; y: number; width?: number; height?: number };
  iconSize: number;
  textSize: number;
  app: Point;
  applications: Point;
}

const DEFAULT_BACKGROUND = {
  image: join(PACKAGE_ROOT, "native", "macos", "dmg", "background.png"),
  image2x: join(PACKAGE_ROOT, "native", "macos", "dmg", "background@2x.png"),
};
const DEFAULT_SIZE = { width: 660, height: 400 };
//? Finder's WindowBounds include the title bar: 28 pt through macOS 15, 32 on macOS 26, which cuts 4 pt off the bottom.
const TITLE_BAR = 28;
export const DMG_DEFAULTS = {
  window: { x: 200, y: 120 },
  iconSize: 128,
  textSize: 13,
  app: { x: 180, y: 170 },
  applications: { x: 480, y: 170 },
} as const;

const isNumber = (value: unknown, min = 0): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min;

export function validateDmg(dmg: DmgConfig | undefined, appDir: string, problems: string[]): ResolvedDmg {
  const raw: DmgConfig = dmg && typeof dmg === "object" ? dmg : {};
  if (dmg !== undefined && (!dmg || typeof dmg !== "object")) problems.push("desktop.dmg must be an object");
  const file = (key: "background" | "background2x", value: unknown): string | undefined => {
    if (value === undefined) return undefined;
    const path = typeof value === "string" && value ? resolve(appDir, value) : null;
    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      problems.push(`desktop.dmg.${key} must be an image file (got ${JSON.stringify(value)})`);
      return undefined;
    }
    return path;
  };
  if (raw.background !== undefined && raw.background !== false && typeof raw.background !== "string")
    problems.push(`desktop.dmg.background must be an image file or false (got ${JSON.stringify(raw.background)})`);
  const image = raw.background === false ? undefined : file("background", raw.background);
  const image2x = file("background2x", raw.background2x);
  if (raw.background2x !== undefined && typeof raw.background !== "string")
    problems.push("desktop.dmg.background2x needs desktop.dmg.background, the same picture at its size in points");
  const window = { ...DMG_DEFAULTS.window, ...(raw.window && typeof raw.window === "object" ? raw.window : {}) };
  for (const [key, value] of Object.entries(window))
    if (!isNumber(value, key === "width" || key === "height" ? 1 : 0))
      problems.push(`desktop.dmg.window.${key} must be a positive number of points (got ${JSON.stringify(value)})`);
  for (const key of ["iconSize", "textSize"] as const)
    if (raw[key] !== undefined && !isNumber(raw[key], 1))
      problems.push(`desktop.dmg.${key} must be a positive number of points (got ${JSON.stringify(raw[key])})`);
  const point = (key: "app" | "applications"): Point => {
    const value = raw[key];
    if (value === undefined) return DMG_DEFAULTS[key];
    if (!value || typeof value !== "object" || !isNumber(value.x) || !isNumber(value.y)) {
      problems.push(`desktop.dmg.${key} must be { x, y }, the icon's center in points (got ${JSON.stringify(value)})`);
      return DMG_DEFAULTS[key];
    }
    return { x: value.x, y: value.y };
  };
  return {
    background:
      raw.background === false
        ? null
        : raw.background === undefined
          ? DEFAULT_BACKGROUND
          : image
            ? { image, ...(image2x ? { image2x } : {}) }
            : null,
    window,
    iconSize: raw.iconSize ?? DMG_DEFAULTS.iconSize,
    textSize: raw.textSize ?? DMG_DEFAULTS.textSize,
    app: point("app"),
    applications: point("applications"),
  };
}

/** A PNG's size from its header, anything else's from sips. */
async function imageSize(path: string): Promise<{ width: number; height: number }> {
  const head = readFileSync(path).subarray(0, 24);
  if (head.length === 24 && head.readUInt32BE(0) === 0x89504e47)
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  const { stdout } = await execOrThrow(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], { echo: false });
  const width = Number(/pixelWidth: (\d+)/.exec(stdout)?.[1]);
  const height = Number(/pixelHeight: (\d+)/.exec(stdout)?.[1]);
  if (!width || !height) throw new Error(`cannot read the size of ${path}`);
  return { width, height };
}

/** The picture the image carries: a 1x and 2x pair as one multi-resolution TIFF, which Finder picks from per display. */
async function stageBackground(background: NonNullable<ResolvedDmg["background"]>, dir: string): Promise<string> {
  mkdirSync(dir, { recursive: true });
  if (background.image2x) {
    const out = join(dir, "background.tiff");
    await execOrThrow(["tiffutil", "-cathidpicheck", background.image, background.image2x, "-out", out], {
      echo: false,
    });
    return out;
  }
  const out = join(dir, `background${extname(background.image).toLowerCase() || ".png"}`);
  copyFileSync(background.image, out);
  return out;
}

export function dmgRecords(
  layout: ResolvedDmg,
  {
    appName,
    size,
    backgroundAlias,
  }: { appName: string; size: { width: number; height: number }; backgroundAlias?: Uint8Array },
): DsStoreRecord[] {
  const { x, y } = layout.window;
  const blob = (value: Uint8Array) => ({ type: "blob" as const, value });
  const iconAt = ({ x, y }: Point) => {
    const value = new Uint8Array(16);
    const view = new DataView(value.buffer);
    view.setUint32(0, Math.round(x));
    view.setUint32(4, Math.round(y));
    view.setUint32(8, 0xffffffff);
    view.setUint32(12, 0xffff0000);
    return blob(value);
  };
  const bwsp = writeBplist({
    WindowBounds: `{{${x}, ${y}}, {${size.width}, ${size.height + TITLE_BAR}}}`,
    ShowToolbar: false,
    ShowSidebar: false,
    ShowStatusBar: false,
    ShowPathbar: false,
    ShowTabView: false,
    ContainerShowSidebar: false,
    PreviewPaneVisibility: false,
    SidebarWidth: 0,
  });
  const icvp = writeBplist({
    viewOptionsVersion: 1,
    backgroundType: backgroundAlias ? 2 : 0,
    ...(backgroundAlias ? { backgroundImageAlias: backgroundAlias } : {}),
    backgroundColorRed: new Real(1),
    backgroundColorGreen: new Real(1),
    backgroundColorBlue: new Real(1),
    gridOffsetX: new Real(0),
    gridOffsetY: new Real(0),
    gridSpacing: new Real(100),
    arrangeBy: "none",
    showIconPreview: true,
    showItemInfo: false,
    labelOnBottom: true,
    textSize: new Real(layout.textSize),
    iconSize: new Real(layout.iconSize),
    scrollPositionX: new Real(0),
    scrollPositionY: new Real(0),
  });
  return [
    { name: ".", code: "bwsp", value: blob(bwsp) },
    { name: ".", code: "icvp", value: blob(icvp) },
    { name: ".", code: "icvl", value: { type: "type", value: "icnv" } },
    { name: ".", code: "vSrn", value: { type: "long", value: 1 } },
    { name: appName, code: "Iloc", value: iconAt(layout.app) },
    { name: "Applications", code: "Iloc", value: iconAt(layout.applications) },
  ];
}

//? FinderInfo of a folder: 16 bytes of FolderInfo whose flags (offset 8) carry kHasCustomIcon (0x0400), so Finder
//? shows the volume's .VolumeIcon.icns.
const CUSTOM_ICON_FINDER_INFO = `${"0".repeat(16)}0400${"0".repeat(44)}`;

async function detach(mountPoint: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    const result = await exec(["hdiutil", "detach", mountPoint, ...(attempt >= 3 ? ["-force"] : [])], { echo: false });
    if (result.code === 0) return;
    //? Spotlight or fseventsd may still hold the fresh volume for a moment.
    if (attempt >= 5)
      throw new Error(`hdiutil detach ${mountPoint} failed: ${(result.stderr || result.stdout).trim()}`);
    await Bun.sleep(1000 * (attempt + 1));
  }
}

export async function buildDmg(
  appPath: string,
  dmgPath: string,
  volumeName: string,
  workDir: string,
  { layout, volumeIcon }: { layout: ResolvedDmg; volumeIcon?: string },
): Promise<void> {
  const staging = join(workDir, "dmg");
  const writable = join(workDir, "dmg-rw.dmg");
  const mountPoint = join(workDir, "dmg-mount");
  rmSync(staging, { recursive: true, force: true });
  rmSync(writable, { force: true });
  mkdirSync(staging, { recursive: true });
  const appName = basename(appPath);
  await execOrThrow(["ditto", appPath, join(staging, appName)], { echo: false });
  symlinkSync("/Applications", join(staging, "Applications"));
  //? fseventsd writes its log into a volume as it unmounts, after anything here could delete it; no_log stops that.
  mkdirSync(join(staging, ".fseventsd"));
  writeFileSync(join(staging, ".fseventsd", "no_log"), "");
  const background = layout.background ? await stageBackground(layout.background, join(staging, ".background")) : null;
  if (volumeIcon && existsSync(volumeIcon)) copyFileSync(volumeIcon, join(staging, ".VolumeIcon.icns"));
  const size = {
    ...(layout.background ? await imageSize(layout.background.image) : DEFAULT_SIZE),
    ...(layout.window.width ? { width: layout.window.width } : {}),
    ...(layout.window.height ? { height: layout.window.height } : {}),
  };

  //? -srcfolder sizes the image to its content; the slack holds the .DS_Store written once it is mounted.
  const { stdout } = await execOrThrow(["du", "-sk", staging], { echo: false });
  const kilobytes = Number(stdout.trim().split(/\s+/)[0]) || 0;
  await execOrThrow(
    [
      "hdiutil",
      "create",
      "-volname",
      volumeName,
      "-srcfolder",
      staging,
      "-fs",
      "HFS+",
      "-format",
      "UDRW",
      "-size",
      `${Math.ceil(kilobytes * 1.1) + 10 * 1024}k`,
      "-ov",
      writable,
    ],
    { echo: false },
  );
  const volumeCreated = volumeHeaderCreateDate(writable);
  rmSync(mountPoint, { recursive: true, force: true });
  mkdirSync(mountPoint, { recursive: true });
  await execOrThrow(
    ["hdiutil", "attach", writable, "-readwrite", "-noverify", "-noautoopen", "-nobrowse", "-mountpoint", mountPoint],
    { echo: false },
  );
  try {
    const backgroundAlias = background
      ? aliasFor(mountPoint, { volumeName, volumeCreated }, join(".background", basename(background)))
      : undefined;
    const records = dmgRecords(layout, { appName, size, ...(backgroundAlias ? { backgroundAlias } : {}) });
    writeFileSync(join(mountPoint, ".DS_Store"), writeDsStore(records));
    const hidden = [".background", ".VolumeIcon.icns", ".DS_Store", ".fseventsd"].map((name) => join(mountPoint, name));
    await execOrThrow(["chflags", "hidden", ...hidden.filter((path) => existsSync(path))], { echo: false });
    if (existsSync(join(mountPoint, ".VolumeIcon.icns")))
      await execOrThrow(["xattr", "-wx", "com.apple.FinderInfo", CUSTOM_ICON_FINDER_INFO, mountPoint], { echo: false });
    rmSync(join(mountPoint, ".Trashes"), { recursive: true, force: true });
  } finally {
    await detach(mountPoint);
  }
  rmSync(dmgPath, { force: true });
  await execOrThrow(
    ["hdiutil", "convert", writable, "-format", "UDZO", "-imagekey", "zlib-level=9", "-ov", "-o", dmgPath],
    { echo: false },
  );
  rmSync(writable, { force: true });
  rmSync(staging, { recursive: true, force: true });
  rmSync(mountPoint, { recursive: true, force: true });
}

/**
 * The createDate of the HFS+ volume a read-write image holds: its header ("H+", version 4) sits 1024 bytes into the
 * partition, which `hdiutil create` puts within the image's first mebibyte, its data stored as is.
 */
export function volumeHeaderCreateDate(image: string): number {
  const head = new Uint8Array(1024 * 1024);
  const fd = openSync(image, "r");
  const length = (() => {
    try {
      return readSync(fd, head, 0, head.length, 0);
    } finally {
      closeSync(fd);
    }
  })();
  for (let offset = 1024; offset + 512 <= length; offset += 512)
    if (head[offset] === 0x48 && head[offset + 1] === 0x2b && head[offset + 2] === 0 && head[offset + 3] === 4)
      return new DataView(head.buffer, offset).getUint32(16);
  throw new Error(`no HFS+ volume header in the first MiB of ${image}`);
}

/** The background's alias as the mounted image names it, while it is mounted where it is being written. */
function aliasFor(
  mountPoint: string,
  { volumeName, volumeCreated }: { volumeName: string; volumeCreated: number },
  relative: string,
): Uint8Array {
  const target = join(mountPoint, relative);
  const parent = join(target, "..");
  const file = lstatSync(target);
  const folder = lstatSync(parent);
  return aliasRecord({
    volumeName,
    volumeCreated,
    volumePath: join("/Volumes", volumeName),
    kind: "file",
    name: basename(target),
    cnid: file.ino,
    created: file.birthtime,
    parentName: basename(parent),
    parentCnid: folder.ino,
    cnidPath: [folder.ino],
    posixPath: `/${relative}`,
  });
}
