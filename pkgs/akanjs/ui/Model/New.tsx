import { usePage } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import type { ReactNode } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { buttonRecipe } from "../recipe";
import type { DraftProp } from "./draftScope";
import EditModal from "./EditModal";
import NewWrapper from "./NewWrapper";

interface NewProps<Full = any> {
  trigger?: ReactNode;
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

export default function New({ trigger, children, slice, modal, partial, renderTitle, namespace, draft }: NewProps) {
  const { l } = usePage();
  return (
    <>
      <NewWrapper
        className="contents"
        slice={slice}
        modal={modal}
        partial={partial}
        namespace={namespace}
        draft={draft}
      >
        {trigger ?? (
          <button className={buttonRecipe({ variant: "primary" })}>
            <AiOutlinePlus /> {l("base.new")}
          </button>
        )}
      </NewWrapper>
      <EditModal renderTitle={renderTitle} slice={slice} draft={draft}>
        {children}
      </EditModal>
    </>
  );
}
