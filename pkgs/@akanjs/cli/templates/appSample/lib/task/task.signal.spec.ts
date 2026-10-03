import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return `import type { DocumentModel } from "akanjs/constant";
import { getOrSetupSignalTestFetch, sampleOf } from "akanjs/test";

import * as cnst from "../cnst";
import type { fetch as appFetch } from "../useServer";

type AppFetch = typeof appFetch;

const getFetch = async () => await getOrSetupSignalTestFetch<AppFetch>();

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
