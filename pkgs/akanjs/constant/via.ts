import { type Cls, type EnumInstance, FIELD_META, type MergeAllKeyOfObjects, type MergeAllTypes } from "akanjs/base";
import { applyMixins } from "akanjs/common";
import { immerable } from "immer";

import { crystalize, getDefault } from ".";
import { ConstantRegistry } from "./constantRegistry";
import {
  ConstantField,
  type ExtractFieldInfoObject,
  type FieldBuilder,
  type FieldInfoObject,
  type FieldInfoObjectToFieldObject,
  type FieldObject,
  type FieldResolver,
  field,
  resolve,
} from "./fieldInfo";
import { makePurify, type PurifyFunc } from "./purify";
import type { BaseInsight, BaseObject, ConstantType, DefaultOf, NonFunctionalKeys } from "./types";

type BaseFields = "id" | "createdAt" | "updatedAt" | "removedAt";
type WithBase<T> = T & BaseObject;
type OmitBase<T> = Omit<T, BaseFields>;
type Merge<A, B> = B & Omit<A, keyof B>;

const objectModelOf = <T>(inputRef: ConstantCls<T>, fieldMap: FieldInfoObject): Cls<WithBase<T>> => {
  const fieldObject = Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()]));
  const applyFieldObject = { ...inputRef[FIELD_META], ...fieldObject };
  const field = Object.assign(ConstantField.getBaseModelField(), applyFieldObject);
  const baseObjectModelRef = getBaseConstantClass(field);
  applyConstantStatics(baseObjectModelRef, applyFieldObject);
  baseObjectModelRef.modelType = "object";
  return baseObjectModelRef as unknown as Cls<WithBase<T>>;
};

const lightModelOf = <T, F extends keyof OmitBase<T>>(
  objectRef: ConstantCls<T>,
  fields: readonly F[],
  fieldMap: FieldInfoObject,
  ...libLightModelRefs: ConstantCls[]
): Cls<Pick<OmitBase<T>, F> & BaseObject> => {
  const libLightModelRef = libLightModelRefs.at(0);
  const applyFieldObject = {
    ...Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()])),
    ...Object.fromEntries(fields.map((field) => [field, objectRef[FIELD_META][field as string] as ConstantField])),
  };
  const field = Object.assign(libLightModelRef?.[FIELD_META] ?? ConstantField.getBaseModelField(), applyFieldObject);
  const baseLightModelRef = getBaseConstantClass(field);
  applyConstantStatics(baseLightModelRef, applyFieldObject);
  applyMixins(baseLightModelRef, libLightModelRefs);
  baseLightModelRef.modelType = "light";
  return baseLightModelRef as unknown as Cls<Pick<OmitBase<T>, F> & BaseObject>;
};

const fullModelOf = <A, B = undefined>(
  objectRef: ConstantCls<A>,
  lightRef: ConstantCls<B>,
  fieldMap: FieldInfoObject,
  ...libFullModelRefs: ConstantCls[]
): Cls<Merge<A, B>> => {
  const fullRef = libFullModelRefs.at(0) ?? getBaseConstantClass(ConstantField.getBaseModelField());
  const applyFieldObject = {
    ...objectRef[FIELD_META],
    ...lightRef[FIELD_META],
    ...Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()])),
  };
  Object.assign(fullRef[FIELD_META], applyFieldObject);
  applyMixins(fullRef, [objectRef, lightRef, ...libFullModelRefs]);
  libFullModelRefs.forEach((libFullModelRef) => {
    applyMixins(libFullModelRef, [objectRef, lightRef]);
  });

  applyConstantStatics(fullRef, applyFieldObject);
  fullRef.modelType = "full";
  return fullRef as unknown as Cls<Omit<A, keyof B> & B>;
};

const extendModelInputs = <T extends ConstantCls[]>(
  fieldMap: FieldInfoObject,
  ...libInputModelRefs: T
): Cls<MergeAllTypes<T>> => {
  const baseInputModelRef = libInputModelRefs.at(0);
  const applyFieldObject = Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()]));
  const fieldObject = Object.assign(baseInputModelRef?.[FIELD_META] ?? {}, applyFieldObject);
  const baseInputRef = getBaseConstantClass(fieldObject);
  applyConstantStatics(baseInputRef, applyFieldObject);
  return baseInputRef as unknown as Cls<MergeAllTypes<T>>;
};

const extendModelObjects = <Input, ObjectModels extends ConstantCls[]>(
  inputRef: ConstantCls<Input>,
  fieldMap: FieldInfoObject,
  ...libObjectModelRefs: ObjectModels
): Cls<MergeAllTypes<ObjectModels> & Input> => {
  const baseObjectModelRef = libObjectModelRefs.at(0);
  const applyFieldObject = {
    ...inputRef[FIELD_META],
    ...Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()])),
  };
  const field = Object.assign(baseObjectModelRef?.[FIELD_META] ?? {}, applyFieldObject);
  const baseInputRef = getBaseConstantClass(field, "object");
  applyConstantStatics(baseInputRef, applyFieldObject);
  return baseInputRef as unknown as Cls<MergeAllTypes<ObjectModels> & Input>;
};

const extendModelInsights = <InsightModels extends ConstantCls[]>(
  fieldMap: FieldInfoObject,
  ...insightModelRefs: InsightModels
): Cls<MergeAllTypes<InsightModels>> => {
  const baseInsightModelRef = insightModelRefs.at(0);
  const applyFieldObject = Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()]));
  const field = Object.assign(
    baseInsightModelRef?.[FIELD_META] ?? ConstantField.getBaseInsightField(),
    applyFieldObject,
  );
  const baseInsightRef = getBaseConstantClass(field, "insight");

  applyConstantStatics(baseInsightRef, applyFieldObject);
  return baseInsightRef as unknown as Cls<MergeAllTypes<InsightModels>>;
};

const getBaseConstantClass = (field: FieldObject, modelType: ConstantType = "scalar") => {
  class BaseConstant {
    static readonly [FIELD_META]: FieldObject = field;
    static modelType: ConstantType = modelType;
    static text: { search: Set<string>; filter: Set<string>; children: { search: Set<string>; filter: Set<string> } } =
      { search: new Set(), filter: new Set(), children: { search: new Set(), filter: new Set() } };
    static children: Set<ConstantCls> = new Set();
    static relations: Set<ConstantCls> = new Set();
    static enums: Set<EnumInstance> = new Set();
    [immerable] = true;
    constructor(obj?: Partial<unknown>) {
      this.set({
        ...(this.constructor as ConstantCls).getDefault(),
        ...((obj ?? {}) as Partial<typeof this>),
      });
    }
    set(obj: Partial<typeof this>) {
      Object.entries(obj).forEach(([key, value]) => {
        //check field has key
        if (!(this.constructor as ConstantCls)[FIELD_META][key] as unknown as object | undefined) return;
        const field = (this.constructor as ConstantCls)[FIELD_META][key];
        if (!field) throw new Error(`Field ${key} not found`);
        const fieldProp = field.getProps();
        (this as Record<string, unknown>)[key] = crystalize(fieldProp, value);
      });
      return this;
    }
  }
  return BaseConstant as unknown as ConstantCls;
};

const makeBaseScalar = <FieldMap extends FieldInfoObject>(
  fieldMap: FieldMap,
): Cls<ExtractFieldInfoObject<FieldMap>> => {
  const fieldObject = Object.fromEntries(Object.entries(fieldMap).map(([key, field]) => [key, field.toField()]));
  const baseScalarRef = getBaseConstantClass(fieldObject, "scalar");
  applyConstantStatics(baseScalarRef, fieldObject);
  return baseScalarRef as unknown as Cls<ExtractFieldInfoObject<FieldMap>>;
};

export interface ConstantMethods<Schema = any> {
  set: (obj: Partial<Schema>) => this;
}

export interface ConstantStatics<Schema = any, FieldObj extends FieldObject = FieldObject> {
  [FIELD_META]: FieldObj;
  getDefault: () => DefaultOf<Schema>;
  purify: PurifyFunc<Schema>;
  modelType: ConstantType;
  children: Set<ConstantCls>;
  relations: Set<ConstantCls>;
  enums: Set<EnumInstance>;
  text: { search: Set<string>; filter: Set<string>; children: { search: Set<string>; filter: Set<string> } };
  _DatabaseSchema: {
    [K in keyof Schema]: K extends keyof FieldObj
      ? FieldObj[K] extends ConstantField<infer FieldType, any, any, any, any, any>
        ? FieldType extends "hidden"
          ? NonNullable<Schema[K]>
          : Schema[K]
        : Schema[K]
      : Schema[K];
  };
}
export type ConstantCls<Schema = any, FieldObj extends FieldObject = FieldObject> = (new (
  obj?: Partial<Schema>,
) => Schema & ConstantMethods<Schema>) &
  ConstantStatics<Schema, FieldObj>;

declare global {
  // dummy type matching for Date, String, Boolean, Map constructors
  interface DateConstructor extends ConstantStatics<unknown> {}
  interface StringConstructor extends ConstantStatics<unknown> {}
  interface BooleanConstructor extends ConstantStatics<unknown> {}
  interface MapConstructor extends ConstantStatics<unknown> {}
}

const applyConstantStatics = <Model>(model: ConstantCls<Model>, fieldMap: FieldObject): ConstantCls<Model> => {
  const defaultValue = getDefault(model[FIELD_META]);
  Object.assign(model, {
    purify: makePurify(model),
    getDefault: () => ({ ...defaultValue }),
  });
  Object.entries(fieldMap).forEach(([key, field]) => {
    if (field.enum) model.enums.add(field.enum);
    if (field.text === "search") model.text.search.add(key);
    else if (field.text === "filter") model.text.filter.add(key);
    else if (field.isClass) {
      if (field.isScalar) model.children.add(field.modelRef);
      else model.relations.add(field.modelRef);
      for (const child of field.modelRef.children) model.children.add(child);
      for (const childEnum of field.modelRef.enums) model.enums.add(childEnum);
      for (const relation of field.modelRef.relations) model.relations.add(relation);
      for (const relationEnum of field.modelRef.enums) model.enums.add(relationEnum);
      field.modelRef.text.search.forEach((subKey) => {
        model.text.children.search.add(`${key}.${subKey}`);
      });
      field.modelRef.text.filter.forEach((subKey) => {
        model.text.children.filter.add(`${key}.${subKey}`);
      });
      field.modelRef.text.children.search.forEach((subKey) => {
        model.text.children.search.add(`${key}.${subKey}`);
      });
      field.modelRef.text.children.filter.forEach((subKey) => {
        model.text.children.filter.add(`${key}.${subKey}`);
      });
    }
  });
  return model as unknown as ConstantCls<Model>;
};

// light via
/** Builds Akan constant models such as scalar, input, object, light, full, and insight classes. */
export function via<
  Obj extends BaseObject,
  ObjFieldObj extends FieldObject,
  K extends NonFunctionalKeys<OmitBase<Obj>>,
  ResolveField extends (resolve: FieldResolver) => FieldInfoObject,
  LightModels extends Cls[],
  _Schema = MergeAllTypes<LightModels> & Pick<Obj, K> & BaseObject & ExtractFieldInfoObject<ReturnType<ResolveField>>,
  _FieldObj extends FieldObject = MergeAllKeyOfObjects<LightModels, typeof FIELD_META> &
    Pick<ObjFieldObj, K & keyof ObjFieldObj> &
    FieldInfoObjectToFieldObject<ReturnType<ResolveField>>,
>(
  modelRef: Cls<Obj, { [FIELD_META]: ObjFieldObj }>,
  fields: readonly K[],
  resolveField: ResolveField,
  ...lightModelRefs: LightModels
): ConstantCls<_Schema, _FieldObj>;

// input or scalar via
export function via<
  BuildField extends (builder: FieldBuilder) => FieldInfoObject,
  Inputs extends Cls[],
  _Schema = MergeAllTypes<Inputs> & ExtractFieldInfoObject<ReturnType<BuildField>>,
  _FieldObj extends FieldObject = MergeAllKeyOfObjects<Inputs, typeof FIELD_META> &
    FieldInfoObjectToFieldObject<ReturnType<BuildField>>,
>(buildField: BuildField, ...extendInputRefs: Inputs): ConstantCls<_Schema, _FieldObj>;

// insight via
export function via<
  Full extends BaseObject,
  BuildField extends (builder: FieldBuilder) => FieldInfoObject,
  Insights extends Cls[],
  _Schema = MergeAllTypes<Insights> & BaseInsight & ExtractFieldInfoObject<ReturnType<BuildField>>,
  _FieldObj extends FieldObject = MergeAllKeyOfObjects<Insights, typeof FIELD_META> &
    FieldInfoObjectToFieldObject<ReturnType<BuildField>>,
>(modelRef: Cls<Full>, buildField: BuildField, ...extendInsightRefs: Insights): ConstantCls<_Schema, _FieldObj>;

// object via
export function via<
  Input,
  InputFieldObj extends FieldObject,
  BuildField extends (builder: FieldBuilder) => FieldInfoObject,
  ObjectModels extends Cls[],
  _Schema = MergeAllTypes<ObjectModels> & Input & BaseObject & ExtractFieldInfoObject<ReturnType<BuildField>>,
  _FieldObj extends FieldObject = MergeAllKeyOfObjects<ObjectModels, typeof FIELD_META> &
    InputFieldObj &
    FieldInfoObjectToFieldObject<ReturnType<BuildField>>,
>(
  inputRef: Cls<Input, { [FIELD_META]: InputFieldObj }>,
  buildField: BuildField,
  ...extendObjectRefs: ObjectModels
): ConstantCls<_Schema, _FieldObj>;

// full via
export function via<
  Obj,
  ObjFieldObj extends FieldObject,
  Light,
  LightFieldObj extends FieldObject,
  ResolveField extends (resolve: FieldResolver) => FieldInfoObject,
  FullModels extends Cls[],
  _Schema = MergeAllTypes<FullModels> & Obj & Light & ExtractFieldInfoObject<ReturnType<ResolveField>>,
  _FieldObj extends FieldObject = MergeAllKeyOfObjects<FullModels, typeof FIELD_META> &
    ObjFieldObj &
    LightFieldObj &
    FieldInfoObjectToFieldObject<ReturnType<ResolveField>>,
>(
  objectRef: Cls<Obj, { [FIELD_META]: ObjFieldObj }>,
  lightModelRef: Cls<Light, { [FIELD_META]: LightFieldObj }>,
  resolveField: ResolveField,
  ...fullModelRefs: FullModels
): ConstantCls<_Schema, _FieldObj>;

export function via(
  firstRefOrBuildField: Cls | ((builder: FieldBuilder) => FieldInfoObject),
  secondRefOrFieldsOrBuildField?: Cls | readonly unknown[] | ((builder: FieldBuilder) => FieldInfoObject),
  thirdRefOrResolveField?: Cls | ((resolve: FieldResolver) => FieldInfoObject),
  ...extendRefs: Cls[]
): any {
  // input via
  if (
    !firstRefOrBuildField.prototype ||
    !(firstRefOrBuildField as Cls<unknown, { modelType?: ConstantType }>).modelType
  ) {
    const buildField = firstRefOrBuildField as (builder: FieldBuilder) => FieldInfoObject;
    const fieldMap = buildField(field);
    const extendInputRefs = [
      ...(secondRefOrFieldsOrBuildField ? [secondRefOrFieldsOrBuildField as Cls] : []),
      ...(thirdRefOrResolveField ? [thirdRefOrResolveField as Cls] : []),
      ...extendRefs,
    ] as ConstantCls[];
    if (!secondRefOrFieldsOrBuildField) return makeBaseScalar(fieldMap);
    else return extendModelInputs(fieldMap, ...extendInputRefs);
  }
  // light via
  if (Array.isArray(secondRefOrFieldsOrBuildField)) {
    const resolveField = thirdRefOrResolveField as (resolve: FieldResolver) => FieldInfoObject;
    const fieldMap = resolveField(resolve);
    return lightModelOf(
      firstRefOrBuildField as ConstantCls,
      secondRefOrFieldsOrBuildField as unknown as readonly never[],
      fieldMap,
      ...(extendRefs as ConstantCls[]),
    );
  }

  // insight or object via
  if (
    !(secondRefOrFieldsOrBuildField as Cls).prototype ||
    !(secondRefOrFieldsOrBuildField as Cls<unknown, { modelType?: ConstantType }>).modelType
  ) {
    const buildField = secondRefOrFieldsOrBuildField as (builder: FieldBuilder) => FieldInfoObject;
    const fieldMap = buildField(field);
    // object via
    if (ConstantRegistry.isScalar(firstRefOrBuildField as Cls<unknown, { modelType: ConstantType }>)) {
      if (!thirdRefOrResolveField) return objectModelOf(firstRefOrBuildField as ConstantCls, fieldMap);
      else
        return extendModelObjects(
          firstRefOrBuildField as ConstantCls,
          fieldMap,
          thirdRefOrResolveField as ConstantCls,
          ...(extendRefs as ConstantCls[]),
        );
    }
    // insight via
    if (ConstantRegistry.isFull(firstRefOrBuildField as Cls<unknown, { modelType: ConstantType }>)) {
      const extendInsightRefs = [
        ...(thirdRefOrResolveField ? [thirdRefOrResolveField as Cls] : []),
        ...extendRefs,
      ] as ConstantCls[];
      return extendModelInsights(fieldMap, ...extendInsightRefs);
    }
  } else {
    const objectRef = firstRefOrBuildField as ConstantCls;
    const lightRef = secondRefOrFieldsOrBuildField as ConstantCls;
    const resolveField = thirdRefOrResolveField as (resolve: FieldResolver) => FieldInfoObject;
    const fieldMap = resolveField(resolve);
    return fullModelOf(objectRef, lightRef, fieldMap, ...(extendRefs as ConstantCls[]));
  }
  throw new Error(
    `Invalid modelRef args ${firstRefOrBuildField as Cls} ${secondRefOrFieldsOrBuildField as Cls} ${extendRefs.join(", ")}`,
  );
}
