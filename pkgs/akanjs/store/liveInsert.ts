/** A row as placement compares it: the sorted fields, plus the base fields every model carries. */
export type LiveSortableRow = { [key: string]: unknown };

export interface LivePlacementProps {
  /** The rows this window currently holds, in the order the server returned them. */
  list: LiveSortableRow[];
  row: LiveSortableRow;
  /** Which page of the list is on screen. Only the first can place a row. */
  page: number;
  limit: number;
  /** The sort key the window is ordered by. */
  sortKey: string;
  /** The sort keys the slice declared a subscriber may reproduce. */
  allowedSorts: string[];
  /** Every sort key the model has, by the fields it orders on. */
  sorts: { [key: string]: { [path: string]: 1 | -1 } } | undefined;
}

/**
 * Where a newly arrived row belongs in this window, or null when that cannot be known and the list has to refetch.
 *
 * Three things have to hold, and each guards a different way of being wrong.
 *
 * The sort key must be one the slice allowlisted, because the client compares values with JavaScript and the server
 * ordered them with SQL — those agree for a real column and need not agree for a field inside the document, where
 * SQLite and Postgres do not even agree with each other. The allowlist is the slice author saying which sorts are
 * safe to reproduce, rather than the framework claiming all of them are.
 *
 * The page must be the first, because a window's index is not the list's index anywhere else. Inserting on page
 * three moves that page's boundary by one and the row pushed off its end belongs to page four, which never learns
 * it moved — so the next page opened shows a duplicate.
 *
 * And every sorted field has to be on the row, because a comparison against a value that is not there silently
 * places the row at one end.
 */
export const livePlacementIndex = ({
  list,
  row,
  page,
  limit,
  sortKey,
  allowedSorts,
  sorts,
}: LivePlacementProps): number | null => {
  if (page !== 1) return null;
  if (!allowedSorts.includes(sortKey)) return null;
  const sort = sorts?.[sortKey];
  if (!sort || !Object.keys(sort).length) return null;
  const paths = Object.entries(sort);
  if (paths.some(([path]) => comparableOf(row[path]) === null)) return null;
  const index = list.findIndex((item) => compareRows(row, item, paths) < 0);
  // Past the end of a full window the row belongs to a later page, and dropping it there would be a row this
  // window claims to hold and does not.
  if (index === -1) return list.length < limit ? list.length : null;
  return index;
};

const compareRows = (left: LiveSortableRow, right: LiveSortableRow, paths: [string, 1 | -1][]): number => {
  for (const [path, direction] of paths) {
    const a = comparableOf(left[path]);
    const b = comparableOf(right[path]);
    if (a === null || b === null) continue;
    if (a === b) continue;
    return (a < b ? -1 : 1) * direction;
  }
  return 0;
};

/**
 * The value to order by, or null when the row does not carry one.
 *
 * A model's date fields arrive as `Dayjs` rather than as a primitive, so they have to be taken through `valueOf`
 * before a comparison means anything — `<` on two objects compares their string forms.
 */
const comparableOf = (value: unknown): number | string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  const valued: unknown = (value as { valueOf?: () => unknown }).valueOf?.();
  if (typeof valued === "number" || typeof valued === "string") return valued;
  return null;
};
