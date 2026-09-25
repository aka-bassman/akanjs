# Form

- Source: /cheatsheet/interface/form
- Mirror: /llms/pages/cheatsheet/interface/form.md
- Section: cheatsheet
- Category: Interface
- Priority: P2

## Headings

- Form From Schema (#overview)
- Keep The Template Simple (#template)
- Create With SSR (#create-page)
- Update Page (#update-page)
- Edit In A Modal (#client-modal)
- Options And Tips (#tips)

## Content

Form

The client component in `<Model>.Template.tsx` that draws the form's fields.

The store's copy of the record being written. `st.use.articleForm()` reads it.

edit shell

A wrapper such as `Load.Edit` or `Model.Edit` that fills, opens and saves the form.

Tells a shell which model to save and which list a new record joins.

A page that creates or edits one record, such as `page/…/new.tsx` or `page/…/edit.tsx`.

An edit button on a list row or a card that opens a modal. It goes in `Article.Util.tsx`.

A card click opens the detail, which then turns into the form. It goes in `Article.Zone.tsx`.

The form state: defaults for a new record, the loaded record for an edit.

One setter per field, such as `setTitleOnArticle`. Hand it to `onChange` as is.

A label plus a control: `Field.Text`, `Field.TextArea`, `Field.ToggleSelect`, `Field.Date` and more.

Required. `fetch.slice.<name>`: the model to save and the list a new record joins.

Required. A seed object opens a new form; `fetch.edit<Model>` opens a saved record.

`form` draws the form in place with a save button; `empty` draws the fields only.

The store's modal name that opens this form. Give a second form of the same model its own name.

After saving: a path, `back`, or `reset`. `[articleId]` in a path becomes the saved id.

When the modal closes: a path, `back`, or `reset`. `type=form` draws no cancel control.

Store options for the save. `{ path: "self" }` also writes the saved record into `self`.

Save button label. Without it, the button reads Create or Update plus the model name.

`false` hides the save button, so you can call `st.do.submitArticle()` from your own.

Keeps save disabled until the form passes the model's input rules.

Shown while an un-awaited `edit` promise is still pending.

Draft recovery. `false` turns it off; a string names the scope.

Wrapper classes. `modalClassName` and `submitClassName` style the modal and the save button.

Form From Schema

Once the model's schema is designed, a form is a thin layer over it. The shell around the form prepares the data, and the Template only draws the fields.

Words used on this page

Term

Pick the shell by where the form opens:

Shell

Keep The Template Simple

A Template does not decide where the form came from. It reads the current form state and connects each field to its store setter.

What it uses

A Template for an article with a title, a body and a status:

Create With SSR

A new-article page under a board, rendered on the server with the board already filled in:

Update Page

Edit In A Modal

When the user is already looking at a list or a card, editing in a modal is faster than moving to a new page. There are two shapes:

An Edit button that opens the form in a modal. Put it in a row, a dropdown or a card.

A card click opens the detail view, and its Edit button turns the same modal into the form.

Model.Edit — an edit button

A Util that draws the button and the modal for one article:

Model.ViewEditModal — view, then edit

One modal beside the list serves every card in it:

Options And Tips

Load.Edit props

Tips

## Code Examples

### apps/koyo/lib/article/Article.Template.tsx

```ts
"use client";
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
};
```

### apps/koyo/page/board/[boardId]/article/new.tsx

```ts
import { Article, type cnst, fetch } from "@apps/koyo/client";
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
        onSubmit={`/board/${boardId}`}
      >
        <Article.Template.General />
      </Load.Edit>
    );
  });
```

### apps/koyo/page/article/[articleId]/edit.tsx

```ts
import { Article, fetch } from "@apps/koyo/client";
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
        onSubmit={`/article/${articleId}`}
      >
        <Article.Template.General />
      </Load.Edit>
    );
  });
```

### apps/koyo/lib/article/Article.Util.tsx

```ts
"use client";
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
};
```

### apps/koyo/lib/article/Article.Zone.tsx

```ts
"use client"; // [!code collapse:4]
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
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

