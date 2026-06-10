import type {
  Head,
  LayoutErrorRender,
  LayoutFallbackRoute,
  LayoutNotFoundRender,
  PathRoute,
  ResolvedHead,
  RouteRender,
} from "akanjs/client";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, Suspense } from "react";
import { resolveHeadResult } from "./metadata";

export class RouteElementComposer {
  static compose({
    pathRoute,
    params,
    searchParams,
  }: {
    pathRoute: PathRoute;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
  }): ReactNode {
    const renders = [...pathRoute.renderRootLayouts, ...pathRoute.renderLayouts, pathRoute.renderPage];
    let element: ReactNode = null;
    for (let i = renders.length - 1; i >= 0; i--) {
      const routeRender = renders[i];
      if (!routeRender) continue;
      element = (
        <Suspense fallback={RouteElementComposer.#composeLoadingFallback(renders.slice(i), params)}>
          <RouteElementComposer.AsyncRender routeRender={routeRender} params={params} searchParams={searchParams}>
            {element}
          </RouteElementComposer.AsyncRender>
        </Suspense>
      );
    }
    return element;
  }

  static async resolveHead({
    pathRoute,
    params,
    searchParams,
  }: {
    pathRoute: PathRoute;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
  }): Promise<Head | null | undefined> {
    return (
      await RouteElementComposer.resolveHeadWithMetadata({
        pathRoute,
        params,
        searchParams,
      })
    ).node;
  }

  static async resolveHeadWithMetadata({
    pathRoute,
    params,
    searchParams,
  }: {
    pathRoute: PathRoute;
    params: Record<string, string>;
    searchParams: Record<string, string[] | string>;
  }): Promise<ResolvedHead> {
    return resolveHeadResult(await pathRoute.resolveHead?.({ params, searchParams }));
  }

  static async composeFallback({
    kind,
    route,
    params,
    searchParams,
    pathname,
    error,
    digest,
  }: {
    kind: "not-found" | "error";
    route: PathRoute | LayoutFallbackRoute;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
    pathname: string;
    error?: unknown;
    digest?: string;
  }): Promise<ReactNode | null> {
    const layoutStack = [...route.renderRootLayouts, ...route.renderLayouts];
    for (let index = layoutStack.length - 1; index >= 0; index--) {
      const layoutRender = layoutStack[index];
      if (!layoutRender) continue;
      const fallback =
        kind === "not-found" ? await layoutRender.resolveNotFound?.() : await layoutRender.resolveError?.();
      if (!fallback) continue;
      const renders = [
        ...layoutStack.slice(0, index + 1),
        RouteElementComposer.#makeFallbackRouteRender({
          kind,
          fallback,
          params,
          searchParams,
          pathname,
          error,
          digest,
        }),
      ];
      return RouteElementComposer.composeRenders({ renders, params, searchParams });
    }
    return null;
  }

  static composeRenders({
    renders,
    params,
    searchParams,
  }: {
    renders: RouteRender[];
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
  }): ReactNode {
    let element: ReactNode = null;
    for (let i = renders.length - 1; i >= 0; i--) {
      const routeRender = renders[i];
      if (!routeRender) continue;
      element = (
        <Suspense fallback={RouteElementComposer.#composeLoadingFallback(renders.slice(i), params)}>
          <RouteElementComposer.AsyncRender routeRender={routeRender} params={params} searchParams={searchParams}>
            {element}
          </RouteElementComposer.AsyncRender>
        </Suspense>
      );
    }
    return element;
  }

  static async renderAsync({
    routeRender,
    children,
    params,
    searchParams,
  }: {
    routeRender: RouteRender;
    children: ReactNode;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
  }) {
    const node = await routeRender.render({ children, params, searchParams } as never);
    return RouteElementComposer.#normalizeReactNode(node);
  }

  static AsyncRender = (props: {
    routeRender: RouteRender;
    children: ReactNode;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
  }) => RouteElementComposer.renderAsync(props);

  static #makeFallbackRouteRender({
    kind,
    fallback,
    pathname,
    error,
    digest,
  }: {
    kind: "not-found" | "error";
    fallback: LayoutNotFoundRender | LayoutErrorRender;
    params: Record<string, string>;
    searchParams: Record<string, string | string[]>;
    pathname: string;
    error?: unknown;
    digest?: string;
  }): RouteRender {
    return {
      render: (props: { params: Record<string, string>; searchParams: Record<string, string | string[]> }) => {
        const { params, searchParams } = props as {
          params: Record<string, string>;
          searchParams: Record<string, string | string[]>;
        };
        return kind === "not-found"
          ? (fallback as LayoutNotFoundRender)({ params, searchParams, pathname })
          : (fallback as LayoutErrorRender)({ params, searchParams, pathname, error, digest });
      },
    };
  }

  static #normalizeReactNode(node: ReactNode): ReactNode {
    if (Array.isArray(node)) return Children.toArray(node).map(RouteElementComposer.#normalizeReactNode);
    if (!isValidElement(node)) return node;

    const props = node.props as { children?: ReactNode };
    if (!("children" in props)) return node;

    const normalizedChildren = RouteElementComposer.#normalizeReactChildren(props.children);
    if (normalizedChildren === props.children) return node;

    return cloneElement(node as ReactElement<{ children?: ReactNode }>, undefined, normalizedChildren);
  }

  static #normalizeReactChildren(children: ReactNode): ReactNode {
    if (Array.isArray(children)) return Children.toArray(children).map(RouteElementComposer.#normalizeReactNode);
    return RouteElementComposer.#normalizeReactNode(children);
  }

  static #composeLoadingFallback(renders: RouteRender[], params: Record<string, string>): ReactNode {
    let element: ReactNode = null;
    for (let i = renders.length - 1; i >= 0; i--) {
      const Loading = renders[i]?.Loading;
      if (!Loading) continue;
      element = Loading({ params, children: element } as never) as ReactNode;
    }
    return element;
  }
}
