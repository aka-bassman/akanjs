"use client";

import type { ReactNode } from "react";

import { Dialog } from "./Dialog";
import { createOverridable } from "./UiOverride";

export interface ModalProps {
  /** Additional classes for the modal surface. */
  className?: string;
  /** Optional trigger element to open the modal. */
  trigger?: ReactNode;
  /** Optional modal title. */
  title?: string | ReactNode;
  /** Optional action area, usually footer buttons. */
  action?: ReactNode;
  /** The dismiss control. `false` draws none. */
  closeButton?: ReactNode | false;
  /** Controlled open state. */
  open?: boolean;
  /** Called when the modal requests closing. */
  onCancel?: () => void;
  /** Additional classes for the content body. */
  bodyClassName?: string;
  children?: ReactNode;
  /** Ask for close confirmation before dismissing. */
  confirmClose?: boolean;
}

/**
 * Default akanjs modal skin. Kept as the fallback implementation; apps replace
 * it per-route through a `page/**\/_overrides.tsx` manifest.
 */
export const DefaultModal = ({
  className,
  trigger,
  title,
  action,
  closeButton,
  open,
  onCancel,
  bodyClassName,
  children,
  confirmClose = false,
}: ModalProps) => {
  return (
    <Dialog open={open}>
      {trigger ? <Dialog.Trigger>{trigger}</Dialog.Trigger> : null}
      <Dialog.Modal
        className={className}
        onCancel={onCancel}
        bodyClassName={bodyClassName}
        confirmClose={confirmClose}
        closeButton={closeButton}
      >
        {title ? <Dialog.Title>{title}</Dialog.Title> : null}
        <Dialog.Content>{children}</Dialog.Content>
        {action ? <Dialog.Action>{action}</Dialog.Action> : null}
      </Dialog.Modal>
    </Dialog>
  );
};

/**
 * Public Modal. Resolves to a route-scoped override when a `_overrides.tsx` in
 * the route's ancestry declares one, otherwise renders {@link DefaultModal}.
 * The proxy is transparent to every existing `<Modal … />` call site.
 */
export const Modal = createOverridable("Modal", DefaultModal);
