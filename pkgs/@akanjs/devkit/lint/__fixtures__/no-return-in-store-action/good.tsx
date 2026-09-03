export class CStore extends store(sig.c, () => ({})) { load() { this.set({ n: 1 }); } } // @ok
export class DStore extends store(sig.d, () => ({})) { load() { if (!this.get()) return; this.set({ n: 1 }); } } // @ok
export class EStore extends store(sig.e, () => ({})) { static helper() { return 1; } } // @ok
export class FStore extends store(sig.f, () => ({})) { get total() { return 1; } } // @ok
export class GStore extends store(sig.g, () => ({})) { load() { items.map((x) => { return x; }); } } // @ok
export class HPlain { load() { return 1; } } // @ok
