export type LiveSortableRow = { [key: string]: unknown };

export interface LivePlacementProps {
  list: LiveSortableRow[];
  row: LiveSortableRow;
  page: number;
  limit: number;
  /** Whether the list is pages `1..N` concatenated rather than one window. */
  cumulative: boolean;
  hasMore: boolean;
  sortKey: string;
  /** The sort keys the slice declared a subscriber may reproduce. */
  allowedSorts: string[];
  sorts: { [key: string]: { [path: string]: 1 | -1 } } | undefined;
}

// Null means refetch. Needs an allowlisted sort (JS and SQL order agree only on real columns), page 1 (a later
// page's boundary would shift unseen), and every sorted field on the row (a missing one sorts to an end).
export const livePlacementIndex = ({
  list,
  row,
  page,
  limit,
  cumulative,
  hasMore,
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
  if (index !== -1) return index;
  // Past the rows in hand: a full paged window is followed by the next page, a cumulative list by `hasMore` rows.
  if (cumulative) return hasMore ? null : list.length;
  return list.length < limit ? list.length : null;
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

// Dayjs dates go through `valueOf`: `<` on two objects compares their string forms.
const comparableOf = (value: unknown): number | string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  const valued: unknown = (value as { valueOf?: () => unknown }).valueOf?.();
  if (typeof valued === "number" || typeof valued === "string") return valued;
  return null;
};
