---
"akanjs": patch
---

The composer says a file is being read

`useChatAttachments` now reports how many files are in the reader, and the composer draws a chip for each. The
built-in readers resolve in a tick and nothing was missing before; an `attach` that uploads takes seconds, and
since the per-file ceiling moved behind the reader that is now the shape an app is meant to write — so a large
photo was seconds of a panel that looked like it had dropped the file.
