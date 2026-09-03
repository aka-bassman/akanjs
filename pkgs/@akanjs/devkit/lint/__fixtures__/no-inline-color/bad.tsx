export const HexInStyleObject = () => <div style={{ color: "#fff" }} />; // @flag
export const RgbInStyleObject = () => <div style={{ background: "rgb(0,0,0)" }} />; // @flag
export const ColorLiteralInStyleTag = () => <style>{`.x { color: #abcdef; }`}</style>; // @flag
