"use client";
import type { DataList } from "akanjs/base";
import { cn } from "akanjs/client";
import { capitalize, lowerlize } from "akanjs/common";
import type { SliceMeta } from "akanjs/fetch";
import { st, useFieldTool, useRelationFieldTool } from "akanjs/store";
import type { ReactNode } from "react";
import { agentAttrs } from "../agentAttrs";
import { Select } from "../Select";
import { Label } from "./Label";

interface ParentProps<Light> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  selectClassName?: string;
  className?: string;
  disabled?: boolean;
  nullable?: boolean;
  initArgs?: any[];
  value: Light | null;
  slice: SliceMeta;
  onChange: (value: Light | null) => void;
  onSearch?: (text: string) => void;
  sortOption?: (a: Light, b: Light) => number;
  renderOption: (model: Light) => ReactNode;
  renderSelected?: (value: Light) => ReactNode;
}
/** The one line an option renders as, so an agent can match an id against what it reads on screen. */
const optionLabel = <Light extends { id: string }>(model: Light, render: (model: Light) => ReactNode) => {
  const rendered = render(model);
  return typeof rendered === "string" ? rendered : model.id;
};

export const Parent = <Light extends { id: string }>({
  label,
  desc,
  labelClassName,
  selectClassName,
  className,
  nullable,
  disabled,
  initArgs,
  slice,
  value,
  onChange,
  onSearch,
  sortOption,
  renderOption,
  renderSelected = renderOption,
}: ParentProps<Light>) => {
  const { refName, sliceName } = slice;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const storeGet = st.get as unknown as <V>() => { [key: string]: V };

  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    refreshModel: `refresh${ModelName}`,
  };

  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
  };

  const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
  useRelationFieldTool(onChange, {
    read: () => storeGet<DataList<Light>>()[namesOfSlice.modelList],
    load: () => storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs }),
    label: (model) => optionLabel(model, renderOption),
    disabled,
  });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select<string | null, false, true>
        label={label}
        desc={desc}
        labelClassName={labelClassName}
        selectClassName={selectClassName}
        value={value?.id ?? null}
        searchable
        options={modelList.map((model) => {
          const render = renderOption(model);
          return { label: typeof render === "string" ? render : model.id, value: model.id };
        })}
        renderOption={(modelId) => {
          if (!modelId) return null;
          const model = modelList.get(modelId);
          if (!model) return null;
          return renderOption(model);
        }}
        renderSelected={(modelId) => {
          if (!modelId) return null;
          const model = modelList.get(modelId);
          if (!model) return null;
          return renderSelected(model);
        }}
        onChange={(modelId) => {
          if (modelId) onChange(modelList.get(modelId) ?? null);
          else onChange(null);
        }}
        onOpen={() => {
          if (disabled) return;
          void storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs });
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

interface ParentIdProps<Light> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
  nullable?: boolean;
  initArgs?: any[];
  value: string | null;
  slice: SliceMeta;
  onChange: (id: string | null, model: Light | null) => void;
  onSearch?: (text: string) => void;
  sortOption?: (a: Light, b: Light) => number;
  renderOption?: (model: Light) => ReactNode;
  renderSelected?: (value: Light) => ReactNode;
}
export const ParentId = <Light extends { id: string }>({
  label,
  desc,
  className,
  selectClassName,
  labelClassName,
  nullable,
  disabled,
  initArgs,
  slice,
  value,
  onChange,
  onSearch,
  sortOption,
  renderOption,
  renderSelected = renderOption,
}: ParentIdProps<Light>) => {
  const { refName, sliceName } = slice;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    refreshModel: `refresh${ModelName}`,
  };
  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
  };
  const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
  // The id *is* the value here, so the ordinary field setter describes it — no lookup, unlike `Parent`.
  useFieldTool(onChange, { disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select<string | null, false, true>
        searchable
        desc={desc}
        label={label}
        labelClassName={labelClassName}
        selectClassName={selectClassName}
        value={value}
        options={modelList.map((model) => model.id)}
        renderOption={(renderId) => {
          if (!renderId) return null;
          const model = modelList.get(renderId);
          if (!model) return null;
          return renderOption?.(model) ?? null;
        }}
        renderSelected={(renderId) => {
          if (!renderId) return null;
          const model = modelList.get(renderId);
          if (!model) return null;
          return renderSelected?.(model) ?? null;
        }}
        onOpen={() => {
          if (disabled) return;
          void storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs });
        }}
        onChange={(modelId) => {
          if (modelId) onChange(modelId, modelList.get(modelId) ?? null);
          else onChange(null, null);
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

interface ChildrenProps<Light> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  selectClassName?: string;
  className?: string;
  disabled?: boolean;
  nullable?: boolean;
  initArgs?: any[];
  value: Light[] | null;
  onChange: (value: Light[]) => void;
  onSearch?: (text: string) => void;
  slice: SliceMeta;
  sortOption?: (a: Light, b: Light) => number;
  renderOption: (model: Light) => ReactNode;
  renderSelected?: (value: Light) => ReactNode;
}
export const Children = <Light extends { id: string }>({
  label,
  desc,
  labelClassName,
  selectClassName,
  className,
  nullable,
  disabled,
  initArgs,
  slice,
  value,
  onChange,
  onSearch,
  sortOption,
  renderOption,
  renderSelected = renderOption,
}: ChildrenProps<Light>) => {
  const { refName, sliceName } = slice;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const storeGet = st.get as unknown as <T>() => { [key: string]: T };
  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    refreshModel: `refresh${ModelName}`,
  };
  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
  };
  const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
  useRelationFieldTool(onChange, {
    read: () => storeGet<DataList<Light>>()[namesOfSlice.modelList],
    load: () => storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs }),
    label: (model) => optionLabel(model, renderOption),
    disabled,
  });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select
        searchable
        desc={desc}
        label={label}
        labelClassName={labelClassName}
        selectClassName={selectClassName}
        multiple
        value={(value ?? []).map((model) => model.id)}
        options={modelList.map((model) => {
          const label = renderOption(model);
          return { label: typeof label === "string" ? label : model.id, value: model.id };
        })}
        onOpen={() => {
          if (disabled) return;
          void storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs });
        }}
        renderOption={(modelId: string) => {
          const model = modelList.get(modelId);
          if (!model) return null;
          return renderOption(model);
        }}
        renderSelected={(modelId: string) => {
          const model = modelList.get(modelId);
          if (!model) return null;
          return renderSelected(model);
        }}
        onChange={(modelIds: string[]) => {
          onChange(
            modelIds.map((id) => modelList.get(id)).filter((model) => model !== undefined) as unknown as Light[],
          );
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

interface ChildrenIdProps<Light> {
  label?: string;
  desc?: string;
  labelClassName?: string;
  className?: string;
  disabled?: boolean;
  nullable?: boolean;
  initArgs?: any[];
  value: string[] | null;
  slice: SliceMeta;
  onChange: (value: string[]) => void;
  onSearch?: (text: string) => void;
  sortOption?: (a: Light, b: Light) => number;
  renderOption: (model: Light) => ReactNode;
}
export const ChildrenId = <Light extends { id: string }>({
  label,
  desc,
  labelClassName,
  className,
  nullable,
  disabled,
  initArgs,
  slice,
  value,
  onChange,
  onSearch,
  sortOption,
  renderOption,
}: ChildrenIdProps<Light>) => {
  const { refName, sliceName } = slice;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const names = {
    model: modelName,
    modelList: `${modelName}List`,
    modelListLoading: `${modelName}ListLoading`,
    refreshModel: `refresh${ModelName}`,
  };
  const namesOfSlice = {
    modelList: sliceName.replace(names.model, names.modelList),
    modelListLoading: sliceName.replace(names.model, names.modelListLoading),
    refreshModel: sliceName.replace(names.model, names.refreshModel),
  };
  const modelList = storeUse[namesOfSlice.modelList]() as DataList<Light>;
  // The ids *are* the value here, so the ordinary field setter describes them — no lookup, unlike `Children`.
  useFieldTool(onChange, { disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select
        searchable
        desc={desc}
        label={label}
        labelClassName={labelClassName}
        multiple
        // selectClassName={selectClassName}
        value={value ?? []}
        options={modelList.map((model) => {
          const label = renderOption(model);
          return { label: typeof label === "string" ? label : model.id, value: model.id };
        })}
        renderOption={(renderId) => {
          const model = modelList.get(renderId);
          if (!model) return null;
          return renderOption(model);
        }}
        onOpen={() => {
          if (disabled) return;
          void storeDo[namesOfSlice.refreshModel]({ invalidate: true, queryArgs: initArgs });
        }}
        onChange={(modelIds) => {
          onChange(modelIds);
        }}
        onSearch={onSearch}
      />
    </div>
  );
};
