import { getEnv } from "akanjs/base";
import type { ReactNode } from "react";

import { PageCSR } from "./PageCSR";

export interface PageProps<Return> {
  /** The route component, which keys the CSR loader cache. */
  of: (props: unknown) => ReactNode | null;
  loader: () => Promise<Return>;
  render: (data: Return) => ReactNode;
  /** Shown while CSR data is pending. */
  loading?: () => ReactNode;
  /** Skips the per-path CSR loader cache. */
  noCache?: boolean;
}
const Page: <Return>(props: PageProps<Return>) => ReactNode =
  getEnv().renderMode === "csr"
    ? PageCSR
    : <Return,>({ loader, render }: PageProps<Return>) => {
        return new Promise((resolve, reject) => {
          loader()
            .then((data) => {
              resolve(render(data));
            })
            .catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
              if (message === "NEXT_REDIRECT") reject(error);
              else {
                console.error(error);
                resolve(<div className="text-destructive">{message}</div>);
              }
            });
        });
      };

export default Page;
