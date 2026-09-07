import { getEnv } from "akanjs/base";
import { getAuthToken } from "akanjs/client";
import { decodeJwtPayload, deepObjectify, isDayjs, Logger } from "akanjs/common";
import { ConstantRegistry, immerify, stripSecrets } from "akanjs/constant";

const DRAFT_PREFIX = "akan.draft";
/** Deliberately not under `DRAFT_PREFIX`, so the sweep's own prefix walk never picks this bookkeeping key up. */
const IDENTITY_PREFIX = "akan.draft-identity";
const DRAFT_VERSION = 1;
const MAX_DRAFT_CHARS = 256_000;
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFTS_PER_IDENTITY = 30;

/**
 * The claims a re-issued token rewrites. Hashing them would rotate the identity on every silent refresh and
 * orphan the draft the user is still typing into.
 */
const VOLATILE_CLAIMS = ["iat", "exp", "nbf", "jti"] as const;

export interface DraftRecord {
  v: number;
  /** ISO. Drives both the "n minutes ago" label and the TTL/LRU sweep. */
  savedAt: string;
  /** The `updatedAt` the edited record carried when the draft was taken, or null for a new form. */
  baseUpdatedAt: string | null;
  form: Record<string, unknown>;
}

interface NewScopeInput {
  /** Only what the caller passed — never the result of merging it into `default<Model>`, whose date defaults rotate. */
  seed: object | undefined;
  modal: string;
  sliceName: string;
  routePath: string;
}

/**
 * Where a form draft lives and what identifies it.
 *
 * Every method that touches storage is async even though localStorage is not, so the backend can move to
 * IndexedDB — which a model with a large `visual` field will eventually force — without a caller changing.
 */
export class DraftStore {
  static #warnedKeys = new Set<string>();
  static #persistenceRequested = false;

  static #storage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      // Private browsing and "block site data" throw on the property itself, not on the call.
      return null;
    }
  }

  static #hash8(text: string): string {
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  /** Key-sorted JSON, so two objects that differ only in insertion order hash the same. */
  static #stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
    if (Array.isArray(value)) return `[${value.map((item) => DraftStore.#stableStringify(item)).join(",")}]`;
    const source = value as Record<string, unknown>;
    const entries = Object.keys(source)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${DraftStore.#stableStringify(source[key])}`);
    return `{${entries.join(",")}}`;
  }

  /**
   * A seed reduced to what actually names a context: primitive leaves and relation ids.
   *
   * Dates are dropped because a `default: () => dayjs()` in the seed would give the same form a different key on
   * every open, and a relation collapses to its id because the rest of the object is display data the caller may
   * or may not have hydrated.
   */
  static #canonicalSeed(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined || typeof value === "function") return undefined;
    if (value instanceof Date || isDayjs(value)) return undefined;
    if (Array.isArray(value))
      return value.map((item) => DraftStore.#canonicalSeed(item, depth + 1)).filter((item) => item !== undefined);
    if (typeof value !== "object") return value;
    const source = value as Record<string, unknown>;
    if (depth > 0 && typeof source.id === "string") return source.id;
    const entries = Object.keys(source)
      .sort()
      .map((key) => [key, DraftStore.#canonicalSeed(source[key], depth + 1)] as const)
      .filter(([, item]) => item !== undefined);
    return Object.fromEntries(entries);
  }

  /**
   * Who this browser is holding a draft for, derived from the auth token rather than from a domain field.
   *
   * `Account` guarantees `appName` and `environment` and nothing else — `userId` lives in the app's own `AddData`,
   * so naming it here would key the draft on a field that may not exist and silently share one scope between two
   * signed-in users. Hashing the whole payload picks up whatever the app did put there under whatever name.
   */
  static identity(): string {
    if (typeof window === "undefined") return "anon";
    const jwt = getAuthToken();
    if (!jwt) return "anon";
    try {
      const payload = decodeJwtPayload<Record<string, unknown>>(jwt);
      for (const claim of VOLATILE_CLAIMS) delete payload[claim];
      return DraftStore.#hash8(DraftStore.#stableStringify(payload));
    } catch {
      // An unparseable token is no worse than none: both mean "we cannot tell who this is".
      return "anon";
    }
  }

  static editScope(modelId: string): string {
    return `id:${modelId}`;
  }

  static newScope({ seed, modal, sliceName, routePath }: NewScopeInput): string {
    const canonical = DraftStore.#stableStringify(DraftStore.#canonicalSeed(seed ?? {}));
    return `new:${DraftStore.#hash8(`${canonical}|${modal}|${sliceName}|${routePath}`)}`;
  }

  static keyOf(refName: string, scope: string, identity: string = DraftStore.identity()): string {
    return `${DRAFT_PREFIX}.${getEnv().appName}.${identity}.${refName}.${scope}`;
  }

  static encodeForm(refName: string, form: object): Record<string, unknown> {
    const modelRef = ConstantRegistry.getDatabase(refName).full;
    const plain = deepObjectify(form, { serializable: true, convertDate: "string" }) as object;
    return stripSecrets(modelRef, plain) as Record<string, unknown>;
  }

  static decodeForm(refName: string, plain: Record<string, unknown>): object {
    const modelRef = ConstantRegistry.getDatabase(refName).full;
    return immerify(modelRef, new modelRef().set(plain) as object);
  }

  /** What the dirty check compares. Cheap enough to take once per debounce window, not once per keystroke. */
  static formHash(refName: string, form: object): string {
    return DraftStore.#hash8(DraftStore.#stableStringify(DraftStore.encodeForm(refName, form)));
  }

  static async read(key: string): Promise<DraftRecord | null> {
    const storage = DraftStore.#storage();
    if (!storage) return null;
    let raw: string | null = null;
    try {
      raw = storage.getItem(key);
    } catch {
      // Reading can throw where writing did not; treat it as no draft.
      return null;
    }
    if (!raw) return null;
    try {
      const record = JSON.parse(raw) as DraftRecord;
      if (record.v !== DRAFT_VERSION || !record.form) {
        await DraftStore.remove(key);
        return null;
      }
      return record;
    } catch {
      // A draft that cannot be parsed is gone; leaving it behind only fails again on every open.
      await DraftStore.remove(key);
      return null;
    }
  }

  static async write(key: string, record: DraftRecord): Promise<void> {
    const storage = DraftStore.#storage();
    if (!storage) return;
    const raw = JSON.stringify(record);
    if (raw.length > MAX_DRAFT_CHARS) {
      DraftStore.#warnOnce(key, `Form draft not saved: ${raw.length} chars is over the ${MAX_DRAFT_CHARS} cap`);
      return;
    }
    try {
      storage.setItem(key, raw);
      DraftStore.#requestPersistence();
      return;
    } catch {
      // Quota. This feature is entitled to reclaim its own oldest draft and nothing else on the origin.
    }
    if (!(await DraftStore.#evictOldest(key))) return;
    try {
      storage.setItem(key, raw);
    } catch {
      DraftStore.#warnOnce(key, "Form draft not saved: storage quota is exhausted");
    }
  }

  static async remove(key: string): Promise<void> {
    const storage = DraftStore.#storage();
    if (!storage) return;
    try {
      storage.removeItem(key);
    } catch {
      // Nothing to do: the draft is unreachable either way.
    }
  }

  /** Every draft held for one identity. Called on sign-out, so a shared device leaves nothing for the next user. */
  static async removeIdentity(identity: string = DraftStore.identity()): Promise<void> {
    const prefix = `${DRAFT_PREFIX}.${getEnv().appName}.${identity}.`;
    for (const key of DraftStore.#keysUnder(prefix)) await DraftStore.remove(key);
  }

  static async sweep(): Promise<void> {
    const storage = DraftStore.#storage();
    if (!storage) return;
    const appPrefix = `${DRAFT_PREFIX}.${getEnv().appName}.`;
    const now = Date.now();
    const byIdentity = new Map<string, { key: string; savedAt: number }[]>();
    for (const key of DraftStore.#keysUnder(appPrefix)) {
      const savedAt = DraftStore.#savedAtOf(storage, key);
      if (savedAt === null || now - savedAt > DRAFT_TTL_MS) {
        await DraftStore.remove(key);
        continue;
      }
      const identity = key.slice(appPrefix.length).split(".")[0] ?? "anon";
      const bucket = byIdentity.get(identity) ?? [];
      bucket.push({ key, savedAt });
      byIdentity.set(identity, bucket);
    }
    for (const bucket of byIdentity.values()) {
      if (bucket.length <= MAX_DRAFTS_PER_IDENTITY) continue;
      bucket.sort((a, b) => a.savedAt - b.savedAt);
      for (const entry of bucket.slice(0, bucket.length - MAX_DRAFTS_PER_IDENTITY)) await DraftStore.remove(entry.key);
    }
  }

  /**
   * Clears what a previous user left on this device, on noticing that the signed-in user changed.
   *
   * Called at boot and whenever a form arms a draft, which covers both a reload and a sign-out followed by a
   * sign-in inside the same page session. The gap is a sign-out with no sign-in and no reload after it: those
   * drafts sit under a key the next user's identity cannot address, and the TTL sweep takes them.
   *
   * A sign-out on its own reads as `anon`, and `anon` is never wiped — nothing distinguishes two anonymous
   * users, so there is no previous one to clear.
   */
  static async reconcileIdentity(): Promise<void> {
    const storage = DraftStore.#storage();
    if (!storage) return;
    const key = `${IDENTITY_PREFIX}.${getEnv().appName}`;
    const current = DraftStore.identity();
    let last: string | null = null;
    try {
      last = storage.getItem(key);
      if (last === current) return;
      storage.setItem(key, current);
    } catch {
      // Without the bookkeeping key there is nothing to compare, so there is nothing to reconcile.
      return;
    }
    if (last && last !== "anon") await DraftStore.removeIdentity(last);
  }

  /**
   * Asks the browser to stop counting this origin as evictable.
   *
   * A WKWebView drops "best effort" storage under pressure, which is exactly the moment a user's unsaved work
   * would disappear. Requested once, after a write has actually succeeded — asking before there is anything to
   * protect can surface a permission prompt for nothing.
   */
  static #requestPersistence() {
    if (DraftStore.#persistenceRequested) return;
    DraftStore.#persistenceRequested = true;
    try {
      void navigator.storage?.persist?.().catch(() => undefined);
    } catch {
      // Neither webview guarantees the API; a draft that can be evicted is still better than no draft.
    }
  }

  static #warnOnce(key: string, message: string) {
    if (DraftStore.#warnedKeys.has(key)) return;
    DraftStore.#warnedKeys.add(key);
    Logger.warn(message);
  }

  static #keysUnder(prefix: string): string[] {
    const storage = DraftStore.#storage();
    if (!storage) return [];
    const keys: string[] = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(prefix)) keys.push(key);
      }
    } catch {
      // Enumeration can throw mid-walk; whatever was collected is still safe to act on.
    }
    return keys;
  }

  static #savedAtOf(storage: Storage, key: string): number | null {
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const time = new Date((JSON.parse(raw) as DraftRecord).savedAt).getTime();
      return Number.isNaN(time) ? null : time;
    } catch {
      // Unreadable means unrestorable, and the caller treats null as expired.
      return null;
    }
  }

  static async #evictOldest(exceptKey: string): Promise<boolean> {
    const storage = DraftStore.#storage();
    if (!storage) return false;
    const appPrefix = `${DRAFT_PREFIX}.${getEnv().appName}.`;
    let oldest: { key: string; savedAt: number } | null = null;
    for (const key of DraftStore.#keysUnder(appPrefix)) {
      if (key === exceptKey) continue;
      const savedAt = DraftStore.#savedAtOf(storage, key) ?? 0;
      if (!oldest || savedAt < oldest.savedAt) oldest = { key, savedAt };
    }
    if (!oldest) return false;
    await DraftStore.remove(oldest.key);
    return true;
  }
}
