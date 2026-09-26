export type Cls<T = unknown> = new (...args: unknown[]) => T;

export type DependencyKind = "command" | "script" | "runner";
export type DependencyKey<RefName extends string, Kind extends DependencyKind> = `${RefName}${Capitalize<Kind>}`;

export type DependencyCls<T = unknown, Key extends string = string> = (new () => T) & {
  readonly dependencyKey: Key;
  readonly dependencyKind: DependencyKind;
  readonly refName: string;
};

type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (
  value: infer Intersection,
) => void
  ? Intersection
  : never;

type DependencyToField<Dep> = Dep extends DependencyCls<infer Instance, infer Key> ? { [K in Key]: Instance } : never;

export type DependencyInstanceMap<Deps extends readonly DependencyCls[]> = [Deps[number]] extends [never]
  ? Record<PropertyKey, never>
  : UnionToIntersection<DependencyToField<Deps[number]>>;

const capitalize = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1);

const createDependencyKey = <RefName extends string, Kind extends DependencyKind>(
  refName: RefName,
  kind: Kind,
): DependencyKey<RefName, Kind> => `${refName}${capitalize(kind)}` as DependencyKey<RefName, Kind>;

export class CommandContainer {
  static #instances = new Map<DependencyCls, unknown>();
  static #resolving = new Set<DependencyCls>();

  static get<T>(dep: DependencyCls<T>): T {
    const instance = CommandContainer.#instances.get(dep);
    if (instance) return instance as T;
    if (CommandContainer.#resolving.has(dep)) throw new Error(`Circular command dependency: ${dep.name}`);
    CommandContainer.#resolving.add(dep);
    try {
      const nextInstance = new dep();
      CommandContainer.#instances.set(dep, nextInstance);
      return nextInstance;
    } finally {
      CommandContainer.#resolving.delete(dep);
    }
  }

  static clear() {
    CommandContainer.#instances.clear();
    CommandContainer.#resolving.clear();
  }
}

export const getDependencyKey = (dep: DependencyCls) => dep.dependencyKey;

export const assertUniqueDependencies = (deps: readonly DependencyCls[]) => {
  const keys = new Map<string, DependencyCls>();
  const classes = new Set<DependencyCls>();
  for (const dep of deps) {
    if (classes.has(dep)) throw new Error(`Duplicate command dependency class: ${dep.name}`);
    classes.add(dep);
    const key = getDependencyKey(dep);
    const existing = keys.get(key);
    if (existing) throw new Error(`Duplicate command dependency key "${key}": ${existing.name}, ${dep.name}`);
    keys.set(key, dep);
  }
};

export const injectDependencies = <Deps extends readonly DependencyCls[]>(target: object, deps: Deps) => {
  assertUniqueDependencies(deps);
  for (const dep of deps) {
    Object.defineProperty(target, getDependencyKey(dep), {
      configurable: true,
      enumerable: false,
      value: CommandContainer.get(dep),
      writable: false,
    });
  }
  return target as typeof target & DependencyInstanceMap<Deps>;
};

export const runner = <RefName extends string>(refName: RefName) => {
  class RunnerBase {
    static readonly refName = refName;
    static readonly dependencyKind = "runner";
    static readonly dependencyKey = createDependencyKey(refName, "runner");
  }

  return RunnerBase as unknown as DependencyCls<InstanceType<typeof RunnerBase>, DependencyKey<RefName, "runner">>;
};

export const script = <RefName extends string, Deps extends readonly DependencyCls[]>(
  refName: RefName,
  deps: Deps = [] as unknown as Deps,
) => {
  assertUniqueDependencies(deps);
  class ScriptBase {
    static readonly refName = refName;
    static readonly dependencyKind = "script";
    static readonly dependencyKey = createDependencyKey(refName, "script");

    constructor() {
      injectDependencies(this, deps);
    }
  }

  return ScriptBase as unknown as DependencyCls<DependencyInstanceMap<Deps>, DependencyKey<RefName, "script">>;
};
