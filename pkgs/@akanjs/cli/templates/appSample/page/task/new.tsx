import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "new.tsx",
    content: `import { fetch, usePage } from "@apps/${dict.appName}/client";
import { Load } from "akanjs/ui";
import { cnst, Task } from "@apps/${dict.appName}/client";

// ===== page/task/new.tsx =====
// Convention: Server-side form page using Load.Edit from akanjs/ui.
// async Page() — server-side component that pre-initializes form data before rendering.
// Load.Edit with type="form" renders the Template inside a form wrapper with submit/cancel actions.
// onCancel="back" navigates to the previous page; onSubmit specifies the redirect after success.
// Template is reused — same Task.Template.General used for create, edit, and client-side modals.

export default async function Page() {
  const taskForm: Partial<cnst.Task> = { status: "todo" };

  return (
    <Load.Edit
      slice={fetch.slice.task}
      edit={taskForm}
      type="form"
      onCancel="back"
      onSubmit="/task"
    >
      <Task.Template.General />
    </Load.Edit>
  );
}
`,
  };
}
