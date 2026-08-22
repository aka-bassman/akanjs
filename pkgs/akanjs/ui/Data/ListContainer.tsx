"use client";
import { type DataList, ID, Int } from "akanjs/base";
import {
  cn,
  type DataAction,
  type DataColumn,
  type DataTool,
  fetch,
  type ModelInsightProps,
  type ModelProps,
  usePage,
} from "akanjs/client";
import { capitalize } from "akanjs/common";
import { type BaseInsight, ConstantRegistry, labelOf } from "akanjs/constant";
import type { FetchInitForm, SliceMeta } from "akanjs/fetch";
import { st } from "akanjs/store";
import { useScreenScope } from "akanjs/webkit";
import { type ReactNode, useEffect, useState } from "react";
import {
  AiOutlineAppstore,
  AiOutlineFileExcel,
  AiOutlineFileText,
  AiOutlineMore,
  AiOutlinePlus,
  AiOutlineRedo,
  AiOutlineUnorderedList,
} from "react-icons/ai";

import { agentAttrs } from "../agentAttrs";
import { badgeRecipe } from "../Badge";
import { buttonRecipe } from "../Button";
import { Dropdown } from "../Dropdown";
import { Loading } from "../Loading";
import { Model } from "../Model";
import { Select } from "../Select";
import DataCardList from "./CardList";
import { columnKey, downloadBlob, toCsvBlob, toJsonBlob } from "./dataExport";
import { dictLabel } from "./dataText";
import DataTableList from "./TableList";

const controlClassName = "h-9";
const pageLimits = [10, 20, 50, 100];
const menuItemClassName = "flex w-full flex-nowrap justify-start gap-2";

export interface ListContainerProps<
  T extends string,
  State,
  Input,
  Full extends { id: string },
  Light extends { id: string },
> {
  /** Additional classes for the list container. */
  className?: string;
  /** Additional classes for card-list rendering. */
  cardListClassName?: string;
  /** Initial rendering mode. The toolbar toggle switches it from here. */
  type?: "card" | "list";
  /** Static query object passed as the first argument of the generated init action. */
  query?: Record<string, unknown>;
  /** Initial fetch form: page, limit, sort, and the default values a new model starts from. */
  init?: FetchInitForm<Input, any>;
  /** Generated slice metadata for the target model. */
  slice: SliceMeta;
  /** Show create/new-model controls. */
  create?: boolean;
  /** Optional list title. */
  title?: string;
  /** Initial sort value. */
  sort?: unknown;
  /** Table/list columns. */
  columns?: DataColumn<any>[];
  /** Toolbar actions or a factory receiving the loaded list. */
  tools?: DataTool[] | ((modelList: Light[]) => DataTool[]);
  /** Per-row actions or action factory. */
  actions?: DataAction[] | ((item: Light, idx: number) => DataAction[]);
  renderDashboard?: ({
    summary,
    hidePresents,
  }: {
    summary: Record<string, unknown>;
    hidePresents?: boolean;
  }) => ReactNode;
  renderItem?: (props: ModelProps<any, any>) => ReactNode;
  renderTemplate?: (props: any) => ReactNode | null;
  renderTitle?: (model: Full) => string | ReactNode;
  renderView?: (model: Full) => ReactNode | null;
  renderQueryMaker?: () => ReactNode;
  renderInsight?: (props: ModelInsightProps) => ReactNode;
  renderLoading?: () => ReactNode;
}

export default function ListContainer<
  T extends string,
  State,
  Input,
  Full extends { id: string },
  Light extends { id: string },
>({
  className,
  cardListClassName,
  type = "card",
  query,
  init,
  create = true,
  slice,
  title,
  sort,
  columns = ["id", "createdAt", "updatedAt"],
  actions = ["remove", "edit", "view"],
  tools = [],
  renderDashboard,
  renderItem,
  renderTemplate,
  renderTitle,
  renderView,
  renderQueryMaker,
  renderInsight,
  renderLoading,
}: ListContainerProps<T, State, Input, Full, Light>) {
  const { l } = usePage();
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const storeSel = st.sel as <Ret>(selector: (state: unknown) => Ret) => Ret;
  const storeGet = st.get as unknown as <T>() => { [key: string]: T };
  const { refName, sliceName } = slice;
  const [modelName, modelClassName] = [refName, capitalize(refName)];
  if (refName !== sliceName) throw new Error("ListContainer: sliceName must be the same as refName");
  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    modelInsight: `${modelName}Insight`,
    limitOfModel: `limitOf${modelClassName}`,
    sortOfModel: `sortOf${modelClassName}`,
    initModel: `init${modelClassName}`,
    newModel: `new${modelClassName}`,
    refreshModel: `refresh${modelClassName}`,
    setSortOfModel: `setSortOf${modelClassName}`,
    setLimitOfModel: `setLimitOf${modelClassName}`,
    setViewOfModel: `setViewOf${modelClassName}`,
    exportCsvOfModel: `exportCsvOf${modelClassName}`,
    exportJsonOfModel: `exportJsonOf${modelClassName}`,
    editModel: `edit${modelClassName}`,
    viewModel: `view${modelClassName}`,
    removeModel: `remove${modelClassName}`,
    submitModel: `submit${modelClassName}`,
    setModelModal: `set${modelClassName}Modal`,
    resetModel: `reset${modelClassName}`,
    cancelEditOfModel: `cancelEditOf${modelClassName}`,
    closeViewOfModel: `closeViewOf${modelClassName}`,
  };
  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    modelInsight: sliceName.replace(names.model, names.modelInsight),
    limitOfModel: sliceName.replace(names.model, names.limitOfModel),
    sortOfModel: sliceName.replace(names.model, names.sortOfModel),
    initModel: sliceName.replace(names.model, names.initModel),
    newModel: sliceName.replace(names.model, names.newModel),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
    setSortOfModel: sliceName.replace(names.model, names.setSortOfModel),
    setLimitOfModel: sliceName.replace(names.model, names.setLimitOfModel),
    setViewOfModel: sliceName.replace(names.model, names.setViewOfModel),
    exportCsvOfModel: sliceName.replace(names.model, names.exportCsvOfModel),
    exportJsonOfModel: sliceName.replace(names.model, names.exportJsonOfModel),
    editModel: sliceName.replace(names.model, names.editModel),
    viewModel: sliceName.replace(names.model, names.viewModel),
    removeModel: sliceName.replace(names.model, names.removeModel),
    cancelEditOfModel: sliceName.replace(names.model, names.cancelEditOfModel),
    closeViewOfModel: sliceName.replace(names.model, names.closeViewOfModel),
  };
  const [view, setView] = useState(type);
  const limitOfModel = storeUse[namesOfSlice.limitOfModel]() as number;
  const sortOfModel = storeUse[namesOfSlice.sortOfModel]() as string;
  const modelInsight = storeUse[namesOfSlice.modelInsight]() as BaseInsight;
  const modelListLoading = storeUse[namesOfSlice.modelListLoading]() as string | boolean;
  useEffect(() => {
    // The init form rides the argument after the slice's own, so every positional slot has to be filled first.
    const queryArgs = new Array(slice.argLength).fill(null) as unknown[];
    if (query) queryArgs[0] = query;
    void storeDo[namesOfSlice.initModel](...queryArgs, { sort, ...init });
  }, []);

  // Every control in the toolbar, published under the same name its store action already carries. A control the
  // toolbar does not draw withholds its name instead of registering: an unreachable lever is noise in every turn.
  const sortKeys = fetch.sortKeyMap?.get(refName) ?? [];
  const columnTitle = (column: DataColumn<any>) =>
    typeof column !== "string" && column.title
      ? column.title
      : dictLabel(l._, `${sliceName}.${columnKey(column)}`, columnKey(column));
  const loadedList = () => [...(storeGet<DataList<Light>>()[namesOfSlice.modelList] as DataList<Light>)];
  const whileLoaded = () => (modelListLoading ? `The ${modelName} list is still loading.` : true);
  const setViewOfModel = st
    .tool(namesOfSlice.setViewOfModel, {
      desc: `Render the ${modelName} list as cards or as a table.`,
      effect: "state",
    })
    .arg("mode", String, { oneOf: ["card", "list"] })
    .exec((mode) => {
      setView(mode);
    });
  const setSortOfModel = st
    .tool(sortKeys.length > 1 ? namesOfSlice.setSortOfModel : null, {
      desc: `Reorder the ${modelName} list.`,
      effect: "state",
    })
    .arg("sortKey", String, { oneOf: sortKeys })
    .exec((sortKey) => storeDo[namesOfSlice.setSortOfModel](sortKey));
  const setLimitOfModel = st
    .tool(namesOfSlice.setLimitOfModel, {
      desc: `Set how many ${modelName} rows one page holds.`,
      effect: "state",
    })
    .arg("limit", Int, { oneOf: pageLimits })
    .exec((limit) => storeDo[namesOfSlice.setLimitOfModel](limit));
  const refreshModel = st
    .tool(namesOfSlice.refreshModel, { desc: `Reload the ${modelName} list from the server.`, effect: "query" })
    .exec(() => storeDo[namesOfSlice.refreshModel]());
  const newModel = st
    .tool(renderTemplate && create ? namesOfSlice.newModel : null, {
      desc: `Open the form that creates a ${modelName}.`,
      effect: "state",
    })
    .exec(() => storeDo[namesOfSlice.newModel]());
  const exportCsvOfModel = st
    .tool(namesOfSlice.exportCsvOfModel, {
      desc: `Download the loaded page of ${modelName} rows as a CSV file.`,
      effect: "state",
      guard: whileLoaded,
    })
    .exec(() => {
      downloadBlob(toCsvBlob(columns, loadedList() as Record<string, unknown>[], columnTitle), `${sliceName}.csv`);
    });
  const exportJsonOfModel = st
    .tool(namesOfSlice.exportJsonOfModel, {
      desc: `Download the loaded page of ${modelName} rows as a JSON file.`,
      effect: "state",
      guard: whileLoaded,
    })
    .exec(() => {
      downloadBlob(toJsonBlob(loadedList()), `${sliceName}.json`);
    });

  // Row buttons and modal buttons, owned here because both render once per row — fifty rows would be fifty
  // registrations of one name. The id an agent passes comes from the `items` resource opened just below.
  // A `actions` factory decides per row, so nothing here can tell which verbs the screen actually draws: it
  // publishes none rather than offering a button some rows do not have.
  const rowActions = Array.isArray(actions) ? actions : [];
  st.tool(rowActions.includes("edit") && renderTemplate ? namesOfSlice.editModel : null, {
    desc: `Open one ${modelName} in the edit form.`,
    effect: "state",
  })
    .arg("modelId", ID)
    .exec((modelId) => storeDo[namesOfSlice.editModel](modelId));
  st.tool(rowActions.includes("view") && renderView ? namesOfSlice.viewModel : null, {
    desc: `Open one ${modelName} in the detail view.`,
    effect: "state",
  })
    .arg("modelId", ID)
    .exec((modelId) => storeDo[namesOfSlice.viewModel](modelId));
  st.tool(rowActions.includes("remove") ? namesOfSlice.removeModel : null, {
    desc: `Remove one ${modelName}.`,
    effect: "mutation",
  })
    .arg("modelId", ID)
    .exec((modelId) => storeDo[namesOfSlice.removeModel](modelId));
  st.tool(renderTemplate ? names.submitModel : null, {
    desc: `Save the ${modelName} the edit form holds.`,
    effect: "mutation",
  }).exec(() => storeDo[names.submitModel]({ sliceName }));
  st.tool(renderTemplate ? namesOfSlice.cancelEditOfModel : null, {
    desc: `Close the ${modelName} edit form without saving.`,
    effect: "state",
  }).exec(() => storeDo[names.setModelModal](null));
  st.tool(renderView ? namesOfSlice.closeViewOfModel : null, {
    desc: `Close the ${modelName} detail view.`,
    effect: "state",
  }).exec(() => storeDo[names.resetModel]());
  const scopePath = useScreenScope({
    id: sliceName,
    kind: refName,
    items: () =>
      [...(storeGet<DataList<Light>>()[namesOfSlice.modelList] as DataList<Light>)].map((item) => {
        const label = labelOf(ConstantRegistry.getDatabase(refName).full, item);
        return { id: item.id, ...(label ? { label } : {}) };
      }),
  });

  const modelLabel = dictLabel(l._, `${sliceName}.modelName`, refName);
  const RenderTitle = renderTitle ?? ((model: Full) => `${modelLabel} - ${model.id ? model.id : "New"}`);
  const ModelDashboard = (): ReactNode => {
    const Stat = renderDashboard;
    // `summary` is an app-level state key, not a generated one: read it off the state so a store without it
    // renders nothing instead of calling an accessor that does not exist.
    const summary = storeSel<Record<string, unknown> | undefined>(
      (state) => (state as { summary?: Record<string, unknown> }).summary,
    );
    const summaryLoading = storeSel<boolean>((state) => !!(state as { summaryLoading?: boolean }).summaryLoading);
    if (!Stat || !summary) return null;
    return summaryLoading ? <Loading.Skeleton className="mb-4" active /> : <Stat summary={summary} hidePresents />;
  };
  const RenderQueryMaker = renderQueryMaker;
  const RenderInsight = (): ReactNode => (renderInsight ? renderInsight({ insight: modelInsight }) : null);
  const RenderTemplate = renderTemplate;
  const RenderTools = (): ReactNode => {
    const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
    const toolList: DataTool[] = modelListLoading
      ? []
      : [
          ...(Array.isArray(tools) ? tools : tools([...modelList])),
          {
            key: "export-csv",
            render: () => (
              <button
                type="button"
                className={buttonRecipe({ variant: "ghost", size: "sm" }, menuItemClassName)}
                onClick={exportCsvOfModel}
                {...agentAttrs(exportCsvOfModel)}
              >
                <AiOutlineFileExcel />
                <span>{l("base.exportCsv")}</span>
              </button>
            ),
          },
          {
            key: "export-json",
            render: () => (
              <button
                type="button"
                className={buttonRecipe({ variant: "ghost", size: "sm" }, menuItemClassName)}
                onClick={exportJsonOfModel}
                {...agentAttrs(exportJsonOfModel)}
              >
                <AiOutlineFileText />
                <span>{l("base.exportJson")}</span>
              </button>
            ),
          },
        ];
    return (
      <Dropdown
        buttonClassName={buttonRecipe({ variant: "outline", size: "icon" }, ["size-9", controlClassName])}
        value={<AiOutlineMore />}
        content={toolList.map((tool) => (
          <li key={tool.key}>
            <tool.render />
          </li>
        ))}
      />
    );
  };
  const RenderSort = (): ReactNode => {
    if (sortKeys.length < 2) return null;
    return (
      <Select<string>
        className="w-36 min-w-0"
        selectClassName={cn("min-h-0", controlClassName)}
        value={sortOfModel}
        options={sortKeys.map((sortKey) => ({
          label: dictLabel(l._, `${refName}.sort.${sortKey}`, sortKey),
          value: sortKey,
        }))}
        onChange={setSortOfModel}
      />
    );
  };
  return (
    <div className={cn("w-full p-4", className)} data-agent-scope={scopePath}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate font-semibold text-foreground text-xl tracking-tight">{title ?? modelLabel}</h2>
          <span className={badgeRecipe({ variant: "outline", size: "sm" }, "tabular-nums")}>
            {modelInsight.count.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-field border border-border p-0.5">
            {(["card", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                title={mode === "card" ? l("base.cardView") : l("base.tableView")}
                className={buttonRecipe({ variant: view === mode ? "default" : "ghost", size: "sm" }, "h-8 px-2.5")}
                onClick={() => {
                  void setViewOfModel(mode);
                }}
                {...agentAttrs(setViewOfModel)}
              >
                {mode === "card" ? <AiOutlineAppstore /> : <AiOutlineUnorderedList />}
                <span className="sr-only">{mode === "card" ? l("base.cardView") : l("base.tableView")}</span>
              </button>
            ))}
          </div>
          <RenderSort />
          <Select<number>
            className="w-36 min-w-0"
            selectClassName={cn("min-h-0", controlClassName)}
            value={limitOfModel}
            options={pageLimits.map((limit) => ({
              label: `${limit} ${l("base.perPage")}`,
              value: limit,
            }))}
            onChange={setLimitOfModel}
          />
          <button
            type="button"
            title={l("base.refresh")}
            className={buttonRecipe({ variant: "outline", size: "icon" }, ["size-9", controlClassName])}
            onClick={refreshModel}
            {...agentAttrs(refreshModel)}
          >
            <AiOutlineRedo className={modelListLoading ? "animate-spin" : ""} />
          </button>
          <RenderTools />
          {renderTemplate && create ? (
            <button
              type="button"
              onClick={newModel}
              {...agentAttrs(newModel)}
              className={buttonRecipe({ variant: "primary", size: "sm" }, controlClassName)}
            >
              <AiOutlinePlus /> {l("base.new")}
            </button>
          ) : null}
        </div>
      </div>
      {query ? null : <ModelDashboard />}
      {RenderQueryMaker ? <RenderQueryMaker /> : null}
      <RenderInsight />
      {view === "card" ? (
        <DataCardList
          slice={slice}
          renderItem={renderItem ?? (() => null)}
          renderLoading={renderLoading}
          renderTemplate={renderTemplate}
          renderView={renderView}
          renderTitle={RenderTitle}
          columns={columns}
          actions={actions}
          cardListClassName={cardListClassName}
        />
      ) : (
        <DataTableList
          columns={columns}
          slice={slice}
          actions={actions}
          renderTemplate={renderTemplate}
          renderTitle={RenderTitle}
          renderView={renderView}
        />
      )}
      <Model.EditModal slice={slice} renderTitle={RenderTitle}>
        {RenderTemplate ? <RenderTemplate /> : null}
      </Model.EditModal>
    </div>
  );
}
