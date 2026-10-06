// .DS_Store writer: the file Finder keeps a folder's view settings in, written without Finder so a disk image is
// laid out where no one is logged in (CI). The format is the one ds_store (dmgbuild) reads and writes:
//
//   00000001 'Bud1' header, then a buddy allocator over 2^31 bytes (offsets are relative to byte 4):
//     block 0  the allocator's own block: block addresses (offset | log2 size, padded to 256 of them), a table of
//              contents naming block 1 "DSDB", and one free list per power of two
//     block 1  the DSDB header: root node, levels, records, nodes, page size
//     block 2  one leaf node holding every record, sorted by file name (case-insensitive), then code
//
// A record is the file name (UTF-16BE, length in code units), a four-letter code, a type and its value. Only one
// leaf is written: a disk image's window holds a handful of records, far from a 4 KiB page.

export type DsStoreValue =
  | { type: "long"; value: number }
  | { type: "bool"; value: boolean }
  | { type: "type"; value: string }
  | { type: "blob"; value: Uint8Array }
  | { type: "ustr"; value: string };

export interface DsStoreRecord {
  /** The file the record is about, "." for the folder itself. */
  name: string;
  /** Four letters: Iloc (icon location), bwsp (window), icvp (icon view), vSrn, icvl … */
  code: string;
  value: DsStoreValue;
}

const PAGE_SIZE = 4096;

class Writer {
  #chunks: Uint8Array[] = [];
  length = 0;
  bytes(data: Uint8Array): this {
    this.#chunks.push(data);
    this.length += data.length;
    return this;
  }
  u8(value: number): this {
    return this.bytes(Uint8Array.of(value));
  }
  u32(value: number): this {
    const data = new Uint8Array(4);
    new DataView(data.buffer).setUint32(0, value >>> 0);
    return this.bytes(data);
  }
  fourCC(code: string): this {
    if (!/^[\x20-\x7e]{4}$/.test(code)) throw new Error(`not a four-letter code: ${JSON.stringify(code)}`);
    return this.bytes(new TextEncoder().encode(code));
  }
  utf16(text: string): this {
    const data = new Uint8Array(text.length * 2);
    const view = new DataView(data.buffer);
    for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i));
    return this.bytes(data);
  }
  toBytes(): Uint8Array {
    const out = new Uint8Array(this.length);
    let at = 0;
    for (const chunk of this.#chunks) {
      out.set(chunk, at);
      at += chunk.length;
    }
    return out;
  }
}

/** Finder compares names as HFS+ does, case-insensitively; a window's few ASCII names need nothing more. */
function compareRecords(a: DsStoreRecord, b: DsStoreRecord): number {
  const left = a.name.toLowerCase();
  const right = b.name.toLowerCase();
  if (left !== right) return left < right ? -1 : 1;
  return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
}

function writeRecord(out: Writer, { name, code, value }: DsStoreRecord): void {
  out.u32(name.length).utf16(name).fourCC(code).fourCC(value.type);
  if (value.type === "long") out.u32(value.value);
  else if (value.type === "bool") out.u8(value.value ? 1 : 0);
  else if (value.type === "type") out.fourCC(value.value);
  else if (value.type === "blob") out.u32(value.value.length).bytes(value.value);
  else out.u32(value.value.length).utf16(value.value);
}

/** The buddy allocator's free lists after the given allocations, each address a power-of-two block. */
class Buddy {
  readonly free: number[][] = Array.from({ length: 32 }, () => []);
  constructor() {
    this.free[31]?.push(0);
  }
  allocate(size: number): { offset: number; width: number } {
    const width = Math.max(5, Math.ceil(Math.log2(size)));
    let w = width;
    while (w < 32 && !this.free[w]?.length) w++;
    const offset = this.free[w]?.shift();
    if (offset === undefined) throw new Error(`no free block of ${size} bytes`);
    while (w > width) {
      w--;
      this.free[w]?.push(offset + 2 ** w);
      this.free[w]?.sort((a, b) => a - b);
    }
    return { offset, width };
  }
}

export function writeDsStore(records: DsStoreRecord[]): Uint8Array {
  const sorted = [...records].sort(compareRecords);
  const leaf = new Writer().u32(0).u32(sorted.length);
  for (const record of sorted) writeRecord(leaf, record);
  if (leaf.length > PAGE_SIZE)
    throw new Error(
      `${sorted.length} .DS_Store records need ${leaf.length} bytes, more than one ${PAGE_SIZE}-byte node`,
    );

  const buddy = new Buddy();
  buddy.allocate(32); // the file header, which no block address names
  const root = buddy.allocate(2048);
  const header = buddy.allocate(32);
  const node = buddy.allocate(PAGE_SIZE);
  const address = ({ offset, width }: { offset: number; width: number }) => offset | width;

  const dsdb = new Writer().u32(2).u32(0).u32(sorted.length).u32(1).u32(PAGE_SIZE);
  const blocks = [root, header, node];
  const allocator = new Writer().u32(blocks.length).u32(0);
  for (const block of blocks) allocator.u32(address(block));
  for (let i = blocks.length; i < 256; i++) allocator.u32(0);
  allocator.u32(1).u8(4).fourCC("DSDB").u32(1);
  for (const list of buddy.free) {
    allocator.u32(list.length);
    for (const offset of list) allocator.u32(offset);
  }
  if (allocator.length > 2 ** root.width) throw new Error(".DS_Store allocator block overflows");

  const end = Math.max(...blocks.map(({ offset, width }) => offset + 2 ** width));
  const file = new Uint8Array(4 + end);
  const view = new DataView(file.buffer);
  view.setUint32(0, 1);
  file.set(new TextEncoder().encode("Bud1"), 4);
  view.setUint32(8, root.offset);
  view.setUint32(12, 2 ** root.width);
  view.setUint32(16, root.offset);
  file.set(allocator.toBytes(), 4 + root.offset);
  file.set(dsdb.toBytes(), 4 + header.offset);
  file.set(leaf.toBytes(), 4 + node.offset);
  return file;
}

/** Reads back what writeDsStore wrote (one leaf): the tests' check, and a way to look at a .DS_Store. */
export function readDsStore(file: Uint8Array): DsStoreRecord[] {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  if (view.getUint32(0) !== 1 || new TextDecoder().decode(file.subarray(4, 8)) !== "Bud1")
    throw new Error("not a .DS_Store");
  const rootOffset = view.getUint32(8);
  const blockAt = (index: number) => {
    const raw = view.getUint32(4 + rootOffset + 8 + index * 4);
    return 4 + (raw & ~0x1f);
  };
  const dsdb = blockAt(1);
  const leafIndex = view.getUint32(dsdb);
  let at = blockAt(leafIndex);
  if (view.getUint32(at) !== 0) throw new Error("only a single-leaf .DS_Store is read");
  const count = view.getUint32(at + 4);
  at += 8;
  const fourCC = () => {
    const code = new TextDecoder().decode(file.subarray(at, at + 4));
    at += 4;
    return code;
  };
  const utf16 = (units: number) => {
    let text = "";
    for (let i = 0; i < units; i++) text += String.fromCharCode(view.getUint16(at + i * 2));
    at += units * 2;
    return text;
  };
  const records: DsStoreRecord[] = [];
  for (let i = 0; i < count; i++) {
    const nameLength = view.getUint32(at);
    at += 4;
    const name = utf16(nameLength);
    const code = fourCC();
    const type = fourCC();
    let value: DsStoreValue;
    if (type === "long") {
      value = { type, value: view.getUint32(at) };
      at += 4;
    } else if (type === "bool") {
      value = { type, value: file[at] === 1 };
      at += 1;
    } else if (type === "type") value = { type, value: fourCC() };
    else if (type === "blob") {
      const length = view.getUint32(at);
      value = { type, value: file.slice(at + 4, at + 4 + length) };
      at += 4 + length;
    } else if (type === "ustr") {
      const length = view.getUint32(at);
      at += 4;
      value = { type, value: utf16(length) };
    } else throw new Error(`unsupported .DS_Store type ${type}`);
    records.push({ name, code, value });
  }
  return records;
}
