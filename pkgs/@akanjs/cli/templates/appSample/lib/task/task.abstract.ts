import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "task.abstract.md",
    content: `# task Abstract
A task is one unit of work that moves from todo through in progress to completed, and keeps a record of each move.

## Rules
- A task only moves forward: \`start()\` needs \`todo\` and \`complete()\` needs \`inProgress\`; any other state throws.
- Every move appends one \`workHistory\` entry, and creation writes the first (\`created\`), so the history is never
  empty and its last entry always matches \`status\`.
- Anyone may read a task; creating, changing, starting and completing one needs a signed-in caller. There is no
  generated admin API (\`root: None\`).
- Removal is soft: a removed task keeps its row with \`removedAt\` set.

todo -> inProgress -> completed
`,
  };
}
