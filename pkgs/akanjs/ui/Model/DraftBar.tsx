"use client";
import { cn, usePage } from "akanjs/client";
import { capitalize, lowerlize } from "akanjs/common";
import type { SliceMeta } from "akanjs/fetch";
import { type DraftState, st } from "akanjs/store";
import { useMemo } from "react";
import { AiOutlineDelete, AiOutlineHistory, AiOutlineRollback } from "react-icons/ai";

import { agentAttrs } from "../agentAttrs";
import { Button } from "../Button";
import { RecentTime } from "../RecentTime";

interface DraftBarProps {
  className?: string;
  slice: SliceMeta;
}

/**
 * What the user is told about a recovered form.
 *
 * Two states, and the difference is whether the draft is already in the form. A pending one is a conflict the
 * user has to settle — the record moved since the draft was taken, so the form shows the server's value and this
 * offers the older one. An applied one is just a notice: the draft is what is on screen, and this is the way back.
 */
export default function DraftBar({ className, slice }: DraftBarProps) {
  const { l } = usePage();
  const { refName } = slice;
  const [modelName, ModelName] = useMemo(() => [lowerlize(refName), capitalize(refName)], []);
  const names = useMemo(
    () => ({
      modelDraft: `${modelName}FormDraft`,
      restoreModelDraft: `restore${ModelName}FormDraft`,
      discardModelDraft: `discard${ModelName}FormDraft`,
    }),
    [],
  );
  const storeUse = st.use as { [key: string]: (option?: { agent?: boolean }) => unknown };
  const storeDo = st.do as unknown as { [key: string]: () => void };
  // `agent: false`: the two tools below are the whole agent surface here. The value itself carries the user's
  // form — a `field.visual` body included — and a read would ride every later turn of the transcript.
  const draft = storeUse[names.modelDraft]({ agent: false }) as DraftState | null;

  const restoreDraft = st
    .tool(draft?.pending ? names.restoreModelDraft : null)
    .desc(`Put the unsaved ${modelName} the user left behind back into the open form.`)
    .exec(() => storeDo[names.restoreModelDraft]());
  const discardDraft = st
    .tool(draft?.pending || draft?.appliedAt ? names.discardModelDraft : null)
    .desc(`Throw away the recovered ${modelName} draft and keep the form as it was opened.`)
    .exec(() => storeDo[names.discardModelDraft]());

  if (draft?.pending)
    return (
      <div
        className={cn(
          "mb-4 flex flex-wrap items-center gap-2 rounded-box border border-warning/40 bg-warning/10 p-3",
          className,
        )}
      >
        <AiOutlineHistory className="text-warning" />
        <span className="flex-1 text-foreground/80 text-sm">
          {l("base.draftConflict")} <RecentTime date={draft.pending.savedAt} />
        </span>
        <Button {...agentAttrs(restoreDraft)} size="sm" onClick={() => restoreDraft()}>
          <AiOutlineRollback /> {l("base.draftRestore")}
        </Button>
        <Button {...agentAttrs(discardDraft)} size="sm" variant="ghost" onClick={() => discardDraft()}>
          <AiOutlineDelete /> {l("base.draftDiscard")}
        </Button>
      </div>
    );
  if (draft?.appliedAt)
    return (
      <div className={cn("mb-4 flex flex-wrap items-center gap-2 text-foreground/60 text-xs", className)}>
        <AiOutlineHistory />
        <span className="flex-1">
          {l("base.draftApplied")} <RecentTime date={draft.appliedAt} />
        </span>
        <Button {...agentAttrs(discardDraft)} size="xs" variant="ghost" onClick={() => discardDraft()}>
          {l("base.draftStartOver")}
        </Button>
      </div>
    );
  return null;
}
