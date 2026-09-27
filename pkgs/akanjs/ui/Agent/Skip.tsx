import type { ReactNode } from "react";

export interface SkipProps {
  className?: string;
  /** What `readScreen` prints in place of the region, and the name `section` takes to read it anyway. */
  label: string;
  children: ReactNode;
}

/** Hides text from `readScreen`, not tools or state. Where a wrapper div would move the layout, put
 *  `data-agent-skip="<label>"` on an element the page already renders. */
export const Skip = ({ className, label, children }: SkipProps) => {
  return (
    <div className={className} data-agent-skip={label}>
      {children}
    </div>
  );
};
