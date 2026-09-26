"use client";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import { st } from "akanjs/store";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { DialogContext } from "./context";

export interface ProviderProps {
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  /** Names this dialog for the in-page agent; without it the dialog publishes nothing. */
  namespace?: string;
  children?: ReactNode;
}
export const Provider = ({
  className,
  defaultOpen = false,
  open = defaultOpen,
  namespace,
  children,
}: ProviderProps) => {
  const [openState, setOpenState] = useState(defaultOpen);
  const dismissRef = useRef<(() => void) | null>(null);
  const registerDismiss = useCallback((dismiss: (() => void) | null) => {
    dismissRef.current = dismiss;
  }, []);
  const [title, setTitle] = useState<ReactNode>(null);
  const [action, setAction] = useState<ReactNode>(null);
  const suffix = namespace ? capitalize(namespace) : "";
  useEffect(() => {
    setOpenState(open);
  }, [open]);
  st.expose(namespace ? `dialogIn${suffix}` : null, Boolean)
    .desc("Whether this dialog is showing.")
    .value(openState);
  const openDialog = st
    .tool(namespace ? `openDialogIn${suffix}` : null)
    .desc(`Open the ${namespace ?? ""} dialog.`)
    .exec(() => {
      setOpenState(true);
    });
  const closeDialog = st
    .tool(namespace ? `closeDialogIn${suffix}` : null)
    .desc(`Close the ${namespace ?? ""} dialog.`)
    .exec(() => {
      // The surface's own dismissal, the X button's path; flipping the state is for a dialog with no modal.
      if (dismissRef.current) dismissRef.current();
      else setOpenState(false);
    });
  return (
    <DialogContext.Provider
      value={{
        open: openState,
        setOpen: setOpenState,
        openDialog,
        closeDialog,
        registerDismiss,
        title,
        setTitle,
        action,
        setAction,
      }}
    >
      <div data-open={openState} className={cn("group/dialog", className)}>
        {children}
      </div>
    </DialogContext.Provider>
  );
};
