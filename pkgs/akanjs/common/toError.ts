export const toError = (reason: unknown): Error => (reason instanceof Error ? reason : new Error(String(reason)));
