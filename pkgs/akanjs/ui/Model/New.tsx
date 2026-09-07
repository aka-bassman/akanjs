import { cn, usePage } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import type { ReactNode } from "react";
import { AiOutlinePlus } from "react-icons/ai";

import type { DraftProp } from "./draftScope";
import EditModal from "./EditModal";
import NewWrapper from "./NewWrapper";

interface NewProps<Full = any> {
  type?: "icon" | "button";
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
  slice: SliceMeta;
  modal?: string | null;
  partial?: Partial<Full> | (() => Partial<Full>);
  renderTitle?: ((model: { id: string }) => string | ReactNode) | string;
  /** Suffixes the tool this button publishes. Only a second create button for the same slice needs one. */
  namespace?: string;
  /** Draft recovery for the form. `false` turns it off; a string names the scope explicitly. */
  draft?: DraftProp;
}

export default function New({
  className,
  wrapperClassName,
  type = "button",
  children,
  slice,
  modal,
  partial,
  renderTitle,
  namespace,
  draft,
}: NewProps) {
  const { l } = usePage();
  return (
    <div className={cn("inline", wrapperClassName)}>
      <NewWrapper
        className={cn("flex w-full items-center justify-center gap-2", className)}
        slice={slice}
        modal={modal}
        partial={partial}
        namespace={namespace}
        draft={draft}
      >
        <AiOutlinePlus /> {type === "button" ? l("base.new") : null}
      </NewWrapper>
      <EditModal renderTitle={renderTitle} slice={slice} draft={draft}>
        {children}
      </EditModal>
    </div>
  );
}
