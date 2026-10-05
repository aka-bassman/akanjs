export class TaskSlice extends slice(srv.task, { guards: { root: Admin, get: Public, cru: Admin } }, (init) => ({
  inProject: init().param("projectId", ID).exec(() => null), // @flag
  inOrg: init({ mcp: false }).param("orgId", ID).exec(() => null), // @flag
  inAnyone: init({ guards: [] }).exec(() => null), // @flag
})) {}

export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation, pubsub, message }) => ({
  taskCount: query(Int).exec(() => 0), // @flag
  taskOfSlug: query(cnst.Task, { nullable: true }).param("slug", String).exec(() => null), // @flag
  startTask: mutation(Boolean).exec(() => true), // @flag
  archiveTask: mutation(Boolean, { guards: [] }).exec(() => true), // @flag
  noteTask: mutation(Boolean, { nullable, timeout: 500 }).exec(() => true), // @flag
  taskEvents: pubsub(cnst.Task).exec(() => null), // @flag
  pingTask: message(Boolean, { timeout: 1000 }).exec(() => true), // @flag
})) {}
