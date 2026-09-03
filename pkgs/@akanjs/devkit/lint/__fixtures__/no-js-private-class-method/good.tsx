export class TypescriptPrivate { private _compute() { return 1; } } // @ok
export class CallsUnderscore { run() { this._compute(); } } // @ok
export class PrivateField { #cache = new Map(); } // @ok
