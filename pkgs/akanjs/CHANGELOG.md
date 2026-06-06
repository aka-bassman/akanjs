# akanjs

## 2.2.5

### Patch Changes

- d636456: add rich Map methods on memory() helper service
- a1ee4e8: fill nested constant defaults for arrays on document save and load, normalize date fields to a consistent epoch representation on store (accepting legacy ISO-string values on read), and correct falsy defaults in getDefault
- 5cdb05e: reverse dependency of file upload api
- a7da50e: remove dependency from radix dialog

## 2.2.3

### Patch Changes

- 587cc68: fix dictionary loading
- 587cc68: fix fetchClient for setting origin with clone or fetchPolicy

## 2.2.0

### Minor Changes

- cb5b07a: enable custom not found and error render on \_layout.tsx files
- 258284e: initial js bundle size is optimized as single language dictionary on ssr
