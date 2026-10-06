export class TaskSlice extends slice(srv.task, { guards: { root: Admin, get: Public, cru: Admin } }, (init) => ({
  inProject: init().param("projectId", ID).exec(() => null), // @warn
  inOrg: init({ mcp: false }).param("orgId", ID).exec(() => null), // @warn
  inAnyone: init({ guards: [] }).exec(() => null), // @warn
})) {}

export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation, pubsub, message }) => ({
  taskCount: query(Int).exec(() => 0), // @warn
  taskOfSlug: query(cnst.Task, { nullable: true }).param("slug", String).exec(() => null), // @warn
  startTask: mutation(Boolean).exec(() => true), // @warn
  archiveTask: mutation(Boolean, { guards: [] }).exec(() => true), // @warn
  noteTask: mutation(Boolean, { nullable, timeout: 500 }).exec(() => true), // @warn
  taskEvents: pubsub(cnst.Task).exec(() => null), // @warn
  pingTask: message(Boolean, { timeout: 1000 }).exec(() => true), // @warn
})) {}

export class NoteSlice extends slice(srv.note, { guards: { get: Public, cru: Admin } }, () => ({})) {} // @warn
export class LabelSlice extends slice(srv.label, { guards: { root: [], get: Public, cru: Admin } }, () => ({})) {} // @warn
export class TagSlice extends slice(srv.tag, { mcp: false }, () => ({})) {} // @warn
export class StampSlice extends slice(srv.stamp, {}, () => ({}), libStampSlice) {} // @warn
