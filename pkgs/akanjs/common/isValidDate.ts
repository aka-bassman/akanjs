import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import { isDayjs } from "./isDayjs";

dayjs.extend(customParseFormat);

export const isValidDate = (d: string | Date | Dayjs) => {
  const format = "YYYY-MM-DD";
  if (typeof d === "string") {
    return dayjs(d, format).isValid();
  } else if (isDayjs(d)) return d.isValid();
  else return d instanceof Date && !Number.isNaN(d.getTime());
};
