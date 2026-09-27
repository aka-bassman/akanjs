---
"@akanjs/devkit": patch
---

fix(build): a barrel's own export wins over the same name a star re-export brings when imports are flattened

The `barrelImports` rewrite turns `import { X } from "pkg"` into an import of the file `X` lives in. It read a barrel
top to bottom and kept the first file it met for each name, so in `export * from "./a"; export { X } from "./c";`
it sent `X` to `./a` — while in JavaScript a module's own export, named or declared, shadows whatever its stars
bring, and `import("pkg").X` is `./c`'s. A flattened import could therefore bind a different value than the
unflattened one. Each module's own exports are now mapped before its stars are walked, which is the ES rule; a name
two stars both bring still goes to the first. No barrel in this repository had such a name, so its builds are
unchanged.
