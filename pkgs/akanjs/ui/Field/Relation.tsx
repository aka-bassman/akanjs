"use client";
import type { DataList } from "akanjs/base";
import { cn } from "akanjs/client";
import type { SliceMeta } from "akanjs/fetch";
import { useFieldTool, useRelationFieldTool } from "akanjs/store";
import type { ReactNode } from "react";
import { agentAttrs } from "../agentAttrs";
import { Select } from "../Select";
import { Label } from "./Label";
import { useRelationOptions } from "./useRelationOptions";

interface UnresolvedProps {
  id: string;
}
/** A row nothing could resolve — removed, unreadable, or still being read. The id beats an empty control. */
const Unresolved = ({ id }: UnresolvedProps) => <span className="font-mono text-foreground/45">{id}</span>;

const renderRow = <Light extends { id: string }>(
  models: DataList<Light>,
  id: string,
  render: (model: Light) => ReactNode,
) => {
  const model = models.get(id);
  return model ? render(model) : <Unresolved id={id} />;
};

export interface ParentProps<Light> {
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
  const { models, options, optionLabel, listLoading, load, read } = useRelationOptions<Light>({
    slice,
    ids: value ? [value.id] : [],
    pinned: [value],
    initArgs,
    sortOption,
    renderOption,
  });
  useRelationFieldTool(onChange, { read, load, label: optionLabel, disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select<string | null, false, true>
        nullable={nullable}
        selectClassName={selectClassName}
        value={value?.id ?? null}
        searchable
        loading={listLoading}
        options={options}
        renderOption={(modelId) => (modelId ? renderRow(models, modelId, renderOption) : null)}
        renderSelected={(modelId) => (modelId ? renderRow(models, modelId, renderSelected) : null)}
        onChange={(modelId) => {
          onChange(modelId ? (models.get(modelId) ?? null) : null);
        }}
        onOpen={() => {
          if (disabled) return;
          void load();
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

export interface ParentIdProps<Light> {
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
  const { models, options, optionLabel, listLoading, load } = useRelationOptions<Light>({
    slice,
    ids: value ? [value] : [],
    initArgs,
    sortOption,
    renderOption,
  });
  // The id *is* the value here, so the ordinary field setter describes it — no lookup, unlike `Parent`.
  useFieldTool(onChange, { disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select<string | null, false, true>
        nullable={nullable}
        searchable
        selectClassName={selectClassName}
        value={value}
        loading={listLoading}
        options={options}
        renderOption={(renderId) => (renderId ? renderRow(models, renderId, renderOption ?? optionLabel) : null)}
        renderSelected={(renderId) => (renderId ? renderRow(models, renderId, renderSelected ?? optionLabel) : null)}
        onOpen={() => {
          if (disabled) return;
          void load();
        }}
        onChange={(modelId) => {
          if (modelId) onChange(modelId, models.get(modelId) ?? null);
          else onChange(null, null);
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

export interface ChildrenProps<Light> {
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
  const { models, options, optionLabel, listLoading, load, read } = useRelationOptions<Light>({
    slice,
    ids: (value ?? []).map((model) => model.id),
    pinned: value ?? [],
    initArgs,
    sortOption,
    renderOption,
  });
  useRelationFieldTool(onChange, { read, load, label: optionLabel, disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select
        nullable={nullable}
        searchable
        selectClassName={selectClassName}
        multiple
        value={(value ?? []).map((model) => model.id)}
        loading={listLoading}
        options={options}
        onOpen={() => {
          if (disabled) return;
          void load();
        }}
        renderOption={(modelId: string) => renderRow(models, modelId, renderOption)}
        renderSelected={(modelId: string) => renderRow(models, modelId, renderSelected)}
        onChange={(modelIds: string[]) => {
          onChange(modelIds.map((id) => models.get(id)).filter((model): model is Light => !!model));
        }}
        onSearch={onSearch}
      />
    </div>
  );
};

export interface ChildrenIdProps<Light> {
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
  const { models, options, listLoading, load } = useRelationOptions<Light>({
    slice,
    ids: value ?? [],
    initArgs,
    sortOption,
    renderOption,
  });
  // The ids *are* the value here, so the ordinary field setter describes them — no lookup, unlike `Children`.
  useFieldTool(onChange, { disabled });

  return (
    <div {...agentAttrs(onChange)} className={cn("flex flex-col", className)}>
      {label ? <Label className={labelClassName} nullable={nullable} label={label} desc={desc} /> : null}
      <Select
        nullable={nullable}
        searchable
        multiple
        value={value ?? []}
        loading={listLoading}
        options={options}
        renderOption={(renderId: string) => renderRow(models, renderId, renderOption)}
        renderSelected={(renderId: string) => renderRow(models, renderId, renderOption)}
        onOpen={() => {
          if (disabled) return;
          void load();
        }}
        onChange={(modelIds) => {
          onChange(modelIds);
        }}
        onSearch={onSearch}
      />
    </div>
  );
};
