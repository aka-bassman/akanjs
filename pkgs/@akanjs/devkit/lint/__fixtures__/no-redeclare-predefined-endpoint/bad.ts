export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation }) => ({
  task: query(cnst.Task).exec(() => null), // @flag
  lightTask: query(cnst.Task).exec(() => null), // @flag
  createTask: mutation(cnst.Task).exec(() => null), // @flag
  updateTask: mutation(cnst.Task).exec(() => null), // @flag
  removeTask: mutation(cnst.Task).exec(() => null), // @flag
  viewTask: query(cnst.Task).exec(() => null), // @flag
  editTask: query(cnst.Task).exec(() => null), // @flag
  mergeTask: mutation(cnst.Task).exec(() => null), // @flag
})) {}
