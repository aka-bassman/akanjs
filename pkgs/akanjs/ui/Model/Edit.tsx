import { usePage } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import type { ReactNode } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { buttonRecipe } from "../recipe";
import type { DraftProp } from "./draftScope";
import EditModal from "./EditModal";
import EditWrapper from "./EditWrapper";

interface EditProps {
  trigger?: ReactNode;
  children: ReactNode;
  slice: SliceMeta;
  modelId: string;
  modal?: string | null;
  renderTitle?: ((model: { id: string }) => string | ReactNode) | string;
  /** Draft recovery for the form this opens. `false` turns it off; a string names the scope explicitly. */
  draft?: DraftProp;
}

export default function Edit({ trigger, children, slice, modelId, modal, renderTitle, draft }: EditProps) {
  const { l } = usePage();
  return (
    <>
      <EditWrapper className="contents" slice={slice} modelId={modelId} modal={modal} draft={draft}>
        {trigger ?? (
          <button className={buttonRecipe({ variant: "primary" })}>
            <AiOutlineEdit /> {l("base.edit")}
          </button>
        )}
      </EditWrapper>
      <EditModal renderTitle={renderTitle} slice={slice} id={modelId} draft={draft}>
        {children}
      </EditModal>
    </>
  );
}
