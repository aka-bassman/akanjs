import { capitalize } from "akanjs/common";

export const sliceNamesOf = (model: string, sliceName: string) => {
  const Model = capitalize(model);
  const names = {
    model,
    modelId: `${model}Id`,
    modelList: `${model}List`,
    modelListLoading: `${model}ListLoading`,
    modelInsight: `${model}Insight`,
    modelInitList: `${model}InitList`,
    modelInitAt: `${model}InitAt`,
    modelStaleAt: `${model}StaleAt`,
    modelObjList: `${model}ObjList`,
    modelObjInsight: `${model}ObjInsight`,
    pageOfModel: `pageOf${Model}`,
    lastPageOfModel: `lastPageOf${Model}`,
    limitOfModel: `limitOf${Model}`,
    hasMoreOfModel: `hasMoreOf${Model}`,
    isCumulativeOfModel: `isCumulativeOf${Model}`,
    queryArgsOfModel: `queryArgsOf${Model}`,
    sortOfModel: `sortOf${Model}`,
    initModel: `init${Model}`,
    newModel: `new${Model}`,
    editModel: `edit${Model}`,
    viewModel: `view${Model}`,
    removeModel: `remove${Model}`,
    refreshModel: `refresh${Model}`,
    watchLiveModel: `watchLive${Model}`,
    setPageOfModel: `setPageOf${Model}`,
    loadMoreOfModel: `loadMoreOf${Model}`,
    setSortOfModel: `setSortOf${Model}`,
    setLimitOfModel: `setLimitOf${Model}`,
    setViewOfModel: `setViewOf${Model}`,
    exportCsvOfModel: `exportCsvOf${Model}`,
    exportJsonOfModel: `exportJsonOf${Model}`,
  };
  const namesOfSlice = Object.fromEntries(
    Object.entries(names).map(([key, name]) => [key, sliceName.replace(model, name)]),
  ) as typeof names;
  return { names, namesOfSlice };
};
