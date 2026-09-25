# Queueing

- Source: /cheatsheet/performance/queue
- Mirror: /llms/pages/cheatsheet/performance/queue.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Queueing (#overview)
- Queue From Endpoint (#endpoint)
- Run In Process (#process)
- Replica Roles (#replica)
- Tips (#tips)

## Content

Queueing

An internal declared in the signal file. A queued job runs its `exec`.

One queued run of a process: its arguments plus its retry state.

One server process of the app. Its role is `federation`, `batch` or `all`.

A process option that picks which replica roles run its jobs.

Milliseconds to wait before the first run.

How many times the job may run in total, counting the first try.

Milliseconds to wait before a retry.

Requests

Default job

Batch job

Answers user requests.

Never listens for requests. Runs background work only.

Does both. The default `0,0,1` is one of these.

The job is in the queue, waiting for its turn.

The process is working. Update `progress` along the way.

The result, here `file`, is ready.

The work failed. The reason goes into `errMsg`.

Some work is too slow to finish inside a request. Put it in a queue and answer right away; a background process picks it up and does the heavy part.

Words used on this page

Term

The three steps

Queue From Endpoint

The endpoint only hands the call to the service:

The service saves the status, then queues the job:

Job options

Pass job options as the last argument of the queueing call:

Run In Process

Declare the process in the signal file's Internal class:

The work itself lives in a service method:

Replica Roles

Role

runs

does not run

Request side: federation replica

User Request

Federation Replica

endpoint

Queue Job

Background side: batch replica

Batch Replica

Run Heavy Work

Update Job Status

User Sees Progress

Tips

Always store the job status. These four are enough for the screen to know what to show:

Status

Written by

Meaning

Internal Signals

Every internal type, and the `serverMode` / `operationMode` options.

Scale With AKAN_REPLICA

The three slots of `AKAN_REPLICA` and how a container runs them.

## Code Examples

### apps/myapp/lib/report/report.signal.ts

```ts
export class ReportEndpoint extends endpoint(srv.report, ({ mutation }) => ({
  queueGenerateReport: mutation(cnst.Report, { guards: [Owner] })
    .param("reportId", ID)
    .exec(async function (reportId) {
      return await this.reportService.queueGenerateReport(reportId);
    }),
})) {}
```

### apps/myapp/lib/report/report.service.ts

```ts
export class ReportService extends serve(db.report, ({ signal, plug }) => ({
  reportSignal: signal<sig.Report>(),
  reportWriter: plug(ReportWriter),
})) {
  async queueGenerateReport(reportId: string) {
    const report = await this.reportModel.getReport(reportId);
    await report.set({ status: "waiting" }).save();
    await this.reportSignal.generateReport(report.id);
    return report;
  }
}
```

### apps/myapp/lib/report/report.signal.ts

```ts
export class ReportInternal extends internal(srv.report, ({ process }) => ({
  generateReport: process(Boolean)
    .msg("reportId", ID)
    .exec(async function (reportId) {
      await this.reportService.generateReport(reportId);
      return true;
    }),
})) {}
```

### apps/myapp/lib/report/report.service.ts

```ts
async generateReport(reportId: string) {
  const report = await this.reportModel.getReport(reportId);
  await report.set({ status: "running", progress: 10 }).save();
  try {
    const file = await this.reportWriter.makePdf(report);
    await report.set({ status: "done", progress: 100, file }).save();
  } catch (err) {
    await report.set({ status: "failed", errMsg: String(err) }).save();
  }
}
```

### apps/myapp/lib/report/report.signal.ts

```ts
generateReport: process(Boolean, { serverMode: "batch" })
  .msg("reportId", ID)
  .exec(async function (reportId) {
    await this.reportService.generateReport(reportId);
    return true;
  }),
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

