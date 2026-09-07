import { deepObjectify } from "akanjs/common";
import type { SliceMeta } from "akanjs/fetch";
import type { ReactNode } from "react";

import type { DraftProp } from "./draftScope";
import { NewWrapper_Client } from "./NewWrapper_Client";

interface NewWrapperProps<Full = any> {
  className?: string;
  children: ReactNode;
  slice: SliceMeta;
  partial?: Partial<Full> | (() => Partial<Full>);
  setDefault?: boolean;
  modal?: string | null;
  resets?: string[] | null;
  /** Suffixes the tool this trigger publishes. Only a second create trigger for the same slice needs one. */
  namespace?: string;
  /** Draft recovery for the form this opens. `false` turns it off; a string names the scope explicitly. */
  draft?: DraftProp;
}

export default function NewWrapper<Full>({ partial = {}, ...props }: NewWrapperProps<Full>) {
  const serializedPartial = deepObjectify(typeof partial === "function" ? partial() : partial, { serializable: true });
  return <NewWrapper_Client {...props} partial={serializedPartial} />;
}
