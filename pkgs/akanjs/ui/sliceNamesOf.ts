import { capitalize } from "akanjs/common";
import { sliceKeysOf } from "../store/sliceKeys";

export const sliceNamesOf = (model: string, sliceName: string) => {
  const Model = capitalize(model);
  const { state, action } = sliceKeysOf(model);
  const names = {
    ...state,
    ...action,
    model,
    modelId: `${model}Id`,
    modelObjList: `${model}ObjList`,
    modelObjInsight: `${model}ObjInsight`,
    newModel: `new${Model}`,
    editModel: `edit${Model}`,
    viewModel: `view${Model}`,
    removeModel: `remove${Model}`,
    setViewOfModel: `setViewOf${Model}`,
    exportCsvOfModel: `exportCsvOf${Model}`,
    exportJsonOfModel: `exportJsonOf${Model}`,
  };
  const namesOfSlice = Object.fromEntries(
    Object.entries(names).map(([key, name]) => [key, sliceName.replace(model, name)]),
  ) as typeof names;
  return { names, namesOfSlice };
};
