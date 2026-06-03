"use client";
import type { ReactDOMAttributes } from "@use-gesture/react/dist/declarations/src/types";
import type { PromiseOrObject } from "akanjs/base";
import { createContext, type ForwardRefExoticComponent, type ReactNode, type RefObject, useContext } from "react";
import type { AnimatedComponent, AnimatedProps, Interpolation, SpringValue } from "react-spring";
import type { RouterInstance } from "./router";
import type { ReactFont } from "./types";

export type TransitionType = "none" | "fade" | "bottomUp" | "stack" | "scaleOut";
/** Per-page CSR configuration for transition, safe-area, gesture, and cache behavior. */
export interface PageConfig {
  transition?: TransitionType;
  safeArea?: boolean | "top" | "bottom";
  topInset?: boolean | number;
  /**
   * @default 48px
   */
  bottomInset?: boolean | number;
  gesture?: boolean;
  cache?: boolean;
  rscCache?: "public" | false;
  rscCacheTtl?: number;
  topSafeAreaColor?: string;
  bottomSafeAreaColor?: string;
}

export interface CsrState {
  transition: TransitionType;
  topSafeArea: number;
  bottomSafeArea: number;
  topInset: number;
  bottomInset: number;
  gesture: boolean;
  cache: boolean;
  topSafeAreaColor?: string;
  bottomSafeAreaColor?: string;
}
export const DEFAULT_TOP_INSET = 48;
export const DEFAULT_BOTTOM_INSET = 60;
export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] };
}
/** Props passed to Akan layout route modules. */
export interface LayoutProps extends PageProps {
  children: ReactNode;
}
export interface PageLoadingProps {
  params: { [key: string]: string };
}
export interface LayoutLoadingProps extends PageLoadingProps {
  children: ReactNode;
}
export interface LayoutNotFoundProps extends PageProps {
  pathname: string;
}
export interface LayoutErrorProps extends LayoutNotFoundProps {
  error?: unknown;
  digest?: string;
}
export type Head = ReactNode;
export type GenerateHead = (props: PageProps) => PromiseOrObject<Head | null | undefined>;
export type ResolveHead = (props: PageProps) => PromiseOrObject<Head | null | undefined>;
export type HeadProps = PageProps;
export type PageRender = (props: PageProps) => PromiseOrObject<ReactNode>;
export type LayoutRender = (props: LayoutProps) => PromiseOrObject<ReactNode>;
export type PageLoadingRender = (props: PageLoadingProps) => PromiseOrObject<ReactNode>;
export type LayoutLoadingRender = (props: LayoutLoadingProps) => PromiseOrObject<ReactNode>;
export type LayoutNotFoundRender = (props: LayoutNotFoundProps) => PromiseOrObject<ReactNode>;
export type LayoutErrorRender = (props: LayoutErrorProps) => PromiseOrObject<ReactNode>;
export interface RouteRender {
  render: LayoutRender | PageRender;
  Loading?: LayoutLoadingRender | PageLoadingRender;
  NotFound?: LayoutNotFoundRender;
  Error?: LayoutErrorRender;
  resolveNotFound?: () => PromiseOrObject<LayoutNotFoundRender | undefined>;
  resolveError?: () => PromiseOrObject<LayoutErrorRender | undefined>;
  resolveHead?: ResolveHead;
  getPageConfig?: () => PromiseOrObject<PageConfig | undefined>;
}
export interface WebAppManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
  [key: string]: unknown;
}
export interface WebAppManifest {
  name?: string;
  shortName?: string;
  startUrl?: string;
  scope?: string;
  display?: "fullscreen" | "standalone" | "minimal-ui" | "browser" | (string & {});
  displayOverride?: string[];
  orientation?: string;
  themeColor?: string;
  backgroundColor?: string;
  description?: string;
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  icons?: WebAppManifestIcon[];
  categories?: string[];
  screenshots?: WebAppManifestIcon[];
  [key: string]: unknown;
}
export interface PageModule {
  default?: PageRender;
  pageConfig?: PageConfig;
  head?: Head;
  generateHead?: GenerateHead;
  Loading?: PageLoadingRender;
}
export interface LayoutModule {
  default?: LayoutRender;
  head?: Head;
  generateHead?: GenerateHead;
  fonts?: ReactFont[];
  manifest?: WebAppManifest;
  theme?: string;
  reconnect?: boolean;
  layoutStyle?: "mobile" | "web";
  gaTrackingId?: string;
  Loading?: LayoutLoadingRender;
  NotFound?: LayoutNotFoundRender;
  Error?: LayoutErrorRender;
}
export type RouteModule = PageModule | LayoutModule;
export interface Route {
  PageConfig?: PageConfig;
  path: string;
  renderPage?: RouteRender;
  renderLayout?: RouteRender;
  pageIncludesOwnLayout?: boolean;
  isSpecialRoute?: boolean;
  // Page?:
  //   | (({ params, searchParams }: PageProps) => ReactNode)
  //   | (({ params, searchParams }: PageProps) => Promise<ReactNode>);
  // Layout?:
  //   | (({ children, params, searchParams }: LayoutProps) => ReactNode)
  //   | (({ children, params, searchParams }: LayoutProps) => Promise<ReactNode>);
  loader?: () => any;
  pageState?: PageState;
  // action?: any;
  // ErrorBoundary?: any;
  children: Map<string, Route>;
}

export type AnimatedDivProps =
  AnimatedComponent<"div"> extends ForwardRefExoticComponent<AnimatedProps<infer P>> ? P : never;
export type TransitionStyle = AnimatedDivProps["style"];

export interface SafeAreaTransition {
  containerStyle: TransitionStyle;
}
export interface ContainerTransition {
  containerStyle: TransitionStyle;
  contentStyle: TransitionStyle;
  prevContentStyle: TransitionStyle;
}
export interface PageTransition {
  containerStyle: TransitionStyle;
  contentStyle: TransitionStyle;
}
export interface CsrTransitionStyles {
  topSafeArea: SafeAreaTransition | null;
  page: PageTransition | null;
  prevPage: PageTransition | null;
  topInset: ContainerTransition | null;
  bottomInset: ContainerTransition | null;
  topLeftAction: ContainerTransition | null;
  bottomSafeArea: SafeAreaTransition | null;
}

export type PageState = CsrState & {
  topInset: number;
  bottomInset: number;
};
export const defaultPageState: PageState = {
  transition: "none",
  topSafeArea: 0,
  bottomSafeArea: 0,
  topInset: 0,
  bottomInset: 0,
  gesture: true,
  cache: false,
  topSafeAreaColor: "transparent",
  bottomSafeAreaColor: "transparent",
};

export interface Location {
  href: string;
  pathname: string;
  search: string;
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] };
  pathRoute: PathRoute;
  hash: string;
}
export interface LocationState {
  location: Location;
  prevLocation: Location | null;
}
export interface History {
  type: "initial" | "forward" | "back";
  locations: Location[];
  scrollMap: Map<string, number>;
  idxMap: Map<string, number>;
  cachedLocationMap: Map<string, Location>;
  idx: number;
}

export interface RouterProps {
  push: (path: string) => void;
  replace: (path: string) => void;
  refresh: () => void;
  back: () => void | Promise<void>;
}

export interface RouteState {
  clientWidth: number;
  clientHeight: number;
  location: Location;
  prevLocation: Location | null;
  history: RefObject<History>;
  topSafeAreaRef: RefObject<HTMLDivElement | null>;
  bottomSafeAreaRef: RefObject<HTMLDivElement | null>;
  prevPageContentRef: RefObject<HTMLDivElement | null>;
  pageContentRef: RefObject<HTMLDivElement | null>;
  frameRootRef: RefObject<HTMLDivElement | null>;
  onBack: RefObject<{ [K in TransitionType]?: () => Promise<void> }>;
  router: RouterInstance;
  pathRoutes: PathRoute[];
}

export type UseCsrTransition = CsrTransitionStyles & {
  pageBind: (...args: any[]) => ReactDOMAttributes;
  pageClassName: string;
  transDirection: "vertical" | "horizontal" | "none";
  transUnitRange: number[];
  transUnit: SpringValue<number>;
  transPercent: Interpolation<number>;
  transProgress: Interpolation<number>;
};

export type CsrContextType = RouteState & UseCsrTransition;
export const csrContext = createContext<CsrContextType>({} as unknown as CsrContextType);
export const useCsr = () => {
  const contextValues = useContext(csrContext);
  return contextValues;
};

export interface PathContextType {
  pageType: "current" | "prev" | "cached";
  location: Location;
  prefix?: string;
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
}
export const pathContext = createContext<PathContextType>({} as unknown as PathContextType);
export const usePathCtx = () => {
  const contextValues = useContext(pathContext);
  return contextValues;
};

export interface PathRoute {
  path: string;
  pathSegments: string[];
  renderPage: RouteRender;
  pageState: PageState;
  renderRootLayouts: RouteRender[];
  renderLayouts: RouteRender[];
  resolveHead?: ResolveHead;
  isSpecialRoute?: boolean;
}

export interface LayoutFallbackRoute {
  path: string;
  pathSegments: string[];
  renderRootLayouts: RouteRender[];
  renderLayouts: RouteRender[];
}

export interface RouteGuide {
  pathSegment: string;
  pathRoute?: PathRoute;
  children: { [key: string]: RouteGuide };
}
