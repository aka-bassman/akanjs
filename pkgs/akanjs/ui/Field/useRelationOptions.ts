"use client";
import { DataList } from "akanjs/base";
import { capitalize, lowerlize } from "akanjs/common";
import { ConstantRegistry, labelOf } from "akanjs/constant";
import type { SliceMeta } from "akanjs/fetch";
import { st } from "akanjs/store";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { LightRefCache } from "./lightRefCache";

export interface RelationOptionsSource<Light extends { id: string }> {
  slice: SliceMeta;
  /** Held ids, whether or not the option list carries them. */
  ids: string[];
  /** Rows the control was handed outright, which a `Light`-valued field's own value already is. */
  pinned?: (Light | null)[];
  initArgs?: any[];
  sortOption?: (a: Light, b: Light) => number;
  renderOption?: (model: Light) => ReactNode;
}

const merge = <Light extends { id: string }>(
  list: DataList<Light>,
  rows: (Light | null | undefined)[],
  sortOption?: (a: Light, b: Light) => number,
) => {
  const merged = new DataList<Light>(list);
  // The list's own copy wins wherever it has one: it is the later read, and swapping it in would flicker.
  for (const row of rows) if (row && !merged.get(row.id)) merged.set(row);
  return sortOption ? merged.sort(sortOption) : merged;
};

// Never only the slice list, which arrives on open and holds one page: missing rows come from the handed value or,
// for an id-valued control, from `LightRefCache`.
export const useRelationOptions = <Light extends { id: string }>({
  slice,
  ids,
  pinned,
  initArgs,
  sortOption,
  renderOption,
}: RelationOptionsSource<Light>) => {
  const { refName, sliceName } = slice;
  const [modelName, ModelName] = [lowerlize(refName), capitalize(refName)];
  const names = {
    modelList: sliceName.replace(modelName, `${modelName}List`),
    modelListLoading: sliceName.replace(modelName, `${modelName}ListLoading`),
    refreshModel: sliceName.replace(modelName, `refresh${ModelName}`),
  };
  const storeUse = st.use as { [key: string]: () => unknown };
  const storeDo = st.do as unknown as { [key: string]: (...args: any[]) => Promise<void> };
  const storeGet = st.get as unknown as <V>() => { [key: string]: V };
  const sliceList = storeUse[names.modelList]() as DataList<Light>;
  const listLoading = storeUse[names.modelListLoading]() as boolean;
  const [resolvedCount, setResolvedCount] = useState(0);

  const held = (pinned ?? []).filter((row): row is Light => !!row);
  const heldKey = held.map((row) => row.id).join(",");
  const missing = ids.filter((id) => !!id && !sliceList.get(id) && !held.some((row) => row.id === id));
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    const wanted = new Set(missingKey.split(","));
    const off = LightRefCache.subscribe((readRefName, id) => {
      if (readRefName === refName && wanted.has(id)) setResolvedCount((count) => count + 1);
    });
    LightRefCache.load(refName, [...wanted]);
    return off;
  }, [refName, missingKey]);

  const cnst = useMemo(() => ConstantRegistry.getDatabase(refName, { allowEmpty: true }), [refName]);
  const models = useMemo(
    () => merge(sliceList, [...held, ...missing.map((id) => LightRefCache.get<Light>(refName, id))], sortOption),
    [sliceList, heldKey, missingKey, resolvedCount],
  );
  // The one line an option reads as, so a search matches it and an agent can match an id against the screen.
  const optionLabel = (model: Light) => {
    const rendered = renderOption?.(model);
    if (typeof rendered === "string" && rendered) return rendered;
    return labelOf(cnst?.full, model) ?? model.id;
  };
  const options = useMemo(() => models.map((model) => ({ label: optionLabel(model), value: model.id })), [models]);

  return {
    models,
    options,
    optionLabel,
    listLoading,
    // `invalidate: false`: the slice list is one store key, so a refetch would replace the listing on screen.
    load: () => storeDo[names.refreshModel]({ invalidate: false, queryArgs: initArgs }),
    // Live rather than the rendered list, because the agent's list tool loads and reads within one call.
    read: () =>
      merge(
        storeGet<DataList<Light>>()[names.modelList],
        [...held, ...ids.map((id) => LightRefCache.get<Light>(refName, id))],
        sortOption,
      ),
  };
};
