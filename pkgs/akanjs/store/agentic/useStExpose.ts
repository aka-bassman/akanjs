import type { MaskModel } from "akanjs/constant";
import { useAgentResource } from "use-agentic";
import { readableValue } from "./readableValue";

export interface StExposeMeta {
  desc?: string;
  mask?: MaskModel;
  serialize?: (value: unknown) => unknown;
  report?: boolean;
}

export const useStExpose = (name: string | null, value: unknown, meta: StExposeMeta = {}): void => {
  useAgentResource(name, value, {
    description: meta.desc,
    report: meta.report,
    serialize: meta.serialize ?? ((current) => readableValue(name ?? "", current, meta.mask)),
  });
};
