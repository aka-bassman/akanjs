---
"@akanjs/devkit": patch
---

fix(devkit): stop re-exporting `lowerlize` from `@akanjs/devkit/workflow`

The re-export was CLI plumbing that leaked through the facet's `export *`: it existed so one CLI script could
import it, and that script has imported it from `akanjs/common` for a while. Nothing else used it. The function
itself is unchanged — import `lowerlize` from `akanjs/common`, which is where it always lived.
