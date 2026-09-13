"use client";
import { DataList } from "akanjs/base";
import { cn } from "akanjs/client";
import { capitalize, type DynamicRecord, isQueryEqual, lowerlize } from "akanjs/common";
import type { BaseInsight } from "akanjs/constant";
import { ConstantRegistry, labelOf, withSharedInstances } from "akanjs/constant";
import type { ClientInit, ServerInit } from "akanjs/fetch";
import { st } from "akanjs/store";
import { usePageTool, useScreenScope } from "akanjs/webkit";
import { type ReactNode, type RefObject, useEffect, useMemo, useRef } from "react";

import { Empty } from "../Empty";
import { Loading } from "../Loading";
import { More } from "../More";
import Stream from "./Stream";

interface DefaultProps<L extends { id: string }> {
  containerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  style?: React.CSSProperties;
  noDiv?: boolean;
  from?: number;
  to?: number;
  loading?: ReactNode;
  filter?: (item: L, idx: number) => boolean;
  sort?: (a: L, b: L) => number;
  /** Placeholder for a slice with no rows. Takes precedence over `renderEmpty`. */
  empty?: ReactNode;
  renderEmpty?: null | (() => ReactNode) | false;
  renderItem?: (item: L, idx: number) => ReactNode;
  renderList?: (list: DataList<L>) => ReactNode;
  reverse?: boolean;
  pagination?: boolean;
  /** Max age in ms of the cached slice data before the client refetches on mount; `0` always refetches. */
  staleTime?: number;
}

interface UnitsProps<RefName extends string, Light extends { id: string }> extends DefaultProps<Light> {
  init: ClientInit<RefName, Light>;
}

interface RenderProps<RefName extends string, Light extends { id: string }> extends DefaultProps<Light> {
  init: ServerInit<RefName, Light>;
}

function Render<RefName extends string, Light extends { id: string }>({
  containerRef,
  className,
  style,
  init,
  noDiv,
  from,
  to,
  loading,
  empty,
  renderItem,
  renderList,
  renderEmpty = noDiv
    ? () => null
    : () => (
        <div className="flex size-full items-center justify-center">
          <Empty />
        </div>
      ),
  filter = () => true,
  sort = (a, b) => 1,
  reverse,
  pagination,
  staleTime,
}: RenderProps<RefName, Light>) {
  const loadedQueryArgs = useRef<object[] | null>(null);
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const storeGet = st.get as unknown as <T>() => { [key: string]: T };
  const { refName, sliceName } = init;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const cnst = ConstantRegistry.getDatabase(refName);
  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    modelInsight: `${modelName}Insight`,
    modelInitList: `${modelName}InitList`,
    modelInitAt: `${modelName}InitAt`,
    modelStaleAt: `${modelName}StaleAt`,
    modelObjList: `${modelName}ObjList`,
    modelObjInsight: `${modelName}ObjInsight`,
    pageOfModel: `pageOf${ModelName}`,
    lastPageOfModel: `lastPageOf${ModelName}`,
    limitOfModel: `limitOf${ModelName}`,
    hasMoreOfModel: `hasMoreOf${ModelName}`,
    isCumulativeOfModel: `isCumulativeOf${ModelName}`,
    queryArgsOfModel: `queryArgsOf${ModelName}`,
    sortOfModel: `sortOf${ModelName}`,
    setPageOfModel: `setPageOf${ModelName}`,
    loadMoreOfModel: `loadMoreOf${ModelName}`,
    refreshModel: `refresh${ModelName}`,
    watchLiveModel: `watchLive${ModelName}`,
  };
  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    modelInitList: sliceName.replace(names.model, names.modelInitList),
    modelInitAt: sliceName.replace(names.model, names.modelInitAt),
    modelStaleAt: sliceName.replace(names.model, names.modelStaleAt),
    modelInsight: sliceName.replace(names.model, names.modelInsight),
    pageOfModel: sliceName.replace(names.model, names.pageOfModel),
    lastPageOfModel: sliceName.replace(names.model, names.lastPageOfModel),
    limitOfModel: sliceName.replace(names.model, names.limitOfModel),
    hasMoreOfModel: sliceName.replace(names.model, names.hasMoreOfModel),
    isCumulativeOfModel: sliceName.replace(names.model, names.isCumulativeOfModel),
    queryArgsOfModel: sliceName.replace(names.model, names.queryArgsOfModel),
    sortOfModel: sliceName.replace(names.model, names.sortOfModel),
    setPageOfModel: sliceName.replace(names.model, names.setPageOfModel),
    loadMoreOfModel: sliceName.replace(names.model, names.loadMoreOfModel),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
    watchLiveModel: sliceName.replace(names.model, names.watchLiveModel),
  };
  const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
  const modelListLoading = storeUse[namesOfSlice.modelListLoading]() as string | boolean;
  const initQueryArgs = (init as DynamicRecord)[names.queryArgsOfModel] as object[];
  const initModelInitAt = (init as DynamicRecord)[names.modelInitAt] as Date;
  const initModelObjInsight = (init as DynamicRecord)[names.modelObjInsight] as BaseInsight | null;
  const initLimitOfModel = (init as DynamicRecord)[names.limitOfModel] as number;
  const initPageOfModel = (init as DynamicRecord)[names.pageOfModel] as number;
  const initHasMoreOfModel = (init as DynamicRecord)[names.hasMoreOfModel] as boolean;
  const initSignature = JSON.stringify(initQueryArgs);

  const useCache =
    !modelListLoading &&
    isQueryEqual(storeGet<object[]>()[namesOfSlice.queryArgsOfModel], initQueryArgs) &&
    storeGet<Date>()[namesOfSlice.modelInitAt].getTime() >= initModelInitAt.getTime();
  if (useCache) loadedQueryArgs.current = initQueryArgs;
  // Hydration identity is the args, not the mount: one slice store is shared by every route that reads it, and a
  // route change swaps `init` on the same instance, so a boolean latch would keep rendering the previous args' rows.
  const loaded = !!loadedQueryArgs.current && isQueryEqual(loadedQueryArgs.current, initQueryArgs);

  const modelInitList = useMemo<DataList<Light>>(() => {
    if (loaded) return modelList;
    const initModelObjList = (init as DynamicRecord)[names.modelObjList] as Light[];
    return new DataList<Light>(
      withSharedInstances(() => initModelObjList.map((model) => new cnst.light().set(model) as unknown as Light)),
    );
  }, [initSignature]);

  useEffect(() => {
    if (loaded) return;
    const modelObjInsight = (init as DynamicRecord)[names.modelObjInsight] as BaseInsight | null;
    // `{ insight: false }` skips the aggregate query, so the rows in hand are the whole count there is to seed.
    const insight = new cnst.insight().set(
      modelObjInsight ?? { count: modelInitList.length },
    ) as unknown as BaseInsight;
    const initPageOfModel = (init as DynamicRecord)[names.pageOfModel] as number;
    const initLastPageOfModel = (init as DynamicRecord)[names.lastPageOfModel] as number;
    const initLimitOfModel = (init as DynamicRecord)[names.limitOfModel] as number;
    const initQueryArgsOfModel = (init as DynamicRecord)[names.queryArgsOfModel] as object[];
    const initSortOfModel = (init as DynamicRecord)[names.sortOfModel] as string;
    st.set({
      [namesOfSlice.modelList]: modelInitList,
      [namesOfSlice.modelInitList]: modelInitList,
      [namesOfSlice.modelInitAt]: initModelInitAt,
      [namesOfSlice.modelListLoading]: false,
      [namesOfSlice.modelInsight]: insight,
      [namesOfSlice.pageOfModel]: initPageOfModel,
      [namesOfSlice.lastPageOfModel]: initLastPageOfModel,
      [namesOfSlice.limitOfModel]: initLimitOfModel,
      // The route rendered one window, so whatever this store accumulated under previous args is not what is
      // on screen any more.
      [namesOfSlice.hasMoreOfModel]: initHasMoreOfModel,
      [namesOfSlice.isCumulativeOfModel]: false,
      [namesOfSlice.queryArgsOfModel]: initQueryArgsOfModel,
      [namesOfSlice.sortOfModel]: initSortOfModel,
    });
    loadedQueryArgs.current = initQueryArgs;
  }, [initSignature]);

  // A no-op on a slice that did not declare `.live()`, which is why it is called without asking first.
  //
  // The room follows the store's arguments rather than the ones this route hydrated with: a filter applied
  // in the browser writes `queryArgsOf<Model><Slice>` and leaves `init` exactly as it was, so keying on `init`
  // alone left the room subscribed to the unfiltered list while the screen showed a filtered one. Read inside
  // the effect, because the hydration effect above runs first in the same commit and this render's value is
  // still the pre-hydration default.
  const queryArgsSignature = JSON.stringify(storeUse[namesOfSlice.queryArgsOfModel]());
  useEffect(() => {
    void storeDo[namesOfSlice.watchLiveModel](storeGet<object[]>()[namesOfSlice.queryArgsOfModel] ?? initQueryArgs);
    return () => {
      void storeDo[namesOfSlice.watchLiveModel](null);
    };
  }, [initSignature, queryArgsSignature]);

  useEffect(() => {
    const modelStaleAt = storeGet<Date>()[namesOfSlice.modelStaleAt];
    const staleThreshold = Math.max(modelStaleAt.getTime(), staleTime === undefined ? 0 : Date.now() - staleTime);
    if (storeGet<Date>()[namesOfSlice.modelInitAt].getTime() >= staleThreshold) return;
    if (storeGet<boolean>()[namesOfSlice.modelListLoading]) return;
    void storeDo[namesOfSlice.refreshModel]({ invalidate: true });
  }, [initSignature]);

  const modelInsight = storeUse[namesOfSlice.modelInsight]() as BaseInsight;
  const limitOfModel = storeUse[namesOfSlice.limitOfModel]() as number;
  const pageOfModel = storeUse[namesOfSlice.pageOfModel]() as number;
  const hasMoreOfModel = storeUse[namesOfSlice.hasMoreOfModel]() as boolean;
  const insight = loaded ? modelInsight : initModelObjInsight;
  const limit = loaded ? limitOfModel : initLimitOfModel;
  const page = loaded ? pageOfModel : initPageOfModel;
  const total = insight?.count ?? (loaded ? modelList : modelInitList).length;
  const moreProps = {
    total,
    currentPage: page,
    itemsPerPage: limit || total,
    hasMore: loaded ? hasMoreOfModel : initHasMoreOfModel,
    onLoadMore: async () => {
      await storeDo[namesOfSlice.loadMoreOfModel]();
    },
    onPageSelect: (page: number, option?: { scrollToTop?: boolean }) => {
      void storeDo[namesOfSlice.setPageOfModel](page);
      // if (scrollToTop) {
      if (option?.scrollToTop !== false) {
        window.parent.postMessage({ type: "pathChange", page }, "*");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      // }
    },
    reverse,
  };
  usePageTool({
    name: pagination && total > limit ? namesOfSlice.setPageOfModel : null,
    model: modelName,
    page,
    lastPage: Math.ceil(total / (limit || total || 1)),
    total,
    onSelect: (page) => moreProps.onPageSelect(page, { scrollToTop: false }),
  });

  const modelDataList = !loaded ? modelInitList.filter(filter).sort(sort) : modelList.filter(filter).sort(sort);
  const scopePath = useScreenScope({
    id: sliceName,
    kind: refName,
    items: () =>
      modelDataList.map((item) => {
        const label = labelOf(cnst.full, item);
        return { id: item.id, ...(label ? { label } : {}) };
      }),
  });
  const showLoading = loaded && modelListLoading;
  if (renderList)
    return (
      <>
        {modelDataList.length || renderEmpty === false ? (
          <ContainerWrapper
            containerRef={containerRef}
            className={cn(className, modelDataList.length === 0 && "grid-cols-1 md:grid-cols-1 lg:grid-cols-1")}
            noDiv={noDiv}
            pagination={pagination}
            moreProps={moreProps}
            scope={scopePath}
          >
            {renderList(modelDataList)}
          </ContainerWrapper>
        ) : empty !== undefined ? (
          empty
        ) : typeof renderEmpty === "function" ? (
          renderEmpty()
        ) : null}
        {showLoading ? (loading ?? <Loading.Area />) : null}
      </>
    );
  else if (!renderItem) throw new Error("renderItem is required");

  const RenderItem = ({ model, idx }: { model: Light; idx: number }) => renderItem(model, idx);
  return (
    <>
      <ContainerWrapper
        containerRef={containerRef}
        className={className}
        noDiv={noDiv}
        pagination={pagination}
        moreProps={moreProps}
        scope={scopePath}
      >
        {modelDataList.length
          ? (reverse ? [...modelDataList].reverse() : modelDataList)
              .slice(from ?? 0, to ?? modelDataList.length + 1)
              .map((model: Light, idx: number) => <RenderItem key={model.id} model={model} idx={idx} />)
          : empty !== undefined
            ? empty
            : typeof renderEmpty === "function"
              ? renderEmpty()
              : null}
      </ContainerWrapper>
      {showLoading ? (loading ?? <Loading.Area />) : null}
    </>
  );
}

export default function Units<RefName extends string, Light extends { id: string }>({
  containerRef,
  className,
  init,
  noDiv,
  from,
  to,
  loading,
  empty,
  renderItem,
  renderList,
  renderEmpty = noDiv
    ? () => null
    : () => (
        <div className="flex size-full items-center justify-center">
          <Empty />
        </div>
      ),
  filter = () => true,
  sort = (a, b) => 1,
  reverse,
  style,
  pagination = true,
  staleTime,
}: UnitsProps<RefName, Light>) {
  const props: UnitsProps<RefName, Light> = {
    containerRef,
    className,
    style,
    init,
    noDiv,
    from,
    to,
    loading,
    empty,
    renderItem,
    renderList,
    renderEmpty,
    filter,
    sort,
    reverse,
    pagination,
    staleTime,
  };

  return (
    <Stream
      of={init}
      fallback={
        loading === undefined ? (
          <div className="flex size-full items-center justify-center">
            <Loading.Skeleton active />
          </div>
        ) : (
          loading
        )
      }
    >
      {(serverInit) =>
        serverInit ? (
          <Render {...props} init={serverInit} />
        ) : empty !== undefined ? (
          empty
        ) : renderEmpty ? (
          renderEmpty()
        ) : (
          <div className="flex size-full items-center justify-center">
            <Empty />
          </div>
        )
      }
    </Stream>
  );
}

interface MoreProps {
  total: number;
  itemsPerPage: number;
  currentPage: number;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onPageSelect: (page: number, option?: { scrollToTop?: boolean }) => void;
  children?: React.ReactNode;
  className?: string;
  reverse?: boolean;
}

interface MoreWrapperProps {
  children: ReactNode;
  pagination?: boolean;
  moreProps: MoreProps;
}
const MoreWrapper = ({ children, pagination, moreProps }: MoreWrapperProps) => {
  return pagination ? <More {...moreProps}>{children}</More> : children;
};

interface ContainerWrapperProps {
  children: ReactNode;
  className?: string;
  containerRef?: RefObject<HTMLDivElement | null>;
  noDiv?: boolean;
  pagination?: boolean;
  moreProps: MoreProps;
  scope?: string;
}
const ContainerWrapper = ({
  children,
  className,
  containerRef,
  noDiv,
  pagination,
  moreProps,
  scope,
}: ContainerWrapperProps) => {
  return noDiv ? (
    <MoreWrapper pagination={pagination} moreProps={moreProps}>
      {children}
    </MoreWrapper>
  ) : pagination ? (
    <MoreWrapper pagination={pagination} moreProps={moreProps}>
      <div ref={containerRef} className={className} data-agent-scope={scope}>
        {children}
      </div>
    </MoreWrapper>
  ) : (
    <div ref={containerRef} className={className} data-agent-scope={scope}>
      <MoreWrapper pagination={pagination} moreProps={moreProps}>
        {children}
      </MoreWrapper>
    </div>
  );
};
