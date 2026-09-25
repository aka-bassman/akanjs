import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(
  scanInfo: AppInfo | LibInfo | null,
  dict: { appName: string },
  options: { libs?: string[] } = {},
) {
  // Task writes are guarded by SignedIn, so the fixtures sign a user in through libs/shared when it is installed.
  const signsIn = options.libs?.includes("shared") ?? false;
  return `${
    signsIn
      ? `import * as userSpec from "@libs/shared/lib/user/user.signal.spec";
`
      : ""
  }import type { DocumentModel } from "akanjs/constant";
import { ${signsIn ? "" : "getOrSetupSignalTestFetch, "}sampleOf } from "akanjs/test";

import * as cnst from "../cnst";
import type { fetch as appFetch } from "../useServer";

type AppFetch = typeof appFetch;

const getFetch = async () => ${signsIn ? "(await userSpec.getUserAgentWithPassword<AppFetch>()).fetch" : "await getOrSetupSignalTestFetch<AppFetch>()"};

export interface TaskAgent {
  task: cnst.Task;
  fetch: AppFetch;
  taskInput: DocumentModel<cnst.TaskInput>;
}

export const createTask = async (overrides: Partial<DocumentModel<cnst.TaskInput>> = {}): Promise<TaskAgent> => {
  const fetch = await getFetch();
  const taskInput = {
    ...sampleOf(cnst.TaskInput),
    ...overrides,
  };

  const task = await fetch.createTask(taskInput);

  return {
    task,
    fetch,
    taskInput,
  };
};

export const getStartedTask = async (overrides: Partial<DocumentModel<cnst.TaskInput>> = {}): Promise<TaskAgent> => {
  const agent = await createTask(overrides);
  const task = await agent.fetch.startTask(agent.task.id);

  return {
    ...agent,
    task,
  };
};

export const getCompletedTask = async (overrides: Partial<DocumentModel<cnst.TaskInput>> = {}): Promise<TaskAgent> => {
  const agent = await getStartedTask(overrides);
  const task = await agent.fetch.completeTask(agent.task.id);

  return {
    ...agent,
    task,
  };
};
`;
}
