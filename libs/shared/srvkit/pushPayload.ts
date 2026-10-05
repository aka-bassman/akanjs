import type * as cnst from "../lib/cnst";

export interface PushPayload {
  title: string;
  content?: string;
  /**
   * A dictionary key for the body, for a caller that ships no copy of its own — a shared library cannot hold a
   * Korean string, and translations belong in the owning module's dictionary. Resolved in the app's default
   * locale: a person carries no locale of their own yet.
   */
  contentKey?: string;
  level: cnst.NotiLevel["value"];
  url?: string;
  // Collapse key — a second notification about the same conversation replaces the first instead of stacking.
  tag?: string;
  imageUrl?: string;
  badge?: number;
}

export interface PushOutcome {
  targetUserIds: string[];
  tokenNum: number;
  successCount: number;
  prunedTokens: string[];
}
