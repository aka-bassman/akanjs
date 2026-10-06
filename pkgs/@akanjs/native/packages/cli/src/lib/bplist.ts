// Binary property list writer (bplist00), for the plists Finder keeps inside a .DS_Store (bwsp, icvp), one of which
// carries raw bytes (an alias record). Objects are written in order, then their offsets, then the 32-byte trailer.

/** A number written as a real even when it is whole: Finder reads `iconSize` and `textSize` as reals. */
export class Real {
  constructor(readonly value: number) {}
}

export type BplistValue = string | number | boolean | Uint8Array | Real | { [key: string]: BplistValue };

class DictNode {
  readonly keys: number[] = [];
  readonly values: number[] = [];
}
type Node = Exclude<BplistValue, { [key: string]: BplistValue }> | DictNode;

const sizeOf = (max: number) => (max < 2 ** 8 ? 1 : max < 2 ** 16 ? 2 : 4);

function uint(value: number, size: number): number[] {
  const out: number[] = [];
  for (let i = size - 1; i >= 0; i--) out.push(Math.floor(value / 2 ** (8 * i)) & 0xff);
  return out;
}

function float64(value: number): number[] {
  const data = new Uint8Array(8);
  new DataView(data.buffer).setFloat64(0, value);
  return [0x23, ...data];
}

function lengthMarker(kind: number, length: number): number[] {
  if (length < 15) return [kind | length];
  const size = length < 2 ** 8 ? 0 : length < 2 ** 16 ? 1 : 2;
  return [kind | 0x0f, 0x10 | size, ...uint(length, 2 ** size)];
}

function encode(node: Node, refSize: number): number[] {
  if (typeof node === "boolean") return [node ? 0x09 : 0x08];
  if (node instanceof Real) return float64(node.value);
  if (typeof node === "number") {
    if (!Number.isInteger(node)) return float64(node);
    if (node < 0) {
      const data = new Uint8Array(8);
      new DataView(data.buffer).setBigInt64(0, BigInt(node));
      return [0x13, ...data];
    }
    const size = node < 2 ** 8 ? 0 : node < 2 ** 16 ? 1 : node < 2 ** 32 ? 2 : 3;
    return [0x10 | size, ...uint(node, 2 ** size)];
  }
  if (typeof node === "string") {
    if ([...node].every((c) => c.charCodeAt(0) < 0x80))
      return [...lengthMarker(0x50, node.length), ...[...node].map((c) => c.charCodeAt(0))];
    const out = lengthMarker(0x60, node.length);
    for (let i = 0; i < node.length; i++) out.push(...uint(node.charCodeAt(i), 2));
    return out;
  }
  if (node instanceof Uint8Array) return [...lengthMarker(0x40, node.length), ...node];
  return [
    ...lengthMarker(0xd0, node.keys.length),
    ...[...node.keys, ...node.values].flatMap((ref) => uint(ref, refSize)),
  ];
}

export function writeBplist(root: { [key: string]: BplistValue }): Uint8Array {
  const nodes: Node[] = [];
  const add = (value: BplistValue): number => {
    const idx = nodes.length;
    if (typeof value !== "object" || value instanceof Uint8Array || value instanceof Real) {
      nodes.push(value);
      return idx;
    }
    const dict = new DictNode();
    nodes.push(dict);
    const entries = Object.entries(value);
    for (const [key] of entries) dict.keys.push(add(key));
    for (const [, item] of entries) dict.values.push(add(item));
    return idx;
  };
  add(root);
  const refSize = sizeOf(nodes.length);
  const bytes: number[] = [..."bplist00"].map((c) => c.charCodeAt(0));
  const offsets: number[] = [];
  for (const node of nodes) {
    offsets.push(bytes.length);
    bytes.push(...encode(node, refSize));
  }
  const tableOffset = bytes.length;
  const offsetSize = sizeOf(tableOffset);
  for (const offset of offsets) bytes.push(...uint(offset, offsetSize));
  bytes.push(0, 0, 0, 0, 0, 0, offsetSize, refSize, ...uint(nodes.length, 8), ...uint(0, 8), ...uint(tableOffset, 8));
  return Uint8Array.from(bytes);
}
