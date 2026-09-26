import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Record<never, never>;
export type CommonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> &
  Omit<LinkProps, "href"> & {
    /** Omitted, or with `disabled`, Link renders a plain div around the same children. */
    href?: string | null;
    children?: ReactNode;
    disabled?: boolean;
    scrollToTop?: boolean;
    /** Replaces the current history entry instead of pushing a new one. */
    replace?: boolean;
    /** Applied while the current path starts with `href`, or equals it with `activeExact`. */
    activeClassName?: string;
    activeExact?: boolean;
    /** Bypass route cache for client-side navigation when supported by the renderer. */
    noCache?: boolean;
  };

export interface CsrLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  activeClassName?: string;
  activeExact?: boolean;
  scrollToTop?: boolean;
  noCache?: boolean;
}

export interface SsrLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href">,
    LinkProps {
  href: string;
  children?: ReactNode;
  disabled?: boolean;
  scrollToTop?: boolean;
  replace?: boolean;
  activeClassName?: string;
  activeExact?: boolean;
  noCache?: boolean;
}
