import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type MatrixGroup,
  type ReferenceRow,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const termRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "database module", ko: "데이터베이스 모듈" })}</span>,
      desc: l.trans({
        en: "A module built around one stored model, in `lib/<module>/`.",
        ko: "저장되는 모델 하나를 중심으로 한 모듈로, `lib/<module>/`에 있습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "service module", ko: "서비스 모듈" })}</span>,
      desc: l.trans({
        en: "Behavior not tied to one stored model, such as notifications, in `lib/_<service>/`.",
        ko: "알림처럼 저장 모델 하나에 묶이지 않는 동작을 담는 모듈로, `lib/_<service>/`에 있습니다.",
      }),
    },
    {
      name: "sys",
      desc: l.trans({
        en: "The app or library that holds the module: `shop` in `shop:story`.",
        ko: "모듈이 들어가는 앱이나 라이브러리입니다. `shop:story`에서는 `shop`입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "scaffold", ko: "스캐폴드" })}</span>,
      desc: l.trans({
        en: "The starter code a command writes, meant to be edited.",
        ko: "명령이 만들어 주는 시작 코드로, 직접 고쳐 쓰는 것을 전제로 합니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "report", ko: "리포트" })}</span>,
      desc: l.trans({
        en: "What a create command prints at the end: the files it wrote and the commands to run next.",
        ko: "create 명령이 끝날 때 출력하는 결과로, 만든 파일과 다음에 실행할 명령이 담깁니다.",
      }),
    },
  ];

  const fileGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "Model and logic", ko: "모델과 로직" }),
      rows: [
        {
          name: ".abstract.md",
          desc: l.trans({
            en: "The module's rules and workflows, in prose.",
            ko: "모듈의 규칙과 흐름을 적은 글입니다.",
          }),
          marks: { module: true, service: true },
        },
        {
          name: ".constant.ts",
          desc: l.trans({ en: "The fields and the Light class.", ko: "필드와 Light 클래스입니다." }),
          marks: { module: true },
        },
        {
          name: ".document.ts",
          desc: l.trans({
            en: "Queries and state changes on the stored record.",
            ko: "저장된 레코드의 쿼리와 상태 변경입니다.",
          }),
          marks: { module: true },
        },
        {
          name: ".dictionary.ts",
          desc: l.trans({ en: "English and Korean labels.", ko: "영어·한국어 라벨입니다." }),
          marks: { module: true, service: true },
        },
        {
          name: ".service.ts",
          desc: l.trans({ en: "The business logic.", ko: "비즈니스 로직입니다." }),
          marks: { module: true, service: true },
        },
        {
          name: ".signal.ts",
          desc: l.trans({ en: "The endpoints callers reach.", ko: "호출자가 부르는 엔드포인트입니다." }),
          marks: { module: true, service: true },
        },
        {
          name: ".store.ts",
          desc: l.trans({ en: "Client state and actions.", ko: "클라이언트 상태와 액션입니다." }),
          marks: { module: true, service: true },
        },
      ],
    },
    {
      label: "UI",
      rows: [
        {
          name: ".View.tsx",
          desc: l.trans({ en: "The detail screen for one record.", ko: "레코드 하나의 상세 화면입니다." }),
          marks: { module: true },
        },
        {
          name: ".Unit.tsx",
          desc: l.trans({ en: "One row or card in a list.", ko: "목록의 행이나 카드 하나입니다." }),
          marks: { module: true },
        },
        {
          name: ".Template.tsx",
          desc: l.trans({ en: "The create and edit form.", ko: "생성·수정 폼입니다." }),
          marks: { module: true },
        },
        {
          name: ".Zone.tsx · .Util.tsx",
          desc: l.trans({
            en: "A page section, and small domain helpers such as a remove button.",
            ko: "페이지 섹션, 그리고 삭제 버튼 같은 작은 도메인 도우미입니다.",
          }),
          marks: { module: true },
        },
      ],
    },
  ];

  const sharedRules = [
    l.trans({
      en: (
        <>
          <strong>Name the target, or pick it from a list.</strong> <code>create-module</code> and{" "}
          <code>create-service</code> take the app or library as their second argument; the other four take{" "}
          <code>{"<sys>:<module>"}</code>. Leave it out and the CLI asks.
        </>
      ),
      ko: (
        <>
          <strong>대상을 적거나, 목록에서 고릅니다.</strong> <code>create-module</code>과 <code>create-service</code>는
          두 번째 인자로 앱이나 라이브러리를 받고, 나머지 네 명령은 <code>{"<sys>:<module>"}</code>를 받습니다. 생략하면
          CLI가 목록을 띄워 묻습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Only database modules can be picked.</strong> A folder with an underscore, such as{" "}
          <code>{"lib/_<service>"}</code> or <code>lib/__scalar</code>, never appears as a <code>sys:module</code>.
        </>
      ),
      ko: (
        <>
          <strong>고를 수 있는 것은 데이터베이스 모듈뿐입니다.</strong> <code>{"lib/_<service>"}</code>,{" "}
          <code>lib/__scalar</code>처럼 밑줄이 있는 폴더는 <code>sys:module</code> 목록에 나오지 않습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>Create commands end with a report.</strong> It lists the files written and the next steps,{" "}
          <code>{"akan sync <sys>"}</code> and <code>{"akan lint <sys>"}</code>. Add <code>-o json</code> for the same
          report as one JSON object.
        </>
      ),
      ko: (
        <>
          <strong>create 명령은 리포트로 끝납니다.</strong> 만든 파일과 다음 단계인 <code>{"akan sync <sys>"}</code>,{" "}
          <code>{"akan lint <sys>"}</code>가 적혀 있습니다. <code>-o json</code>을 붙이면 같은 리포트를 JSON 객체 하나로
          받습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>remove-module</code> prints no report.
          </strong>{" "}
          Run <code>{"akan sync <sys>"}</code> after it yourself.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>remove-module</code>은 리포트를 출력하지 않습니다.
          </strong>{" "}
          끝나면 <code>{"akan sync <sys>"}</code>를 직접 실행합니다.
        </>
      ),
    }),
  ];

  const formatOption: ReferenceRow = {
    name: "--format",
    type: "String",
    defaultValue: "markdown",
    enumOrFlag: "markdown | json · -o",
    desc: l.trans({
      en: "`markdown` is for a person to read; `json` is the same report as one object, for scripts and agents.",
      ko: "`markdown`은 사람이 읽는 형식이고, `json`은 같은 리포트를 객체 하나로 출력해 스크립트와 에이전트가 씁니다.",
    }),
  };
  const sysArg: ReferenceRow = {
    name: "sys",
    type: "String",
    desc: l.trans({
      en: "The app or library to write into, such as `shop`. Leave it out to pick one from a list.",
      ko: "모듈을 만들 앱이나 라이브러리로, `shop` 같은 이름입니다. 생략하면 목록에서 고릅니다.",
    }),
  };
  const moduleArgNote: ReferenceRow = {
    name: "sys:module",
    desc: l.trans({
      en: "Name the module as `<sys>:<module>`, such as `shop:story`. Leave it out to pick the sys, then the module.",
      ko: "모듈은 `shop:story`처럼 `<sys>:<module>`로 적습니다. 생략하면 앱이나 라이브러리를 고른 뒤 모듈을 고릅니다.",
    }),
  };
  const databaseOnlyNote: ReferenceRow = {
    name: l.trans({ en: "database modules only", ko: "데이터베이스 모듈만" }),
    desc: l.trans({
      en: "A service module in `lib/_<service>` or a scalar in `lib/__scalar` is not listed.",
      ko: "`lib/_<service>`의 서비스 모듈과 `lib/__scalar`의 스칼라는 목록에 나오지 않습니다.",
    }),
  };
  const overwriteNote: ReferenceRow = {
    name: l.trans({ en: "existing file", ko: "기존 파일" }),
    desc: l.trans({
      en: "A file already at that path is overwritten with the scaffold, so commit first.",
      ko: "같은 경로에 파일이 있으면 스캐폴드로 덮어쓰므로, 실행 전에 커밋해 둡니다.",
    }),
  };
  const nameFieldNote: ReferenceRow = {
    name: l.trans({ en: "name field", ko: "name 필드" }),
    desc: l.trans({
      en: "The scaffold renders only the module's `name` field; swap in the fields you need.",
      ko: "스캐폴드는 모듈의 `name` 필드만 그리므로, 필요한 필드로 바꿔 씁니다.",
    }),
  };

  const commands: CommandReferenceItem[] = [
    {
      name: "create-module",
      signature: "akan create-module <module-name> [sys] [--page] [--format <markdown|json>]",
      desc: l.trans({
        en: "Create a database module in an app or library.\nIt writes the standard module files into `lib/<module>/`, and route files too with `--page`.",
        ko: "앱이나 라이브러리에 데이터베이스 모듈을 만듭니다.\n표준 모듈 파일을 `lib/<module>/`에 만들고, `--page`를 주면 라우트 파일도 함께 만듭니다.",
      }),
      args: [
        {
          name: "module-name",
          type: "String",
          required: "yes",
          desc: l.trans({
            en: "Module name. Spaces are removed and the first letter is lowercased; asked for if left out.",
            ko: "모듈 이름입니다. 공백은 없애고 첫 글자는 소문자로 바꾸며, 생략하면 입력을 받습니다.",
          }),
        },
        sysArg,
      ],
      options: [
        {
          name: "--page",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-p",
          desc: l.trans({
            en: "Also write CRUD routes for the module. Apps only; a library ignores it.",
            ko: "모듈의 CRUD 라우트도 함께 만듭니다. 앱에서만 동작하고 라이브러리에서는 무시합니다.",
          }),
        },
        formatOption,
      ],
      notes: [
        {
          name: l.trans({ en: "files", ko: "파일" }),
          desc: l.trans({
            en: "Twelve files: abstract, constant, dictionary, document, service, signal, store and five UI files.",
            ko: "abstract, constant, dictionary, document, service, signal, store와 UI 파일 다섯 개로 모두 열두 개입니다.",
          }),
        },
        {
          name: "--page",
          desc: l.trans({
            en: "Writes list, new, detail and edit routes under `page/(<app>)/(public)/<module>/`.",
            ko: "`page/(<app>)/(public)/<module>/` 아래에 목록, 생성, 상세, 수정 라우트를 만듭니다.",
          }),
        },
        {
          name: l.trans({ en: "guards", ko: "가드" }),
          desc: l.trans({
            en: "The slice reads with `Public`; `root` and `cru` are `Admin` from `@libs/shared/srvkit`.",
            ko: "슬라이스는 `Public`으로 읽고, `root`와 `cru`는 `@libs/shared/srvkit`의 `Admin`입니다.",
          }),
        },
        {
          name: l.trans({ en: "without libs/shared", ko: "libs/shared가 없으면" }),
          desc: l.trans({
            en: "`root` and `cru` are `None`, so nothing writes until you name a guard.",
            ko: "`root`와 `cru`가 `None`이므로, 가드를 직접 정할 때까지 아무도 쓰지 못합니다.",
          }),
        },
        {
          name: l.trans({ en: "same name", ko: "같은 이름" }),
          desc: l.trans({
            en: "A module that already has the name is overwritten file by file, so commit first.",
            ko: "같은 이름의 모듈이 이미 있으면 파일마다 덮어쓰므로, 실행 전에 커밋해 둡니다.",
          }),
        },
      ],
      examples: `akan create-module Story
akan create-module UserProfile --page true
akan create-module Story --format json
akan create-module story shop --page`,
    },
    {
      name: "create-service",
      signature: "akan create-service <service-name> [sys] [--format <markdown|json>]",
      desc: l.trans({
        en: "Create a service module: behavior that is not centered on one stored model.\nIt lands in `lib/_<service>/`, with no constant, document or UI files.",
        ko: "서비스 모듈을 만듭니다. 저장 모델 하나를 중심으로 하지 않는 동작을 담는 모듈입니다.\n`lib/_<service>/`에 만들어지며 constant, document, UI 파일은 없습니다.",
      }),
      args: [
        {
          name: "service-name",
          type: "String",
          required: "yes",
          desc: l.trans({
            en: "Service name. Spaces and leading underscores are removed, and the first letter is lowercased.",
            ko: "서비스 이름입니다. 공백과 앞의 밑줄은 없애고 첫 글자는 소문자로 바꿉니다.",
          }),
        },
        sysArg,
      ],
      options: [formatOption],
      notes: [
        {
          name: l.trans({ en: "files", ko: "파일" }),
          desc: l.trans({
            en: "Five files: abstract, dictionary, service, signal and store.",
            ko: "abstract, dictionary, service, signal, store 다섯 개입니다.",
          }),
        },
        {
          name: l.trans({ en: "file names", ko: "파일 이름" }),
          desc: l.trans({
            en: "Only the folder has the underscore: `lib/_noti/noti.service.ts`, `lib/_noti/noti.abstract.md`.",
            ko: "밑줄은 폴더에만 붙습니다. `lib/_noti/noti.service.ts`, `lib/_noti/noti.abstract.md`처럼 됩니다.",
          }),
        },
        {
          name: "UI",
          desc: l.trans({
            en: "A service module holds only Zone and Util files; write them by hand.",
            ko: "서비스 모듈에는 Zone과 Util 파일만 둘 수 있으며, 직접 작성합니다.",
          }),
        },
      ],
      examples: `akan create-service noti
akan create-service Security --format json`,
    },
    {
      name: "remove-module",
      signature: "akan remove-module [sys:module]",
      desc: l.trans({
        en: "Remove a database module from an app or library.\nIt deletes the whole `lib/<module>/` folder at once, without asking.",
        ko: "앱이나 라이브러리에서 데이터베이스 모듈을 지웁니다.\n`lib/<module>/` 폴더 전체를 확인 없이 한 번에 지웁니다.",
      }),
      notes: [
        moduleArgNote,
        databaseOnlyNote,
        {
          name: l.trans({ en: "what stays", ko: "남는 것" }),
          desc: l.trans({
            en: "Routes made with `--page` and imports in other modules stay; remove them yourself.",
            ko: "`--page`로 만든 라우트와 다른 모듈의 import는 남으므로, 직접 지웁니다.",
          }),
        },
        {
          name: l.trans({ en: "afterwards", ko: "그다음" }),
          desc: l.trans({
            en: "Run `akan sync <sys>` so the generated files drop the module.",
            ko: "`akan sync <sys>`를 실행해 생성 파일에서도 모듈을 뺍니다.",
          }),
        },
      ],
      examples: `akan remove-module shop:story
akan remove-module`,
    },
    {
      name: "create-view",
      signature: "akan create-view [sys:module] [--format <markdown|json>]",
      desc: l.trans({
        en: 'Write the View file of an existing module: the detail screen for one record.\nIt is always a server component, so it never carries "use client".',
        ko: '기존 모듈에 View 파일을 만듭니다. 레코드 하나의 상세 화면입니다.\n언제나 서버 컴포넌트라서 "use client"를 붙이지 않습니다.',
      }),
      options: [formatOption],
      notes: [
        moduleArgNote,
        databaseOnlyNote,
        {
          name: l.trans({ en: "writes", ko: "만드는 파일" }),
          desc: l.trans({
            en: "`lib/<module>/<Module>.View.tsx`, exporting `General`.",
            ko: "`General`을 내보내는 `lib/<module>/<Module>.View.tsx`입니다.",
          }),
        },
        nameFieldNote,
        overwriteNote,
      ],
      examples: "akan create-view shop:story",
    },
    {
      name: "create-unit",
      signature: "akan create-unit [sys:module] [--format <markdown|json>]",
      desc: l.trans({
        en: "Write the Unit file of an existing module: one row or card in a list.\nIt takes the module's Light data and, like View, is always a server component.",
        ko: "기존 모듈에 Unit 파일을 만듭니다. 목록의 행이나 카드 하나입니다.\n모듈의 Light 데이터를 받으며, View처럼 언제나 서버 컴포넌트입니다.",
      }),
      options: [formatOption],
      notes: [
        moduleArgNote,
        databaseOnlyNote,
        {
          name: l.trans({ en: "writes", ko: "만드는 파일" }),
          desc: l.trans({
            en: "`lib/<module>/<Module>.Unit.tsx`, exporting `Card`.",
            ko: "`Card`를 내보내는 `lib/<module>/<Module>.Unit.tsx`입니다.",
          }),
        },
        nameFieldNote,
        overwriteNote,
      ],
      examples: "akan create-unit shop:story",
    },
    {
      name: "create-template",
      signature: "akan create-template [sys:module] [--format <markdown|json>]",
      desc: l.trans({
        en: 'Write the Template file of an existing module: its create and edit form.\nIt is bound to the store\'s form state, so it is always a client component with "use client" on line 1.',
        ko: '기존 모듈에 Template 파일을 만듭니다. 모듈의 생성·수정 폼입니다.\n스토어의 폼 상태에 묶여 있어 언제나 클라이언트 컴포넌트이고, 첫 줄이 "use client"입니다.',
      }),
      options: [formatOption],
      notes: [
        moduleArgNote,
        databaseOnlyNote,
        {
          name: l.trans({ en: "writes", ko: "만드는 파일" }),
          desc: l.trans({
            en: "`lib/<module>/<Module>.Template.tsx`, exporting the `General` form.",
            ko: "폼 `General`을 내보내는 `lib/<module>/<Module>.Template.tsx`입니다.",
          }),
        },
        nameFieldNote,
        overwriteNote,
      ],
      examples: "akan create-template shop:story",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="module-cli" title={l.trans({ en: "Module CLI", ko: "모듈 명령" })}>
        <Docs.Title>{l.trans({ en: "Module CLI", ko: "모듈 명령" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Six commands that create, remove and fill in modules inside an app or library. Use{" "}
                  <code>create-module</code> for a feature built around a stored model, <code>create-service</code> for
                  one that is not.
                </span>
              ),
              ko: (
                <span>
                  앱이나 라이브러리 안의 모듈을 만들고, 지우고, 빠진 파일을 채우는 명령 여섯 가지입니다. 저장 모델이
                  중심인 기능에는 <code>create-module</code>을, 그렇지 않은 기능에는 <code>create-service</code>를
                  씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Words Used on This Page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
        <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

        <Docs.SubSubTitle>{l.trans({ en: "Files a New Module Gets", ko: "새 모듈에 생기는 파일" })}</Docs.SubSubTitle>
        <Docs.Matrix
          type={l.trans({ en: "File", ko: "파일" })}
          columns={[
            { key: "module", label: "create-module", code: true },
            { key: "service", label: "create-service", code: true },
          ]}
          groups={fileGroups}
          markLabel={l.trans({ en: "Written", ko: "생성" })}
          emptyLabel={l.trans({ en: "Not written", ko: "생성 안 함" })}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  The other three create commands fill in one UI file of an existing module: <code>create-view</code>{" "}
                  the View, <code>create-unit</code> the Unit, and <code>create-template</code> the Template.
                </span>
              ),
              ko: (
                <span>
                  나머지 create 명령 셋은 이미 있는 모듈에 UI 파일을 하나씩 만듭니다. <code>create-view</code>는 View,{" "}
                  <code>create-unit</code>은 Unit, <code>create-template</code>은 Template을 만듭니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Rules All Six Share", ko: "여섯 명령의 공통 규칙" })}</Docs.SubSubTitle>
        <ul className="my-4 list-disc space-y-2 pl-5">
          {sharedRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <>
                <strong>Commit before you run these.</strong> A create command writes its scaffold over any file at the
                same path, and <code>remove-module</code> deletes the folder without asking.
              </>
            ),
            ko: (
              <>
                <strong>실행 전에 커밋해 두세요.</strong> create 명령은 같은 경로의 파일을 스캐폴드로 덮어쓰고,{" "}
                <code>remove-module</code>은 확인 없이 폴더를 지웁니다.
              </>
            ),
          })}
        </Docs.Alert>

        <Docs.SubSubTitle>{l.trans({ en: "Related Pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
        <Docs.LinkGrid
          items={[
            {
              href: "/conventions/module/overview",
              title: l.trans({ en: "Database Module", ko: "데이터베이스 모듈" }),
              desc: l.trans({
                en: "What each file `create-module` writes is for.",
                ko: "`create-module`이 만드는 파일마다 맡는 역할입니다.",
              }),
            },
            {
              href: "/conventions/service/overview",
              title: l.trans({ en: "Service Module", ko: "서비스 모듈" }),
              desc: l.trans({
                en: "What each file `create-service` writes is for.",
                ko: "`create-service`가 만드는 파일마다 맡는 역할입니다.",
              }),
            },
            {
              href: "/references/cli/primitive",
              title: l.trans({ en: "Primitive CLI", ko: "Primitive 명령" }),
              desc: l.trans({
                en: "`create-ui` writes the same UI files, taking the app and module as flags.",
                ko: "`create-ui`는 앱과 모듈을 옵션으로 받아 같은 UI 파일을 만듭니다.",
              }),
            },
          ]}
        />
      </Scroll.Slide>
      {commands.flatMap((command) => [
        <Divider key={`${command.name}-divider`} />,
        <CommandReferenceSlide key={command.name} command={command} />,
      ])}
      <DocsToc />
    </Scroll>
  );
});
