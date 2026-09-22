import { usePage } from "@apps/akan/client";
import { type CommandReferenceItem, CommandReferenceSlide, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "tunnel",
      signature: "akan tunnel [app] [--list <boolean>] [--stop <code>] [--host <url>] [--port <number>] [--ttl <min>]",
      desc: l.trans({
        en: "Share a locally running app on a public URL.\nThe control plane issues a hostname and a connector token, and the connector runs inside this process — there is no binary to install and no step between the command and a URL to paste.\nBecause the process is the tunnel, the command blocks until you interrupt it, and closing it hands the hostname back.",
        ko: "local에서 돌고 있는 app을 public URL로 공유합니다.\ncontrol plane이 hostname과 connector token을 발급하고, connector는 이 process 안에서 돕니다. 설치할 binary도, command와 붙여넣을 URL 사이의 단계도 없습니다.\nprocess가 곧 tunnel이므로 command는 중단할 때까지 대기하며, 종료하면서 hostname을 반납합니다.",
      }),
      args: [
        {
          name: "app",
          type: "String",
          required: "no",
          defaultValue: "-",
          desc: "App to share. A workspace with one app infers it; with several and no name, a picker opens. The app is resolved here rather than through the usual App argument, so --list and --stop do not open a picker for a question that has nothing to do with an app.",
        },
      ],
      options: [
        {
          name: "--list",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-",
          desc: "List the shares this account is holding — code, URL, name, expiry, and whether the connector is currently attached — then exit.",
        },
        {
          name: "--stop",
          type: "String",
          defaultValue: '""',
          enumOrFlag: "-",
          desc: "Revoke the share with this code, then exit. A code that is not open is reported rather than treated as an error.",
        },
        {
          name: "--host",
          type: "String",
          defaultValue: "https://cloud.akanjs.com",
          enumOrFlag: "-",
          desc: "Cloud control plane. Inside the framework repo (USE_AKANJS_PKGS=true) it defaults to the local cloud instead.",
        },
        {
          name: "--port",
          type: "Number",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Local port to share. Defaults to the app's own dev port, so a normal `akan start` needs nothing here.",
        },
        {
          name: "--ttl",
          type: "Number",
          defaultValue: "-",
          enumOrFlag: "nullable",
          desc: "Minutes before the share expires on its own. Left off, the control plane decides; the expiry is printed under the URL whenever the grant carries one.",
        },
      ],
      notes: [
        {
          name: "the URL",
          desc: "Printed and copied to the clipboard, with the expiry and the exact `akan tunnel --stop <code>` line beside it.",
        },
        {
          name: "interrupt",
          desc: "Ctrl-C releases the hostname and exits. A second interrupt abandons the release rather than looking hung — the share then expires on its own TTL.",
        },
        {
          name: "reconnect",
          desc: "A dropped link is reported and reconnected; it does not end the share.",
        },
        {
          name: "account",
          desc: "The hostname and token come from the cloud control plane, so the account signed in with `akan login` is the one holding the share and the one `--list` reports on.",
        },
        {
          name: "not a deployment",
          desc: "The tunnel forwards to a dev server. It adds no authentication, no caching, and no build step — what the URL serves is exactly what localhost was already serving.",
        },
      ],
      examples: `akan tunnel
akan tunnel myapp
akan tunnel myapp --ttl 60
akan tunnel myapp --port 8080
akan tunnel --list
akan tunnel --stop abc123`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="tunnel-cli" title={l.trans({ en: "Tunnel CLI", ko: "Tunnel CLI" })}>
        <Docs.Title>{l.trans({ en: "Tunnel CLI", ko: "Tunnel CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A designer wants to see the screen you just built, on their phone, now. A webhook from a payment provider needs to reach the handler you are still editing. Both want a public URL pointing at the dev server on your laptop, and neither is worth a deployment.",
              ko: "디자이너가 방금 만든 화면을 지금 자기 휴대폰에서 보고 싶어 합니다. 결제사 webhook이 아직 수정 중인 handler에 닿아야 합니다. 둘 다 노트북의 dev server를 가리키는 public URL을 원하고, 둘 다 배포할 가치는 없습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Most of the time you want this while already running the app, and `akan start --share` does it as part of the session. `akan tunnel` is the standalone form: it shares an app that is already running and does nothing else.",
              ko: "대개는 app을 이미 실행 중일 때 이것이 필요하고, `akan start --share`가 session의 일부로 처리합니다. `akan tunnel`은 독립 형태입니다. 이미 실행 중인 app을 공유하는 일만 합니다.",
            })}
          </div>
        </Docs.Description>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <span>
                A public URL exposes the whole dev server to anyone holding it — every route under <code>page/</code>,
                the API prefix, the websocket, and <code>/mcp</code> if the app mounts it. Nothing is added in front of
                it. Give it a <code>--ttl</code>, stop it when the call ends, and never point one at a session signed in
                to production data.
              </span>
            ),
            ko: (
              <span>
                public URL은 그것을 가진 누구에게나 dev server 전체를 노출합니다. <code>page/</code> 아래의 모든 route,
                API prefix, websocket, 그리고 app이 mount했다면 <code>/mcp</code>까지입니다. 그 앞에 아무것도 덧붙지
                않습니다. <code>--ttl</code>을 주고, 통화가 끝나면 중단하고, production data에 로그인된 session에는 절대
                연결하지 마세요.
              </span>
            ),
          })}
        </Docs.Alert>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <Divider />

      <Scroll.Slide id="share-or-tunnel" title={l.trans({ en: "Share Or Tunnel", ko: "share냐 tunnel이냐" })}>
        <Docs.Title>{l.trans({ en: "Share Or Tunnel", ko: "share냐 tunnel이냐" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "They open the same kind of share against the same control plane. What differs is who owns the process, and that decides which one you want.",
              ko: "둘은 같은 control plane에 같은 종류의 share를 엽니다. 다른 것은 process를 누가 소유하느냐이고, 그것이 어느 쪽을 원하는지를 정합니다.",
            })}
          </div>
        </Docs.Description>
        <div className="my-4 space-y-3">
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">🚀</span>
              <strong className="text-primary">{"akan start --share true"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "The dev session opens a share for each app it boots and keeps it for the life of the session. In the full-screen view, `s` copies the selected app's public URL — or every app's from the merged row — and the header carries it ahead of the local one.",
                ko: "dev session이 boot하는 app마다 share를 열고 session이 사는 동안 유지합니다. 전체 화면 view에서 `s`가 선택한 app의 public URL을, 병합된 행에서는 모든 app의 URL을 복사하고, header가 local URL보다 앞에 표시합니다.",
              })}
            </div>
          </div>
          <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-primary">🔌</span>
              <strong className="text-primary">{"akan tunnel"}</strong>
            </div>
            <div className="text-foreground/70 text-sm">
              {l.trans({
                en: "A second terminal against an app that is already running — including one you did not start with `--share`, or one on a port that is not the dev port. Stopping it leaves the dev server alone.",
                ko: "이미 실행 중인 app을 향한 두 번째 terminal입니다. `--share` 없이 띄운 app이나 dev port가 아닌 port도 포함합니다. 중단해도 dev server는 그대로입니다.",
              })}
            </div>
          </div>
        </div>
        <div className="my-4 text-foreground/70 text-sm">
          {l.trans({
            en: (
              <span>
                The dev session's own options — the full-screen view, <code>--kill</code>, <code>--concurrency</code> —
                are on{" "}
                <Link href="/references/cli/application" className="text-primary underline">
                  Application
                </Link>
                .
              </span>
            ),
            ko: (
              <span>
                dev session 자체의 option — 전체 화면 view, <code>--kill</code>, <code>--concurrency</code> — 은{" "}
                <Link href="/references/cli/application" className="text-primary underline">
                  Application
                </Link>
                에 있습니다.
              </span>
            ),
          })}
        </div>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
