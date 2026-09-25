export class SyncPrivate { #compute() { return 1; } } // @flag
export class AsyncPrivate { async #load() { return 1; } } // @flag
export class CallsPrivate { run() { this.#compute(); } } // @flag
