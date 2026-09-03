export const CssVariableShorthand = () => <div className="bg-[--brand]" />; // @ok
export const CssVariableFunction = () => <div className="text-[var(--fg)]" />; // @ok
export const ArbitrarySizeNotColor = () => <div className="min-h-[300px] w-[42ch]" />; // @ok
export const SemanticToken = () => <div className="bg-primary" />; // @ok
