import { type Environment, getEnv, type SLICE_META } from "akanjs/base";
import type { DatabaseSignal } from "akanjs/signal";
import type { SliceMeta } from "./fetchType/appliedReturn.type";

/** Account data made available to services for the current app/environment. */
export type Account<AddData = unknown> = {
  appName: string;
  environment: Environment;
} & AddData;
export const getDefaultAccount = (): Account => {
  const env = getEnv();
  return { appName: env.appName, environment: env.environment };
};

type GetSliceNameFromSignal<Signal> = Signal extends DatabaseSignal
  ? `${Signal["slice"]["baseName"]}${Capitalize<keyof Signal["slice"][typeof SLICE_META] & string>}`
  : Signal extends { slice: { [K in infer Key]: SliceMeta } }
    ? Key
    : never;
type GetSliceNamesFromSignals<Signals extends readonly unknown[]> = GetSliceNameFromSignal<Signals[number]>;
export type GetSliceMetaObjFromDatabaseSignals<Signals extends readonly unknown[]> = {
  [K in GetSliceNamesFromSignals<Signals>]: SliceMeta;
};
