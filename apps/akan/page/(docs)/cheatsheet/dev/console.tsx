import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const entryRows = [
    {
      name: "akan console myapp",
      desc: l.trans({
        en: "Local development: boots the app from its source in the workspace.",
        ko: "로컬 개발에서 워크스페이스의 소스로 앱을 띄웁니다.",
      }),
    },
    {
      name: "AKAN_CONSOLE=1 bun console.js",
      desc: l.trans({
        en: "Docker or Kubernetes: runs the `console.js` that `akan build` puts next to `main.js`.",
        ko: "Docker나 Kubernetes에서 `akan build`가 `main.js` 옆에 넣어 둔 `console.js`를 실행합니다.",
      }),
    },
  ];

  const inputRows = [
    {
      goal: l.trans({ en: "Keep a value for later", ko: "값을 다음 명령에서도 쓰기" }),
      how: l.trans({
        en: 'Assign without a keyword, as in `users = service("user")`, since `const` and `let` last one command.',
        ko: '`const`와 `let`은 명령 하나 동안만 살아 있으므로, `users = service("user")`처럼 키워드 없이 대입합니다.',
      }),
    },
    {
      goal: l.trans({ en: "Print a block's result", ko: "블록의 결과 출력하기" }),
      how: l.trans({
        en: "End the block with `return <expr>`, which a lone expression does not need.",
        ko: "식 하나는 그대로 출력되고, 블록은 `return <expr>`로 끝내야 출력됩니다.",
      }),
    },
    {
      goal: l.trans({ en: "Finish an unfinished line", ko: "덜 끝난 줄 이어 쓰기" }),
      how: l.trans({
        en: "Keep typing at the `...` prompt until the open bracket, string or comment closes.",
        ko: "열린 괄호, 문자열, 주석이 닫힐 때까지 `...` 프롬프트에서 이어서 입력합니다.",
      }),
    },
    {
      goal: l.trans({ en: "Throw away pending input", ko: "입력 중인 내용 버리기" }),
      how: l.trans({ en: "`.clear` or Ctrl+C.", ko: "`.clear` 또는 Ctrl+C." }),
    },
    {
      goal: l.trans({ en: "Close the console", ko: "콘솔 닫기" }),
      how: l.trans({
        en: "Ctrl+D, `.exit`, `.quit`, or Ctrl+C on an empty prompt.",
        ko: "Ctrl+D, `.exit`, `.quit`, 또는 빈 프롬프트에서 Ctrl+C를 누릅니다.",
      }),
    },
  ];

  const gateConditionRows = [
    {
      setting: "AKAN_PUBLIC_ENV",
      refuses: l.trans({ en: "It is `main`.", ko: "`main`일 때입니다." }),
    },
    {
      setting: "AKAN_PUBLIC_OPERATION_MODE",
      refuses: l.trans({
        en: "It is `cloud` or `edge`; unset, it counts as `cloud` unless the env is `local`.",
        ko: "`cloud`나 `edge`일 때입니다. 비어 있으면 env가 `local`이 아닌 한 `cloud`로 봅니다.",
      }),
    },
    {
      setting: "NODE_ENV",
      refuses: l.trans({ en: "It is `production`.", ko: "`production`일 때입니다." }),
    },
  ];

  const gateRows = [
    {
      where: l.trans({ en: "Local `akan console`", ko: "로컬 `akan console`" }),
      rule: l.trans({
        en: "Not needed while `.env` keeps both the env and the mode at `local`.",
        ko: "`.env`가 env와 모드를 모두 `local`로 두고 있다면 필요 없습니다.",
      }),
    },
    {
      where: l.trans({ en: "Docker, Kubernetes", ko: "Docker, Kubernetes" }),
      rule: l.trans({
        en: "Always needed, since the image sets `NODE_ENV=production` and the mode to `cloud`.",
        ko: "이미지가 `NODE_ENV=production`과 모드 `cloud`를 넣어 두므로 항상 필요합니다.",
      }),
    },
  ];

  const globalRows = [
    {
      name: "server",
      desc: l.trans({ en: "The booted server instance.", ko: "부팅된 서버 인스턴스입니다." }),
    },
    {
      name: "env",
      desc: l.trans({
        en: "The server config the app booted with (`env/env.server.<env>.ts`), which can hold secrets.",
        ko: "앱이 부팅할 때 읽은 서버 설정(`env/env.server.<env>.ts`)이며, 시크릿이 들어 있을 수 있습니다.",
      }),
    },
    {
      name: ["service", "signal", "adaptor"],
      desc: l.trans({
        en: 'Look an instance up by its refName, as in `service("user")`.',
        ko: '`service("user")`처럼 refName으로 인스턴스를 찾습니다.',
      }),
    },
    {
      name: "get",
      desc: l.trans({
        en: "Look an instance up by its service, signal or adaptor class, as in `get(srv.shared.UserService)`.",
        ko: "`get(srv.shared.UserService)`처럼 서비스, 시그널, 어댑터 클래스로 인스턴스를 찾습니다.",
      }),
    },
    {
      name: "methods",
      desc: l.trans({
        en: "Lists the method names on an object's prototype chain, sorted.",
        ko: "객체의 프로토타입 체인에 있는 메서드 이름을 정렬해서 보여 줍니다.",
      }),
    },
    {
      name: "debug",
      desc: l.trans({
        en: "Summarizes status, server mode, environment, and every registered service, signal and adaptor.",
        ko: "상태, 서버 모드, 실행 환경, 등록된 서비스·시그널·어댑터 전부를 요약합니다.",
      }),
    },
    {
      name: ["srv", "sig", "db", "cnst", "dict", "option"],
      desc: l.trans({
        en: "The app's generated exports, as `server.ts` exports them.",
        ko: "`server.ts`가 내보내는, 자동 생성된 앱 export입니다.",
      }),
    },
  ];

  const commandRows = [
    {
      name: ".help",
      desc: l.trans({
        en: "Lists the commands and the multi-line input rules.",
        ko: "명령 목록과 여러 줄 입력 규칙을 보여 줍니다.",
      }),
    },
    {
      name: ".globals",
      desc: l.trans({
        en: "Lists the console's globals, including the values you assigned.",
        ko: "콘솔이 넣어 둔 전역 값과 직접 대입한 값의 이름을 보여 줍니다.",
      }),
    },
    {
      name: ".clear",
      desc: l.trans({ en: "Throws away the pending multi-line input.", ko: "입력 중인 여러 줄 내용을 버립니다." }),
    },
    {
      name: [".exit", ".quit"],
      desc: l.trans({ en: "Closes the console.", ko: "콘솔을 닫습니다." }),
    },
    {
      name: ".tail",
      desc: l.trans({
        en: "Follows the running server's logs through filters until `.tail off`.",
        ko: "`.tail off`를 입력할 때까지 실행 중인 서버의 로그를 필터를 걸어 따라갑니다.",
      }),
      example: ".tail level=warn grep=payment endpoint=mutation:*",
    },
    {
      name: ".trace",
      desc: l.trans({
        en: "Prints every buffered record of one request.",
        ko: "요청 하나가 남긴 버퍼 속 기록을 모두 출력합니다.",
      }),
      example: ".trace <traceId>",
    },
  ];

  const relatedLinks = [
    {
      href: "/cheatsheet/dev/script",
      title: l.trans({ en: "Scripts", ko: "스크립트" }),
      desc: l.trans({
        en: "Repeatable operator work, with a dry run.",
        ko: "반복할 운영 작업을 dry run과 함께 파일로 남깁니다.",
      }),
    },
    {
      href: "/cheatsheet/observability/logging#live-tail",
      title: l.trans({ en: "Live Tail", ko: "실시간 로그 조회" }),
      desc: l.trans({
        en: "Every filter `.tail` accepts, from the terminal.",
        ko: "`.tail`이 받는 필터를 터미널에서 쓰는 법입니다.",
      }),
    },
    {
      href: "/cheatsheet/dev/docker#console",
      title: l.trans({ en: "Docker", ko: "Docker" }),
      desc: l.trans({ en: "Opening the console in a compose setup.", ko: "compose 환경에서 콘솔을 여는 법입니다." }),
    },
    {
      href: "/cheatsheet/dev/k8s#console",
      title: l.trans({ en: "Kubernetes", ko: "Kubernetes" }),
      desc: l.trans({ en: "Opening the console in a running pod.", ko: "실행 중인 pod에서 콘솔을 여는 법입니다." }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Server Console", ko: "서버 콘솔" })}>
        <Docs.Title>{l.trans({ en: "Server Console", ko: "서버 콘솔" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The server console is a JavaScript prompt inside your app's server. Use it to inspect services and run small operator commands.",
              ko: "서버 콘솔은 앱 서버 안에서 여는 JavaScript 프롬프트입니다. 서비스를 점검하거나 작은 운영 명령을 실행할 때 씁니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Command", ko: "명령" })} items={entryRows} />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Never create console files inside a running container or pod.</strong> The image already
                    ships <code>console.js</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>실행 중인 컨테이너나 pod 안에서 콘솔 파일을 직접 만들지 마세요.</strong> 이미지에{" "}
                    <code>console.js</code>가 이미 들어 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="local" title={l.trans({ en: "Local Console", ko: "로컬 콘솔" })}>
        <Docs.Title>{l.trans({ en: "Local Console", ko: "로컬 콘솔" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Open it to inspect a service, call a method, or try a query without writing a script file. Run it from the workspace root with the app's name:",
              ko: "스크립트 파일을 만들지 않고 서비스를 점검하거나, 메서드를 부르거나, 쿼리를 시험해 볼 때 엽니다. 워크스페이스 루트에서 앱 이름을 넘겨 실행합니다.",
            })}
          </div>
          <Code.Snippet className="w-full" title="Terminal" language="bash" code="akan console myapp" />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      The prompt reads <code>akan:myapp&gt;</code>.
                    </strong>{" "}
                    Type <code>.help</code> to list the commands and input rules.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      프롬프트는 <code>akan:myapp&gt;</code>입니다.
                    </strong>{" "}
                    <code>.help</code>를 입력하면 명령과 입력 규칙이 나옵니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Work you will repeat belongs in a script.</strong> See{" "}
                    <Link href="/cheatsheet/dev/script" className="text-primary">
                      Scripts
                    </Link>
                    .
                  </span>
                ),
                ko: (
                  <span>
                    <strong>반복할 작업은 스크립트로 만드세요.</strong>{" "}
                    <Link href="/cheatsheet/dev/script" className="text-primary">
                      스크립트
                    </Link>{" "}
                    페이지를 참고하세요.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="multiline" title={l.trans({ en: "Multi-line Input", ko: "여러 줄 입력" })}>
        <Docs.Title>{l.trans({ en: "Multi-line Input", ko: "여러 줄 입력" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Paste a snippet as it is: the console runs a pasted block as one command, not line by line. So a{" "}
                  <code>const</code> declared on the first line is still visible on the last one:
                </span>
              ),
              ko: (
                <span>
                  코드를 그대로 붙여넣으면 됩니다. 붙여넣은 블록은 한 줄씩이 아니라 명령 하나로 실행되므로, 첫 줄에서
                  선언한 <code>const</code>를 마지막 줄에서도 쓸 수 있습니다.
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            code={`const users = service("user");
const user = await users.getUser("6890f2c1f0a1b2c3d4e5f6a7");
return await users.updateUser(user.id, { nickname: "checked" });`}
          />
          <Docs.Table
            columns={[
              { key: "goal", label: l.trans({ en: "To", ko: "하려는 일" }) },
              { key: "how", label: l.trans({ en: "Do this", ko: "방법" }) },
            ]}
            rows={inputRows}
            stacked
          />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>await</code> works at the top level.
                    </strong>{" "}
                    No async wrapper is needed.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>await</code>를 맨 바깥에서 바로 씁니다.
                    </strong>{" "}
                    async 함수로 감쌀 필요가 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      A typo can hold the prompt at <code>...</code>.
                    </strong>{" "}
                    A stray <code>{"}"}</code> looks like an unfinished block, so type <code>.clear</code> and paste
                    again.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      오타 때문에 <code>...</code> 프롬프트에 머물 수 있습니다.
                    </strong>{" "}
                    짝 없는 <code>{"}"}</code>는 덜 끝난 블록처럼 보이므로, <code>.clear</code>를 입력하고 다시
                    붙여넣으세요.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Results print up to 5 levels deep</strong> and up to 100 array items.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>결과는 5단계 깊이까지</strong>, 배열은 100개 항목까지 출력됩니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="container" title={l.trans({ en: "Container Console", ko: "컨테이너 콘솔" })}>
        <Docs.Title>{l.trans({ en: "Container Console", ko: "컨테이너 콘솔" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  In Docker or Kubernetes, run the <code>console.js</code> already in the image. Put{" "}
                  <code>AKAN_CONSOLE=1</code> on the exec command itself.
                </span>
              ),
              ko: (
                <span>
                  Docker나 Kubernetes에서는 이미지에 이미 들어 있는 <code>console.js</code>를 실행합니다.{" "}
                  <code>AKAN_CONSOLE=1</code>은 exec 명령에 직접 붙입니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>Docker</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  Replace <code>myapp</code> with your container name:
                </span>
              ),
              ko: (
                <span>
                  <code>myapp</code>을 실제 컨테이너 이름으로 바꾸세요.
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            code="docker exec -it myapp sh -lc 'AKAN_CONSOLE=1 bun console.js'"
          />
          <Docs.SubSubTitle>Kubernetes</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The Akan Helm chart runs the <code>app</code> container of <code>app-deployment</code>. The namespace
                  is the app name plus the branch, such as <code>myapp-main</code>:
                </span>
              ),
              ko: (
                <span>
                  Akan Helm 차트는 <code>app-deployment</code>의 <code>app</code> 컨테이너로 앱을 실행합니다.
                  네임스페이스는 <code>myapp-main</code>처럼 앱 이름 뒤에 브랜치를 붙인 이름입니다.
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            language="bash"
            showLineNumbers={false}
            code={`kubectl exec -it -n myapp-main deploy/app-deployment -c app -- \\
  sh -lc 'AKAN_CONSOLE=1 bun console.js'`}
          />
          <Docs.SubSubTitle>
            {l.trans({ en: "When the flag is required", ko: "플래그가 필요한 경우" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  The console refuses to open without <code>AKAN_CONSOLE=1</code> when any one of these settings points
                  at production:
                </span>
              ),
              ko: (
                <span>
                  다음 설정 중 하나라도 운영 환경을 가리키면 <code>AKAN_CONSOLE=1</code> 없이는 콘솔이 열리지 않습니다.
                </span>
              ),
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "setting", label: l.trans({ en: "Setting", ko: "설정" }), code: true },
              { key: "refuses", label: l.trans({ en: "Refuses when", ko: "막히는 경우" }) },
            ]}
            rows={gateConditionRows}
          />
          <div>
            {l.trans({
              en: "So where you open it decides whether you need the flag:",
              ko: "그래서 어디서 여느냐에 따라 플래그가 필요한지가 갈립니다.",
            })}
          </div>
          <Docs.Table
            columns={[
              { key: "where", label: l.trans({ en: "Where", ko: "어디서" }) },
              { key: "rule", label: l.trans({ en: "Flag", ko: "플래그" }) },
            ]}
            rows={gateRows}
            stacked
          />
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Set the flag on the exec command, never in the deployment env.</strong> It is the one
                  deliberate step before a console reaches production data. Kept in the env, every shell in the pod can
                  open one.
                </span>
              ),
              ko: (
                <span>
                  <strong>플래그는 exec 명령에만 붙이고, 배포 env에는 절대 넣지 마세요.</strong> 콘솔이 운영 데이터에
                  닿기 전에 거치는 단 하나의 의도적인 단계입니다. env에 남겨 두면 pod 안의 어떤 셸이든 콘솔을 열 수
                  있습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="lifecycle" title={l.trans({ en: "Console Process", ko: "콘솔 프로세스" })}>
        <Docs.Title>{l.trans({ en: "Console Process", ko: "콘솔 프로세스" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The console is a second process, not a window into the running one. It boots its own server next to the app, inside the same container or pod.",
              ko: "콘솔은 실행 중인 프로세스를 들여다보는 창이 아니라 두 번째 프로세스입니다. 같은 컨테이너나 pod 안에서 앱 옆에 자기 서버를 따로 띄웁니다.",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Shared With The App", ko: "앱과 함께 쓰는 것" })}
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "Env, secrets, mounted volumes, network, and database access.",
                  ko: "env, 시크릿, 마운트한 볼륨, 네트워크, 데이터베이스 접근.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">{l.trans({ en: "Not Shared", ko: "함께 쓰지 않는 것" })}</div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      The running <code>main.js</code> process and its in-memory state. The console never attaches to
                      them.
                    </span>
                  ),
                  ko: (
                    <span>
                      실행 중인 <code>main.js</code> 프로세스와 그 메모리 속 상태. 콘솔은 여기에 붙지 않습니다.
                    </span>
                  ),
                })}
              </div>
            </div>
          </div>
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>It listens on nothing.</strong> The console's server opens no port and serves no pages, so
                    it takes no traffic.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>요청을 받지 않습니다.</strong> 콘솔의 서버는 포트를 열지 않고 페이지도 서빙하지 않으므로
                    트래픽이 들어오지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>It runs none of the app's background work.</strong> Internal <code>init</code>,{" "}
                    <code>interval</code>, <code>cron</code> and <code>timeout</code> jobs and queue workers stay with
                    the app, so nothing runs twice.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>앱의 백그라운드 작업은 하나도 돌리지 않습니다.</strong> internal의 <code>init</code>,{" "}
                    <code>interval</code>, <code>cron</code>, <code>timeout</code> 작업과 큐 worker는 앱에만 있으므로
                    같은 작업이 두 번 실행되지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Services and adaptors still start.</strong> Each <code>onInit</code> runs, so the console
                    opens the same connections the app does.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>서비스와 어댑터는 그대로 시작합니다.</strong> 각 <code>onInit</code>이 실행되므로, 콘솔도
                    앱과 같은 연결을 엽니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>It opens no log stream of its own.</strong> <code>.tail</code> and <code>.trace</code> read
                    the running server's logs, as the next section shows.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>자기 로그 스트림은 열지 않습니다.</strong> 다음 절의 <code>.tail</code>과{" "}
                    <code>.trace</code>가 실행 중인 서버의 로그를 읽어 옵니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="globals" title={l.trans({ en: "Globals And Commands", ko: "전역 값과 명령" })}>
        <Docs.Title>{l.trans({ en: "Globals And Commands", ko: "전역 값과 명령" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The console puts runtime helpers and the app's generated exports in scope, so most commands fit on one line.",
              ko: "콘솔은 런타임 도우미 함수와 자동 생성된 앱 export를 전역에 미리 넣어 두므로, 대부분의 명령이 한 줄로 끝납니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Globals", ko: "전역 값" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Name", ko: "이름" })} items={globalRows} />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A lib's exports sit under the lib's name.</strong> The user service from{" "}
                    <code>libs/shared</code> is <code>srv.shared.UserService</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>라이브러리의 export는 라이브러리 이름 아래에 있습니다.</strong> <code>libs/shared</code>의
                    유저 서비스는 <code>srv.shared.UserService</code>입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Any other name is the ordinary global,</strong> so <code>process.env</code> and{" "}
                    <code>Bun</code> work as usual.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>그 밖의 이름은 평소의 전역 값입니다.</strong> 그래서 <code>process.env</code>와{" "}
                    <code>Bun</code>도 그대로 쓸 수 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Dot commands", ko: "점 명령" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Command", ko: "명령" })} items={commandRows} />
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>.tail</code> takes the <code>akan logs</code> filters as <code>key=value</code>:
                    </strong>{" "}
                    <code>level</code>, <code>grep</code>, <code>endpoint</code>, <code>origin</code>,{" "}
                    <code>trace</code>, <code>child</code>, <code>role</code>, <code>since</code>. A bare{" "}
                    <code>.tail</code> shows what it follows.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>.tail</code>은 <code>akan logs</code>의 필터를 <code>key=value</code>로 받습니다.
                    </strong>{" "}
                    <code>level</code>, <code>grep</code>, <code>endpoint</code>, <code>origin</code>,{" "}
                    <code>trace</code>, <code>child</code>, <code>role</code>, <code>since</code>입니다. 인자 없는{" "}
                    <code>.tail</code>은 지금 따라가는 조건을 보여 줍니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Both need the app running.</strong> Locally that is <code>akan start myapp</code>; with
                    nothing running, the console answers <code>myapp is not running</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>둘 다 앱이 실행 중이어야 합니다.</strong> 로컬에서는 <code>akan start myapp</code>이 떠
                    있어야 하고, 아무것도 없으면 콘솔이 <code>myapp is not running</code>이라고 답합니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "First commands", ko: "처음 쳐 볼 명령" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A few commands to get your bearings, one per line:",
              ko: "상황을 파악할 때 쓰는 명령입니다. 한 줄에 하나씩 입력합니다.",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="Terminal"
            code={`process.env.AKAN_PUBLIC_ENV
env
debug()
methods(service("user"))
await service("user").__count()
await get(srv.shared.UserService).__count()`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="safety" title={l.trans({ en: "Safety", ko: "안전 수칙" })}>
        <Docs.Title>{l.trans({ en: "Safety", ko: "안전 수칙" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A change made in the console lands on real data at once, with no review step. Four habits keep that safe:",
              ko: "콘솔에서 바꾼 내용은 검토 없이 곧바로 실제 데이터에 반영됩니다. 다음 네 가지 습관을 지키세요.",
            })}
          </div>
          <ul className="my-4 list-disc space-y-2 pl-5">
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Check the target first.</strong> Print <code>debug().env</code> and confirm the environment
                    before changing data.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>대상부터 확인하세요.</strong> 데이터를 바꾸기 전에 <code>debug().env</code>를 출력해 환경을
                    확인합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Change data through service methods.</strong> <code>updateUser</code> runs the service's
                    update hooks; a direct database write skips the domain rules.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>데이터는 서비스 메서드로 바꾸세요.</strong> <code>updateUser</code>는 서비스의 업데이트 훅을
                    거치지만, 데이터베이스에 직접 쓰면 도메인 규칙을 건너뜁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Script destructive work.</strong> Write a script with a dry run or a confirmation instead of
                    typing many commands by hand.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>파괴적인 작업은 스크립트로 하세요.</strong> 명령을 여러 번 손으로 치는 대신, dry run이나
                    확인 단계가 있는 스크립트를 작성합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Keep <code>AKAN_CONSOLE=1</code> out of deployment config.
                    </strong>{" "}
                    Set it on the one exec command that opens the console.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>AKAN_CONSOLE=1</code>은 배포 설정에 넣지 마세요.
                    </strong>{" "}
                    콘솔을 여는 exec 명령 한 번에만 붙입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Related pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={relatedLinks} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
