"use client";
import type { RouteRender } from "akanjs/client";
import { createElement, memo, type ReactNode, useRef } from "react";
import { useFetch } from "./useFetch";

interface RenderLayerProps {
  renders: RouteRender[];
  index: number;
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
  leaf?: ReactNode;
}
export const RenderLayer = memo(({ renders, index, params, searchParams, leaf = null }: RenderLayerProps) => {
  const isLast = index >= renders.length - 1;
  const children = isLast ? (
    leaf
  ) : (
    <RenderLayer renders={renders} index={index + 1} params={params} searchParams={searchParams} leaf={leaf} />
  );
  const routeRender = renders[index];
  const isAsyncRender = isAsyncRouteRender(routeRender);
  const resultRef = useRef<ReactNode | Promise<ReactNode> | null>(null);
  if (isAsyncRender && resultRef.current === null) {
    resultRef.current = routeRender?.render({ children, params, searchParams } as never) ?? null;
  }
  const { fulfilled, value } = useFetch(resultRef.current);
  if (!routeRender) return null;
  if (!isAsyncRender) return createElement(routeRender.render as never, { children, params, searchParams } as never);
  if (!fulfilled || !value) return <>{composeLoadingFallback(renders.slice(index), params)}</>;
  return value;
});

function isAsyncRouteRender(routeRender?: RouteRender): boolean {
  return Boolean(routeRender?.isAsync || routeRender?.render.constructor.name === "AsyncFunction");
}

function composeLoadingFallback(renders: RouteRender[], params: Record<string, string>): ReactNode {
  let element: ReactNode = null;
  for (let i = renders.length - 1; i >= 0; i--) {
    const Loading = renders[i]?.Loading;
    if (!Loading) continue;
    element = Loading({ params, children: element } as never) as ReactNode;
  }
  return element;
}
