import type { SerializedArg } from "akanjs/signal";

const isNullableArg = (arg: SerializedArg) => arg.nullable ?? arg.type === "search";

export const normalizeQueryArgs = (queryArgs: unknown[], args: SerializedArg[]) => {
  let length = Math.min(queryArgs.length, args.length);
  while (length > 0 && isNullableArg(args[length - 1]) && queryArgs[length - 1] == null) length--;
  return queryArgs.slice(0, length);
};

export const expandQueryArgs = (queryArgs: unknown[], args: SerializedArg[]) => args.map((_, idx) => queryArgs[idx]);
