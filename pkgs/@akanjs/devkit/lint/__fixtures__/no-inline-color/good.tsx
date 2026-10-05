export const VarReferenceInStyleObject = () => <div style={{ color: "var(--primary)" }} />; // @ok
export const NonColorStyleProperty = () => <div style={{ width: "100%" }} />; // @ok
export const ComputedNonColorStyle = () => <div style={{ minHeight }} />; // @ok
export const CurrentColorFill = () => <path fill="currentColor" className="text-primary" />; // @ok
export const NoneAndTransparent = () => <path fill="none" stroke="transparent" />; // @ok
export const VarStopColor = () => <stop stopColor="var(--primary)" />; // @ok
export const RuntimeFill = () => <path fill={fillColor} />; // @ok
export const GradientReference = () => <path fill="url(#fade)" />; // @ok
export const QuotedGradientReference = () => <path fill="url('#bead')" />; // @ok
export const HrefIsNotAColorAttribute = () => <use href="#cafe" />; // @ok
export const VarStyleWrite = (el: HTMLElement) => { el.style.color = "var(--primary)"; }; // @ok
export const CurrentColorStyleWrite = (el: HTMLElement) => { el.style.fill = "currentColor"; }; // @ok
export const NonColorStyleWrite = (el: HTMLElement) => { el.style.display = "none"; }; // @ok
export const FilterReferenceStyleWrite = (el: HTMLElement) => { el.style.filter = "url(#dead)"; }; // @ok
// biome-ignore lint/plugin: the Google mark keeps its brand colors
export const SuppressedBrandMark = () => <path fill="#4285f4" />; // @ok
