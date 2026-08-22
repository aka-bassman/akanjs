"use client";
import { cn, usePage } from "akanjs/client";
import { useEscapeKey } from "akanjs/webkit";
import { type ButtonHTMLAttributes, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { BiMessageRoundedError } from "react-icons/bi";
import { buttonRecipe } from "./Button";
import { createOverridable, useUiRecipe } from "./UiOverride";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export interface PopconfirmProps {
  /** Confirmation title. */
  title: string;
  /** Optional detailed confirmation message. */
  description?: ReactNode;
  /** Called when the user confirms. */
  onConfirm?: () => void;
  /** Props forwarded to the OK button. */
  okButtonProps?: ButtonProps;
  /** Props forwarded to the cancel button. */
  cancelButtonProps?: ButtonProps;
  /** Custom OK button text. */
  okText?: string;
  /** Custom cancel button text. */
  cancelText?: string;
  /** Trigger content. */
  children?: ReactNode;
  /** Additional classes for the trigger wrapper. */
  triggerClassName?: string;
  /** Additional classes for the popover arrow/decorator. */
  decoClassName?: string;
}

export const DefaultPopconfirm = ({
  title,
  description,
  onConfirm,
  okButtonProps,
  cancelButtonProps,
  okText,
  cancelText,
  children,
  triggerClassName,
  decoClassName,
}: PopconfirmProps) => {
  const { l } = usePage();
  const recipe = useUiRecipe("button") ?? buttonRecipe;
  const [isConfirming, setIsConfirming] = useState(false);
  const [alignStart, setAlignStart] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Measured off the trigger and the panel's own width, never off the panel's current position: reading the
  // placed panel makes each flip change the next measurement, which is how the previous version ended up
  // mutating classes through a document-wide `.popconfirm` query.
  useLayoutEffect(() => {
    if (!isConfirming) return;
    const trigger = triggerRef.current?.getBoundingClientRect();
    const width = panelRef.current?.offsetWidth;
    if (!trigger || !width) return;
    setAlignStart(trigger.right - width < 8);
  }, [isConfirming]);

  const handleConfirm = () => {
    setIsConfirming(false);
    onConfirm?.();
  };
  const handleCancel = () => {
    setIsConfirming(false);
  };
  useEscapeKey(isConfirming, handleCancel);

  return (
    <>
      {isConfirming ? (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsConfirming(false);
          }}
        />
      ) : null}
      <div className="relative inline-block" ref={triggerRef}>
        <div
          className={cn("trigger", triggerClassName)}
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirming(true);
          }}
        >
          {children}
        </div>
        {isConfirming ? (
          <div
            className={cn(
              "absolute top-full z-50 mt-2 w-64 animate-fadeIn rounded-box border border-border bg-popover p-4 text-popover-foreground shadow-xl",
              alignStart ? "left-0" : "right-0",
            )}
            ref={panelRef}
            role="dialog"
          >
            <div
              className={cn(
                "absolute -top-1.5 size-3 rotate-45 border-border border-t border-l bg-popover",
                !decoClassName && (alignStart ? "left-5" : "right-5"),
                decoClassName,
              )}
            />
            <div className="flex gap-2">
              <BiMessageRoundedError className="mt-0.5 shrink-0 text-lg text-warning" />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-snug">{title}</p>
                {description ? <div className="mt-1 text-foreground/70 text-sm leading-snug">{description}</div> : null}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className={recipe({ variant: "ghost", size: "xs" })}
                onClick={handleCancel}
                type="button"
                {...cancelButtonProps}
              >
                {cancelText ?? l("base.cancel")}
              </button>
              <button
                className={recipe({ variant: "primary", size: "xs" })}
                onClick={handleConfirm}
                type="button"
                {...okButtonProps}
              >
                {okText ?? l("base.ok")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

/**
 * Confirmation popover. Resolves to a route-scoped override when a
 * `page/**\/_overrides.tsx` in the route's ancestry declares one, otherwise
 * renders {@link DefaultPopconfirm}.
 */
export const Popconfirm = createOverridable("Popconfirm", DefaultPopconfirm);
