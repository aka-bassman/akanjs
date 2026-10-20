---
"akanjs": patch
---

The agent chat's `@` and `/` menus:

- Two records with the same title, such as two pages called "Minutes" or a ticket and a document with the same name, no longer share one React key. Each `MenuRow` now carries an `id` (`<refName>/<refId>` for a reference row, the command name for a `/` row), and `DefaultAgentMenu` keys its rows by it. An `AgentMenu` override should key its rows by `row.id` too.
- Clicking or tapping a row no longer moves focus out of the composer. On a phone that blur dropped the keyboard, and the panel shrank under the finger, so the tap missed.
- `ComposerProps` gains `isMenuOpen`, true while a menu is drawn. An `AgentComposer` override that writes a newline on Enter can pass Enter to `onKeyDown` while it is set, so Enter picks the highlighted row.
