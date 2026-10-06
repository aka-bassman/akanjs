---
"@akanjs/devkit": minor
---

New lint rules: `no-unguarded-endpoint` warns on an endpoint, named slice or root slice that declares no guards, and `no-double-brace-placeholder` refuses `{{name}}` in a dictionary error/translate entry. `no-throw-raw-error` also warns on a raw `Error` constructed without `throw`, and `no-inline-color` warns on color literals in SVG color attributes and `el.style` writes.
