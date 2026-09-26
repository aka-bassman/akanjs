"use client";
import { cn, router } from "akanjs/client";
import type { ReactNode } from "react";

interface BackProps {
  className?: string;
  children?: ReactNode;
}
export const Back = ({ className, children }: BackProps) => {
  return (
    <div className={cn("cursor-pointer", className)} onClick={() => router.back()}>
      {children}
    </div>
  );
};

interface CloseProps {
  className?: string;
  children?: ReactNode;
}
export const Close = ({ className, children }: CloseProps) => {
  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={() => {
        window.close();
      }}
    >
      {children}
    </div>
  );
};

interface LangProps {
  className?: string;
  lang: "ko" | "en" | (string & {});
  children?: ReactNode;
}
export const Lang = ({ className, lang, children }: LangProps) => {
  return (
    <div className={cn("cursor-pointer", className)} onClick={() => router.setLang(lang)}>
      {children}
    </div>
  );
};
