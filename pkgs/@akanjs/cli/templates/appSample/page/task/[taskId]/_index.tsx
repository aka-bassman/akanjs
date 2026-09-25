import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "_index.tsx",
    content: `import { fetch, usePage } from "@apps/${dict.appName}/client";
import { Task } from "@apps/${dict.appName}/lib/task";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Link, buttonRecipe } from "akanjs/ui";

export default page()
  .param("taskId", ID)
  .render(async ({ taskId }) => {
    const { l } = usePage();
    const { taskView } = await fetch.viewTask(taskId);
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <a href="/task" className={buttonRecipe({ variant: "ghost", size: "sm" })}>
            {l("task.taskBackToTasks")}
          </a>
          <Link href={\`/task/\${taskId}/edit\`} className={buttonRecipe({ variant: "primary", size: "sm" })}>
            {l("task.taskEdit")}
          </Link>
        </div>

        <Task.Zone.View className="max-w-2xl" view={taskView} />
      </main>
    );
  });
`,
  };
}
