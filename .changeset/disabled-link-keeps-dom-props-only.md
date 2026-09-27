---
"akanjs": patch
---

fix(ui): a disabled `Link` renders its `div` without the link-only props

With `disabled` (or no `href`), `Link` spread every remaining prop onto the `div` it renders, so `scrollToTop`,
`replace`, `activeClassName`, `activeExact` and `noCache` reached the DOM and React warned about each. They are now
dropped there; the caller's own attributes (`aria-*`, handlers, `data-*`) still reach the `div`.
