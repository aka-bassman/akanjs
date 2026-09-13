import { cn } from "akanjs/client";
import { cloneElement, Fragment, isValidElement, type MouseEvent, type ReactElement, type ReactNode } from "react";

type TriggerHandler = (event: MouseEvent<HTMLElement>) => void;

interface TriggerElementProps {
  className?: string;
  onClick?: TriggerHandler;
}

interface TriggerSlotOptions {
  className?: string;
  onClick?: TriggerHandler;
  /** Host element for a trigger that cannot be cloned — a string, a fragment, several children. */
  as?: "div" | "span";
}

/**
 * Puts a disclosure's click and aria state onto the element the caller handed in, rather than wrapping it.
 *
 * Reach for this **only when an attribute has to ride the caller's own control** — `aria-expanded` /
 * `aria-haspopup` on a wrapper names a box rather than the button a screen reader activates. Everywhere else
 * the framework wraps instead: a wrapper works with any node, and a clone is silently inert on a component
 * that does not forward `className` / `onClick` (every `ModelProps` component, whose `onClick` takes the model
 * rather than the event).
 *
 * The caller's own `onClick` runs first and can call `preventDefault()` to stop the surface from acting. A
 * trigger that is not a single element has nothing to clone onto, so it keeps a host element.
 */
export const triggerSlot = (
  trigger: ReactNode,
  { className, onClick, as: Host = "div", ...attrs }: TriggerSlotOptions & { [key: string]: unknown },
) => {
  // A fragment passes `isValidElement` and takes neither prop, so it belongs on the wrapper path with the rest.
  if (isValidElement<TriggerElementProps>(trigger) && trigger.type !== Fragment) {
    const element = trigger as ReactElement<TriggerElementProps>;
    return cloneElement(element, {
      ...attrs,
      className: cn(className, element.props.className),
      onClick: (event: MouseEvent<HTMLElement>) => {
        element.props.onClick?.(event);
        if (event.defaultPrevented) return;
        onClick?.(event);
      },
    });
  }
  return (
    <Host className={className} onClick={onClick} {...attrs}>
      {trigger}
    </Host>
  );
};
