import { usePage } from "@apps/akan/client";
import {
  Code,
  cardGridRecipe,
  Divider,
  Docs,
  DocsToc,
  type IntroItem,
  type LinkGridItem,
  type MatrixGroup,
  panelRecipe,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";
  const bulletList = "my-4 list-disc space-y-2 pl-5";

  const termRows: IntroItem[] = [
    {
      name: "document",
      desc: l.trans({
        en: "One stored record of a model, such as one post.",
        ko: "게시글 한 개처럼, 모델로 저장된 레코드 하나입니다.",
      }),
    },
    {
      name: "relation",
      desc: l.trans({
        en: "A field typed as another model, which stores only the id and is loaded by the server.",
        ko: "타입이 다른 모델인 필드로, id만 저장하고 응답을 만들 때 서버가 그 모델을 불러옵니다.",
      }),
    },
    {
      name: "scalar",
      desc: l.trans({
        en: "A value object declared under `lib/__scalar/` and stored inside the document.",
        ko: "`lib/__scalar/` 아래에 선언하고 document 안에 그대로 저장하는 값 객체입니다.",
      }),
    },
    {
      name: "Light<Model>",
      desc: l.trans({
        en: "The few fields of a model that one list row shows, such as `LightPost`.",
        ko: "`LightPost`처럼, 목록의 행 하나가 보여 주는 몇 개의 필드입니다.",
      }),
    },
    {
      name: "child model",
      desc: l.trans({
        en: "A model whose documents point back at a parent, like comments at a post.",
        ko: "게시글을 가리키는 댓글처럼, document마다 부모를 가리키는 모델입니다.",
      }),
    },
  ];

  const screenColumns = [
    { key: "screen", label: l.trans({ en: "Screen", ko: "화면" }) },
    { key: "lands", label: l.trans({ en: "Lands in", ko: "담기는 곳" }), code: true },
    { key: "ask", label: l.trans({ en: "Ask first", ko: "먼저 물어볼 것" }) },
  ];
  const screenRows = [
    {
      screen: l.trans({ en: "List page", ko: "목록 화면" }),
      ask: l.trans({
        en: "What small fields should every row show?",
        ko: "각 행에 어떤 작은 정보가 보여야 하나요?",
      }),
      lands: "LightPost",
    },
    {
      screen: l.trans({ en: "Detail page", ko: "상세 화면" }),
      ask: l.trans({
        en: "What full data should load together?",
        ko: "어떤 데이터를 한 번에 함께 불러와야 하나요?",
      }),
      lands: "Post",
    },
    {
      screen: l.trans({ en: "Form", ko: "입력 폼" }),
      ask: l.trans({
        en: "Which values does the user type in?",
        ko: "사용자가 직접 입력하는 값은 무엇인가요?",
      }),
      lands: "PostInput",
    },
    {
      screen: l.trans({ en: "Child list", ko: "하위 목록" }),
      ask: l.trans({
        en: "What can grow forever, like comments or logs, and needs its own model?",
        ko: "댓글이나 로그처럼 끝없이 늘어나서 따로 모델이 필요한 데이터는 무엇인가요?",
      }),
      lands: "Comment",
    },
  ];

  const sizeRows: IntroItem[] = [
    {
      name: <span className="font-sans">{l.trans({ en: "One to few", ko: "몇 개 (one to few)" })}</span>,
      desc: l.trans({
        en: "Embed a scalar array in the document, as for a user's few links or a post's small settings.",
        ko: "사용자의 링크 몇 개나 게시글의 작은 설정값처럼, scalar 배열로 document 안에 넣습니다.",
      }),
      example: "links: field([ExternalLink])",
    },
    {
      name: <span className="font-sans">{l.trans({ en: "One to many", ko: "여러 개 (one to many)" })}</span>,
      desc: l.trans({
        en: "Keep an array of relations, which stores only ids, as for selected files or assigned users.",
        ko: "선택한 파일이나 담당자 목록처럼, id만 저장하는 relation 배열로 둡니다.",
      }),
      example: "files: field([File])",
    },
    {
      name: <span className="font-sans">{l.trans({ en: "One to squillions", ko: "끝없이 (one to squillions)" })}</span>,
      desc: l.trans({
        en: "Make a child model that points back at its parent, as for comments, logs, events or telemetry.",
        ko: "댓글, 로그, 이벤트, 장비 상태 기록처럼, 부모를 가리키는 child 모델을 따로 만듭니다.",
      }),
      example: 'post: field(ID, { ref: "post" })',
    },
  ];

  const snapshotColumns = [
    { key: "reference", label: l.trans({ en: "Reference", ko: "참조" }), caption: "field(LightUser)" },
    { key: "copy", label: l.trans({ en: "Copy", ko: "복사" }), caption: "field(AuthorCard)" },
  ];
  const both = { reference: true, copy: true };
  const referenceOnly = { reference: true, copy: false };
  const copyOnly = { reference: false, copy: true };
  const snapshotGroups: MatrixGroup[] = [
    {
      label: l.trans({ en: "When the list is read", ko: "목록을 읽을 때" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Same response", ko: "같은 응답에 담김" })}</span>,
          desc: l.trans({
            en: "Either way, the list page sends no second request.",
            ko: "어느 쪽이든 목록 화면이 요청을 한 번 더 보내지 않습니다.",
          }),
          marks: both,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Always current", ko: "항상 최신" })}</span>,
          desc: l.trans({
            en: "The server looks the user up each time it builds a response.",
            ko: "서버가 응답을 만들 때마다 사용자를 새로 찾아 옵니다.",
          }),
          marks: referenceOnly,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "No lookup on read", ko: "읽을 때 조회 없음" })}</span>,
          desc: l.trans({
            en: "The copied values are read exactly as stored.",
            ko: "복사해 둔 값을 저장된 그대로 읽습니다.",
          }),
          marks: copyOnly,
        },
      ],
    },
    {
      label: l.trans({ en: "When the post is written", ko: "게시글을 저장할 때" }),
      rows: [
        {
          name: <span className="font-sans">{l.trans({ en: "Stores only the id", ko: "id만 저장" })}</span>,
          desc: l.trans({
            en: "The post keeps the user's id and nothing else about them.",
            ko: "게시글에는 사용자 id만 남습니다.",
          }),
          marks: referenceOnly,
        },
        {
          name: <span className="font-sans">{l.trans({ en: "Updated by your code", ko: "갱신은 직접" })}</span>,
          desc: l.trans({
            en: "A copy changes only when your code writes it again.",
            ko: "복사본은 코드가 다시 써 줄 때만 바뀝니다.",
          }),
          marks: copyOnly,
        },
      ],
    },
  ];

  const layerRows: IntroItem[] = [
    {
      name: "<Model>Input",
      desc: l.trans({
        en: "Fields a user can submit through a form.",
        ko: "사용자가 폼으로 입력할 수 있는 필드입니다.",
      }),
    },
    {
      name: "<Model>Object",
      desc: l.trans({
        en: "`<Model>Input` plus fields the server manages, such as a status or a counter.",
        ko: "`<Model>Input`에 status나 카운터처럼 서버가 관리하는 필드를 더한 것입니다.",
      }),
    },
    {
      name: "Light<Model>",
      desc: l.trans({
        en: "The small shape for list rows and relations, which also holds display methods like `isNew()`.",
        ko: "목록 행과 relation에 쓰는 작은 모양으로, `isNew()` 같은 표시용 메서드도 여기에 둡니다.",
      }),
    },
    {
      name: "<Model>",
      desc: l.trans({
        en: "The full document: everything in `<Model>Object` and `Light<Model>`.",
        ko: "`<Model>Object`와 `Light<Model>`을 모두 합친 전체 document입니다.",
      }),
    },
    {
      name: "<Model>Insight",
      desc: l.trans({
        en: "Summary numbers for dashboards, always including `count`.",
        ko: "대시보드에 쓰는 요약 숫자로, `count`가 항상 들어 있습니다.",
      }),
    },
  ];

  const readNextItems: LinkGridItem[] = [
    {
      href: "/conventions/module/constant",
      title: "model.constant.ts",
      desc: l.trans({
        en: "Every field type, option and rule of the constant file.",
        ko: "constant 파일의 필드 타입, 옵션, 규칙을 모두 다룹니다.",
      }),
    },
    {
      href: "/conventions/module/constant#cascade-fields",
      title: l.trans({ en: "Cascade Remove", ko: "cascade 삭제" }),
      desc: l.trans({
        en: "Which side of a relation is removed along with the other.",
        ko: "relation의 어느 쪽이 다른 쪽과 함께 삭제되는지 정합니다.",
      }),
    },
    {
      href: "/docs/tutorials/scalar",
      title: l.trans({ en: "Scalar Tutorial", ko: "스칼라 튜토리얼" }),
      desc: l.trans({
        en: "Build a scalar and embed it in a model, step by step.",
        ko: "scalar를 만들어 모델에 넣는 과정을 단계별로 따라갑니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Schema Design", ko: "스키마 설계" })}>
        <Docs.Title>{l.trans({ en: "Schema Design", ko: "스키마 설계" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  In Akan, <code>{"<model>.constant.ts"}</code> describes the shape of your data. The easiest way to
                  design it is to start from the page or API that reads the data.
                </span>
              ),
              ko: (
                <span>
                  Akan에서는 <code>{"<model>.constant.ts"}</code>가 데이터의 모양을 정합니다. 가장 쉬운 설계 방법은 그
                  데이터를 읽을 화면이나 API에서 출발하는 것입니다.
                </span>
              ),
            })}
          </div>
          <div className="mt-2">
            {l.trans({
              en: "One simple rule settles most cases:",
              ko: "대부분은 간단한 규칙 하나로 정해집니다:",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Keep It Together", ko: "한 document에 함께 두기" })}
              </div>
              <div className="mt-1 text-foreground/70 text-sm">
                {l.trans({
                  en: "Small data that is read together stays inside one document.",
                  ko: "작고 늘 함께 읽는 데이터는 document 하나 안에 둡니다.",
                })}
              </div>
              <code className={chip}>links: field([ExternalLink])</code>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">
                {l.trans({ en: "Split It Out", ko: "별도 모델로 나누기" })}
              </div>
              <div className="mt-1 text-foreground/70 text-sm">
                {l.trans({
                  en: "Data that keeps growing moves to a model of its own.",
                  ko: "계속 늘어나는 데이터는 따로 모델을 만들어 옮깁니다.",
                })}
              </div>
              <code className={chip}>{'post: field(ID, { ref: "post" })'}</code>
            </div>
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="query-first" title={l.trans({ en: "Start From The Screen", ko: "화면에서 시작하기" })}>
        <Docs.Title>{l.trans({ en: "Start From The Screen", ko: "화면에서 시작하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Before adding fields, picture the list page, the detail page and the form. The schema should make those everyday reads easy.",
              ko: "필드를 추가하기 전에 목록 화면, 상세 화면, 입력 폼을 먼저 떠올려 보세요. 스키마는 자주 읽는 화면을 쉽게 만드는 모양이어야 합니다.",
            })}
          </div>
          <Docs.Table columns={screenColumns} rows={screenRows} stacked />
          <div>
            {l.trans({
              en: (
                <span>
                  The list page's answer becomes the key list of <code>LightPost</code>:
                </span>
              ),
              ko: (
                <span>
                  목록 화면에 대한 답이 곧 <code>LightPost</code>의 key 목록이 됩니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/post/post.constant.ts"
            code={`export class LightPost extends via(
  PostObject,
  ["title", "author", "thumbnail", "status"] as const,
  (resolve) => ({}),
) {}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Every list row has this shape.</strong> A slice list holds <code>LightPost</code> rows, so
                    each key here rides along with every row.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>목록의 모든 행이 이 모양입니다.</strong> slice 목록은 <code>LightPost</code> 행을 담으므로,
                    여기 적은 key는 모든 행에 실려 갑니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The id and timestamps come free.</strong> <code>id</code>, <code>createdAt</code>,{" "}
                    <code>updatedAt</code> and <code>removedAt</code> are always included, so you do not list them.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>id와 시각 필드는 저절로 들어갑니다.</strong> <code>id</code>, <code>createdAt</code>,{" "}
                    <code>updatedAt</code>, <code>removedAt</code>는 항상 포함되므로 목록에 적지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The key list is type-checked.</strong> Only keys of <code>PostObject</code> are accepted,
                    and the array ends in <code>as const</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>key 목록은 타입 검사를 받습니다.</strong> <code>PostObject</code>에 있는 key만 쓸 수 있고,
                    배열 끝에 <code>as const</code>를 붙입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="relationship-size" title={l.trans({ en: "Relationship Size", ko: "관계 크기" })}>
        <Docs.Title>{l.trans({ en: "Relationship Size", ko: "관계 크기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When one thing has many children, first ask how many there will be. The answer picks the schema.",
              ko: "데이터 하나가 여러 하위 데이터를 가질 때는 먼저 몇 개까지 늘어날지 생각해 보세요. 그 개수에 따라 스키마가 달라집니다.",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "How many", ko: "개수" })}
            descLabel={l.trans({ en: "Store it as", ko: "저장 방법" })}
            items={sizeRows}
          />
          <div>
            {l.trans({
              en: "Comments can grow without limit, so they get a model of their own that points back at the post:",
              ko: "댓글은 끝없이 늘어날 수 있으므로, 게시글을 가리키는 별도 모델로 만듭니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/comment/comment.constant.ts"
            code={`import { ID } from "akanjs/base";
import { via } from "akanjs/constant";

export class CommentInput extends via((field) => ({
  post: field(ID, { ref: "post", cascade: "removeWith" }),
  content: field(String),
})) {}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The child points at the parent.</strong> The post keeps no comment array, so it stays the
                    same size however many comments arrive.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>자식이 부모를 가리킵니다.</strong> 게시글에는 댓글 배열이 없으므로, 댓글이 아무리 늘어도
                    게시글의 크기는 그대로입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>ref</code> names the parent model.
                    </strong>{" "}
                    <code>{'ref: "post"'}</code> says which model the stored id belongs to.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>ref</code>는 부모 모델의 이름입니다.
                    </strong>{" "}
                    <code>{'ref: "post"'}</code>는 저장된 id가 어느 모델의 것인지 알려 줍니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>{'cascade: "removeWith"'}</code> removes the comments with their post.
                    </strong>{" "}
                    Leave it off when comments must outlive the post.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>{'cascade: "removeWith"'}</code>를 달면 게시글을 삭제할 때 댓글도 함께 삭제됩니다.
                    </strong>{" "}
                    댓글이 게시글보다 오래 남아야 한다면 빼세요.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Never let an array inside a document grow without limit.</strong> Every field is stored in the
                  document itself, so each read of that row carries the whole array.
                </span>
              ),
              ko: (
                <span>
                  <strong>document 안의 배열이 끝없이 커지게 두지 마세요.</strong> 필드는 모두 document 자체에
                  저장되므로, 그 행을 읽을 때마다 배열 전체가 함께 실려 옵니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="denormalize" title={l.trans({ en: "Reference Or Copy", ko: "참조할까, 복사할까" })}>
        <Docs.Title>{l.trans({ en: "Reference Or Copy", ko: "참조할까, 복사할까" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A post list usually shows the author's name and picture next to each post. Both schemas below put them in the same response, so the list page needs no extra request.",
              ko: "게시글 목록에는 보통 글마다 작성자 이름과 사진이 함께 나옵니다. 아래 두 방법 모두 이 값을 같은 응답에 담아 주므로, 목록 화면에서 요청을 더 보낼 필요가 없습니다.",
            })}
          </div>
          <Docs.Matrix
            type={l.trans({ en: "What you get", ko: "특징" })}
            columns={snapshotColumns}
            groups={snapshotGroups}
            markLabel={l.trans({ en: "Yes", ko: "해당" })}
            emptyLabel={l.trans({ en: "No", ko: "해당 없음" })}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Good to copy:</strong> small values that rarely change, such as a name, a thumbnail or a
                    short status text.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>복사하기 좋은 값:</strong> 이름, 썸네일, 짧은 상태 문구처럼 작고 잘 바뀌지 않는 값입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Reference instead:</strong> values that change every second or must always be perfectly
                    fresh.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>참조가 나은 값:</strong> 매초 바뀌거나 항상 완벽하게 최신이어야 하는 값입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Declaring each one", ko: "각각 선언하는 법" })}</Docs.SubSubTitle>
          <div>
            {l.trans({
              en: (
                <span>
                  A reference is a field whose type is a model, such as <code>LightUser</code> or <code>File</code>:
                </span>
              ),
              ko: (
                <span>
                  참조는 타입이 <code>LightUser</code>나 <code>File</code> 같은 모델인 필드입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/post/post.constant.ts"
            code={`export class PostInput extends via((field) => ({
  title: field(String),
  thumbnail: field(File).optional(),
})) {}

export class PostObject extends via(PostInput, (field) => ({
  author: field(LightUser),
})) {}`}
          />
          <div>
            {l.trans({
              en: "A copy first needs a scalar that holds the snapshot:",
              ko: "복사하려면 먼저 스냅샷을 담을 scalar를 만듭니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/__scalar/authorCard/authorCard.constant.ts"
            code={`import { via } from "akanjs/constant";

export class AuthorCard extends via((field) => ({
  nickname: field(String),
  imageUrl: field(String).optional(),
})) {}`}
          />
          <div>
            {l.trans({
              en: "Then the post keeps a field of that type:",
              ko: "그다음 게시글에 그 타입의 필드를 둡니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/post/post.constant.ts"
            code={`export class PostObject extends via(PostInput, (field) => ({
  authorCard: field(AuthorCard),
})) {}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      The author goes on <code>PostObject</code>, not <code>PostInput</code>.
                    </strong>{" "}
                    The user uploads the thumbnail, but the server fills in the author from the signed-in user and never
                    trusts one the client sends.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      작성자는 <code>PostInput</code>이 아니라 <code>PostObject</code>에 둡니다.
                    </strong>{" "}
                    썸네일은 사용자가 올리지만, 작성자는 서버가 로그인한 사용자로 채우고 클라이언트가 보낸 값은 믿지
                    않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Point a reference at <code>{"Light<Model>"}</code>.
                    </strong>{" "}
                    <code>field(LightUser)</code> sends only the light fields, while <code>field(User)</code> sends the
                    full user.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      참조는 <code>{"Light<Model>"}</code>을 가리키게 합니다.
                    </strong>{" "}
                    <code>field(LightUser)</code>는 light 필드만 보내고, <code>field(User)</code>는 사용자 전체를
                    보냅니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Scaffold the scalar with <code>akan create-scalar authorCard</code>.
                    </strong>{" "}
                    It lands in <code>lib/__scalar/authorCard/</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      scalar는 <code>akan create-scalar authorCard</code>로 만듭니다.
                    </strong>{" "}
                    <code>lib/__scalar/authorCard/</code>에 생성됩니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="layers" title={l.trans({ en: "The Five Model Classes", ko: "모델을 이루는 클래스 다섯 개" })}>
        <Docs.Title>{l.trans({ en: "The Five Model Classes", ko: "모델을 이루는 클래스 다섯 개" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Every <code>{"<model>.constant.ts"}</code> declares five classes, always in this order. Each is a
                  different view of the same data.
                </span>
              ),
              ko: (
                <span>
                  모든 <code>{"<model>.constant.ts"}</code>는 클래스 다섯 개를 항상 이 순서로 선언합니다. 다섯 개 모두
                  같은 데이터를 쓰임에 따라 다른 모양으로 보여 줍니다.
                </span>
              ),
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Class", ko: "클래스" })} items={layerRows} />
          <div>
            {l.trans({
              en: (
                <span>
                  A complete <code>post.constant.ts</code> with all five:
                </span>
              ),
              ko: (
                <span>
                  다섯 개를 모두 갖춘 <code>post.constant.ts</code>입니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/post/post.constant.ts"
            code={`import { enumOf } from "akanjs/base";
import { via } from "akanjs/constant";

export class PostStatus extends enumOf("postStatus", [
  "draft",
  "published",
] as const) {}

export class PostInput extends via((field) => ({
  title: field(String),
})) {}

export class PostObject extends via(PostInput, (field) => ({
  status: field(PostStatus, { default: "draft" }),
})) {}

export class LightPost extends via(
  PostObject,
  ["title", "status"] as const,
  (resolve) => ({}),
) {}

export class Post extends via(PostObject, LightPost, (resolve) => ({})) {}

export class PostInsight extends via(Post, (field) => ({})) {}`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Write all five, even when one is empty.</strong> <code>PostInsight</code> stays{" "}
                    <code>{"(field) => ({})"}</code> until a dashboard needs a number.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>비어 있어도 다섯 개를 모두 씁니다.</strong> 대시보드에 숫자가 필요해질 때까지{" "}
                    <code>PostInsight</code>는 <code>{"(field) => ({})"}</code>로 둡니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Each class builds on the one before.</strong> <code>PostObject</code> extends{" "}
                    <code>PostInput</code>, <code>LightPost</code> picks from <code>PostObject</code>, and{" "}
                    <code>Post</code> joins both.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>각 클래스는 앞의 클래스를 바탕으로 합니다.</strong> <code>PostObject</code>는{" "}
                    <code>PostInput</code>을 넓히고, <code>LightPost</code>는 <code>PostObject</code>에서 고르고,{" "}
                    <code>Post</code>는 둘을 합칩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Enums sit above the classes.</strong> <code>enumOf</code> takes an <code>as const</code>{" "}
                    array, and a <code>default</code> names one of its values.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>enum은 클래스들보다 위에 둡니다.</strong> <code>enumOf</code>에는 <code>as const</code>{" "}
                    배열을 넘기고, <code>default</code>에는 그중 한 값을 적습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Design Checklist", ko: "설계 체크리스트" })}>
        <Docs.Title>{l.trans({ en: "Design Checklist", ko: "설계 체크리스트" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Run through these before you add a field.",
              ko: "필드를 추가하기 전에 아래 네 가지를 확인하세요.",
            })}
          </div>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Design for the everyday read.</strong> A perfect database diagram matters less than the
                    pages people open every day.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>매일 읽는 흐름에 맞춥니다.</strong> 완벽한 DB 다이어그램보다 사람들이 매일 여는 화면이 더
                    중요합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Give an endless array its own model.</strong> Comments, logs and events belong in a child
                    model, not in an array field.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>끝없이 커지는 배열은 모델로 분리합니다.</strong> 댓글, 로그, 이벤트는 배열 필드가 아니라
                    child 모델에 둡니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Keep <code>{"Light<Model>"}</code> small.
                    </strong>{" "}
                    It should feel like a list row, not the full detail page.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>{"Light<Model>"}</code>은 작게 유지합니다.
                    </strong>{" "}
                    상세 페이지가 아니라 목록의 한 행처럼 느껴져야 합니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Reference by default, copy on purpose.</strong> Copy only small values that rarely change.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>기본은 참조, 복사는 이유가 있을 때만.</strong> 작고 잘 바뀌지 않는 값만 복사하세요.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.SubSubTitle>{l.trans({ en: "Read next", ko: "이어서 읽기" })}</Docs.SubSubTitle>
          <Docs.LinkGrid items={readNextItems} />
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
