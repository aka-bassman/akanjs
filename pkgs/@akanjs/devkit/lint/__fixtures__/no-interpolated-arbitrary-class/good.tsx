export const LiteralArbitraryValue = () => <div className="min-h-[300px] flex" />; // @ok
export const InterpolationOutsideBrackets = () => <div className={`flex gap-2 ${isOpen ? "opacity-50" : ""}`} />; // @ok
export const InterpolationInStylePropNotClass = () => <div style={{ minHeight }} className={`flex ${extra}`} />; // @ok
