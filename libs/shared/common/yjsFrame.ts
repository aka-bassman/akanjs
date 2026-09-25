/**
 * The one-byte tag every collaboration frame starts with, so one room and one guard carry both the document
 * and the cursors. Shared because the browser writes it and the server routes on it: a document update is
 * merged into the stored state, a presence frame is relayed and forgotten.
 */
export const YJS_DOC_FRAME = 0;
export const YJS_PRESENCE_FRAME = 1;

export const yjsFrameOf = (tag: number, payload: Uint8Array) => {
  const frame = new Uint8Array(payload.length + 1);
  frame[0] = tag;
  frame.set(payload, 1);
  return frame;
};
