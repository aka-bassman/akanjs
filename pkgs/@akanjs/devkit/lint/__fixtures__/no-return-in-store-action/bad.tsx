export class AStore extends store(sig.a, () => ({})) { load() { return 1; } } // @flag
export class BStore extends store(sig.b, () => ({})) { async save() { return true; } } // @flag
