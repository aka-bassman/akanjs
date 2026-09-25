import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type MatrixGroup,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const termRows: IntroItem[] = [
    {
      name: "CRUD",
      desc: l.trans({
        en: "Create, read, update and delete: the basic things you do with a model's records.",
        ko: "생성, 조회, 수정, 삭제입니다. 모델의 데이터를 다루는 기본 동작입니다.",
      }),
    },
    {
      name: "sys:module",
      desc: l.trans({
        en: "How the CLI names a module: `shop:product` is `lib/product/` in the `shop` app.",
        ko: "CLI가 모듈을 가리키는 방식입니다. `shop:product`는 `shop` 앱의 `lib/product/`입니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "route group", ko: "라우트 그룹" })}</span>,
      href: "/docs/core/routing#file-based-routing",
      desc: l.trans({
        en: "A folder in parentheses, such as `(public)`. It groups files and adds nothing to the URL.",
        ko: "`(public)`처럼 괄호로 감싼 폴더입니다. 파일을 묶기만 하고 URL에는 나타나지 않습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "scaffold", ko: "스캐폴드" })}</span>,
      desc: l.trans({
        en: "The starter code a command writes, meant to be edited.",
        ko: "명령이 만들어 주는 시작 코드로, 직접 고쳐 쓰는 것을 전제로 합니다.",
      }),
    },
  ];

  const fileGroups: MatrixGroup[] = [
    {
      label: l.trans({
        en: "Written into the target folder, by default `page/(<app>)/(public)/<module>/`",
        ko: "대상 폴더(기본값 `page/(<app>)/(public)/<module>/`)에 생기는 파일",
      }),
      rows: [
        {
          name: "_index.tsx",
          desc: l.trans({
            en: "`/<module>`: the list of cards, with a create button. Under `--single` the button opens a modal.",
            ko: "`/<module>`: 카드 목록과 생성 버튼입니다. `--single`이면 버튼이 모달을 엽니다.",
          }),
          marks: { crud: true, single: true },
        },
        {
          name: "new/_index.tsx",
          desc: l.trans({
            en: "`/<module>/new`: the create form, built from `Template.General`.",
            ko: "`/<module>/new`: `Template.General`로 만든 생성 폼입니다.",
          }),
          marks: { crud: true },
        },
        {
          name: "[<module>Id]/_index.tsx",
          desc: l.trans({
            en: "`/<module>/<id>`: the detail from `Zone.View`, with a link to the edit page.",
            ko: "`/<module>/<id>`: `Zone.View`로 그린 상세 화면과 수정 페이지 링크입니다.",
          }),
          marks: { crud: true },
        },
        {
          name: "[<module>Id]/edit/_index.tsx",
          desc: l.trans({
            en: "`/<module>/<id>/edit`: the edit form, filled with the saved record.",
            ko: "`/<module>/<id>/edit`: 저장된 데이터가 채워진 수정 폼입니다.",
          }),
          marks: { crud: true },
        },
      ],
    },
  ];

  const moduleParts: IntroItem[] = [
    {
      name: "inPublic",
      desc: l.trans({
        en: "The slice the list and both forms load and save through.",
        ko: "목록과 두 폼이 데이터를 불러오고 저장할 때 쓰는 slice입니다.",
      }),
    },
    {
      name: ["Zone.Card", "Zone.View"],
      desc: l.trans({
        en: "The list of cards and the detail screen.",
        ko: "카드 목록과 상세 화면입니다.",
      }),
    },
    {
      name: "Template.General",
      desc: l.trans({
        en: "The form body, shared by the create and edit pages.",
        ko: "생성 페이지와 수정 페이지가 함께 쓰는 폼 본문입니다.",
      }),
    },
  ];

  const afterRules = [
    l.trans({
      en: (
        <>
          <strong>
            Links assume the URL is <code>{"/<module>"}</code>.
          </strong>{" "}
          The buttons, the redirect after saving and the cards in <code>Zone.Card</code> all point to paths starting
          with <code>{"/<module>"}</code>. Move the pages to another URL and update them too.
        </>
      ),
      ko: (
        <>
          <strong>
            링크는 URL이 <code>{"/<module>"}</code>이라고 가정합니다.
          </strong>{" "}
          버튼, 저장 후 이동할 주소, <code>Zone.Card</code>의 카드가 모두 <code>{"/<module>"}</code>로 시작하는 주소를
          가리킵니다. 페이지를 다른 URL로 옮기면 이 링크도 함께 고칩니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            <code>--single</code> writes no detail page.
          </strong>{" "}
          Each card still links to <code>{"/<module>/<id>"}</code>, so change that link, or generate the full set of
          four pages without <code>--single</code> instead.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>--single</code>은 상세 페이지를 만들지 않습니다.
          </strong>{" "}
          카드는 여전히 <code>{"/<module>/<id>"}</code>로 연결되므로, 링크를 고치거나 <code>--single</code> 없이 네
          페이지를 모두 만듭니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>The pages check no session.</strong> Writes follow the slice <code>create-module</code> wrote:{" "}
          <code>cru: Admin</code> with <code>libs/shared</code>, <code>cru: None</code> without it. Gate the pages in a{" "}
          <code>_layout.tsx</code> and set the guards your screens need before you ship.
        </>
      ),
      ko: (
        <>
          <strong>페이지는 세션을 확인하지 않습니다.</strong> 쓰기는 <code>create-module</code>이 만든 slice를 따릅니다.{" "}
          <code>libs/shared</code>가 있으면 <code>cru: Admin</code>, 없으면 <code>cru: None</code>입니다. 배포 전에{" "}
          <code>_layout.tsx</code>에서 페이지를 막고, 화면에 맞는 guard를 정합니다.
        </>
      ),
    }),
  ];

  const commands: CommandReferenceItem[] = [
    {
      name: "create-crud-page",
      signature: "akan create-crud-page [app] [sys:module] [--base-path <path>] [--single]",
      desc: l.trans({
        en: "Create the list, create, detail and edit pages for an existing module.\nThey go into `page/(<app>)/(public)/<module>/` unless `--base-path` names another folder.",
        ko: "기존 모듈의 목록, 생성, 상세, 수정 페이지를 만듭니다.\n`--base-path`로 다른 폴더를 지정하지 않으면 `page/(<app>)/(public)/<module>/`에 만듭니다.",
      }),
      args: [
        {
          name: "app",
          type: "String",
          desc: l.trans({
            en: "The app that gets the pages. Left out, the only app is used, or you pick one from a list.",
            ko: "페이지를 받을 앱입니다. 생략하면 앱이 하나일 때는 그 앱을, 여럿이면 목록에서 고릅니다.",
          }),
        },
        {
          name: "sys:module",
          type: "String",
          desc: l.trans({
            en: "The module, such as `shop:product`. Left out, you pick the app or library, then the module.",
            ko: "`shop:product` 같은 모듈입니다. 생략하면 앱이나 라이브러리를 고른 뒤 모듈을 고릅니다.",
          }),
        },
      ],
      options: [
        {
          name: "--base-path",
          type: "String",
          defaultValue: "page/(<app>)/(public)/<module>",
          enumOrFlag: "-b",
          desc: l.trans({
            en: "The folder to write into, relative to the app root, such as `page/(shop)/(admin)/product`.",
            ko: "파일을 쓸 폴더로, 앱 루트 기준 경로입니다. 예: `page/(shop)/(admin)/product`",
          }),
        },
        {
          name: "--single",
          type: "Boolean",
          defaultValue: "false",
          enumOrFlag: "-s",
          desc: l.trans({
            en: "Write one `_index.tsx` with the list and a create modal, instead of four pages.",
            ko: "페이지 네 개 대신, 목록과 생성 모달이 든 `_index.tsx` 하나만 만듭니다.",
          }),
        },
      ],
      notes: [
        {
          name: l.trans({ en: "same app", ko: "같은 앱" }),
          desc: l.trans({
            en: "Pick a module of the target app. The pages import from `@apps/<sys>/client`.",
            ko: "대상 앱의 모듈을 고릅니다. 페이지가 `@apps/<sys>/client`에서 import하기 때문입니다.",
          }),
        },
        {
          name: l.trans({ en: "database modules only", ko: "데이터베이스 모듈만" }),
          desc: l.trans({
            en: "A service module in `lib/_<service>` or a scalar in `lib/__scalar` is not accepted.",
            ko: "`lib/_<service>`의 서비스 모듈과 `lib/__scalar`의 스칼라는 받지 않습니다.",
          }),
        },
        {
          name: l.trans({ en: "with create-module", ko: "create-module과 함께" }),
          desc: l.trans({
            en: "`akan create-module <name> <app> --page` runs this command with the default folder.",
            ko: "`akan create-module <name> <app> --page`는 기본 폴더로 이 명령까지 실행합니다.",
          }),
        },
        {
          name: l.trans({ en: "existing file", ko: "기존 파일" }),
          desc: l.trans({
            en: "A file already at the path is overwritten with the scaffold, so commit first.",
            ko: "같은 경로에 파일이 있으면 스캐폴드로 덮어쓰므로, 실행 전에 커밋해 둡니다.",
          }),
        },
      ],
      examples: `akan create-crud-page shop shop:product
akan create-crud-page shop shop:product --single
akan create-crud-page shop shop:product --base-path "page/(shop)/(admin)/product"
akan create-crud-page`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="page-cli" title={l.trans({ en: "Page CLI", ko: "페이지 명령" })}>
        <Docs.Title>{l.trans({ en: "Page CLI", ko: "페이지 명령" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>create-crud-page</code> writes the list, create, detail and edit pages for a module that already
                  exists, so you can browse and edit its data right away. Run it after <code>create-module</code>, then
                  edit the pages like any other code.
                </span>
              ),
              ko: (
                <span>
                  <code>create-crud-page</code>는 이미 있는 모듈에 목록, 생성, 상세, 수정 페이지를 만들어, 바로 데이터를
                  보고 고칠 수 있게 합니다. <code>create-module</code> 다음에 실행하고, 만들어진 페이지는 여느 코드처럼
                  고쳐 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Words Used on This Page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
        <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

        <Docs.SubSubTitle>{l.trans({ en: "Pages It Writes", ko: "만드는 페이지" })}</Docs.SubSubTitle>
        <Docs.Matrix
          type={l.trans({ en: "File", ko: "파일" })}
          columns={[
            { key: "crud", label: l.trans({ en: "Default", ko: "기본" }) },
            { key: "single", label: "--single", code: true },
          ]}
          groups={fileGroups}
          markLabel={l.trans({ en: "Written", ko: "만듦" })}
          emptyLabel={l.trans({ en: "Not written", ko: "만들지 않음" })}
        />

        <Docs.SubSubTitle>{l.trans({ en: "What the Module Must Have", ko: "모듈에 있어야 하는 것" })}</Docs.SubSubTitle>
        <p className="my-4">
          {l.trans({
            en: (
              <span>
                The pages call these parts of the module. A module made with <code>create-module</code> has all of them;
                if you renamed or removed one, fix the generated pages to match.
              </span>
            ),
            ko: (
              <span>
                페이지는 모듈의 다음 부분을 사용합니다. <code>create-module</code>로 만든 모듈에는 모두 있으며, 이름을
                바꾸거나 지웠다면 생성된 페이지도 맞춰 고칩니다.
              </span>
            ),
          })}
        </p>
        <Docs.IntroTable type={l.trans({ en: "Part", ko: "부분" })} items={moduleParts} />

        <Docs.SubSubTitle>{l.trans({ en: "Check After It Runs", ko: "실행한 뒤 확인할 것" })}</Docs.SubSubTitle>
        <ul className="my-4 list-disc space-y-2 pl-5">
          {afterRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <>
                <strong>
                  <code>--base-path</code> is a folder inside the app, not a URL prefix.
                </strong>{" "}
                <code>--base-path admin</code> writes to <code>apps/shop/admin/</code>, outside <code>page/</code>, so
                no route is created. Give the whole folder, such as <code>{"page/(shop)/(admin)/product"}</code>.
              </>
            ),
            ko: (
              <>
                <strong>
                  <code>--base-path</code>는 URL 접두사가 아니라 앱 안의 폴더입니다.
                </strong>{" "}
                <code>--base-path admin</code>은 <code>page/</code> 밖인 <code>apps/shop/admin/</code>에 파일을 쓰므로
                라우트가 생기지 않습니다. <code>{"page/(shop)/(admin)/product"}</code>처럼 폴더 전체를 적습니다.
              </>
            ),
          })}
        </Docs.Alert>

        <Docs.SubSubTitle>{l.trans({ en: "Related Pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
        <Docs.LinkGrid
          items={[
            {
              href: "/references/cli/module#create-module",
              title: l.trans({ en: "Module CLI", ko: "모듈 명령" }),
              desc: l.trans({
                en: "`create-module` makes the module these pages need, and `--page` adds them in one go.",
                ko: "`create-module`로 이 페이지들이 쓰는 모듈을 만들고, `--page`로 페이지까지 한 번에 만듭니다.",
              }),
            },
            {
              href: "/docs/core/routing#file-based-routing",
              title: l.trans({ en: "Routing", ko: "라우팅" }),
              desc: l.trans({
                en: "How folders under `page/` become URLs, including route groups and `[id]` segments.",
                ko: "`page/` 아래 폴더가 URL이 되는 방식과 라우트 그룹, `[id]` 세그먼트를 설명합니다.",
              }),
            },
            {
              href: "/conventions/module/zone",
              title: l.trans({ en: "Zone Convention", ko: "Zone 컨벤션" }),
              desc: l.trans({
                en: "`Zone.Card` and `Zone.View`, the two zones the generated pages render.",
                ko: "생성된 페이지가 그리는 두 zone인 `Zone.Card`와 `Zone.View`를 다룹니다.",
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
