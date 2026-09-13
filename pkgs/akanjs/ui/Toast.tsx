"use client";
import { cn } from "akanjs/client";
import type { ReactNode } from "react";
import {
  AiOutlineCheckCircle,
  AiOutlineClose,
  AiOutlineExclamationCircle,
  AiOutlineInfoCircle,
  AiOutlineLoading3Quarters,
  AiOutlineWarning,
} from "react-icons/ai";

import { createOverridable } from "./UiOverride";

export type ToastType = "info" | "success" | "error" | "warning" | "loading";

export interface ToastMessage {
  key: string;
  type: ToastType;
  content: ReactNode;
  /** Seconds the message is shown before the shell starts its exit. */
  duration: number;
  /** The shell started this message's exit: play the leave animation, then call `onClosed`. */
  leaving: boolean;
}

const messageTone: { [key in ToastType]: { card: string; chip: string; icon: ReactNode } } = {
  info: { card: "border-info/35", chip: "bg-info/15 text-info", icon: <AiOutlineInfoCircle /> },
  success: { card: "border-success/35", chip: "bg-success/15 text-success", icon: <AiOutlineCheckCircle /> },
  warning: { card: "border-warning/35", chip: "bg-warning/15 text-warning", icon: <AiOutlineWarning /> },
  error: {
    card: "border-destructive/35",
    chip: "bg-destructive/15 text-destructive",
    icon: <AiOutlineExclamationCircle />,
  },
  loading: {
    card: "border-border",
    chip: "bg-muted text-foreground/60",
    icon: <AiOutlineLoading3Quarters className="animate-spin" />,
  },
};

export interface ToastItemProps {
  className?: string;
  message: ToastMessage;
  /** Dismisses early — starts the same exit the timer would. */
  onClose: () => void;
  /** Takes the message off the screen. Call it when the exit animation has finished. */
  onClosed: () => void;
}

export const DefaultToastItem = ({ className, message, onClose, onClosed }: ToastItemProps) => {
  const tone = messageTone[message.type];
  return (
    <div
      data-state={message.leaving ? "out" : "in"}
      onAnimationEnd={() => {
        if (message.leaving) onClosed();
      }}
      className={cn(
        "pointer-events-auto w-full data-[state=in]:animate-fadeInDown15-150ms data-[state=out]:animate-smaller",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full items-start gap-3 rounded-box border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-sm",
          tone.card,
        )}
      >
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-base", tone.chip)}>
          {tone.icon}
        </div>
        <span className="min-w-0 flex-1 self-center break-words text-sm leading-snug">{message.content}</span>
        <button
          aria-label="Dismiss"
          className="-mr-1 shrink-0 self-center rounded-full p-1 text-foreground/30 transition-colors hover:text-foreground/70"
          onClick={onClose}
          type="button"
        >
          <AiOutlineClose className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export interface ToastProps {
  className?: string;
  /** Oldest first, already capped by the store. A replacement showing fewer slices the list itself. */
  messages: ToastMessage[];
  /** The device's top safe area in pixels — the stack starts below it. */
  topSafeArea: number;
  /** Starts a message's exit, as the dismiss button and the elapsed timer both do. */
  onClose: (key: string) => void;
  /** Takes a message off the screen once its exit animation has finished. */
  onClosed: (key: string) => void;
}

export const DefaultToast = ({ className, messages, topSafeArea, onClose, onClosed }: ToastProps) => (
  <div
    id="toast"
    className={cn(
      "pointer-events-none fixed top-0 left-1/2 z-[100] flex h-fit w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4 pt-3",
      className,
    )}
    style={{ marginTop: topSafeArea }}
  >
    {messages.map((message) => (
      <Toast.Item
        key={message.key}
        message={message}
        onClose={() => onClose(message.key)}
        onClosed={() => onClosed(message.key)}
      />
    ))}
  </div>
);

const ToastBase = createOverridable("Toast", DefaultToast);

/**
 * The toast surface. `Toast` (the stack) and `Toast.Item` (one card) each resolve to a route-scoped override
 * when a `page/**\/_overrides.tsx` in the route's ancestry declares one (slots `Toast`, `ToastItem`).
 *
 * `System`'s `Messages` renders this and is not a slot: it keeps the `msg.*` wiring, the store read, the
 * body-level portal and the dismiss timers, so a replacement re-skins the surface without re-implementing
 * when a toast appears and goes away.
 */
export const Toast = Object.assign(ToastBase, {
  Item: createOverridable("ToastItem", DefaultToastItem),
});
