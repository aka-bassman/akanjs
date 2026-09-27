import { cn } from "akanjs/client";
import type { ReactNode } from "react";

import { Link } from "../Link";

export interface TemplateProps {
  className?: string;
  children?: ReactNode;
}
export const Template = ({ className, children }: TemplateProps) => {
  return <div className={cn("flex w-full flex-col gap-6 p-2", className)}>{children}</div>;
};

export interface UnitProps {
  className?: string;
  children: ReactNode;
  /** Makes the whole unit a link. */
  href?: string;
}
export const Unit = ({ className, children, href }: UnitProps) => {
  return (
    <Link href={href}>
      <div className={cn("flex w-full flex-col gap-2 p-4", !!href && "cursor-pointer", className)}>{children}</div>
    </Link>
  );
};

export interface ViewProps {
  className?: string;
  children: ReactNode;
}
export const View = ({ className, children }: ViewProps) => {
  return <div className={cn("flex size-full max-w-5xl flex-col gap-6 px-2", className)}>{children}</div>;
};

export interface ZoneProps {
  className?: string;
  children: ReactNode;
}
export const Zone = ({ className, children }: ZoneProps) => {
  return <div className={cn("flex size-full max-w-5xl flex-col gap-6 px-2", className)}>{children}</div>;
};
