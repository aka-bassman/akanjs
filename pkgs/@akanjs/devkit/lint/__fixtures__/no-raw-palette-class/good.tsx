export const BareSemanticNeutral = () => <div className="bg-neutral text-neutral-foreground" />; // @ok
export const SemanticTokens = () => <div className="bg-primary text-muted-foreground border-border" />; // @ok
export const BlackAndWhiteStayInVocabulary = () => <div className="bg-black text-white bg-white/30 bg-black/50" />; // @ok
export const NonColorNumericUtilities = () => <div className="gap-4 mt-2 grid-cols-3 w-500" />; // @ok
export const OpacityOnASemanticToken = () => <div className="text-foreground/70 bg-primary/10" />; // @ok
// iconClassName="bg-blue-500" — a class name in a line comment is not code
/** legacy: bg-red-500 */
export const CommentsAreNotCode = () => <div className="flex" />; // @ok
