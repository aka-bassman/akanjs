import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "new.tsx",
    content: `import { type cnst, fetch, Task } from "@apps/${dict.appName}/client";
import { page } from "akanjs/client";
import { Load, Link, buttonRecipe } from "akanjs/ui";

export default page().render(() => {
  const taskForm: Partial<cnst.Task> = { status: "todo" };

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <Link href="/task" className={buttonRecipe({ variant: "ghost", size: "sm" })}>
          ← Tasks
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="font-extrabold text-3xl text-foreground">New Task</h1>
        <p className="mt-1 text-foreground/60 text-sm">Create a new task with title and description</p>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-background p-6 shadow-sm">
        <Load.Edit slice={fetch.slice.taskInPublic} edit={taskForm} type="form" onCancel="back" onSubmit="/task">
          <Task.Template.General />
        </Load.Edit>
      </div>
    </main>
  );
});`,
  };
}
