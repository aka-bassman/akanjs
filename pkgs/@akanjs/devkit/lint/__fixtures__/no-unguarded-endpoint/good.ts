export class TaskSlice extends slice(srv.task, { guards: { root: Admin, get: Public, cru: Admin } }, (init) => ({
  inProject: init({ guards: [Member] }).param("projectId", ID).exec(() => null), // @ok
  inPublic: init({ guards: [Public], mcp: false }).exec(() => null), // @ok
  inShared: init(sharedSliceOption).exec(() => null), // @ok
})) {}

export class TaskEndpoint extends endpoint(srv.task, ({ query, mutation, pubsub, message }) => ({
  taskCount: query(Int, { guards: [Public] }).exec(() => 0), // @ok
  startTask: mutation(Boolean, { guards: [User], mcp: false }).exec(() => true), // @ok
  addTaskFiles: mutation([cnst.File], { guards: [Every], fileUpload: true }).exec(() => []), // @ok
  taskFrames: pubsub(Binary, { guards: [Admin], backpressure: "queue" }).exec(() => null), // @ok
  pingTask: message(Boolean, { guards }).exec(() => true), // @ok
  taskSummary: query(cnst.Task, { ...adminOption, nullable: true }).exec(() => null), // @ok
  taskOwner: query(cnst.User, { "guards": [Admin] }).exec(() => null), // @ok
})) {}

export class TaskInternal extends internal(srv.task, ({ interval, initialize }) => ({
  sweepTasks: interval(60_000).exec(() => null), // @ok
  bootTasks: initialize().exec(() => null), // @ok
})) {}

export const describeTask = () => query(cnst.Task); // @ok

export class NoteSlice extends slice(srv.note, { guards: { root: [Admin, Owner], get: Public } }, () => ({}), libNoteSlice) {} // @ok
export class LabelSlice extends slice(srv.label, { guards: { root: None, get: None, cru: None } }) {} // @ok
export class TagSlice extends slice(srv.tag, sharedSliceOption, () => ({})) {} // @ok
export class StampSlice extends slice(srv.stamp, { guards: { ...adminGuards, get: Public } }, () => ({})) {} // @ok
export class SealSlice extends slice(srv.seal, { guards: sealGuards, mcp: { cru: false } }, () => ({})) {} // @ok
