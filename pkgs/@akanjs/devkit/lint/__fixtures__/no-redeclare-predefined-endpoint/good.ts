export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation }) => ({
  startTask: mutation(cnst.Task).exec(() => null), // @ok
  taskSummary: query(cnst.Task).exec(() => null), // @ok
  viewTaskBoard: query(cnst.Task).exec(() => null), // @ok
  createTaskComment: mutation(cnst.Task).exec(() => null), // @ok
})) {}
