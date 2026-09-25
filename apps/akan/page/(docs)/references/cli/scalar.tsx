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
      name: <span className="font-sans">{l.trans({ en: "scalar", ko: "스칼라" })}</span>,
      href: "/conventions/scalar/overview",
      desc: l.trans({
        en: "A named group of fields saved inside other models, like `Price`. It has no table of its own.",
        ko: "`Price`처럼 다른 모델 안에 함께 저장되는 필드 묶음입니다. 자체 테이블이 없습니다.",
      }),
    },
    {
      name: "sys",
      desc: l.trans({
        en: "The app or library that holds the scalar: `shop` in `akan create-scalar price shop`.",
        ko: "스칼라가 들어가는 앱이나 라이브러리입니다. `akan create-scalar price shop`에서는 `shop`입니다.",
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
        en: "What `create-scalar` prints at the end: the files it wrote and the commands to run next.",
        ko: "`create-scalar`가 끝날 때 출력하는 결과로, 만든 파일과 다음에 실행할 명령이 담깁니다.",
      }),
    },
  ];

  const fileGroups: MatrixGroup[] = [
    {
      label: l.trans({
        en: "Scaffolded into `lib/__scalar/<scalar>/`",
        ko: "`lib/__scalar/<scalar>/`에 스캐폴드로 생기는 파일",
      }),
      rows: [
        {
          name: "<scalar>.abstract.md",
          desc: l.trans({
            en: "What the value means and its reuse rules, as headings to fill in.",
            ko: "값의 의미와 재사용 규칙을 채워 넣을 제목들입니다.",
          }),
          marks: { create: true, remove: true },
        },
        {
          name: "<scalar>.constant.ts",
          desc: l.trans({
            en: "The class with the fields, starting with one placeholder `field: field(String)`.",
            ko: "필드를 담는 클래스로, 자리표시자 `field: field(String)` 하나로 시작합니다.",
          }),
          marks: { create: true, remove: true },
        },
        {
          name: "<scalar>.dictionary.ts",
          desc: l.trans({
            en: "English and Korean labels, written with `scalarDictionary`.",
            ko: "`scalarDictionary`로 쓰는 영어·한국어 라벨입니다.",
          }),
          marks: { create: true, remove: true },
        },
        {
          name: "<scalar>.document.ts",
          desc: l.trans({
            en: "The server-side class, one line: `by(cnst.<Scalar>)`.",
            ko: "서버 쪽 클래스로, `by(cnst.<Scalar>)` 한 줄입니다.",
          }),
          marks: { create: true, remove: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Written by hand, in the same folder", ko: "같은 폴더에 직접 작성하는 파일" }),
      rows: [
        {
          name: "<Scalar>.Template.tsx",
          desc: l.trans({
            en: "The editor for the value inside a parent form.",
            ko: "상위 폼 안에서 값을 편집하는 에디터입니다.",
          }),
          marks: { remove: true },
        },
        {
          name: "<Scalar>.Unit.tsx",
          desc: l.trans({
            en: "The display of the value inside a parent card or detail page.",
            ko: "상위 카드나 상세 화면 안에서 값을 보여 주는 컴포넌트입니다.",
          }),
          marks: { remove: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Outside the folder", ko: "폴더 밖" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "code that uses it", ko: "스칼라를 쓰는 코드" })}</span>,
          desc: l.trans({
            en: "Fields such as `field(Price)` and imports in other modules. Neither command touches them.",
            ko: "다른 모듈의 `field(Price)` 같은 필드와 import입니다. 두 명령 모두 건드리지 않습니다.",
          }),
          marks: {},
        },
      ],
    },
  ];

  const sharedRules = [
    l.trans({
      en: (
        <>
          <strong>Name the target, or pick it from a list.</strong> The second argument is the app or library. Leave it
          out, or give a name that does not exist, and the CLI shows a list. A missing scalar name is asked for.
        </>
      ),
      ko: (
        <>
          <strong>대상을 적거나, 목록에서 고릅니다.</strong> 두 번째 인자가 앱이나 라이브러리입니다. 생략하거나 없는
          이름을 적으면 CLI가 목록을 띄웁니다. 스칼라 이름을 생략하면 입력을 받습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>create-scalar</code> never overwrites.
          </strong>{" "}
          A file already at the path keeps its content, so running it again only restores missing files.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>create-scalar</code>는 덮어쓰지 않습니다.
          </strong>{" "}
          같은 경로에 파일이 있으면 내용을 바꾸지 않으므로, 다시 실행하면 빠진 파일만 새로 생깁니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>create-scalar</code> ends with a report.
          </strong>{" "}
          It lists the files written and the next steps, <code>{"akan sync <sys>"}</code> and{" "}
          <code>{"akan lint <sys>"}</code>. Add <code>-o json</code> for the same report as one JSON object.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>create-scalar</code>는 리포트로 끝납니다.
          </strong>{" "}
          만든 파일과 다음 단계인 <code>{"akan sync <sys>"}</code>, <code>{"akan lint <sys>"}</code>가 적혀 있습니다.{" "}
          <code>-o json</code>을 붙이면 같은 리포트를 JSON 객체 하나로 받습니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>remove-scalar</code> takes the folder name exactly as typed.
          </strong>{" "}
          Nothing is lowercased, so write <code>coordinate</code>, not <code>Coordinate</code>. It prints no report.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>remove-scalar</code>는 폴더 이름을 적은 그대로 씁니다.
          </strong>{" "}
          소문자로 바꾸지 않으므로 <code>Coordinate</code>가 아니라 <code>coordinate</code>로 적습니다. 리포트는
          출력하지 않습니다.
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
      en: "The app or library, such as `shop`. Leave it out to pick one from a list.",
      ko: "대상 앱이나 라이브러리로, `shop` 같은 이름입니다. 생략하면 목록에서 고릅니다.",
    }),
  };

  const commands: CommandReferenceItem[] = [
    {
      name: "create-scalar",
      signature: "akan create-scalar <scalar-name> [sys] [--format <markdown|json>]",
      desc: l.trans({
        en: "Create a scalar: a reusable value object or data shape that needs no table of its own.\nIt writes four files into `lib/__scalar/<scalar>/` and prints what it wrote.",
        ko: "스칼라를 만듭니다. 자체 테이블이 필요 없는 재사용 값 객체나 데이터 형태입니다.\n`lib/__scalar/<scalar>/`에 파일 네 개를 만들고, 만든 파일 목록을 출력합니다.",
      }),
      args: [
        {
          name: "scalar-name",
          type: "String",
          required: "yes",
          desc: l.trans({
            en: "Scalar name. Spaces are removed and the first letter is lowercased; asked for if left out.",
            ko: "스칼라 이름입니다. 공백은 없애고 첫 글자는 소문자로 바꾸며, 생략하면 입력을 받습니다.",
          }),
        },
        sysArg,
      ],
      options: [formatOption],
      notes: [
        {
          name: l.trans({ en: "files", ko: "파일" }),
          desc: l.trans({
            en: "Four files: abstract, constant, dictionary and document. Template and Unit are written by hand.",
            ko: "abstract, constant, dictionary, document 네 개입니다. Template과 Unit은 직접 작성합니다.",
          }),
        },
        {
          name: l.trans({ en: "names", ko: "이름" }),
          desc: l.trans({
            en: "`AccessToken` becomes the folder `accessToken` and the class `AccessToken`.",
            ko: "`AccessToken`을 주면 폴더는 `accessToken`, 클래스는 `AccessToken`이 됩니다.",
          }),
        },
        {
          name: l.trans({ en: "placeholder", ko: "자리표시자" }),
          desc: l.trans({
            en: "Replace the placeholder `field` in the constant and its label in the dictionary.",
            ko: "constant의 자리표시자 `field`와 dictionary의 라벨을 실제 필드로 바꿉니다.",
          }),
        },
        {
          name: l.trans({ en: "existing file", ko: "기존 파일" }),
          desc: l.trans({
            en: "A file already at the path keeps its content; only the formatter may tidy it.",
            ko: "같은 경로에 이미 있는 파일은 내용을 바꾸지 않고, 포매터로 모양만 정리할 수 있습니다.",
          }),
        },
      ],
      examples: `akan create-scalar Coordinate
akan create-scalar Price shop
akan create-scalar Address --format json`,
    },
    {
      name: "remove-scalar",
      signature: "akan remove-scalar <scalar-name> [sys]",
      desc: l.trans({
        en: "Remove a scalar from an app or library.\nIt deletes the whole `lib/__scalar/<scalar>/` folder at once, without asking.",
        ko: "앱이나 라이브러리에서 스칼라를 지웁니다.\n`lib/__scalar/<scalar>/` 폴더 전체를 확인 없이 한 번에 지웁니다.",
      }),
      args: [
        {
          name: "scalar-name",
          type: "String",
          required: "yes",
          desc: l.trans({
            en: "The folder name under `lib/__scalar/`, used exactly as typed; asked for if left out.",
            ko: "`lib/__scalar/` 아래의 폴더 이름으로, 적은 그대로 씁니다. 생략하면 입력을 받습니다.",
          }),
        },
        sysArg,
      ],
      notes: [
        {
          name: l.trans({ en: "check first", ko: "먼저 확인" }),
          desc: l.trans({
            en: "Modules, dictionaries, templates and service payload types often import a scalar.",
            ko: "모듈, 딕셔너리, 템플릿, 서비스 페이로드 타입이 스칼라를 import하는 경우가 많습니다.",
          }),
        },
        {
          name: l.trans({ en: "exact name", ko: "정확한 이름" }),
          desc: l.trans({
            en: "Type the folder name, such as `accessToken`. A name with no folder deletes nothing, silently.",
            ko: "`accessToken`처럼 폴더 이름을 적습니다. 맞는 폴더가 없으면 아무것도 지우지 않고 조용히 끝납니다.",
          }),
        },
        {
          name: l.trans({ en: "what stays", ko: "남는 것" }),
          desc: l.trans({
            en: "Fields and imports in other modules that use the scalar stay; remove them yourself.",
            ko: "다른 모듈에서 스칼라를 쓰는 필드와 import는 남으므로, 직접 지웁니다.",
          }),
        },
        {
          name: l.trans({ en: "afterwards", ko: "그다음" }),
          desc: l.trans({
            en: "Run `akan sync <sys>` so the generated files drop the scalar.",
            ko: "`akan sync <sys>`를 실행해 생성 파일에서도 스칼라를 뺍니다.",
          }),
        },
      ],
      examples: `akan remove-scalar coordinate
akan remove-scalar price shop`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="scalar-cli" title={l.trans({ en: "Scalar CLI", ko: "스칼라 명령" })}>
        <Docs.Title>{l.trans({ en: "Scalar CLI", ko: "스칼라 명령" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Two commands that create and remove a scalar inside an app or library. A scalar is a reusable value
                  object saved inside other models, not a model with its own table; for that, use{" "}
                  <code>create-module</code>.
                </span>
              ),
              ko: (
                <span>
                  앱이나 라이브러리 안에 스칼라를 만들고 지우는 명령 두 가지입니다. 스칼라는 다른 모델 안에 함께
                  저장되는 재사용 값 객체이며, 자체 테이블을 가진 모델이 아닙니다. 그런 모델에는{" "}
                  <code>create-module</code>을 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Words Used on This Page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
        <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

        <Docs.SubSubTitle>
          {l.trans({ en: "Files Each Command Touches", ko: "명령마다 건드리는 파일" })}
        </Docs.SubSubTitle>
        <Docs.Matrix
          type={l.trans({ en: "File", ko: "파일" })}
          columns={[
            {
              key: "create",
              label: (
                <span>
                  create-
                  <br className="sm:hidden" />
                  scalar
                </span>
              ),
              code: true,
            },
            {
              key: "remove",
              label: (
                <span>
                  remove-
                  <br className="sm:hidden" />
                  scalar
                </span>
              ),
              code: true,
            },
          ]}
          groups={fileGroups}
          markLabel={l.trans({ en: "Written or deleted", ko: "만들거나 지움" })}
          emptyLabel={l.trans({ en: "Not touched", ko: "건드리지 않음" })}
        />

        <Docs.SubSubTitle>{l.trans({ en: "Rules to Know", ko: "알아 둘 규칙" })}</Docs.SubSubTitle>
        <ul className="my-4 list-disc space-y-2 pl-5">
          {sharedRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <>
                <strong>Check usages before you remove a scalar.</strong> <code>remove-scalar</code> deletes the folder
                without asking and leaves every field and import that used it broken until you fix them.
              </>
            ),
            ko: (
              <>
                <strong>스칼라를 지우기 전에 사용처를 확인하세요.</strong> <code>remove-scalar</code>는 확인 없이 폴더를
                지우고, 그 스칼라를 쓰던 필드와 import는 고칠 때까지 깨진 채로 남습니다.
              </>
            ),
          })}
        </Docs.Alert>

        <Docs.SubSubTitle>{l.trans({ en: "Related Pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
        <Docs.LinkGrid
          items={[
            {
              href: "/conventions/scalar/overview",
              title: l.trans({ en: "Scalar Overview", ko: "스칼라 개요" }),
              desc: l.trans({
                en: "When a scalar fits better than a module, and how to embed one.",
                ko: "모듈보다 스칼라가 맞는 경우와 스칼라를 넣는 방법입니다.",
              }),
            },
            {
              href: "/references/cli/module",
              title: l.trans({ en: "Module CLI", ko: "모듈 명령" }),
              desc: l.trans({
                en: "`create-module` for a model with its own table.",
                ko: "자체 테이블이 있는 모델은 `create-module`로 만듭니다.",
              }),
            },
            {
              href: "/references/cli/workflow#workflow-catalogue",
              title: l.trans({ en: "Workflow CLI", ko: "워크플로 CLI" }),
              desc: l.trans({
                en: "The `create-scalar` workflow runs this command, then sync and lint.",
                ko: "`create-scalar` 워크플로는 이 명령을 실행한 뒤 sync와 lint까지 이어서 합니다.",
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
