"use client";
import type { ReactNode } from "react";
import { sharedContext } from "../../client/sharedContext";

export interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDialog: () => void;
  closeDialog: () => void;
  /** The drawing surface's own dismissal, where `confirmClose` and `onCancel` live; flipping `open` skips both. */
  registerDismiss: (dismiss: (() => void) | null) => void;
  title: ReactNode;
  setTitle: (title: ReactNode) => void;
  action: ReactNode;
  setAction: (action: ReactNode) => void;
}

export const DialogContext = sharedContext<DialogContextType>("dialog", {
  open: false,
  setOpen: (open: boolean) => null,
  openDialog: () => null,
  closeDialog: () => null,
  registerDismiss: (dismiss: (() => void) | null) => null,
  title: null,
  setTitle: (title: ReactNode) => null,
  action: null,
  setAction: (action: ReactNode) => null,
});
