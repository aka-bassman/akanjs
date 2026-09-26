"use client";
import { cn, router } from "akanjs/client";
import type { ReactNode } from "react";

interface ActionProps {
  className?: string;
  children?: ReactNode;
}

export const Back = ({ className, children }: ActionProps) => (
  <div className={cn("cursor-pointer", className)} onClick={() => router.back()}>
    {children}
  </div>
);

export const Close = ({ className, children }: ActionProps) => (
  <div className={cn("cursor-pointer", className)} onClick={() => window.close()}>
    {children}
  </div>
);

interface LangProps extends ActionProps {
  lang: "ko" | "en" | (string & {});
}
export const Lang = ({ className, lang, children }: LangProps) => (
  <div className={cn("cursor-pointer", className)} onClick={() => router.setLang(lang)}>
    {children}
  </div>
);
