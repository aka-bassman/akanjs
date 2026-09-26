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

/** Clones a disclosure's click and aria state onto the caller's element; the caller's `onClick` runs first and may
 *  `preventDefault()`. Only for aria that must ride the caller's control: a clone is inert on one not forwarding it. */
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
