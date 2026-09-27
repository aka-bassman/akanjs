import { Logger } from "akanjs/common";
import { msg } from "./useClient";

interface ToastProps {
  root?: string;
  duration?: number;
}
/** Toasts `<root>.<key>-loading` / `-success` around the method; an error is toasted and logged, not rethrown. */
export const Toast = ({ root, duration = 3 }: ToastProps = {}) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (...args: any[]) => Promise<void>;
    descriptor.value = async function (...args: any[]) {
      try {
        msg.loading(`${root ? `${root}.` : ""}${key}-loading` as any, { key, duration });
        const result = (await originMethod.apply(this, args)) as unknown;
        msg.success(`${root ? `${root}.` : ""}${key}-success` as any, { key, duration });
        return result;
      } catch (err) {
        const errKey = typeof err === "string" ? err : (err as Error).message;
        msg.error(errKey as any, { key, duration });
        Logger.error(`${key} action error return: ${err}`);
      }
    };
  };
};
