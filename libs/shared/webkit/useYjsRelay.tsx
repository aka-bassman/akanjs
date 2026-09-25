"use client";
import { YJS_DOC_FRAME, YJS_PRESENCE_FRAME, yjsFrameOf } from "@libs/shared/common";
import { useEffect, useMemo, useState } from "react";
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector, type Transaction } from "yjs";

/** How the page's own endpoints reach the relay. Kept as props so this hook belongs to no one model. */
export interface YjsRelayTransport {
  join: (id: string) => Promise<{ state: string; seed: boolean }>;
  push: (id: string, frame: Uint8Array) => void;
  subscribe: (id: string, onFrame: (frame: Uint8Array) => void) => () => void;
}

interface UserState {
  [key: string]: unknown;
}

type ProviderAwareness = {
  getLocalState: () => UserState | null;
  getStates: () => Map<number, UserState>;
  off: (type: "update", cb: () => void) => void;
  on: (type: "update", cb: () => void) => void;
  setLocalState: (state: UserState | null) => void;
  setLocalStateField: (field: string, value: unknown) => void;
};

/** A frame this client sent comes back from its own room; yjs is idempotent but the bandwidth is not free. */
const REMOTE_ORIGIN = "akan-relay";
/** Updates are batched because every message frame re-runs the endpoint's guards. */
const UPDATE_BATCH_MS = 200;
const AWARENESS_HEARTBEAT_MS = 10_000;
/** A peer that has not spoken for this long is gone: a closed tab sends no goodbye a browser can rely on. */
const AWARENESS_TIMEOUT_MS = 30_000;

const decodeBase64 = (state: string) => {
  const binary = atob(state);
  const bytes = new Uint8Array(binary.length);
  for (let idx = 0; idx < binary.length; idx += 1) bytes[idx] = binary.charCodeAt(idx);
  return bytes;
};

/**
 * A `@lexical/yjs` provider over an akan websocket room.
 *
 * The interface a Lexical collaboration provider has to satisfy is small — connect/disconnect, four event
 * kinds, and six awareness methods — and akan's own socket already carries the guards, the Redis fan-out
 * across replicas, and the resubscribe on reconnect. Running `y-websocket` beside it would mean a second
 * port, a second deployment and a second implementation of who may edit this page.
 *
 * Awareness is JSON rather than the `y-protocols` encoding: both ends of this wire are this class, and the
 * saving does not pay for another dependency. Presence expires on a timeout, since a closed tab has no
 * reliable way to say goodbye.
 */
class RelayProvider {
  readonly awareness: ProviderAwareness;
  readonly #doc: Doc;
  readonly #id: string;
  readonly #transport: YjsRelayTransport;
  readonly #initialState: string;
  readonly #handlers = new Map<string, Set<(payload: never) => void>>();
  readonly #awarenessHandlers = new Set<() => void>();
  readonly #states = new Map<number, UserState>();
  readonly #seenAt = new Map<number, number>();
  #localState: UserState | null = null;
  #pending: Uint8Array[] = [];
  #batchTimer: ReturnType<typeof setTimeout> | null = null;
  #heartbeat: ReturnType<typeof setInterval> | null = null;
  #unsubscribe: (() => void) | null = null;
  #connected = false;

  constructor(doc: Doc, id: string, transport: YjsRelayTransport, initialState: string) {
    this.#doc = doc;
    this.#id = id;
    this.#transport = transport;
    this.#initialState = initialState;
    this.awareness = {
      getLocalState: () => this.#localState,
      getStates: () => new Map(this.#states),
      on: (_type, cb) => this.#awarenessHandlers.add(cb),
      off: (_type, cb) => this.#awarenessHandlers.delete(cb),
      setLocalState: (state) => {
        this.#localState = state;
        this.#publishAwareness();
      },
      setLocalStateField: (field, value) => {
        this.#localState = { ...(this.#localState ?? {}), [field]: value };
        this.#publishAwareness();
      },
    };
  }

  on(type: string, cb: (payload: never) => void) {
    const handlers = this.#handlers.get(type) ?? new Set();
    handlers.add(cb);
    this.#handlers.set(type, handlers);
  }

  off(type: string, cb: (payload: never) => void) {
    this.#handlers.get(type)?.delete(cb);
  }

  connect() {
    if (this.#connected) return;
    this.#connected = true;
    this.#unsubscribe = this.#transport.subscribe(this.#id, (frame) => {
      this.#receive(frame);
    });
    this.#doc.on("update", this.#onLocalUpdate);
    // Apply what the server holds before announcing the sync: `CollaborationPlugin` bootstraps only when
    // the root is still empty at that moment, so a document with stored state skips it on its own.
    if (this.#initialState) applyUpdate(this.#doc, decodeBase64(this.#initialState), REMOTE_ORIGIN);
    this.#emit("status", { status: "connected" });
    this.#emit("sync", true);
    this.#heartbeat = setInterval(() => {
      this.#expirePeers();
      if (this.#localState) this.#publishAwareness();
      // The whole state, not a delta: a flush that lost a race is repaired by the next one of these.
      this.#send(yjsFrameOf(YJS_DOC_FRAME, encodeStateAsUpdate(this.#doc)));
    }, AWARENESS_HEARTBEAT_MS);
  }

  get clientId() {
    return this.#doc.clientID;
  }

  peerIds() {
    return [...this.#states.keys()];
  }

  disconnect() {
    if (!this.#connected) return;
    this.#flush();
    // The whole state on the way out: a flush that lost a read-modify-write race is repaired by this,
    // and the last editor leaving is exactly when an unrepaired one would be lost for good.
    this.#send(yjsFrameOf(YJS_DOC_FRAME, encodeStateAsUpdate(this.#doc)));
    this.#connected = false;
    this.#localState = null;
    this.#publishAwareness();
    this.#doc.off("update", this.#onLocalUpdate);
    if (this.#heartbeat) clearInterval(this.#heartbeat);
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#emit("status", { status: "disconnected" });
  }

  /** The state vector of everything this client holds, so a leaving editor can hand over a full snapshot. */
  snapshot() {
    return encodeStateAsUpdate(this.#doc, encodeStateVector(new Doc()));
  }

  #onLocalUpdate = (update: Uint8Array, origin: unknown, _doc: Doc, _transaction: Transaction) => {
    if (origin === REMOTE_ORIGIN) return;
    this.#pending.push(update);
    if (this.#batchTimer) return;
    this.#batchTimer = setTimeout(() => {
      this.#flush();
    }, UPDATE_BATCH_MS);
  };

  #flush() {
    if (this.#batchTimer) clearTimeout(this.#batchTimer);
    this.#batchTimer = null;
    if (!this.#pending.length) return;
    const pending = this.#pending;
    this.#pending = [];
    for (const update of pending) this.#send(yjsFrameOf(YJS_DOC_FRAME, update));
  }

  #send(frame: Uint8Array) {
    if (!this.#connected) return;
    this.#transport.push(this.#id, frame);
  }

  #receive(frame: Uint8Array) {
    if (!frame.length) return;
    const payload = frame.subarray(1);
    if (frame[0] === YJS_DOC_FRAME) {
      // REMOTE_ORIGIN keeps this out of #onLocalUpdate, so a received frame is never echoed back upstream.
      applyUpdate(this.#doc, payload, REMOTE_ORIGIN);
      this.#emit("update", payload);
      return;
    }
    if (frame[0] !== YJS_PRESENCE_FRAME) return;
    this.#receiveAwareness(payload);
  }

  #receiveAwareness(payload: Uint8Array) {
    let parsed: { clientId?: number; state?: UserState | null };
    try {
      parsed = JSON.parse(new TextDecoder().decode(payload)) as typeof parsed;
    } catch {
      return;
    }
    const clientId = parsed.clientId;
    if (typeof clientId !== "number" || clientId === this.#doc.clientID) return;
    if (parsed.state) {
      this.#states.set(clientId, parsed.state);
      this.#seenAt.set(clientId, Date.now());
    } else {
      this.#states.delete(clientId);
      this.#seenAt.delete(clientId);
    }
    this.#notifyAwareness();
  }

  #publishAwareness() {
    const payload = new TextEncoder().encode(JSON.stringify({ clientId: this.#doc.clientID, state: this.#localState }));
    this.#send(yjsFrameOf(YJS_PRESENCE_FRAME, payload));
    this.#notifyAwareness();
  }

  #expirePeers() {
    const cutoff = Date.now() - AWARENESS_TIMEOUT_MS;
    let dropped = false;
    for (const [clientId, seenAt] of this.#seenAt) {
      if (seenAt >= cutoff) continue;
      this.#seenAt.delete(clientId);
      this.#states.delete(clientId);
      dropped = true;
    }
    if (dropped) this.#notifyAwareness();
  }

  #notifyAwareness() {
    for (const handler of this.#awarenessHandlers) handler();
  }

  #emit(type: string, payload: unknown) {
    for (const handler of this.#handlers.get(type) ?? []) (handler as (value: unknown) => void)(payload);
  }
}

export interface YjsRelay {
  ready: boolean;
  /** The join did not come back. The caller should fall back to a plain editor rather than show nothing. */
  failed: boolean;
  seed: boolean;
  /**
   * Whether this client is the one that writes the document back as plain content.
   *
   * Every editor's `onChange` fires for remote edits too, so without a lease N editors would each save the
   * same body N times. The lowest yjs client id holds it — the standard convention, and one that needs no
   * server: when that client leaves, the next lowest takes over on its own.
   */
  isLeader: boolean;
  /** Typed as `never` to match `EditorCollab`: `@lexical/yjs`'s `Provider` is not exported as a value. */
  providerFactory: (id: string, docMap: Map<string, Doc>) => never;
  /** Peers currently on this document, by their yjs client id. */
  peers: UserState[];
  /**
   * The shared document, once `CollaborationPlugin` has asked for a provider.
   *
   * A caller that keeps a field outside the editor body — a title, an icon — puts it in a sibling type here
   * instead of round-tripping through the server: the relay already carries the whole document, so the field
   * merges with the same rules as the body and needs no debounce.
   */
  doc: Doc | null;
}

/**
 * Joins a document's relay room and hands back what `CollaborationPlugin` needs.
 *
 * `seed` has to be known before the plugin mounts — it decides `shouldBootstrap`, and exactly one client
 * per document may say yes — so the join happens here rather than inside the provider's `connect`.
 */
export const useYjsRelay = (id: string, transport: YjsRelayTransport, enabled = true): YjsRelay => {
  const [joined, setJoined] = useState<{ id: string; state: string; seed: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  const [peers, setPeers] = useState<UserState[]>([]);
  const [isLeader, setIsLeader] = useState(true);
  const [doc, setDoc] = useState<Doc | null>(null);

  useEffect(() => {
    if (!enabled || !id) return;
    let cancelled = false;
    void (async () => {
      try {
        const { state, seed } = await transport.join(id);
        if (!cancelled) setJoined({ id, state, seed });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      setJoined(null);
      setFailed(false);
    };
  }, [id, enabled]);

  const providerFactory = useMemo(() => {
    return (docId: string, docMap: Map<string, Doc>) => {
      const sharedDoc = docMap.get(docId) ?? new Doc();
      docMap.set(docId, sharedDoc);
      setDoc(sharedDoc);
      const provider = new RelayProvider(sharedDoc, docId, transport, joined?.id === docId ? joined.state : "");
      provider.awareness.on("update", () => {
        setPeers([...provider.awareness.getStates().values()]);
        setIsLeader(provider.peerIds().every((peerId) => provider.clientId < peerId));
      });
      return provider as unknown as never;
    };
  }, [joined?.id, joined?.state]);

  return {
    ready: !!joined && joined.id === id,
    failed,
    seed: joined?.seed ?? false,
    isLeader,
    providerFactory,
    peers,
    doc,
  };
};
