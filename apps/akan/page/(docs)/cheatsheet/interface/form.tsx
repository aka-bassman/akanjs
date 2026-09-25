import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, type IntroItem, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  const bulletList = "my-4 list-disc space-y-2 pl-5";
  const chip = "mt-2 block overflow-x-auto whitespace-nowrap rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs";

  const termRows: IntroItem[] = [
    {
      name: "Template",
      desc: l.trans({
        en: "The client component in `<Model>.Template.tsx` that draws the form's fields.",
        ko: "`<Model>.Template.tsx`에 있는 클라이언트 컴포넌트로, 폼의 필드를 그립니다.",
      }),
    },
    {
      name: "articleForm",
      desc: l.trans({
        en: "The store's copy of the record being written. `st.use.articleForm()` reads it.",
        ko: "store가 들고 있는, 작성 중인 레코드입니다. `st.use.articleForm()`으로 읽습니다.",
      }),
    },
    {
      name: <span className="font-sans">{l.trans({ en: "edit shell", ko: "편집 셸" })}</span>,
      desc: l.trans({
        en: "A wrapper such as `Load.Edit` or `Model.Edit` that fills, opens and saves the form.",
        ko: "`Load.Edit`, `Model.Edit`처럼 폼을 채우고, 열고, 저장하는 래퍼입니다.",
      }),
    },
    {
      name: "fetch.slice.<name>",
      desc: l.trans({
        en: "Tells a shell which model to save and which list a new record joins.",
        ko: "셸에게 어떤 모델을 저장하고 새 레코드를 어느 목록에 넣을지 알려 줍니다.",
      }),
    },
  ];

  const shellRows: IntroItem[] = [
    {
      name: "Load.Edit",
      desc: l.trans({
        en: "A page that creates or edits one record, such as `page/…/new.tsx` or `page/…/edit.tsx`.",
        ko: "레코드 하나를 만들거나 고치는 page입니다. `page/…/new.tsx`, `page/…/edit.tsx` 같은 곳에 둡니다.",
      }),
    },
    {
      name: "Model.Edit",
      desc: l.trans({
        en: "An edit button on a list row or a card that opens a modal. It goes in `Article.Util.tsx`.",
        ko: "목록 행이나 카드에 붙어 모달을 여는 편집 버튼입니다. `Article.Util.tsx`에 둡니다.",
      }),
    },
    {
      name: "Model.ViewEditModal",
      desc: l.trans({
        en: "A card click opens the detail, which then turns into the form. It goes in `Article.Zone.tsx`.",
        ko: "카드를 누르면 상세가 열리고, 그 자리에서 폼으로 바뀝니다. `Article.Zone.tsx`에 둡니다.",
      }),
    },
  ];

  const storeRows: IntroItem[] = [
    {
      name: "st.use.articleForm()",
      desc: l.trans({
        en: "The form state: defaults for a new record, the loaded record for an edit.",
        ko: "폼 상태입니다. 새 레코드면 기본값을, 수정이면 불러온 레코드를 담습니다.",
      }),
    },
    {
      name: "st.do.set<Field>OnArticle",
      desc: l.trans({
        en: "One setter per field, such as `setTitleOnArticle`. Hand it to `onChange` as is.",
        ko: "필드마다 하나씩 생기는 setter로, 예를 들면 `setTitleOnArticle`입니다. `onChange`에 그대로 넘깁니다.",
      }),
    },
    {
      name: "Field.*",
      desc: l.trans({
        en: "A label plus a control: `Field.Text`, `Field.TextArea`, `Field.ToggleSelect`, `Field.Date` and more.",
        ko: "라벨과 입력 컨트롤 한 쌍입니다. `Field.Text`, `Field.TextArea`, `Field.ToggleSelect`, `Field.Date` 등이 있습니다.",
      }),
    },
  ];

  const optionRows = [
    {
      key: "slice",
      type: "SliceMeta",
      desc: l.trans({
        en: "Required. `fetch.slice.<name>`: the model to save and the list a new record joins.",
        ko: "필수입니다. `fetch.slice.<name>`으로, 저장할 모델과 새 레코드가 들어갈 목록을 정합니다.",
      }),
    },
    {
      key: "edit",
      type: "Partial<Model> | ClientEdit",
      desc: l.trans({
        en: "Required. A seed object opens a new form; `fetch.edit<Model>` opens a saved record.",
        ko: "필수입니다. 시작 값 객체를 넘기면 새 폼이, `fetch.edit<Model>` 결과를 넘기면 저장된 레코드가 열립니다.",
      }),
    },
    {
      key: "type",
      type: '"modal" | "form" | "empty"',
      default: '"modal"',
      desc: l.trans({
        en: "`form` draws the form in place with a save button; `empty` draws the fields only.",
        ko: "`form`은 그 자리에 저장 버튼까지 그리고, `empty`는 필드만 그립니다.",
      }),
    },
    {
      key: "modal",
      type: "string",
      default: '"edit"',
      desc: l.trans({
        en: "The store's modal name that opens this form. Give a second form of the same model its own name.",
        ko: "이 폼을 여는 store의 모달 이름입니다. 같은 모델의 폼이 한 화면에 둘이면 하나에 다른 이름을 줍니다.",
      }),
    },
    {
      key: "onSubmit",
      type: "string",
      desc: l.trans({
        en: "After saving: a path, `back`, or `reset`. `[articleId]` in a path becomes the saved id.",
        ko: "저장한 뒤 할 일입니다. 경로, `back`, `reset` 중 하나이고, 경로의 `[articleId]`는 저장된 id로 바뀝니다.",
      }),
    },
    {
      key: "onCancel",
      type: "string",
      desc: l.trans({
        en: "When the modal closes: a path, `back`, or `reset`. `type=form` draws no cancel control.",
        ko: "모달을 닫을 때 할 일로, 경로, `back`, `reset` 중 하나입니다. `type=form`에는 취소 버튼이 없습니다.",
      }),
    },
    {
      key: "submitOption",
      type: "CreateOption",
      desc: l.trans({
        en: 'Store options for the save. `{ path: "self" }` also writes the saved record into `self`.',
        ko: '저장 액션에 넘기는 옵션입니다. `{ path: "self" }`를 주면 저장된 레코드를 `self`에도 씁니다.',
      }),
    },
    {
      key: "submitText",
      type: "string",
      desc: l.trans({
        en: "Save button label. Without it, the button reads Create or Update plus the model name.",
        ko: "저장 버튼 문구입니다. 없으면 모델 이름에 생성 또는 수정을 붙인 문구가 나옵니다.",
      }),
    },
    {
      key: "renderSubmit",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "`false` hides the save button, so you can call `st.do.submitArticle()` from your own.",
        ko: "`false`면 저장 버튼을 숨깁니다. 직접 만든 버튼에서 `st.do.submitArticle()`을 부르면 됩니다.",
      }),
    },
    {
      key: "checkSubmit",
      type: "boolean",
      default: "true",
      desc: l.trans({
        en: "Keeps save disabled until the form passes the model's input rules.",
        ko: "폼이 모델의 입력 규칙을 통과할 때까지 저장 버튼을 비활성으로 둡니다.",
      }),
    },
    {
      key: "loading",
      type: "ReactNode",
      default: "Loading.Skeleton",
      desc: l.trans({
        en: "Shown while an un-awaited `edit` promise is still pending.",
        ko: "await하지 않은 `edit` promise가 도착하기 전까지 보여 줍니다.",
      }),
    },
    {
      key: "draft",
      type: "boolean | string",
      default: "true",
      desc: l.trans({
        en: "Draft recovery. `false` turns it off; a string names the scope.",
        ko: "초안 복구입니다. `false`면 끄고, 문자열을 넘기면 그 이름을 범위로 씁니다.",
      }),
    },
    {
      key: "className",
      type: "string",
      desc: l.trans({
        en: "Wrapper classes. `modalClassName` and `submitClassName` style the modal and the save button.",
        ko: "래퍼의 class입니다. 모달 창은 `modalClassName`, 저장 버튼은 `submitClassName`으로 꾸밉니다.",
      }),
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Form From Schema", ko: "스키마로 폼 만들기" })}>
        <Docs.Title>{l.trans({ en: "Form From Schema", ko: "스키마로 폼 만들기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Once the model's schema is designed, a form is a thin layer over it. The shell around the form prepares the data, and the Template only draws the fields.",
              ko: "모델 스키마를 설계했다면 폼은 그 위에 얇게 얹는 UI입니다. 데이터는 폼을 감싼 셸이 준비하고, Template은 필드만 그립니다.",
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Words used on this page", ko: "이 페이지에서 쓰는 말" })}</Docs.SubSubTitle>
          <Docs.IntroTable type={l.trans({ en: "Term", ko: "용어" })} items={termRows} />
          <div>
            {l.trans({
              en: "Pick the shell by where the form opens:",
              ko: "셸은 폼이 열리는 곳을 보고 고릅니다:",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "Shell", ko: "셸" })} items={shellRows} />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>One Template serves all three.</strong> It reads <code>st.use.articleForm()</code> and never
                    checks whether it is creating or editing.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>Template 하나를 세 셸이 함께 씁니다.</strong> <code>st.use.articleForm()</code>만 읽고,
                    생성인지 수정인지는 따지지 않습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>The shell decides the rest:</strong> what fills the form first, where saving leads, and
                    whether it is a page or a modal.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>나머지는 셸이 정합니다.</strong> 폼을 무엇으로 채워 열지, 저장한 뒤 어디로 갈지, page로
                    그릴지 모달로 띄울지가 셸의 몫입니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="template" title={l.trans({ en: "Keep The Template Simple", ko: "Template은 필드만 그리기" })}>
        <Docs.Title>{l.trans({ en: "Keep The Template Simple", ko: "Template은 필드만 그리기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "A Template does not decide where the form came from. It reads the current form state and connects each field to its store setter.",
              ko: "Template은 폼이 어디서 왔는지 판단하지 않습니다. 지금의 폼 상태를 읽고, 필드마다 store setter를 연결할 뿐입니다.",
            })}
          </div>
          <Docs.IntroTable type={l.trans({ en: "What it uses", ko: "Template이 쓰는 것" })} items={storeRows} />
          <div>
            {l.trans({
              en: "A Template for an article with a title, a body and a status:",
              ko: "제목, 본문, 상태가 있는 article의 Template입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/article/Article.Template.tsx"
            code={`"use client";
import { cnst, st, usePage } from "@apps/koyo/client";
import { Field, Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}
export const General = ({ className }: GeneralProps) => {
  const articleForm = st.use.articleForm();
  const { l } = usePage();

  return (
    <Layout.Template className={className}>
      <Field.Text
        label={l("article.title")}
        value={articleForm.title}
        onChange={st.do.setTitleOnArticle}
      />
      <Field.TextArea
        label={l("article.content")}
        value={articleForm.content}
        onChange={st.do.setContentOnArticle}
      />
      <Field.ToggleSelect
        label={l("article.status")}
        value={articleForm.status}
        items={cnst.ArticleStatus}
        onChange={st.do.setStatusOnArticle}
      />
    </Layout.Template>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>{'"use client"'}</code> on line 1, and no <code>useState</code>.
                    </strong>{" "}
                    Every value lives in <code>articleForm</code>, which is what lets create, edit and the modal share
                    this file.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      첫 줄은 <code>{'"use client"'}</code>이고, <code>useState</code>는 쓰지 않습니다.
                    </strong>{" "}
                    값이 모두 <code>articleForm</code>에 있어야 생성, 수정, 모달이 이 파일 하나를 함께 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>An enum goes straight into </strong>
                    <code>items</code>. <code>Field.ToggleSelect</code> labels each value from the dictionary.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>enum은 </strong>
                    <code>items</code>
                    <strong>에 그대로 넘깁니다.</strong> <code>Field.ToggleSelect</code>가 값마다 사전의 번역을 라벨로
                    붙입니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Normalize the input with </strong>
                    <code>transform</code>, such as <code>{"transform={(v) => v.toLowerCase()}"}</code> on{" "}
                    <code>Field.Text</code>. The setter itself still goes to <code>onChange</code> untouched.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>입력값 변환은 </strong>
                    <code>transform</code>
                    <strong>으로 합니다.</strong> <code>Field.Text</code>에{" "}
                    <code>{"transform={(v) => v.toLowerCase()}"}</code>처럼 주면, setter는 감싸지 않은 채{" "}
                    <code>onChange</code>에 그대로 넘길 수 있습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <strong>Pass the setter itself, never an arrow around it.</strong>{" "}
                  <code>{"onChange={(v) => st.do.setTitleOnArticle(v)}"}</code> behaves the same but fails lint, and the
                  field no longer publishes its agent tool or <code>data-akan-action</code>.
                </span>
              ),
              ko: (
                <span>
                  <strong>setter는 화살표 함수로 감싸지 말고 그대로 넘기세요.</strong>{" "}
                  <code>{"onChange={(v) => st.do.setTitleOnArticle(v)}"}</code>는 똑같이 동작하지만 lint에 걸리고,
                  필드가 에이전트 tool과 <code>data-akan-action</code>을 더 이상 내보내지 않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="create-page" title={l.trans({ en: "Create With SSR", ko: "SSR로 생성 폼 만들기" })}>
        <Docs.Title>{l.trans({ en: "Create With SSR", ko: "SSR로 생성 폼 만들기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  When the page already knows some values, put them in a seed object and hand it to{" "}
                  <code>Load.Edit</code>. Parent ids, the current org, a default status and values from the URL all
                  belong here.
                </span>
              ),
              ko: (
                <span>
                  page가 이미 아는 값은 시작 값 객체(seed)에 담아 <code>Load.Edit</code>에 넘깁니다. parent id, 현재
                  조직, 기본 상태, URL에서 온 값이 여기에 들어갑니다.
                </span>
              ),
            })}
          </div>
          <div>
            {l.trans({
              en: "A new-article page under a board, rendered on the server with the board already filled in:",
              ko: "게시판 아래의 새 article page입니다. 게시판 값이 채워진 채로 서버에서 렌더링됩니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/board/[boardId]/article/new.tsx"
            code={`import { Article, type cnst, fetch } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page()
  .param("boardId", ID)
  .render(({ boardId }) => {
    const articleForm: Partial<cnst.Article> = {
      board: boardId,
      status: "draft",
    };

    return (
      <Load.Edit
        slice={fetch.slice.articleInBoard}
        edit={articleForm}
        type="form"
        onSubmit={\`/board/\${boardId}\`}
      >
        <Article.Template.General />
      </Load.Edit>
    );
  });`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A seed opens a new form.</strong> Fields you leave out take the model's defaults, and the
                    user never has to pick a hidden value such as the parent id.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>seed를 넘기면 새 폼이 열립니다.</strong> 빠진 필드는 모델의 기본값을 쓰고, 사용자는 parent
                    id 같은 숨은 값을 고를 필요가 없습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>{'type="form"'}</code> draws the form in place
                    </strong>{" "}
                    with a save button under it. Leave it out and the form opens in a modal instead.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>{'type="form"'}</code>이면 그 자리에 폼을 그립니다.
                    </strong>{" "}
                    저장 버튼도 아래에 붙습니다. 빼면 기본값인 모달로 열립니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>onSubmit</code> is where to go after saving.
                    </strong>{" "}
                    <code>[articleId]</code> in the path becomes the new record's id, so{" "}
                    <code>{'"/article/[articleId]"'}</code> opens what was just created.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>onSubmit</code>은 저장한 뒤 이동할 곳입니다.
                    </strong>{" "}
                    경로의 <code>[articleId]</code>는 새 레코드의 id로 바뀌므로, <code>{'"/article/[articleId]"'}</code>
                    로 두면 방금 만든 글로 갑니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A value the page has to fetch</strong>, such as a parent's setting, is awaited in the page
                    and goes into the same seed.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>조회해야 아는 값</strong>(부모 레코드의 설정 등)은 page에서 await한 뒤 같은 seed에 넣습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="update-page" title={l.trans({ en: "Update Page", ko: "수정 페이지" })}>
        <Docs.Title>{l.trans({ en: "Update Page", ko: "수정 페이지" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  For a full edit page, fetch the record on the server and pass it to <code>Load.Edit</code>. The
                  Template is exactly the one the create page uses:
                </span>
              ),
              ko: (
                <span>
                  수정 전용 page라면 서버에서 레코드를 불러와 <code>Load.Edit</code>에 넘깁니다. Template은 생성 page와
                  똑같은 것을 씁니다:
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/page/article/[articleId]/edit.tsx"
            code={`import { Article, fetch } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load } from "akanjs/ui";

export default page()
  .param("articleId", ID)
  .render(({ articleId }) => {
    const { articleEdit } = fetch.editArticle(articleId);

    return (
      <Load.Edit
        slice={fetch.slice.articleInBoard}
        edit={articleEdit}
        type="form"
        onSubmit={\`/article/\${articleId}\`}
      >
        <Article.Template.General />
      </Load.Edit>
    );
  });`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>fetch.editArticle</code> fills the form with the saved record.
                    </strong>{" "}
                    The save button then reads Update instead of Create.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>fetch.editArticle</code>이 저장된 레코드로 폼을 채웁니다.
                    </strong>{" "}
                    저장 버튼 문구도 생성 대신 수정으로 바뀝니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      The <code>articleEdit</code> promise goes across un-awaited.
                    </strong>{" "}
                    The page is sent at once, and a skeleton (or your <code>loading</code>) holds the form's place until
                    the record lands.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>articleEdit</code> promise는 await하지 않고 넘깁니다.
                    </strong>{" "}
                    page는 바로 전송되고, 레코드가 도착할 때까지 스켈레톤(또는 넘긴 <code>loading</code>)이 폼 자리를
                    지킵니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Await when the page needs the record itself</strong>, for a heading or a URL:{" "}
                    <code>{"const { article, articleEdit } = await fetch.editArticle(articleId)"}</code>. The page then
                    waits for the record before it is sent.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>page가 레코드 자체를 써야 하면 await합니다.</strong> 제목이나 URL을 만들 때{" "}
                    <code>{"const { article, articleEdit } = await fetch.editArticle(articleId)"}</code>로 받습니다.
                    이때 page는 레코드가 도착한 뒤에야 전송됩니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="client-modal" title={l.trans({ en: "Edit In A Modal", ko: "모달에서 수정하기" })}>
        <Docs.Title>{l.trans({ en: "Edit In A Modal", ko: "모달에서 수정하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "When the user is already looking at a list or a card, editing in a modal is faster than moving to a new page. There are two shapes:",
              ko: "사용자가 이미 목록이나 카드를 보고 있다면, 새 page로 옮기기보다 모달에서 고치는 편이 빠릅니다. 모양은 두 가지입니다:",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" }, "my-4")}>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">Model.Edit</div>
              <div className="mt-1 text-foreground/70 text-sm">
                {l.trans({
                  en: "An Edit button that opens the form in a modal. Put it in a row, a dropdown or a card.",
                  ko: "누르면 폼을 모달로 여는 편집 버튼입니다. 목록 행, 드롭다운, 카드에 둡니다.",
                })}
              </div>
              <code className={chip}>{"<Model.Edit slice modelId renderTitle>"}</code>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" }, "min-w-0")}>
              <div className="font-semibold text-primary">Model.ViewEditModal</div>
              <div className="mt-1 text-foreground/70 text-sm">
                {l.trans({
                  en: "A card click opens the detail view, and its Edit button turns the same modal into the form.",
                  ko: "카드를 누르면 상세 보기가 열리고, 그 안의 편집 버튼이 같은 모달을 폼으로 바꿉니다.",
                })}
              </div>
              <code className={chip}>{"<Model.ViewEditModal slice renderView renderTemplate>"}</code>
            </div>
          </div>

          <Docs.SubSubTitle>
            {l.trans({ en: "Model.Edit — an edit button", ko: "Model.Edit — 편집 버튼" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "A Util that draws the button and the modal for one article:",
              ko: "article 하나의 편집 버튼과 모달을 그리는 Util입니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/article/Article.Util.tsx"
            code={`"use client";
import { Article, fetch } from "@apps/koyo/client";
import { Model } from "akanjs/ui";

interface EditProps {
  articleId: string;
}
export const Edit = ({ articleId }: EditProps) => {
  return (
    <Model.Edit
      renderTitle="title"
      slice={fetch.slice.articleInBoard}
      modelId={articleId}
    >
      <Article.Template.General />
    </Model.Edit>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>A click loads the record.</strong> It calls <code>st.do.editArticle(articleId)</code>, which
                    fetches the record into <code>articleForm</code> and opens the modal.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>누르면 레코드를 불러옵니다.</strong> <code>st.do.editArticle(articleId)</code>가 레코드를{" "}
                    <code>articleForm</code>에 채우고 모달을 엽니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Saving closes the modal</strong> and updates the record in every list already on screen.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>저장하면 모달이 닫히고</strong>, 화면에 떠 있는 모든 목록에서 그 레코드가 갱신됩니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>{'renderTitle="title"'}</code> titles the modal
                    </strong>{" "}
                    with the model name and the form's <code>title</code>. <code>trigger</code> replaces the default
                    Edit button.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>{'renderTitle="title"'}</code>은 모달 제목을 정합니다.
                    </strong>{" "}
                    모델 이름과 폼의 <code>title</code> 값을 씁니다. 기본 편집 버튼 대신 다른 요소를 쓰려면{" "}
                    <code>trigger</code>를 넘깁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Button and modal in different places?</strong> <code>Model.Edit</code> is{" "}
                    <code>Model.EditWrapper</code> (the trigger) plus <code>{"Model.EditModal id={articleId}"}</code>{" "}
                    (the modal), so use the two separately.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>버튼과 모달을 따로 둬야 하나요?</strong> <code>Model.Edit</code>은{" "}
                    <code>Model.EditWrapper</code>(트리거)와 <code>{"Model.EditModal id={articleId}"}</code>(모달)를
                    합친 것이므로, 둘을 나눠 쓰면 됩니다.
                  </span>
                ),
              })}
            </li>
          </ul>

          <Docs.SubSubTitle>
            {l.trans({ en: "Model.ViewEditModal — view, then edit", ko: "Model.ViewEditModal — 보고 나서 수정" })}
          </Docs.SubSubTitle>
          <div>
            {l.trans({
              en: "One modal beside the list serves every card in it:",
              ko: "목록 옆에 둔 모달 하나가 목록의 모든 카드를 맡습니다:",
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/koyo/lib/article/Article.Zone.tsx"
            code={`"use client"; // [!code collapse:4]
import { Article, type cnst, fetch } from "@apps/koyo/client";
import type { ClientInit } from "akanjs/fetch";
import { Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"article", cnst.LightArticle>;
}
export const Card = ({ className, init }: CardProps) => {
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderItem={(article) => (
          <Model.ViewWrapper
            key={article.id}
            slice={fetch.slice.articleInPublic}
            modelId={article.id}
          >
            <Article.Unit.Card article={article} />
          </Model.ViewWrapper>
        )}
      />
      <Model.ViewEditModal
        slice={fetch.slice.articleInPublic}
        renderView={(article) => <Article.View.General article={article} />}
        renderTemplate={() => <Article.Template.General />}
      />
    </>
  );
};`}
          />
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>Model.ViewWrapper</code> opens the view.
                    </strong>{" "}
                    A card click calls <code>st.do.viewArticle(id)</code>, and the modal draws <code>renderView</code>.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>Model.ViewWrapper</code>가 상세 보기를 엽니다.
                    </strong>{" "}
                    카드를 누르면 <code>st.do.viewArticle(id)</code>가 불리고, 모달이 <code>renderView</code>를
                    그립니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Edit swaps in <code>renderTemplate</code>, and Save returns to the view
                    </strong>{" "}
                    with the updated record. The ⋮ menu holds Remove, and <code>{"menu={false}"}</code> hides it.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      편집을 누르면 <code>renderTemplate</code>으로 바뀌고, 저장하면 상세 보기로 돌아옵니다.
                    </strong>{" "}
                    ⋮ 메뉴에는 삭제가 있고, <code>{"menu={false}"}</code>로 숨깁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      <code>renderTitle</code>, <code>editLabel</code> and <code>saveLabel</code>
                    </strong>{" "}
                    change the modal title and the two button labels.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      <code>renderTitle</code>, <code>editLabel</code>, <code>saveLabel</code>
                    </strong>
                    로 모달 제목과 두 버튼의 문구를 바꿉니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>It lives in a Zone, not a page.</strong> <code>renderView</code> and{" "}
                    <code>renderTemplate</code> are functions, and a server page cannot pass a function to a client
                    component.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>page가 아니라 Zone에 둡니다.</strong> <code>renderView</code>와 <code>renderTemplate</code>
                    은 함수인데, 서버 page는 클라이언트 컴포넌트에 함수를 넘길 수 없습니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Options And Tips", ko: "옵션과 꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Options And Tips", ko: "옵션과 꿀팁" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Load.Edit</code> hands these props on to <code>Model.EditModal</code>, which takes them too. On{" "}
                  <code>Model.EditModal</code>, <code>onSubmit</code> and <code>onCancel</code> may also be functions.
                </span>
              ),
              ko: (
                <span>
                  <code>Load.Edit</code>은 아래 props를 <code>Model.EditModal</code>에 그대로 넘기고,{" "}
                  <code>Model.EditModal</code>도 같은 props를 받습니다. <code>Model.EditModal</code>에서는{" "}
                  <code>onSubmit</code>, <code>onCancel</code>에 함수도 넘길 수 있습니다.
                </span>
              ),
            })}
          </div>
          <Docs.SubSubTitle>{l.trans({ en: "Load.Edit props", ko: "Load.Edit props" })}</Docs.SubSubTitle>
          <Docs.OptionTable items={optionRows} />

          <Docs.SubSubTitle>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.SubSubTitle>
          <ul className={bulletList}>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Reuse one Template</strong> for the create page, the update page and the edit modal.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>Template은 하나만 만들어</strong> 생성 page, 수정 page, 편집 모달에서 함께 씁니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Do not ask the user for hidden values</strong> such as a parent id. Prepare them on the
                    server and put them in the seed.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>parent id 같은 숨은 값은 사용자에게 고르게 하지 마세요.</strong> 서버에서 준비해 seed에
                    넣습니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>
                      Page moves go in <code>onSubmit</code>, store writes in <code>submitOption</code>.
                    </strong>{" "}
                    On a profile form, <code>{'submitOption={{ path: "self" }}'}</code> keeps <code>st.use.self()</code>{" "}
                    current after saving.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>
                      page 이동은 <code>onSubmit</code>, store 갱신은 <code>submitOption</code>으로 합니다.
                    </strong>{" "}
                    프로필 폼이라면 <code>{'submitOption={{ path: "self" }}'}</code>로 저장 뒤{" "}
                    <code>st.use.self()</code>도 최신으로 맞춥니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>When field logic grows, split it into small field groups</strong>, but keep the Template as
                    the form's owner.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>필드 로직이 커지면 작은 필드 묶음으로 나누되</strong>, 폼의 주인은 Template으로 둡니다.
                  </span>
                ),
              })}
            </li>
            <li>
              {l.trans({
                en: (
                  <span>
                    <strong>Never save form values yourself.</strong> The shell keeps a draft as the user types and
                    offers it back on the next open; <code>{"draft={false}"}</code> turns that off.
                  </span>
                ),
                ko: (
                  <span>
                    <strong>폼 값을 직접 저장하지 마세요.</strong> 셸이 입력하는 동안 초안을 보관했다가 다음에 열 때
                    되돌려 줍니다. 끄려면 <code>{"draft={false}"}</code>를 넘깁니다.
                  </span>
                ),
              })}
            </li>
          </ul>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
