import { capitalize, lowerlize } from "akanjs/common";

/**
 * The keys `makeFormSetter` publishes for one field of one model.
 *
 * Shared with the agent catalogue, which has to answer what `setNameOnUser` takes without parsing the name apart —
 * `set(.+)On(.+)` has more than one reading whenever a field or a model name contains `On`. Computing the same names
 * forward from the same field metadata is unambiguous, and keeps the two from drifting when a name changes here.
 */
export const formSetterNames = (className: string, key: string) => {
  const classKeyName = capitalize(key);
  return {
    field: lowerlize(key),
    Field: classKeyName,
    setFieldOnModel: `set${classKeyName}On${className}`,
    addFieldOnModel: `add${classKeyName}On${className}`,
    subFieldOnModel: `sub${classKeyName}On${className}`,
    addOrSubFieldOnModel: `addOrSub${classKeyName}On${className}`,
    uploadFieldOnModel: `upload${classKeyName}On${className}`,
  };
};
