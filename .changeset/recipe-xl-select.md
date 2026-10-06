---
"akanjs": minor
---

`buttonRecipe` gains `size: "xl"` and `inputRecipe` gains `kind: "select"` for a native `<select>`. Upgrade note: an app's own `recipes.button` / `recipes.input` override slot must accept the new values to typecheck.
