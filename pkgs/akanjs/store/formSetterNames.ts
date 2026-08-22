import { capitalize, lowerlize } from "akanjs/common";

/**
 * The keys `makeFormSetter` publishes for one field of one model.
 *
 * Computed forward from the field metadata rather than parsed back out of a key: `set(.+)On(.+)` has more than one
 * reading whenever a field or a model name contains `On`, so any reader that has only the name must build the same
 * names here instead of taking one apart.
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
