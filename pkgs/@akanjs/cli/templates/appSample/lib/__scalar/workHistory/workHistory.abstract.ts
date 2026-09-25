import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "workHistory.abstract.md",
    content: `# workHistory Abstract
One step in a task's history: which move happened, when, and an optional note.

## Rules
- Entries are only appended — by \`Task\`'s chain methods and by the task service on create — and never edited or
  removed, so the list reads as the task's moves in order.
- \`at\` is the moment the entry was built when the writer gives none.
- \`note\` is empty on every entry the app writes itself.
`,
  };
}
