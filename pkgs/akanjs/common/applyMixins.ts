type Cls<T = unknown> = new (...args: never[]) => T;

export const getAllPropertyDescriptors = (objRef: Cls): { [key: string]: PropertyDescriptor } => {
  const descriptors: Record<string, PropertyDescriptor> = {};
  let current = objRef.prototype as object | null;
  while (current) {
    Object.getOwnPropertyNames(current).forEach((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(current, name);
      if (descriptor) descriptors[name] ??= descriptor;
    });
    current = Object.getPrototypeOf(current) as Cls | object;
  }
  return descriptors;
};

export const applyMixins = (derivedCtor: Cls, constructors: (Cls | undefined)[], avoidKeys?: Set<string>) => {
  constructors.forEach((baseCtor) => {
    if (!baseCtor) return;
    Object.entries(getAllPropertyDescriptors(baseCtor)).forEach(([name, descriptor]) => {
      if (name === "constructor" || avoidKeys?.has(name)) return;
      Object.defineProperty(derivedCtor.prototype, name, { ...descriptor, configurable: true });
    });
  });
  return derivedCtor;
};
