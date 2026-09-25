/**
 * Method decorators for a server class: `@Transaction`, `@Try`. Kept because `libs/util`'s
 * storage adaptors use `@Try` on their remote calls; new code follows the adaptor rule instead
 * (`catch` → `logger.error` → `return null`).
 */

type DecoratedInstance = {
  logger?: { warn?: (message: string) => void };
  __database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
  __databaseModel?: { __database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> } };
  database?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
  connection?: { transaction?: <T>(fn: () => Promise<T>) => Promise<T> };
};

/** Method decorator that catches errors and logs a warning instead of throwing. */
export const Try = () => {
  return (_target: unknown, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (this: unknown, ...args: unknown[]) => unknown;
    descriptor.value = async function (...args: unknown[]) {
      try {
        const result = await originMethod.apply(this, args);
        return result;
      } catch (e) {
        (this as DecoratedInstance).logger?.warn?.(`${key} action error return: ${e}`);
      }
    };
  };
};

/** Method decorator that runs the method inside the detected database transaction. */
export const Transaction = (): MethodDecorator => {
  return ((_target: unknown, key: string, descriptor: PropertyDescriptor) => {
    const originMethod = descriptor.value as (this: unknown, ...args: unknown[]) => unknown;
    descriptor.value = async function (...args: unknown[]) {
      const instance = this as DecoratedInstance;
      const database =
        instance.__database ?? instance.__databaseModel?.__database ?? instance.database ?? instance.connection;
      if (!database?.transaction) throw new Error(`No transactional database in function ${key}`);
      return await database.transaction(async () => await originMethod.apply(this, args));
    };
    return descriptor;
  }) as MethodDecorator;
};
