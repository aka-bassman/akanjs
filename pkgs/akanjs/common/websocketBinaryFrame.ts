export interface WebsocketBinaryFrame {
  roomId: string;
  payload: Uint8Array;
}

const MAGIC = 0xab;
const KIND_PUB = 0x01;
const HEADER_BYTES = 4;
const MAX_ROOM_BYTES = 0xffff;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Not the JSON envelope: `Buffer.toJSON()` spells bytes `{ type: "Buffer", data: number[] }` (3.6x, never restored).
export const websocketBinaryFrameContract = {
  encode: ({ roomId, payload }: WebsocketBinaryFrame): Uint8Array => {
    const room = encoder.encode(roomId);
    if (room.length > MAX_ROOM_BYTES) throw new Error(`Room id is too long to frame: ${roomId}`);
    const frame = new Uint8Array(HEADER_BYTES + room.length + payload.length);
    frame[0] = MAGIC;
    frame[1] = KIND_PUB;
    frame[2] = room.length >> 8;
    frame[3] = room.length & 0xff;
    frame.set(room, HEADER_BYTES);
    frame.set(payload, HEADER_BYTES + room.length);
    return frame;
  },
  decode: (data: ArrayBuffer | Uint8Array): WebsocketBinaryFrame | null => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < HEADER_BYTES || bytes[0] !== MAGIC || bytes[1] !== KIND_PUB) return null;
    const roomBytes = (bytes[2] << 8) | bytes[3];
    if (bytes.length < HEADER_BYTES + roomBytes) return null;
    return {
      roomId: decoder.decode(bytes.subarray(HEADER_BYTES, HEADER_BYTES + roomBytes)),
      payload: bytes.subarray(HEADER_BYTES + roomBytes),
    };
  },
} as const;
