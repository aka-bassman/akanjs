"use client";
import { cn } from "akanjs/client";
import { capitalize } from "akanjs/common";
import { st } from "akanjs/store";
import { type ReactNode, useEffect, useState } from "react";

import { DialogContext } from "./context";

export interface ProviderProps {
  /** Additional classes for the dialog root wrapper. */
  className?: string;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Names this dialog for the in-page agent. Without it the dialog publishes nothing — two on one screen would share a name. */
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
  const [title, setTitle] = useState<ReactNode>(null);
  const [action, setAction] = useState<ReactNode>(null);
  const suffix = namespace ? capitalize(namespace) : "";
  useEffect(() => {
    setOpenState(open);
  }, [open]);
  st.expose(namespace ? `dialogIn${suffix}` : null, openState, { desc: "Whether this dialog is showing." });
  const openDialog = st
    .tool(namespace ? `openDialogIn${suffix}` : null, { desc: `Open the ${namespace ?? ""} dialog.`, effect: "state" })
    .exec(() => {
      setOpenState(true);
    });
  const closeDialog = st
    .tool(namespace ? `closeDialogIn${suffix}` : null, {
      desc: `Close the ${namespace ?? ""} dialog.`,
      effect: "state",
    })
    .exec(() => {
      setOpenState(false);
    });
  return (
    <DialogContext.Provider
      value={{ open: openState, setOpen: setOpenState, openDialog, closeDialog, title, setTitle, action, setAction }}
    >
      <div data-open={openState} className={cn("group/dialog", className)}>
        {children}
      </div>
    </DialogContext.Provider>
  );
};
