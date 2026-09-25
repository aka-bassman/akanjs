import {
  baseDocumentColumns,
  type DocumentQuery,
  DocumentQueryEvaluator,
  type DocumentRowView,
  documentQueryHelper,
  type QueryFieldMap,
} from "akanjs/document";

/** What happened to one document from one room's point of view — never the CRUD verb that caused it. */
export type LiveOp = "enter" | "update" | "leave";

export interface LiveEvent {
  op: LiveOp;
  id: string;
}

export interface LiveRoomTarget {
  roomId: string;
  op: LiveOp;
  /** An invalidation-only room says nothing about which document moved, so its subscribers refetch. */
  invalidate: boolean;
  payload: "light" | "id";
}

export interface LiveRoomRegistration {
  refName: string;
  roomId: string;
  query: DocumentQuery | undefined;
  fallback: "invalidate" | null;
  payload?: "light" | "id";
  fields?: QueryFieldMap;
}

interface LiveRoom {
  refName: string;
  roomId: string;
  query: DocumentQuery | undefined;
  invalidate: boolean;
  evaluator: DocumentQueryEvaluator;
  payload: "light" | "id";
  subscribers: number;
  /**
   * Top-level `<path> eq <value>` conditions this room's query requires, when it is a plain conjunction of them.
   * A change whose document disagrees with one of these cannot belong to this room, and cannot have belonged to it
   * before either, so the room is skipped without walking its tree at all.
   */
  index: Map<string, unknown> | null;
}

/**
 * Routes a document change to the rooms it belongs to.
 *
 * A room is one live subscription's resolved query, kept from the moment the socket subscribed. When a document
 * changes, the same query is evaluated against the version before the write and the version after it, and the pair
 * of answers is the event: appearing is `enter`, disappearing is `leave`, and staying is `update`. That is why the
 * CRUD verb never reaches a subscriber — an edit that moves a row out of a filter has to arrive as a removal from
 * that list, and a create that lands in one has to arrive as an insertion, which the verb alone cannot say.
 *
 * Every read wraps the caller's query in `removedAt` being empty (`SqlDocumentStore.findForRead`), and that wrapper
 * is added by the store rather than carried in the descriptor a slice returns. It is applied here for the same
 * reason: without it a soft delete still satisfies the query and would be routed as an ordinary update.
 */
export class LiveSyncHub {
  readonly #rooms = new Map<string, LiveRoom>();
  readonly #roomsByModel = new Map<string, Set<LiveRoom>>();

  get roomCount() {
    return this.#rooms.size;
  }

  roomCountOf(refName: string) {
    return this.#roomsByModel.get(refName)?.size ?? 0;
  }

  /** Idempotent: a second socket subscribing to the same room shares the one evaluation. */
  join({ refName, roomId, query, fallback, payload = "light", fields }: LiveRoomRegistration): LiveRoom {
    const existing = this.#rooms.get(roomId);
    if (existing) {
      existing.subscribers += 1;
      return existing;
    }
    const invalidate = fallback === "invalidate";
    if (!invalidate) {
      const reason = DocumentQueryEvaluator.unevaluableReason(query);
      if (reason)
        throw new Error(
          `Live slice "${roomId}" resolved to a query that cannot be routed in memory (${reason}). ` +
            `Declare .live({ fallback: "invalidate" }) on the slice to fall back to refetching.`,
        );
    }
    const room: LiveRoom = {
      refName,
      roomId,
      query,
      invalidate,
      evaluator: new DocumentQueryEvaluator(fields ?? {}),
      payload,
      subscribers: 1,
      index: invalidate ? null : LiveSyncHub.#indexOf(query, fields ?? {}),
    };
    this.#rooms.set(roomId, room);
    const forModel = this.#roomsByModel.get(refName) ?? new Set<LiveRoom>();
    forModel.add(room);
    this.#roomsByModel.set(refName, forModel);
    return room;
  }

  /** Every room this process currently holds, for a recovery that has to tell all of them to resynchronize. */
  roomIds(): string[] {
    return [...this.#rooms.keys()];
  }

  leave(roomId: string) {
    const room = this.#rooms.get(roomId);
    if (!room) return;
    room.subscribers -= 1;
    if (room.subscribers > 0) return;
    this.#rooms.delete(roomId);
    const forModel = this.#roomsByModel.get(room.refName);
    forModel?.delete(room);
    if (forModel && !forModel.size) this.#roomsByModel.delete(room.refName);
  }

  /**
   * Which rooms this change belongs to and how it reads in each.
   *
   * `previous` is absent on a create, which is the same thing as having belonged to no room before.
   */
  route(refName: string, next: Record<string, unknown>, previous?: Record<string, unknown>): LiveRoomTarget[] {
    const rooms = this.#roomsByModel.get(refName);
    if (!rooms?.size) return [];
    const nextRow = DocumentQueryEvaluator.rowViewOf(next);
    const previousRow = previous ? DocumentQueryEvaluator.rowViewOf(previous) : null;
    const targets: LiveRoomTarget[] = [];
    for (const room of rooms) {
      if (room.invalidate) {
        targets.push({ roomId: room.roomId, op: "update", invalidate: true, payload: room.payload });
        continue;
      }
      if (!LiveSyncHub.#mayMatch(room, nextRow) && !(previousRow && LiveSyncHub.#mayMatch(room, previousRow))) continue;
      const wrapped = documentQueryHelper.all(documentQueryHelper.empty("removedAt"), room.query ?? {});
      const inNext = room.evaluator.evaluate(wrapped, nextRow);
      const inPrevious = previousRow ? room.evaluator.evaluate(wrapped, previousRow) : false;
      if (!inNext && !inPrevious) continue;
      const op: LiveOp = inNext ? (inPrevious ? "update" : "enter") : "leave";
      targets.push({ roomId: room.roomId, op, invalidate: false, payload: room.payload });
    }
    return targets;
  }

  /** A cheap pre-filter: false only when the room's own equality conditions rule the document out outright. */
  static #mayMatch(room: LiveRoom, row: DocumentRowView): boolean {
    if (!room.index) return true;
    for (const [path, value] of room.index) {
      const actual = (row.doc as Record<string, unknown>)[path];
      if (actual !== value) return false;
    }
    return true;
  }

  /**
   * The top-level equality conditions of a query, when it is nothing but those.
   *
   * Most slices are `{ org: <id> }` or `{ org: <id>, status: "open" }`, so a write on a document belonging to one
   * organisation can skip every room belonging to another without evaluating anything. Anything less regular —
   * a nested group, an operator, a dotted path — indexes nothing and evaluates in full.
   *
   * Two shapes are excluded because the stored value is not the operand even though it looks like it is: a base
   * column, which the row holds encoded rather than as the caller wrote it, and an array field, where a bare value
   * means membership. Indexing either would skip a room that does match.
   */
  static #indexOf(query: DocumentQuery | undefined, fields: QueryFieldMap): Map<string, unknown> | null {
    if (!query || typeof query !== "object" || "kind" in query) return null;
    const index = new Map<string, unknown>();
    for (const [path, value] of Object.entries(query)) {
      if (path.includes(".") || baseDocumentColumns.has(path)) return null;
      if (value === null || typeof value === "object") return null;
      const field = fields[path];
      if ((field?.getProps?.() ?? field)?.isArray) return null;
      index.set(path, value);
    }
    return index.size ? index : null;
  }
}
