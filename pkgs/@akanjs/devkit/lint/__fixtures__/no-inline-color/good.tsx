export const VarReferenceInStyleObject = () => <div style={{ color: "var(--primary)" }} />; // @ok
export const NonColorStyleProperty = () => <div style={{ width: "100%" }} />; // @ok
export const ComputedNonColorStyle = () => <div style={{ minHeight }} />; // @ok
