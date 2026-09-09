import { cn, usePage } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import type { ReactNode } from "react";
import { AiOutlineEdit } from "react-icons/ai";

import type { DraftProp } from "./draftScope";
import EditModal from "./EditModal";
import EditWrapper from "./EditWrapper";

interface EditProps {
  type?: "icon" | "button";
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
  slice: SliceMeta;
  modelId: string;
  modal?: string | null;
  renderTitle?: ((model: { id: string }) => string | ReactNode) | string;
  /** Draft recovery for the form this opens. `false` turns it off; a string names the scope explicitly. */
  draft?: DraftProp;
}

export default function Edit({
  className,
  wrapperClassName,
  type = "button",
  children,
  slice,
  modelId,
  modal,
  renderTitle,
  draft,
}: EditProps) {
  const { l } = usePage();
  return (
    <div className={cn("inline", wrapperClassName)}>
      <EditWrapper
        className={cn("flex w-full items-center justify-center gap-2", className)}
        slice={slice}
        modelId={modelId}
        modal={modal}
        draft={draft}
      >
        <AiOutlineEdit /> {type === "button" ? l("base.edit") : null}
      </EditWrapper>
      <EditModal renderTitle={renderTitle} slice={slice} id={modelId} draft={draft}>
        {children}
      </EditModal>
    </div>
  );
}
