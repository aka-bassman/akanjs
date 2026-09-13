"use client";
import { type cnst, st } from "@libs/shared/client";
import { type ReactNode, useMemo } from "react";

interface ShowProps {
  children: ReactNode | ReactNode[];
  show?: boolean | cnst.util.Responsive["value"][];
  type?: "unmount" | "hidden";
}
export const Show = ({ children, show = false, type = "unmount" }: ShowProps) => {
  const responsive = st.use.responsive();
  const isActive = useMemo(() => {
    if (typeof show === "boolean") return show;
    else return show.includes(responsive);
  }, [show, responsive]);
  return isActive ? children : type === "hidden" ? <div className="hidden">{children}</div> : null;
};
