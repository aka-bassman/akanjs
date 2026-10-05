"use client";
import { type AkanModalComponent, Dialog } from "akanjs/ui";

/**
 * App-authored Modal skin used to demonstrate the `page/_overrides.tsx` mechanism. It composes the
 * framework's headless Dialog parts, so the app re-skins the Modal without re-owning focus-trap,
 * escape handling, scroll-lock, or portal behavior. Typed as `AkanModalComponent` so it is checked as a
 * drop-in replacement for the framework `<Modal>`.
 */
export const BrandModal: AkanModalComponent = ({
  className,
  title,
  action,
  open,
  onCancel,
  bodyClassName,
  children,
  confirmClose = false,
}) => (
  <Dialog open={open}>
    <Dialog.Modal
      className={`overflow-hidden rounded-[2rem] border border-primary/30 bg-card shadow-2xl shadow-primary/20 ${className ?? ""}`}
      onCancel={onCancel}
      bodyClassName={bodyClassName}
      confirmClose={confirmClose}
    >
      <div data-testid="brand-modal" className="h-1.5 shrink-0 bg-gradient-to-r from-primary via-accent to-primary" />
      {title ? <Dialog.Title>{title}</Dialog.Title> : null}
      <Dialog.Content>{children}</Dialog.Content>
      {action ? <Dialog.Action>{action}</Dialog.Action> : null}
    </Dialog.Modal>
  </Dialog>
);
