// A version 2 Alias Manager record, the reference a disk image's .DS_Store holds to its background picture (icvp
// `backgroundImageAlias`). Finder resolves it by volume name, creation date and catalog node id (CNID), and falls back
// to the paths in the tagged extras, so the image is found wherever the volume mounts. Layout as mac_alias (dmgbuild)
// and macos-alias (appdmg) write it: a 150-byte fixed part, then (tag, length, data) extras ending with tag -1.

export interface AliasTarget {
  /** The HFS+ volume name (the disk image's label). */
  volumeName: string;
  /**
   * The volume header's createDate as it stands, in HFS seconds. HFS+ writes it on the local clock of whatever formatted
   * the volume (TN1150), unlike every other date, so it is read off the image rather than computed here.
   */
  volumeCreated: number;
  /** Where the volume mounts: /Volumes/<name>. */
  volumePath: string;
  kind: "file" | "folder";
  name: string;
  cnid: number;
  created: Date;
  parentName: string;
  parentCnid: number;
  /** The CNIDs of the folders above the target, nearest first, the volume's root left out. */
  cnidPath: number[];
  /** From the volume's root, starting with "/". */
  posixPath: string;
}

/** Seconds since 1904-01-01 UTC, the HFS epoch. */
export function hfsTime(date: Date): number {
  return Math.max(0, Math.floor(date.getTime() / 1000) + 2_082_844_800) >>> 0;
}

const EJECTABLE_DISK = 5;

/** A Carbon name: ':' is the path separator there, so a name spells it '/'. */
function pascal(text: string, size: number): Uint8Array {
  const bytes = new TextEncoder().encode(text.replaceAll(":", "/")).subarray(0, size - 1);
  const out = new Uint8Array(size);
  out[0] = bytes.length;
  out.set(bytes, 1);
  return out;
}

function utf16WithLength(text: string): Uint8Array {
  const out = new Uint8Array(2 + text.length * 2);
  const view = new DataView(out.buffer);
  view.setUint16(0, text.length);
  for (let i = 0; i < text.length; i++) view.setUint16(2 + i * 2, text.charCodeAt(i));
  return out;
}

export function aliasRecord(target: AliasTarget): Uint8Array {
  const fixed = new Uint8Array(150);
  const view = new DataView(fixed.buffer);
  view.setUint16(6, 2);
  view.setUint16(8, target.kind === "folder" ? 1 : 0);
  fixed.set(pascal(target.volumeName, 28), 10);
  //? Finder finds the volume by name and this date; a date that misses matches any volume of that name instead, so with
  //? an older image of the app still mounted it reads the picture's CNID on the wrong disk.
  view.setUint32(38, target.volumeCreated);
  fixed.set(new TextEncoder().encode("H+"), 42);
  view.setUint16(44, EJECTABLE_DISK);
  view.setUint32(46, target.parentCnid);
  fixed.set(pascal(target.name, 64), 50);
  view.setUint32(114, target.cnid);
  view.setUint32(118, hfsTime(target.created));
  view.setInt16(130, -1);
  view.setInt16(132, -1);

  const encoder = new TextEncoder();
  const cnids = new Uint8Array(target.cnidPath.length * 4);
  for (const [idx, cnid] of target.cnidPath.entries()) new DataView(cnids.buffer).setUint32(idx * 4, cnid);
  const carbonPath = [target.volumeName, ...target.posixPath.split("/").filter(Boolean)]
    .map((part) => part.replaceAll(":", "/"))
    .join(":");
  const extras: [number, Uint8Array][] = [
    [0, encoder.encode(target.parentName.replaceAll(":", "/"))],
    [1, cnids],
    [2, encoder.encode(carbonPath)],
    [14, utf16WithLength(target.name)],
    [15, utf16WithLength(target.volumeName)],
    [18, encoder.encode(target.posixPath)],
    [19, encoder.encode(target.volumePath)],
  ];
  const parts: Uint8Array[] = [fixed];
  for (const [tag, data] of extras) {
    const head = new Uint8Array(4);
    new DataView(head.buffer).setInt16(0, tag);
    new DataView(head.buffer).setUint16(2, data.length);
    parts.push(head, data, ...(data.length % 2 ? [new Uint8Array(1)] : []));
  }
  const end = new Uint8Array(4);
  new DataView(end.buffer).setInt16(0, -1);
  parts.push(end);

  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const record = new Uint8Array(length);
  let at = 0;
  for (const part of parts) {
    record.set(part, at);
    at += part.length;
  }
  new DataView(record.buffer).setUint16(4, length);
  return record;
}
