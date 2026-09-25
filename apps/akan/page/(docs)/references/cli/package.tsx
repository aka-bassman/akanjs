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
      name: <span className="font-sans">{l.trans({ en: "package", ko: "패키지" })}</span>,
      desc: l.trans({
        en: "A folder under `pkgs/` with its own `package.json`, such as `akanjs` or `@akanjs/cli`.",
        ko: "`akanjs`, `@akanjs/cli`처럼 `pkgs/` 아래에서 자기 `package.json`을 가진 폴더입니다.",
      }),
    },
    {
      name: "dist",
      desc: l.trans({
        en: "The build output in `dist/pkgs/<pkg>/`, which is the folder that gets packed and published.",
        ko: "`dist/pkgs/<pkg>/`에 생기는 빌드 결과로, 압축해서 배포하는 대상이 이 폴더입니다.",
      }),
    },
    {
      name: "exports",
      desc: l.trans({
        en: "The export map in `package.json`: which import paths a consumer may use, and the file each opens.",
        ko: "패키지를 설치한 쪽이 쓸 수 있는 import 경로와, 각 경로가 여는 파일을 적는 `package.json` 항목입니다.",
      }),
    },
    {
      name: "npm pack --dry-run",
      desc: l.trans({
        en: "Lists what a publish would upload and its size, without writing a tarball.",
        ko: "배포하면 올라갈 파일과 크기를 보여 주되, 압축 파일은 만들지 않습니다.",
      }),
    },
  ];

  const commandGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "Check", ko: "확인" }),
      rows: [
        {
          name: "version",
          desc: l.trans({ en: "Print the `akanjs` version in use.", ko: "지금 쓰는 `akanjs` 버전을 출력합니다." }),
          marks: {},
        },
        {
          name: "sync-package",
          desc: l.trans({
            en: "Scan one package's imports as a quick check.",
            ko: "패키지 하나의 import를 스캔해 빠르게 점검합니다.",
          }),
          marks: {},
        },
      ],
    },
    {
      label: l.trans({ en: "Add and remove", ko: "추가와 제거" }),
      rows: [
        {
          name: "create-package",
          desc: l.trans({
            en: "Start a new folder in `pkgs/` and register its import path.",
            ko: "`pkgs/`에 새 폴더를 만들고 import 경로를 등록합니다.",
          }),
          marks: { src: true, tsconfig: true },
        },
        {
          name: "remove-package",
          desc: l.trans({
            en: "Delete the folder and its import path.",
            ko: "폴더와 import 경로를 지웁니다.",
          }),
          marks: { src: true, tsconfig: true },
        },
      ],
    },
    {
      label: l.trans({ en: "Build and publish", ko: "빌드와 배포" }),
      rows: [
        {
          name: "build-package",
          desc: l.trans({
            en: "Write the dist folder and the dependency list.",
            ko: "dist 폴더를 만들고 의존성 목록을 적습니다.",
          }),
          marks: { src: true, dist: true },
        },
        {
          name: "verify-dist-package",
          desc: l.trans({
            en: "Check the dist folder before you publish it.",
            ko: "배포 전에 dist 폴더를 검사합니다.",
          }),
          marks: {},
        },
      ],
    },
  ];

  const steps = [
    l.trans({
      en: (
        <>
          <code>akan create-package --name renderer</code> makes <code>pkgs/renderer/</code>. Add its{" "}
          <code>package.json</code> and <code>index.ts</code> yourself.
        </>
      ),
      ko: (
        <>
          <code>akan create-package --name renderer</code>로 <code>pkgs/renderer/</code>를 만듭니다.{" "}
          <code>package.json</code>과 <code>index.ts</code>는 직접 추가합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          Write the code and test it with <code>akan test renderer</code>.
        </>
      ),
      ko: (
        <>
          코드를 작성하고 <code>akan test renderer</code>로 테스트합니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <code>akan build-package renderer</code> writes <code>dist/pkgs/renderer/</code>.
        </>
      ),
      ko: (
        <>
          <code>akan build-package renderer</code>가 <code>dist/pkgs/renderer/</code>를 만듭니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <code>akan verify-dist-package renderer</code> checks that folder before you publish it.
        </>
      ),
      ko: (
        <>
          <code>akan verify-dist-package renderer</code>로 배포 전에 그 폴더를 검사합니다.
        </>
      ),
    }),
  ];

  const sharedRules = [
    l.trans({
      en: (
        <>
          <strong>
            Name a package by its path under <code>pkgs/</code>.
          </strong>{" "}
          For example <code>akanjs</code>, <code>@akanjs/cli</code> or <code>create-akan-workspace</code>. Leave it out,
          or mistype it, and you pick one from a list.
        </>
      ),
      ko: (
        <>
          <strong>
            패키지는 <code>pkgs/</code> 아래 경로로 지정합니다.
          </strong>{" "}
          <code>akanjs</code>, <code>@akanjs/cli</code>, <code>create-akan-workspace</code>처럼 씁니다. 생략하거나 잘못
          적으면 목록에서 고릅니다.
        </>
      ),
    }),
    l.trans({
      en: (
        <>
          <strong>
            Only a folder with a <code>package.json</code> counts as a package.
          </strong>{" "}
          A folder fresh from <code>create-package</code> has none yet, so add one before the other commands.
        </>
      ),
      ko: (
        <>
          <strong>
            <code>package.json</code>이 있는 폴더만 패키지로 봅니다.
          </strong>{" "}
          <code>create-package</code>로 막 만든 폴더에는 아직 없으니, 다른 명령을 쓰기 전에 추가합니다.
        </>
      ),
    }),
  ];

  const pkgArg: ReferenceRow = {
    name: "pkg",
    type: "String",
    desc: l.trans({
      en: "A package path under `pkgs/`, such as `akanjs` or `@akanjs/cli`; leave it out to pick from a list.",
      ko: "`akanjs`, `@akanjs/cli`처럼 `pkgs/` 아래 패키지 경로이며, 생략하면 목록에서 고릅니다.",
    }),
  };

  const commands: CommandReferenceItem[] = [
    {
      name: "version",
      signature: "akan version",
      desc: l.trans({
        en: "Print the `akanjs` version as one line, `akanjs@<version>`.\nCheck it before a package release, an upgrade or framework maintenance work.",
        ko: "`akanjs` 버전을 `akanjs@<version>` 한 줄로 출력합니다.\n패키지 릴리스, 업그레이드, 프레임워크 유지보수 전에 현재 버전을 확인할 때 씁니다.",
      }),
      notes: [
        {
          name: l.trans({ en: "default source", ko: "기본 출처" }),
          desc: l.trans({
            en: "The `akanjs` version the running CLI resolves or depends on.",
            ko: "지금 실행 중인 CLI가 찾거나 의존하는 `akanjs`의 버전입니다.",
          }),
        },
        {
          name: "USE_AKANJS_PKGS=true",
          desc: l.trans({
            en: "Reads `pkgs/akanjs/package.json` in this workspace instead.",
            ko: "대신 이 워크스페이스의 `pkgs/akanjs/package.json`을 읽습니다.",
          }),
        },
        {
          name: "akan --version",
          desc: l.trans({
            en: "A separate flag that prints the CLI's own version instead.",
            ko: "CLI 자신의 버전을 출력하는 별개의 플래그입니다.",
          }),
        },
        {
          name: l.trans({ en: "mismatch", ko: "버전 불일치" }),
          desc: l.trans({
            en: "If the CLI and `node_modules/akanjs` differ, every command warns and suggests `akan update`.",
            ko: "CLI와 `node_modules/akanjs` 버전이 다르면 모든 명령이 경고하고 `akan update`를 권합니다.",
          }),
        },
      ],
      examples: `akan version
akan --version`,
    },
    {
      name: "create-package",
      signature: "akan create-package --name <name>",
      desc: l.trans({
        en: "Create a new package folder at `pkgs/<name>/` and register its import path in the root `tsconfig.json`.\nThe folder starts with only a `tsconfig.json`; add `package.json` and `index.ts` yourself.",
        ko: "새 패키지 폴더를 `pkgs/<name>/`에 만들고, 루트 `tsconfig.json`에 import 경로를 등록합니다.\n폴더에는 `tsconfig.json`만 생기므로 `package.json`과 `index.ts`는 직접 추가합니다.",
      }),
      options: [
        {
          name: "--name",
          type: "String",
          enumOrFlag: "-n",
          desc: l.trans({
            en: "The package name, lowercased with spaces turned into `-`; asked for if left out.",
            ko: "소문자로 바꾸고 공백을 `-`로 바꾼 패키지 이름이며, 생략하면 입력을 받습니다.",
          }),
        },
      ],
      notes: [
        {
          name: "tsconfig.json",
          desc: l.trans({
            en: "The new `pkgs/<name>/tsconfig.json` extends the root one through `../../tsconfig.json`.",
            ko: "새로 생긴 `pkgs/<name>/tsconfig.json`은 `../../tsconfig.json`으로 루트 설정을 확장합니다.",
          }),
        },
        {
          name: l.trans({ en: "scoped name", ko: "스코프가 붙은 이름" }),
          desc: l.trans({
            en: "For a name like `@scope/x`, change that `extends` to `../../../tsconfig.json` by hand.",
            ko: "`@scope/x` 같은 이름이면 그 `extends`를 `../../../tsconfig.json`으로 직접 고칩니다.",
          }),
        },
        {
          name: "paths",
          desc: l.trans({
            en: "Adds `<name>` → `./pkgs/<name>/index.ts` and `<name>/*` → `./pkgs/<name>/*` to the root.",
            ko: "루트에 `<name>` → `./pkgs/<name>/index.ts`, `<name>/*` → `./pkgs/<name>/*`를 추가합니다.",
          }),
        },
        {
          name: "references",
          desc: l.trans({
            en: "Also adds `./pkgs/<name>/tsconfig.json` when the root `tsconfig.json` lists `references`.",
            ko: "루트 `tsconfig.json`에 `references`가 있으면 `./pkgs/<name>/tsconfig.json`도 추가합니다.",
          }),
        },
      ],
      examples: `akan create-package --name renderer
akan create-package`,
    },
    {
      name: "remove-package",
      signature: "akan remove-package [pkg]",
      desc: l.trans({
        en: "Delete the whole `pkgs/<pkg>/` folder without asking, and drop its entries from the root `tsconfig.json`.\nUse it when a package should no longer be synced, built or verified.",
        ko: "`pkgs/<pkg>/` 폴더 전체를 확인 없이 지우고, 루트 `tsconfig.json`에서 그 항목을 뺍니다.\n패키지를 더는 동기화하거나 빌드·검증하지 않을 때 씁니다.",
      }),
      args: [pkgArg],
      notes: [
        {
          name: "tsconfig.json",
          desc: l.trans({
            en: "Removes `<pkg>` and `<pkg>/*` from `paths`, and its entry from `references`.",
            ko: "`paths`에서 `<pkg>`와 `<pkg>/*`를, `references`에서 그 항목을 지웁니다.",
          }),
        },
        {
          name: l.trans({ en: "what stays", ko: "남는 것" }),
          desc: l.trans({
            en: "The old build in `dist/pkgs/<pkg>/` and any imports of the package in other code.",
            ko: "`dist/pkgs/<pkg>/`의 이전 빌드와, 다른 코드에 남은 그 패키지의 import입니다.",
          }),
        },
      ],
      examples: `akan remove-package renderer
akan remove-package`,
    },
    {
      name: "sync-package",
      signature: "akan sync-package [pkg]",
      desc: l.trans({
        en: "Scan one package's imports to find the npm packages and sibling packages it uses.\nIt changes no files and prints only whether the scan passed, so use it as a quick check after editing imports.",
        ko: "패키지 하나의 import를 스캔해 쓰고 있는 npm 패키지와 `pkgs/`의 다른 패키지를 찾습니다.\n파일은 바꾸지 않고 스캔 성공 여부만 출력하므로, import를 고친 뒤 빠르게 점검할 때 씁니다.",
      }),
      args: [pkgArg],
      notes: [
        {
          name: l.trans({ en: "npm packages", ko: "npm 패키지" }),
          desc: l.trans({
            en: "An import counts only when the root `package.json` lists it in `dependencies` or `devDependencies`.",
            ko: "루트 `package.json`의 `dependencies`나 `devDependencies`에 있는 import만 셉니다.",
          }),
        },
        {
          name: l.trans({ en: "writing them", ko: "의존성 기록" }),
          desc: l.trans({
            en: "`build-package` is the step that writes dependencies into `pkgs/<pkg>/package.json`.",
            ko: "의존성을 `pkgs/<pkg>/package.json`에 적는 단계는 `build-package`입니다.",
          }),
        },
      ],
      examples: `akan sync-package renderer
akan sync-package`,
    },
    {
      name: "build-package",
      signature: "akan build-package [pkg]",
      desc: l.trans({
        en: "Build one package into `dist/pkgs/<pkg>/`, the folder you publish or other packages use locally.\nRun it after you change the package, before anything relies on its build output.",
        ko: "패키지 하나를 `dist/pkgs/<pkg>/`에 빌드합니다. 배포하거나 다른 패키지가 로컬에서 가져다 쓰는 폴더입니다.\n패키지를 고친 뒤, 그 빌드 결과를 다른 곳에서 쓰기 전에 실행합니다.",
      }),
      args: [pkgArg],
      notes: [
        {
          name: l.trans({ en: "clean start", ko: "빈 폴더에서 시작" }),
          desc: l.trans({
            en: "Deletes `dist/pkgs/<pkg>/` first, so nothing from an older build is left behind.",
            ko: "먼저 `dist/pkgs/<pkg>/`를 지우므로, 이전 빌드의 파일이 남지 않습니다.",
          }),
        },
        {
          name: l.trans({ en: "dependencies", ko: "의존성" }),
          desc: l.trans({
            en: "Writes each imported package into `pkgs/<pkg>/package.json` at the version the root pins.",
            ko: "import한 패키지를 루트가 고정한 버전으로 `pkgs/<pkg>/package.json`에 적습니다.",
          }),
        },
        {
          name: "devDependencies",
          desc: l.trans({
            en: "Type-only imports and imports inside `build.ts` go to `devDependencies` instead.",
            ko: "타입만 가져오는 import와 `build.ts` 안의 import는 `devDependencies`로 갑니다.",
          }),
        },
        {
          name: l.trans({ en: "sibling packages", ko: "pkgs/의 다른 패키지" }),
          desc: l.trans({
            en: "An import of a `pkgs/` package the root does not list takes that package's own `version`.",
            ko: "루트에 없는 `pkgs/`의 다른 패키지를 import하면 그 패키지 자신의 `version`을 씁니다.",
          }),
        },
        {
          name: l.trans({ en: "missing version", ko: "버전 누락" }),
          desc: l.trans({
            en: "Stops if an import has no version in the root `package.json`; add it there, then rebuild.",
            ko: "루트 `package.json`에 버전이 없는 import가 있으면 멈추니, 루트에 추가한 뒤 다시 빌드합니다.",
          }),
        },
        {
          name: l.trans({ en: "optional peers", ko: "선택적 peer 의존성" }),
          desc: l.trans({
            en: "Packages marked optional in `peerDependenciesMeta` stay out of the dependency list.",
            ko: "`peerDependenciesMeta`에서 optional로 표시한 패키지는 의존성 목록에서 뺍니다.",
          }),
        },
        {
          name: "build.ts",
          desc: l.trans({
            en: "If `pkgs/<pkg>/build.ts` exists, Bun runs it and it writes the dist folder.",
            ko: "`pkgs/<pkg>/build.ts`가 있으면 Bun이 그 파일을 실행하고, dist 폴더는 그 스크립트가 씁니다.",
          }),
        },
        {
          name: l.trans({ en: "no build.ts", ko: "build.ts가 없으면" }),
          desc: l.trans({
            en: "Copies the source into dist and writes a `package.json` and `tsconfig.json` there.",
            ko: "소스를 dist로 복사하고, 그 안에 `package.json`과 `tsconfig.json`을 씁니다.",
          }),
        },
        {
          name: l.trans({ en: "generated manifest", ko: "만들어지는 package.json" }),
          desc: l.trans({
            en: "Adds `type: module`, an `index.ts` root export and `engines.bun`, and is copied back to the source.",
            ko: "`type: module`, `index.ts` 루트 export, `engines.bun`을 넣고, 소스 쪽에도 똑같이 씁니다.",
          }),
        },
        {
          name: "README",
          desc: l.trans({
            en: "Copies `README.md` and `README.ko.md` into dist when they exist.",
            ko: "`README.md`와 `README.ko.md`가 있으면 dist로 복사합니다.",
          }),
        },
      ],
      examples: `akan build-package renderer
akan build-package akanjs`,
    },
    {
      name: "verify-dist-package",
      signature: "akan verify-dist-package [pkg]",
      desc: l.trans({
        en: "Check a package's build output in `dist/pkgs/<pkg>/`, then measure it with an `npm pack` dry run.\nRun it after `build-package` and before publishing, so a broken export map is caught here and not by the first person to install it.",
        ko: "`dist/pkgs/<pkg>/`의 빌드 결과를 검사한 뒤 `npm pack` dry run으로 크기를 잽니다.\n`build-package` 다음, 배포 전에 실행합니다. 깨진 export map을 처음 설치하는 사람보다 먼저 여기서 잡습니다.",
      }),
      args: [pkgArg],
      notes: [
        {
          name: l.trans({ en: "build first", ko: "빌드 먼저" }),
          desc: l.trans({
            en: "Fails at once if `dist/pkgs/<pkg>/package.json` is missing; run `build-package`.",
            ko: "`dist/pkgs/<pkg>/package.json`이 없으면 바로 실패하니, `build-package`를 먼저 실행합니다.",
          }),
        },
        {
          name: l.trans({ en: "name and version", ko: "이름과 버전" }),
          desc: l.trans({
            en: "The dist `package.json` names this package and carries a `version`.",
            ko: "dist의 `package.json`에 이 패키지의 이름과 `version`이 있어야 합니다.",
          }),
        },
        {
          name: l.trans({ en: "public access", ko: "공개 배포" }),
          desc: l.trans({
            en: "`publishConfig.access` is `public`.",
            ko: "`publishConfig.access`가 `public`이어야 합니다.",
          }),
        },
        {
          name: "README",
          desc: l.trans({
            en: "Both `README.md` and `README.ko.md` are in dist.",
            ko: "dist에 `README.md`와 `README.ko.md`가 둘 다 있어야 합니다.",
          }),
        },
        {
          name: "bin",
          desc: l.trans({
            en: "No `bin` entry points at a `.ts` source.",
            ko: "`bin` 항목이 `.ts` 소스를 가리키면 안 됩니다.",
          }),
        },
        {
          name: "exports",
          desc: l.trans({
            en: "Every subpath the package imports from itself must open a real file through `exports`.",
            ko: "패키지가 자기 자신의 하위 경로를 import하면, 그 경로마다 `exports`를 거쳐 실제 파일에 닿아야 합니다.",
          }),
        },
        {
          name: l.trans({ en: "fixing exports", ko: "exports 고치기" }),
          desc: l.trans({
            en: 'Targets match exactly: a file needs `"./*": "./*.ts"`, a folder `"./name": "./name/index.ts"`.',
            ko: '대상 경로에 확장자나 `index.ts`를 붙여 주지 않으므로, 파일은 `"./*": "./*.ts"`, 폴더는 `"./name": "./name/index.ts"`가 필요합니다.',
          }),
        },
        {
          name: l.trans({ en: "suffixed imports", ko: "확장자가 붙은 import" }),
          desc: l.trans({
            en: 'Add `"./*.ts": "./*.ts"` so a specifier already ending in `.ts` does not get a second extension.',
            ko: '`"./*.ts": "./*.ts"`를 넣어 두면 이미 `.ts`로 끝나는 경로에 확장자가 두 번 붙지 않습니다.',
          }),
        },
        {
          name: "akanjs",
          desc: l.trans({
            en: "For `akanjs` only, the root export's `types` must point into `./types/`.",
            ko: "`akanjs`는 추가로, 루트 export의 `types`가 `./types/` 안을 가리켜야 합니다.",
          }),
        },
        {
          name: l.trans({ en: "result", ko: "결과" }),
          desc: l.trans({
            en: "Prints the file count and the packed size in bytes, and writes or publishes nothing.",
            ko: "파일 개수와 압축 크기(바이트)를 출력할 뿐, 파일을 쓰거나 배포하지는 않습니다.",
          }),
        },
        {
          name: "npm",
          desc: l.trans({
            en: "The size comes from `npm pack --dry-run`, so `npm` must be on your `PATH`.",
            ko: "크기는 `npm pack --dry-run`으로 재므로 `PATH`에 `npm`이 있어야 합니다.",
          }),
        },
        {
          name: l.trans({ en: "published four", ko: "배포 패키지 네 개" }),
          desc: l.trans({
            en: "`akan verify-akan-publish-packages`, hidden from help, checks the four that Akan.js publishes.",
            ko: "도움말에 없는 `akan verify-akan-publish-packages`는 Akan.js가 배포하는 패키지 네 개를 검사합니다.",
          }),
        },
        {
          name: l.trans({ en: "which four", ko: "네 개의 목록" }),
          desc: l.trans({
            en: "`akanjs`, `@akanjs/cli`, `@akanjs/devkit` and `create-akan-workspace`.",
            ko: "`akanjs`, `@akanjs/cli`, `@akanjs/devkit`, `create-akan-workspace`입니다.",
          }),
        },
        {
          name: l.trans({ en: "cross-imports", ko: "서로 간 import" }),
          desc: l.trans({
            en: "Run together, an import of a sibling's subpath is checked against that sibling's `exports`.",
            ko: "네 개를 함께 검사하면, 서로의 하위 경로를 import한 것도 상대 패키지의 `exports`로 확인합니다.",
          }),
        },
      ],
      examples: `akan verify-dist-package renderer
akan verify-dist-package @akanjs/devkit`,
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="package-cli" title={l.trans({ en: "Package CLI", ko: "패키지 CLI" })}>
        <Docs.Title>{l.trans({ en: "Package CLI", ko: "패키지 CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Six commands that create, build and verify the packages under <code>pkgs/</code>: the framework (
                  <code>akanjs</code>), the CLI and other tooling. They sit below the app and library commands, so use
                  those for product code.
                </span>
              ),
              ko: (
                <span>
                  <code>pkgs/</code> 아래의 패키지, 즉 프레임워크(<code>akanjs</code>)와 CLI 같은 도구 패키지를 만들고
                  빌드하고 검증하는 명령 여섯 가지입니다. 앱·라이브러리 명령보다 낮은 수준이므로, 제품 코드에는 그쪽
                  명령을 씁니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>

        <Docs.SubSubTitle>{l.trans({ en: "Words Used on This Page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
        <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />

        <Docs.SubSubTitle>{l.trans({ en: "Typical Order", ko: "보통의 순서" })}</Docs.SubSubTitle>
        <ol className="my-4 list-decimal space-y-2 pl-5">
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>

        <Docs.SubSubTitle>{l.trans({ en: "What Each Command Changes", ko: "명령마다 바꾸는 것" })}</Docs.SubSubTitle>
        <Docs.Matrix
          type={l.trans({ en: "Command", ko: "명령" })}
          columns={[
            { key: "src", label: l.trans({ en: "Source", ko: "소스" }), caption: "pkgs/<pkg>" },
            { key: "tsconfig", label: l.trans({ en: "Root tsconfig", ko: "루트 tsconfig" }), caption: "tsconfig.json" },
            { key: "dist", label: l.trans({ en: "Build output", ko: "빌드 결과" }), caption: "dist/pkgs/<pkg>" },
          ]}
          groups={commandGroups}
          markLabel={l.trans({ en: "Changed", ko: "바뀜" })}
          emptyLabel={l.trans({ en: "Untouched", ko: "그대로" })}
        />

        <Docs.SubSubTitle>{l.trans({ en: "Picking a Package", ko: "패키지를 지정하는 법" })}</Docs.SubSubTitle>
        <p>
          {l.trans({
            en: (
              <span>
                The four commands that take <code>[pkg]</code> find the package the same way.
              </span>
            ),
            ko: (
              <span>
                <code>[pkg]</code>를 받는 네 명령은 모두 같은 방식으로 패키지를 찾습니다.
              </span>
            ),
          })}
        </p>
        <ul className="my-4 list-disc space-y-2 pl-5">
          {sharedRules.map((rule, idx) => (
            <li key={idx}>{rule}</li>
          ))}
        </ul>
        <Docs.Alert type="warning">
          {l.trans({
            en: (
              <>
                <strong>Commit before you remove or build a package.</strong> <code>remove-package</code> deletes{" "}
                <code>{"pkgs/<pkg>/"}</code> without asking, and <code>build-package</code> rewrites{" "}
                <code>{"pkgs/<pkg>/package.json"}</code>.
              </>
            ),
            ko: (
              <>
                <strong>패키지를 지우거나 빌드하기 전에 커밋해 두세요.</strong> <code>remove-package</code>는{" "}
                <code>{"pkgs/<pkg>/"}</code>를 확인 없이 지우고, <code>build-package</code>는{" "}
                <code>{"pkgs/<pkg>/package.json"}</code>을 다시 씁니다.
              </>
            ),
          })}
        </Docs.Alert>

        <Docs.SubSubTitle>{l.trans({ en: "Related Pages", ko: "관련 페이지" })}</Docs.SubSubTitle>
        <Docs.LinkGrid
          items={[
            {
              href: "/references/cli/application#test",
              title: "akan test",
              desc: l.trans({
                en: "Run a package's tests with `bun test --isolate` before you build it.",
                ko: "빌드 전에 패키지 테스트를 `bun test --isolate`로 실행합니다.",
              }),
            },
            {
              href: "/references/cli/library",
              title: l.trans({ en: "Library CLI", ko: "라이브러리 CLI" }),
              desc: l.trans({
                en: "Create, sync and remove the shared code apps use in `libs/`.",
                ko: "앱이 함께 쓰는 `libs/`의 코드를 만들고, 동기화하고, 지웁니다.",
              }),
            },
            {
              href: "/references/cli/cloud#update",
              title: "akan update",
              desc: l.trans({
                en: "Upgrade the Akan.js packages and the CLI, then confirm with `akan version`.",
                ko: "Akan.js 패키지와 CLI를 올린 뒤 `akan version`으로 확인합니다.",
              }),
            },
            {
              href: "/conventions/workspace/structure",
              title: l.trans({ en: "Workspace Structure", ko: "워크스페이스 구조" }),
              desc: l.trans({
                en: "Where `pkgs/` sits next to `apps/` and `libs/`.",
                ko: "`pkgs/`가 `apps/`, `libs/`와 함께 어디에 놓이는지 봅니다.",
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
