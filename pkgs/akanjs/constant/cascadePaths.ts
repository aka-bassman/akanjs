import { type Cls, PrimitiveRegistry, type PrimitiveScalar } from "akanjs/base";
import type { ConstantField, FieldObject } from "./fieldInfo";
import type { ConstantModelRef } from "./via";

/**
 * `removeRef`: removing this document removes what the field points at. `removeWith`: removing what the field points
 * at removes this document. `removeWithAny`: `removeWith` over an owner unknowable at build time.
 */
export const cascadeActions = ["removeRef", "removeWith", "removeWithAny"] as const;
export type CascadeAction = (typeof cascadeActions)[number];

/** How a `removeWith` field names the owner whose removal takes this document with it. */
export interface CascadeWithPath {
  readonly key: string;
  /** Set when the field is a relation. Resolved to a refName later: the owner may not be registered yet. */
  readonly modelRef: ConstantModelRef | null;
  /** Set when the field declares `ref`, which names the owner at declaration. */
  readonly refName: string | null;
  /** Set when the field declares `refPath`: the sibling field holding the owner's refName. */
  readonly typeKey: string | null;
  /** The refNames `typeKey` may hold. Empty unless the field is polymorphic over an enum. */
  readonly typeValues: readonly string[];
  /** Set by `cascade: "removeWithAny"`: `typeKey` is free-form, so the owner is whatever refName the row holds. */
  readonly anyOwner: boolean;
}

const idNames = new Set(["ID", "String"]);

export class CascadePaths {
  /** Field key → the model its ids point at, removed when this document is. */
  readonly removeRef = new Map<string, ConstantModelRef>();
  /** Field key → the owner whose removal removes this document. */
  readonly removeWith = new Map<string, CascadeWithPath>();

  collect(fieldMap: FieldObject) {
    for (const [key, field] of Object.entries(fieldMap)) {
      if (!field.cascade) continue;
      this.#assertKnownAction(key, field.cascade);
      if (field.cascade === "removeRef") this.removeRef.set(key, this.#readOwnedRelation(key, field));
      else this.removeWith.set(key, this.#readOwnerPath(key, field, fieldMap));
    }
    return this;
  }

  #assertKnownAction(key: string, action: CascadeAction) {
    // A macro import or a bundled build skips the typecheck, and a dropped unknown action would look wired up.
    if (!cascadeActions.includes(action)) {
      throw new Error(`Cascade field "${key}" declares cascade: "${action}", which is not one of ${cascadeActions}`);
    }
  }

  #readOwnedRelation(key: string, field: ConstantField) {
    // A scalar is embedded in `_doc` and has no document of its own to remove; a primitive holds no id at all.
    if (!field.isClass || field.isScalar) {
      throw new Error(`Cascade field "${key}" is not a model reference and has no document to remove`);
    }
    if (field.arrDepth > 1) throw new Error(`Cascade field "${key}" is a nested array and cannot cascade`);
    return field.modelRef;
  }

  #readOwnerPath(key: string, field: ConstantField, fieldMap: FieldObject): CascadeWithPath {
    // Several owners make the removal ambiguous, a per-model rule left to the module's own `_postRemove`.
    if (field.arrDepth > 0) throw new Error(`Cascade field "${key}" is an array and names more than one owner`);
    if (field.isMap) throw new Error(`Cascade field "${key}" is a Map and names no owner`);
    const anyOwner = field.cascade === "removeWithAny";
    if (field.refPath) return this.#readPolymorphicOwner(key, field, fieldMap, anyOwner);
    // A wildcard owner is whatever the row says it is, so the field holding that refName is the declaration.
    if (anyOwner) {
      throw new Error(
        `Cascade field "${key}" declares cascade: "removeWithAny" and must name the field holding the owner's ` +
          `refName with refPath: "<typeField>"`,
      );
    }
    if (field.ref) {
      this.#assertHoldsId(key, field);
      return { key, modelRef: null, refName: field.ref, typeKey: null, typeValues: [], anyOwner: false };
    }
    if (field.isClass && !field.isScalar) {
      return { key, modelRef: field.modelRef, refName: null, typeKey: null, typeValues: [], anyOwner: false };
    }
    throw new Error(
      `Cascade field "${key}" declares cascade: "removeWith" but names no owner; make it a model reference, ` +
        `or add ref: "<model>" / refPath: "<typeField>"`,
    );
  }

  #readPolymorphicOwner(key: string, field: ConstantField, fieldMap: FieldObject, anyOwner: boolean): CascadeWithPath {
    if (field.ref) throw new Error(`Cascade field "${key}" declares both ref and refPath; keep one`);
    this.#assertHoldsId(key, field);
    const typeKey = field.refPath as string;
    const typeField = fieldMap[typeKey];
    if (!typeField) throw new Error(`Cascade field "${key}" declares refPath: "${typeKey}", which is not a field`);
    if (anyOwner) return this.#readAnyOwner(key, typeKey, typeField);
    // A free-form owner type would make every model's removal sweep this table; an enum names the candidates.
    if (!typeField.enum) {
      throw new Error(
        `Cascade field "${key}" declares refPath: "${typeKey}", which must be an enumOf(...) naming the owner ` +
          `refNames it may hold; declare cascade: "removeWithAny" to pay for a sweep on every removal instead`,
      );
    }
    const typeValues = typeField.enum.values.map((value) => String(value));
    return { key, modelRef: null, refName: null, typeKey, typeValues, anyOwner: false };
  }

  #readAnyOwner(key: string, typeKey: string, typeField: ConstantField): CascadeWithPath {
    // An enum already names the candidates and gets the reverse index for free, so widening it would only cost.
    if (typeField.enum) {
      throw new Error(
        `Cascade field "${key}" declares cascade: "removeWithAny" and a refPath naming an enumOf(...), which ` +
          `already names its owners; use cascade: "removeWith"`,
      );
    }
    // The sweep matches the removed refName against this column, so a non-String one would silently find nothing.
    if (this.#primitiveNameOf(typeField) !== "String") {
      throw new Error(
        `Cascade field "${key}" declares cascade: "removeWithAny", so refPath: "${typeKey}" must be a String ` +
          `field holding the owner's refName`,
      );
    }
    return { key, modelRef: null, refName: null, typeKey, typeValues: [], anyOwner: true };
  }

  #assertHoldsId(key: string, field: ConstantField) {
    const refName = this.#primitiveNameOf(field);
    if (refName && idNames.has(refName)) return;
    throw new Error(`Cascade field "${key}" declares ref or refPath and must hold an ID`);
  }

  #primitiveNameOf(field: ConstantField) {
    const modelRef = field.modelRef as unknown as Cls;
    if (!PrimitiveRegistry.has(modelRef)) return null;
    return PrimitiveRegistry.getName(modelRef as unknown as typeof PrimitiveScalar);
  }
}
