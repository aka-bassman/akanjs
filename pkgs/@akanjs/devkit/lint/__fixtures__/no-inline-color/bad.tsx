export const HexInStyleObject = () => <div style={{ color: "#fff" }} />; // @flag
export const RgbInStyleObject = () => <div style={{ background: "rgb(0,0,0)" }} />; // @flag
export const ColorLiteralInStyleTag = () => <style>{`.x { color: #abcdef; }`}</style>; // @flag
export const FillInAStyleObject = () => <path style={{ fill: "#2b7fff" }} />; // @flag
export const FillAttribute = () => <path fill="#2b7fff" />; // @warn
export const StrokeAttribute = () => <path stroke="#909090" />; // @warn
export const StopColorAttribute = () => <stop stopColor="rgba(255,72,64,0)" />; // @warn
export const FloodColorAttribute = () => <feDropShadow floodColor="#000" />; // @warn
export const LightingColorAttribute = () => <feDiffuseLighting lightingColor="hsl(0 0% 100%)" />; // @warn
export const ColorAttribute = () => <svg color="#5bbad5" />; // @warn
export const ComponentFillProp = () => <Icon fill="#ffd700" />; // @warn
export const ExpressionValue = () => <path fill={isActive ? "#ffffff" : fillColor} />; // @warn
export const TemplateValue = () => <path stroke={`rgb(${red}, 0, 0)`} />; // @warn
export const GradientWithFallback = () => <path fill="url(#fade) #2b7fff" />; // @warn
export const StyleWrite = (path: SVGPathElement) => { path.style.fill = "#2b7fff"; }; // @warn
export const StyleFilterWrite = (path: SVGPathElement) => { path.style.filter = "drop-shadow(0 0 12px rgba(96, 165, 250, 0.7))"; }; // @warn
export const NestedStyleWrite = (ref: { current: HTMLElement }) => { ref.current.style.background = "#fff"; }; // @warn
export const ComputedStyleWrite = (el: HTMLElement) => { el.style["background-color"] = "#fff"; }; // @warn
export const TemplateStyleWrite = (el: HTMLElement) => { el.style.boxShadow = `0 0 ${blur}px rgba(0, 0, 0, 0.3)`; }; // @warn
export const SetPropertyWrite = (el: HTMLElement) => { el.style.setProperty("--glow", "#60a5fa"); }; // @warn
