import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import { isDayjs } from "./isDayjs";

dayjs.extend(customParseFormat);

export const isValidDate = (d: string | Date | Dayjs) => {
  if (typeof d === "string") return dayjs(d, "YYYY-MM-DD").isValid();
  if (isDayjs(d)) return d.isValid();
  return d instanceof Date && !Number.isNaN(d.getTime());
};
