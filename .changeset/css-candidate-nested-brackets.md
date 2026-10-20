---
"@akanjs/devkit": patch
---

A Tailwind class with a bracket nested inside its arbitrary part, such as `[[data-theme=light]_&]:block`, `has-[[aria-expanded=true]]:opacity-100`, `[&_[data-slot=x]]:p-2` or `[&:has([data-state=open])]:p-1`, now compiles. The source scanner cut each one at the inner `]`, so Tailwind never saw the class and its rule was left out of the built CSS without a warning. The candidate cache's version is bumped, so the scanner reads every file again on the next build instead of reusing the cut classes.
