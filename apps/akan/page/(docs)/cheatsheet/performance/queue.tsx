import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows = [
    {
      name: "process",
      desc: l.trans({
        en: "An internal declared in the signal file. A queued job runs its `exec`.",
        ko: "signal 파일에 선언하는 internal입니다. 큐에 들어간 job이 이것의 `exec`을 실행합니다.",
      }),
    },
    {
      name: "job",
      desc: l.trans({
        en: "One queued run of a process: its arguments plus its retry state.",
        ko: "process를 한 번 실행하도록 큐에 넣은 단위입니다. 인자와 재시도 상태를 담습니다.",
      }),
    },
    {
      name: "replica",
      desc: l.trans({
        en: "One server process of the app. Its role is `federation`, `batch` or `all`.",
        ko: "앱을 실행하는 서버 프로세스 하나입니다. 역할은 `federation`, `batch`, `all` 중 하나입니다.",
      }),
    },
    {
      name: "serverMode",
      desc: l.trans({
        en: "A process option that picks which replica roles run its jobs.",
        ko: "어느 역할의 replica가 job을 실행할지 고르는 process 옵션입니다.",
      }),
    },
  ];

  const jobOptionRows = [
    {
      key: "delay",
      type: "number",
      default: "0",
      desc: l.trans({
        en: "Milliseconds to wait before the first run.",
        ko: "첫 실행까지 기다릴 시간(ms)입니다.",
      }),
    },
    {
      key: "attempts",
      type: "number",
      default: "1",
      desc: l.trans({
        en: "How many times the job may run in total, counting the first try.",
        ko: "첫 시도를 포함해 job이 실행될 수 있는 최대 횟수입니다.",
      }),
      example: "await this.reportSignal.generateReport(report.id, { attempts: 3, backoff: 10_000 });",
    },
    {
      key: "backoff",
      type: "number | { type?, delay? }",
      desc: l.trans({
        en: "Milliseconds to wait before a retry.",
        ko: "재시도하기 전에 기다릴 시간(ms)입니다.",
      }),
    },
  ];

  const roleColumns = [
    { key: "requests", label: l.trans({ en: "Requests", ko: "요청" }) },
    { key: "anyJob", label: l.trans({ en: "Default job", ko: "기본 job" }), caption: 'serverMode: "all"' },
    { key: "batchJob", label: l.trans({ en: "Batch job", ko: "batch job" }), caption: 'serverMode: "batch"' },
  ];

  const roleGroups = [
    {
      label: "`AKAN_REPLICA=<federation>,<batch>,<all>`",
      rows: [
        {
          name: "federation",
          desc: l.trans({
            en: "Answers user requests.",
            ko: "사용자 요청을 받습니다.",
          }),
          marks: { requests: true, anyJob: true },
        },
        {
          name: "batch",
          desc: l.trans({
            en: "Never listens for requests. Runs background work only.",
            ko: "요청을 받지 않고 백그라운드 작업만 합니다.",
          }),
          marks: { anyJob: true, batchJob: true },
        },
        {
          name: "all",
          desc: l.trans({
            en: "Does both. The default `0,0,1` is one of these.",
            ko: "둘 다 합니다. 기본값 `0,0,1`이 이 replica 하나입니다.",
          }),
          marks: { requests: true, anyJob: true, batchJob: true },
        },
      ],
    },
  ];

  const statusRows = [
    {
      status: "waiting",
      setBy: "queueGenerateReport",
      meaning: l.trans({
        en: "The job is in the queue, waiting for its turn.",
        ko: "job이 큐에서 차례를 기다립니다.",
      }),
    },
    {
      status: "running",
      setBy: "generateReport",
      meaning: l.trans({
        en: "The process is working. Update `progress` along the way.",
        ko: "process가 작업 중입니다. 도중에 `progress`를 갱신합니다.",
      }),
    },
    {
      status: "done",
      setBy: "generateReport",
      meaning: l.trans({
        en: "The result, here `file`, is ready.",
        ko: "결과(여기서는 `file`)가 준비됐습니다.",
      }),
    },
    {
      status: "failed",
      setBy: "generateReport",
      meaning: l.trans({
        en: "The work failed. The reason goes into `errMsg`.",
        ko: "작업이 실패했습니다. 원인은 `errMsg`에 남깁니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Queueing", ko: "큐 작업" })}>
        <Docs.Title>{l.trans({ en: "Queueing", ko: "큐 작업" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Some work is too slow to finish inside a request. Put it in a queue and answer right away; a background process picks it up and does the heavy part.",
              ko: "요청 안에서 끝내기엔 너무 오래 걸리는 일이 있습니다. 이런 일은 큐에 넣고 바로 응답합니다. 무거운 부분은 백그라운드 process가 이어받아 처리합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  <strong>Good for</strong> backups, exports, report generation, imports, and long AI jobs.
                </span>
              ),
              ko: (
                <span>
                  <strong>이럴 때 씁니다.</strong> 백업, 내보내기, 리포트 생성, 가져오기, 오래 걸리는 AI 작업.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <Docs.SubSubTitle>{l.trans({ en: "The three steps", ko: "세 단계" })}</Docs.SubSubTitle>
          <ol className="my-4 list-decimal space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The endpoint records the intent.</strong> It saves <code>waiting</code>, queues the job and
                    returns.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>엔드포인트가 사용자의 의도를 기록합니다.</strong> 상태를 <code>waiting</code>으로 저장하고
                    job을 큐에 넣은 뒤 바로 돌아옵니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The queue holds the job</strong> until a replica that runs this process takes it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>큐가 job을 보관합니다.</strong> 이 process를 실행하는 replica가 가져갈 때까지입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The process does the slow work</strong> outside the request path, writing status and
                    progress into the document.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>process가 느린 작업을 합니다.</strong> 요청 경로 밖에서 실행하며, 상태와 진행률을 문서에
                    기록합니다.
                  </span>
                ),
              })}
            </li>
          </ol>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint" title={l.trans({ en: "Queue From Endpoint", ko: "엔드포인트에서 큐에 넣기" })}>
        <Docs.Title>{l.trans({ en: "Queue From Endpoint", ko: "엔드포인트에서 큐에 넣기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Keep the endpoint short. It sets the status to <code>waiting</code>, asks the process to run later,
                  and returns.
                </span>
              ),
              ko: (
                <span>
                  엔드포인트는 짧게 둡니다. 상태를 <code>waiting</code>으로 바꾸고, process에게 나중에 실행해 달라고
                  요청한 뒤 돌아옵니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "The endpoint only hands the call to the service:",
              ko: "엔드포인트는 호출을 service에 넘기기만 합니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/report/report.signal.ts"
          code={`export class ReportEndpoint extends endpoint(srv.report, ({ mutation }) => ({
  queueGenerateReport: mutation(cnst.Report, { guards: [Owner] })
    .param("reportId", ID)
    .exec(async function (reportId) {
      return await this.reportService.queueGenerateReport(reportId);
    }),
})) {}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The service saves the status, then queues the job:",
              ko: "service가 상태를 저장한 다음 job을 큐에 넣습니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/report/report.service.ts"
          code={`export class ReportService extends serve(db.report, ({ signal, plug }) => ({
  reportSignal: signal<sig.Report>(),
  reportWriter: plug(ReportWriter),
})) {
  async queueGenerateReport(reportId: string) {
    const report = await this.reportModel.getReport(reportId);
    await report.set({ status: "waiting" }).save();
    await this.reportSignal.generateReport(report.id);
    return report;
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>this.reportSignal.generateReport()</code> queues, it does not run.
                    </strong>{" "}
                    It returns once the job is stored, and its arguments follow the process's <code>.msg()</code> order.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>this.reportSignal.generateReport()</code>는 실행이 아니라 등록입니다.
                    </strong>{" "}
                    job이 저장되면 바로 돌아오고, 인자는 process의 <code>.msg()</code> 순서를 따릅니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Inject it with <code>signal&lt;sig.Report&gt;()</code>.
                    </strong>{" "}
                    The field must be named <code>&lt;refName&gt;Signal</code>, here <code>reportSignal</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>signal&lt;sig.Report&gt;()</code>로 주입합니다.
                    </strong>{" "}
                    필드 이름은 <code>&lt;refName&gt;Signal</code>, 여기서는 <code>reportSignal</code>이어야 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Save the status first, then queue.</strong> A job can start at once, and a late{" "}
                    <code>waiting</code> would overwrite its <code>running</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>상태를 먼저 저장하고 큐에 넣습니다.</strong> job은 곧바로 시작될 수 있어서, 늦게 쓴{" "}
                    <code>waiting</code>이 process가 쓴 <code>running</code>을 덮어쓸 수 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Job options", ko: "job 옵션" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "Pass job options as the last argument of the queueing call:",
              ko: "등록 호출의 마지막 인자로 job 옵션을 넘깁니다:",
            })}
          </div>
          <Docs.OptionTable items={jobOptionRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="process" title={l.trans({ en: "Run In Process", ko: "process에서 실행" })}>
        <Docs.Title>{l.trans({ en: "Run In Process", ko: "process에서 실행" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The internal process owns the slow work. It updates progress, uploads files, and marks the job{" "}
                  <code>done</code> or <code>failed</code>.
                </span>
              ),
              ko: (
                <span>
                  느린 작업은 internal process가 맡습니다. 진행률을 갱신하고, 파일을 업로드하고, job을 <code>done</code>{" "}
                  또는 <code>failed</code>로 표시합니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "Declare the process in the signal file's Internal class:",
              ko: "process는 signal 파일의 Internal 클래스에 선언합니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/report/report.signal.ts"
          code={`export class ReportInternal extends internal(srv.report, ({ process }) => ({
  generateReport: process(Boolean)
    .msg("reportId", ID)
    .exec(async function (reportId) {
      await this.reportService.generateReport(reportId);
      return true;
    }),
})) {}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>.msg()</code> declares what the job carries.
                    </strong>{" "}
                    The values passed when queueing arrive in the same order, restored to the declared type.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>.msg()</code>가 job에 실을 인자를 정합니다.
                    </strong>{" "}
                    등록할 때 넘긴 값이 선언한 타입으로 복원되어 같은 순서로 들어옵니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The job itself comes last:</strong>{" "}
                    <code>exec(async function (reportId, job) {"{…}"})</code>. It carries <code>job.id</code> and{" "}
                    <code>job.attemptsMade</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>job 자체는 마지막 인자로 옵니다.</strong>{" "}
                    <code>exec(async function (reportId, job) {"{…}"})</code>처럼 받고, <code>job.id</code>와{" "}
                    <code>job.attemptsMade</code>를 담고 있습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>process(Boolean)</code> types the return value of <code>exec</code>,
                    </strong>{" "}
                    here <code>true</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>process(Boolean)</code>가 <code>exec</code>의 반환 타입을 정합니다.
                    </strong>{" "}
                    여기서는 <code>true</code>를 돌려줍니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <div>
            {l.trans({
              en: "The work itself lives in a service method:",
              ko: "실제 작업은 service 메서드에 둡니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/report/report.service.ts"
          code={`async generateReport(reportId: string) {
  const report = await this.reportModel.getReport(reportId);
  await report.set({ status: "running", progress: 10 }).save();
  try {
    const file = await this.reportWriter.makePdf(report);
    await report.set({ status: "done", progress: 100, file }).save();
  } catch (err) {
    await report.set({ status: "failed", errMsg: String(err) }).save();
  }
}`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Save at every step.</strong> <code>running</code>, then <code>done</code> or{" "}
                    <code>failed</code>, with <code>progress</code> in between.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>단계마다 저장합니다.</strong> <code>running</code>을 거쳐 <code>done</code> 또는{" "}
                    <code>failed</code>로 끝나고, 그 사이에 <code>progress</code>를 갱신합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Only a throw retries.</strong> A job runs again only when <code>exec</code> throws and{" "}
                  <code>attempts</code> remain. This example catches and records <code>failed</code>, so it runs once.
                </span>
              ),
              ko: (
                <span>
                  <strong>에러를 던져야 재시도됩니다.</strong> <code>exec</code>이 에러를 던지고 <code>attempts</code>가
                  남아 있을 때만 job이 다시 실행됩니다. 이 예제는 catch해서 <code>failed</code>로 기록하므로 한 번에
                  끝납니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="replica" title={l.trans({ en: "Replica Roles", ko: "replica 역할" })}>
        <Docs.Title>{l.trans({ en: "Replica Roles", ko: "replica 역할" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Akan runs replicas with roles: <code>federation</code> answers users, and <code>batch</code> takes
                  background work. Splitting them keeps slow jobs from exhausting the request servers.
                </span>
              ),
              ko: (
                <span>
                  Akan은 역할이 있는 replica를 실행합니다. <code>federation</code>은 사용자 요청을 받고,{" "}
                  <code>batch</code>는 백그라운드 작업을 맡습니다. 둘을 나누면 느린 job이 요청 서버의 자원을 다 쓰지
                  못합니다.
                </span>
              ),
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "Role", ko: "역할" })}
            columns={roleColumns}
            groups={roleGroups}
            markLabel={l.trans({ en: "runs", ko: "실행함" })}
            emptyLabel={l.trans({ en: "does not run", ko: "실행 안 함" })}
          />
          <div>
            {l.trans({
              en: (
                <span>
                  To move the report job off the request servers, declare <code>serverMode</code> on the process:
                </span>
              ),
              ko: (
                <span>
                  리포트 job을 요청 서버에서 빼려면 process에 <code>serverMode</code>를 선언합니다:
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/report/report.signal.ts"
          code={`generateReport: process(Boolean, { serverMode: "batch" })
  .msg("reportId", ID)
  .exec(async function (reportId) {
    await this.reportService.generateReport(reportId);
    return true;
  }),`}
        />
        <Docs.Description>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Then start a batch replica.</strong> <code>AKAN_REPLICA=2,1,0</code> is two federation
                    replicas and one batch replica.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>그다음 batch replica를 띄웁니다.</strong> <code>AKAN_REPLICA=2,1,0</code>은 federation
                    replica 2개와 batch replica 1개입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Something must run it.</strong> With <code>serverMode: "batch"</code> and neither a batch
                    nor an all replica, as in <code>2,0,0</code>, jobs pile up unrun.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>실행할 replica가 있어야 합니다.</strong> <code>serverMode: "batch"</code>인데{" "}
                    <code>2,0,0</code>처럼 batch도 all도 없으면 job이 실행되지 않고 쌓입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>A batch replica alone does not move the work.</strong> A process without{" "}
                  <code>serverMode</code> runs on every role, federation included.
                </span>
              ),
              ko: (
                <span>
                  <strong>batch replica를 띄우는 것만으로는 작업이 옮겨 가지 않습니다.</strong> <code>serverMode</code>
                  를 선언하지 않은 process는 federation을 포함한 모든 역할에서 실행됩니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
        <Docs.Flow
          title={l.trans({ en: "Request side: federation replica", ko: "요청 쪽: federation replica" })}
          nodes={{
            user: { label: l.trans({ en: "User Request", ko: "사용자 요청" }) },
            federation: {
              label: l.trans({ en: "Federation Replica", ko: "federation replica" }),
              lines: [l.trans({ en: "endpoint", ko: "엔드포인트" })],
            },
            queue: { label: l.trans({ en: "Queue Job", ko: "job을 큐에 넣기" }) },
          }}
          edges={[
            ["user", "federation"],
            ["federation", "queue"],
          ]}
        />
        <Docs.Flow
          title={l.trans({ en: "Background side: batch replica", ko: "백그라운드 쪽: batch replica" })}
          nodes={{
            batch: {
              label: l.trans({ en: "Batch Replica", ko: "batch replica" }),
              lines: ["process"],
            },
            work: { label: l.trans({ en: "Run Heavy Work", ko: "무거운 작업 실행" }) },
            status: { label: l.trans({ en: "Update Job Status", ko: "job 상태 갱신" }) },
            userView: { label: l.trans({ en: "User Sees Progress", ko: "사용자가 진행 상황 확인" }) },
          }}
          edges={[
            ["batch", "work"],
            ["work", "status"],
            ["status", "userView"],
          ]}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Always store the job status. These four are enough for the screen to know what to show:",
              ko: "job 상태는 항상 저장합니다. 이 네 가지면 화면이 무엇을 보여 줄지 정할 수 있습니다:",
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "status", label: l.trans({ en: "Status", ko: "상태" }), code: true },
              { key: "setBy", label: l.trans({ en: "Written by", ko: "쓰는 곳" }), code: true },
              { key: "meaning", label: l.trans({ en: "Meaning", ko: "뜻" }) },
            ]}
            rows={statusRows}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Make jobs idempotent.</strong> Retrying the same job must not corrupt data.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>job은 멱등(idempotent)하게 만듭니다.</strong> 같은 job을 다시 실행해도 데이터가 깨지면 안
                    됩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Save progress when the user needs feedback.</strong> A <code>progress</code> field is
                    enough.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>사용자에게 진행 상황을 보여 줘야 하면 진행률을 저장합니다.</strong> <code>progress</code>{" "}
                    필드 하나면 충분합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Return quickly from the endpoint.</strong> Do the slow work in the process.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>엔드포인트는 빨리 반환합니다.</strong> 느린 작업은 process에서 합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.LinkGrid
            items={[
              {
                href: "/conventions/module/signal#internal-signal",
                title: l.trans({ en: "Internal Signals", ko: "internal signal" }),
                desc: l.trans({
                  en: "Every internal type, and the `serverMode` / `operationMode` options.",
                  ko: "internal의 모든 종류와 `serverMode` / `operationMode` 옵션.",
                }),
              },
              {
                href: "/cheatsheet/dev/docker#replica",
                title: l.trans({ en: "Scale With AKAN_REPLICA", ko: "AKAN_REPLICA로 확장" }),
                desc: l.trans({
                  en: "The three slots of `AKAN_REPLICA` and how a container runs them.",
                  ko: "`AKAN_REPLICA`의 세 자리와 컨테이너가 그것을 실행하는 방식.",
                }),
              },
            ]}
          />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
