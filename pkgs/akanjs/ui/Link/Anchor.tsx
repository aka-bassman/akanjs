"use client";
import { getEnv } from "akanjs/base";
import { cn, getPathInfo, router, usePage, usePathCtx } from "akanjs/client";
import { loadCapacitorBrowser } from "akanjs/client/capacitor";
import { Logger } from "akanjs/common";
import { st } from "akanjs/store";
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

export const CsrLink = ({
  className,
  children,
  href,
  replace,
  activeClassName,
  scrollToTop,
  activeExact,
  noCache,
  ...props
}: CsrLinkProps) => {
  const pathCtx = usePathCtx();
  const prefix = pathCtx.prefix;
  const currentPath = st.use.path({ agent: false });
  const { lang } = usePage();
  const { path, hash } = getPathInfo(href, lang, prefix ?? "");
  return (
    <a
      className={cn(
        "cursor-pointer",
        className,
        (activeExact ? currentPath === path : currentPath.startsWith(path)) && (activeClassName ?? ""),
      )}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
        const isHash = href.startsWith("#");
        const url = isHash ? `${window.location.pathname}#${hash}` : href;
        if (isExternal)
          void loadCapacitorBrowser()
            .then(({ Browser }) => Browser.open({ url: href, presentationStyle: "popover" }))
            .catch(() => window.open(href, "_blank", "noopener,noreferrer"));
        else if (replace) router.replace(url, { scrollToTop });
        else router.push(url, { scrollToTop });
      }}
    >
      {children}
    </a>
  );
};

export const SsrLink = ({
  className,
  children,
  disabled,
  href,
  scrollToTop,
  replace,
  activeClassName,
  activeExact,
  noCache,
  ...props
}: SsrLinkProps) => {
  const pathCtx = usePathCtx();
  const prefix = pathCtx.prefix;
  const { lang, path: pagePath } = usePage();
  const currentPath = pathCtx.location?.pathRoute?.path ?? getPathInfo(pagePath, lang, prefix ?? "").path;
  const isExternal = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const internalPathInfo = getPathInfo(href, lang, prefix ?? "");
  const publicPathInfo = getPathInfo(href, lang, "");
  const requestHref = getEnv().operationMode === "local" ? internalPathInfo.href : publicPathInfo.href;
  const path = internalPathInfo.path;
  if (href.startsWith("#")) {
    return (
      <a className={cn(className, currentPath === path && (activeClassName ?? ""))} href={href}>
        {children}
      </a>
    );
  }
  return (
    <a
      className={cn(
        className,
        (activeExact ? currentPath === path : currentPath.startsWith(path)) && (activeClassName ?? ""),
      )}
      href={isExternal ? href : href.startsWith("#") ? href : requestHref}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        if (disabled) {
          event.preventDefault();
          return;
        }
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (isExternal || href.startsWith("#")) return;
        const rscNavigationReady =
          typeof (globalThis as typeof globalThis & { __AKAN_RSC_NAVIGATE__?: unknown }).__AKAN_RSC_NAVIGATE__ ===
          "function";
        if (!router.isInitialized || !rscNavigationReady) return;
        event.preventDefault();
        try {
          if (replace) router.replace(href, { scrollToTop });
          else router.push(href, { scrollToTop });
        } catch (error) {
          Logger.warn(`SSR link navigation failed, falling back to document navigation: ${String(error)}`);
          if (replace) window.location.replace(requestHref);
          else window.location.assign(requestHref);
        }
      }}
    >
      {children}
    </a>
  );
};
