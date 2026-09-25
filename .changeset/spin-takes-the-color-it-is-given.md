---
"akanjs": patch
---

`Loading.Spin` takes the color and the size the caller gives it, instead of pinning both to the icon

The spinner hard-coded `text-primary/70` and `text-xl` **on the icon**, while `className` landed on the wrapper
around it. So every `text-*` and every `size-*` a caller passed was a silent no-op — `cn` merged it into a class
list the icon never read — and the worst case was a filled surface: a `<Badge variant="info">` renders
`text-info-foreground`, the spinner inside it stayed `text-primary/70`, and green-on-cyan at L 70% against L 74%
is a 1.10:1 contrast that leaves the badge's text legible and the spinner invisible.

Both now sit on the wrapper. The icon is drawn at `1em` in `currentColor`, so color and size cascade into it, and
`className` — merged last — wins over either. `tone="current"` names no color at all, which is what a filled
surface needs: the spinner inherits whatever foreground the badge or the button already set. `tone` defaults to
`"primary"`, so nothing that exists renders differently, and `"muted"` is there for a secondary surface.

`size` also takes a number now, drawn as that many pixels, because the named steps were the only vocabulary and a
caller reaching past them wrote `size-[50px]` — a 50px empty box around a 20px icon. A custom `indicator` is left
alone by `tone` exactly as before: it carries its own color, and the rotation is the wrapper's.
