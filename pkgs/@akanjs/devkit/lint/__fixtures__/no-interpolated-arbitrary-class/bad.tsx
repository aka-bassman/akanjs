export const SizeFromRuntimeExpression = () => <div className={`min-h-[${minHeight}px] flex`} />; // @flag
export const ColorFromRuntimeExpression = () => <div className={`bg-[${color}] w-full`} />; // @flag
export const BrokenBracketSwallowsNextClass = () => <div className={`min-h-[ w-full${minHeight}px] flex`} />; // @flag
