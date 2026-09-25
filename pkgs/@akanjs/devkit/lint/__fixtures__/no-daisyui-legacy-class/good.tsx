export const BareAmbiguousNamesCollideWithTailwind = () => <div className="card input badge btn" />; // @ok
export const SurvivingSemanticPair = () => <div className="bg-primary text-primary-foreground" />; // @ok
export const SurvivingStatusTokens = () => <div className="bg-neutral text-info border-warning" />; // @ok
export const DestructiveReplacesError = () => <div className="bg-destructive/10 text-destructive" />; // @ok
export const UnrelatedContentUtilities = () => <div className="content-center justify-content" />; // @ok
