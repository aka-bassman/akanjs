---
"akanjs": patch
---

fix: runtime defects the reference audit turned up

- `imageOptimizer` re-encodes only JPEG, PNG, WebP and AVIF; a static GIF (or TIFF) that no accepted format beats is
  served as its own bytes instead of JPEG bytes labelled `image/gif`.
- `DataList.sort()` sorts a copy, so the list it was called on keeps a consistent id lookup.
- `fetch.view<Model>` exists whenever the model's `get` does, and `edit<Model>` when a create/update/remove endpoint
  does too; a read-only model used to have neither, and one without `get` had a `view` that always threw.
  `merge<Model>` still follows `update` alone.
- Path parameters are `encodeURIComponent`-ed, so a `/` or `?` in a value no longer reroutes the request.
- `ConstantRegistry.serialize` / `deserialize` handle a `Map` of a declared value type instead of throwing.
- `BlobStorage` takes `appName` from the deployment env; the server env it was reading has none, so local blobs
  landed under `local/undefined/`.
- UI: `Field.Switch` no longer marks itself optional; `Field.TextList` checks each entry against
  `minTextlength` / `maxTextlength` and caps the list at `maxlength`; `CsrLink` forwards its props and the caller's
  `onClick`; `CsrImage` / `Image` pass `alt` through; `useBottomUpTrans` measures height; the safe-area colour falls
  back to the default page state; `DataColumn.responsive` shows the column from `md` up.
- webkit: `useFetch` follows the promise it is handed now rather than only the first one — pass a stable promise, or
  use `useFetchFn` — and `useCamera` no longer leaves an unhandled rejection in a browser without Capacitor.
- `Constant.Doc` and its diagram are translated.
