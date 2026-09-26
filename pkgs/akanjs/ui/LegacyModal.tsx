"use client";
import type { ReactNode } from "react";

import { Dialog } from "./Dialog";

export interface LegacyModalProps {
  className?: string;
  title?: string | ReactNode;
  action?: ReactNode;
  open: boolean;
  onCancel: () => void;
  bodyClassName?: string;
  children?: ReactNode;
  confirmClose?: boolean;
}

/** Spring-animated, drag-to-dismiss skin. Unlike `Modal`, it does not resolve through the `Modal` override slot. */
export const LegacyModal = ({
  className,
  title,
  action,
  open,
  onCancel,
  bodyClassName,
  children,
  confirmClose = false,
}: LegacyModalProps) => {
  return (
    <Dialog open={open}>
      <Dialog.LegacyModal
        className={className}
        onCancel={onCancel}
        bodyClassName={bodyClassName}
        confirmClose={confirmClose}
      >
        {title ? <Dialog.Title>{title}</Dialog.Title> : null}
        <Dialog.Content>{children}</Dialog.Content>
        {action ? <Dialog.Action>{action}</Dialog.Action> : null}
      </Dialog.LegacyModal>
    </Dialog>
  );
};
