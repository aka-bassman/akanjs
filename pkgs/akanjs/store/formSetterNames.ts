import { capitalize, lowerlize } from "akanjs/common";

// Built forward from the field: `set(.+)On(.+)` has several readings when a field or model name contains `On`.
export const formSetterNames = (className: string, key: string) => {
  const classKeyName = capitalize(key);
  return {
    field: lowerlize(key),
    Field: classKeyName,
    setFieldOnModel: `set${classKeyName}On${className}`,
    addFieldOnModel: `add${classKeyName}On${className}`,
    subFieldOnModel: `sub${classKeyName}On${className}`,
    addOrSubFieldOnModel: `addOrSub${classKeyName}On${className}`,
    // An agent tool only; no store action answers to it.
    moveFieldOnModel: `move${classKeyName}On${className}`,
    uploadFieldOnModel: `upload${classKeyName}On${className}`,
    // No model suffix: a subclass cannot override a generated mapped-type property (TS2425), so the name must differ.
    postSetField: `_postSet${classKeyName}`,
  };
};
