import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "edit.tsx",
    content: `import { fetch, Task } from "@apps/${dict.appName}/client";
import { Load } from "akanjs/ui";

// ===== page/task/[taskId]/edit.tsx =====
// Convention: Server-side edit form page using Load.Edit from akanjs/ui.
// async Page() — fetches model data on the server via fetch.editTask(params.taskId).
// The same Template (Task.Template.General) is reused here — no separate edit template needed.
// Load.Edit with type="form" provides the submit/cancel wrapper with the pre-loaded model.

interface PageProps {
  params: { taskId: string };
}
export default async function Page({ params: { taskId } }: PageProps) {
  const taskEdit = await fetch.editTask(taskId);

  return (
    <Load.Edit
      slice={fetch.slice.task}
      edit={taskEdit}
      type="form"
      onSubmit={\`/task/\${params.taskId}\`}
    >
      <Task.Template.General />
    </Load.Edit>
  );
}
`,
  };
}
