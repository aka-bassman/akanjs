type AsyncFunctionConstructor = new (...args: string[]) => (scope: object) => Promise<unknown>;

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as AsyncFunctionConstructor;

// JavaScriptCore closes the wrapper function itself, so an input ending inside an open bracket reports
// `Unexpected token '}'` — the same message a stray `}` gives, which is why a typo can hold the buffer open.
const incompleteSyntaxMessages = [
  "Unexpected end of script",
  "Unexpected EOF",
  "Unexpected token '}'",
  "Multiline comment was not closed properly",
  "Unexpected end of input",
  "Unterminated",
] as const;

const createScope = (context: Record<string, unknown>) =>
  new Proxy(context, {
    has: () => true,
    get(target, prop) {
      if (prop === Symbol.unscopables) return undefined;
      if (prop in target) return target[prop as keyof typeof target];
      return (globalThis as Record<PropertyKey, unknown>)[prop];
    },
    set(target, prop, value) {
      target[prop as keyof typeof target] = value;
      return true;
    },
  });

export const isAkanConsoleInputComplete = (source: string) => {
  const trimmed = source.trim();
  if (!trimmed) return true;
  try {
    new AsyncFunction(trimmed);
    return true;
  } catch (error) {
    if (!(error instanceof SyntaxError)) return true;
    return !incompleteSyntaxMessages.some((message) => error.message.includes(message));
  }
};

export const evaluateAkanConsoleInput = async (source: string, context: Record<string, unknown>) => {
  const trimmed = source.trim();
  if (!trimmed) return undefined;
  const scope = createScope(context);

  try {
    return await new AsyncFunction("scope", `with (scope) { return await (${trimmed}); }`)(scope);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return await new AsyncFunction("scope", `with (scope) { return await (async () => {\n${trimmed}\n})(); }`)(scope);
  }
};
