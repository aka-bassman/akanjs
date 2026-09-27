---
---

fix(util): `libs/util`'s `useCodepush` stops showing a debug alert on every release check

`checkNewRelease` opened a blocking `window.alert` listing the built-in, bundle and native versions each time it ran,
update or not — a leftover device-debugging note, already removed from the `akanjs/webkit` copy. The `libs/util`
copy now checks without interrupting the user. `libs/util` ships through `akan library install`, not a versioned
package, so this changeset names none.
