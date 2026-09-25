# Model.Unit.tsx

- Source: /conventions/module/unit
- Mirror: /llms/pages/conventions/module/unit.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- Model.Unit.tsx (#unit-overview)
- ModelProps And Light Models (#modelprops-light)
- Unit Variants (#unit-variants)
- Actions Inside Units (#actions-inside-units)
- Load.Units And Direct Rendering (#loadunits-direct-rendering)
- Practical Rules (#practical-rules)

## Content

Model.Unit.tsx

The slim version of a model: only the fields its constant picks for lists, plus display methods.

server component

A component without "use client". It becomes HTML on the server and ships no JavaScript.

A named list query such as `inProject`. Its name becomes the `<Suffix>` in generated names.

Putting data the server already loaded into the browser's store, so nothing is fetched twice.

What the Unit does itself

Light model fields

Title, status, dates: drawn as a card, a row or a tile.

Translation works on the server, so labels need no client code.

Navigation belongs to the Unit; the caller decides where it goes.

What it hands to another file

A thin action such as edit or remove is a Util that the Unit renders.

A form is a Template, never part of a list item.

A larger interaction: a Util starts it and a store action runs it.

The page loads the data and hands each record to the Unit as a prop.

required

The record to draw. The prop is named by the first type argument.

Extra classes from the caller. Merge them last with `cn`.

Where the Unit links to. Without it, `Layout.Unit` and `Link` render a plain `div`.

A click callback that a client parent can pass.

The slice the list belongs to, passed by `Data.ListContainer`.

Row actions (`edit`, `view`, `remove` or an element), passed by `Data.ListContainer`.

Which fields to show, passed by `Data.ListContainer`.

The normal card for lists and grids.

A compact row for dense lists. `Admin.Unit.Row` also carries its action buttons.

A short summary for feeds and list previews.

An image-first tile for image grids.

A small picture of the record, such as `User.Unit.Avatar`.

The page holds

Render with

What you get

`init` passed to a Zone

Loading, pagination, refresh and empty states, plus a hydrated store.

An awaited list

Plain server HTML in the first response. Common on server-rendered pages.

The un-awaited `<model>List<Suffix>`

The list renders behind its own boundary instead of holding the route.

The list `Load.Units` draws, as it is on screen now.

The first list the server sent, kept for reset and comparison.

When the server built that first list.

`false` once the list is hydrated, and `true` again while a refetch runs.

Insight returned with the slice, such as `count` or summary values.

Pagination state taken from the init object.

Whether more rows follow, and whether the list keeps rows appended by `loadMoreOf<Model><Suffix>()`.

The filter arguments the slice was loaded with.

The sort key the slice was loaded with.

Mistake, then the fix

Do this

A Util takes an id, so pass `articleId={article.id}`.

Move the handler into a Util and render that Util from the Unit.

Export `Card`. The namespace names the model: `<Article.Unit.Card />`.

A Light model has only the fields its constant picks. Add the field there, or draw it in a View.

A Unit never fetches. Load in the page and pass the record down as a prop.

A Unit file draws one record of a model: a card, a compact row, an avatar, a gallery tile, or a column helper for tables. Every list and relation that shows the model reuses these exports.

Open it when a list needs a new look, or a row should show another field. A Unit only draws; everything else has a file of its own:

What

Lives here

Not here

Words used on this page

Term

ModelProps And Light Models

A list renders a Unit many times, so it takes a Light model. The smallest complete Unit file:

What ModelProps gives you

Unit Variants

A compact row and an image tile from the same file:

Actions Inside Units

A Unit may show small actions such as remove, copy or a detail button. The Unit only places a small Util component; the Util owns the browser behaviour.

The Unit puts the button in a corner, next to the link rather than inside it:

The Util is the client component. It takes the id, not the model:

Load.Units And Direct Rendering

A list of Units reaches the screen in one of three ways. Pick by what the page holds:

Load.Units in a Zone

What Load.Units puts in the store

Store key

Direct rendering on the server

When the page already holds the list, map it straight into Units. Nothing hydrates, and the rows are in the first response:

Practical Rules

Six rules keep a Unit reusable:

Common mistakes

## Code Examples

### apps/koyo/lib/article/Article.Unit.tsx

```ts
import type { cnst } from "@apps/koyo/client";
import { cn, type ModelProps } from "akanjs/client";
import { Layout } from "akanjs/ui";

export const Card = ({ className, article, href }: ModelProps<"article", cnst.LightArticle>) => {
  return (
    <Layout.Unit className={cn("rounded-lg border", className)} href={href}>
      <div className="font-bold">{article.title}</div>
      <div className="text-foreground/70">{article.summary}</div>
    </Layout.Unit>
  );
};
```

### apps/koyo/lib/article/Article.Unit.tsx

```ts
import { Article, type cnst } from "@apps/koyo/client"; // [!code collapse:3]
import { cn, type ModelProps } from "akanjs/client";
import { Image, Link } from "akanjs/ui";

export const Mini = ({ className, article, href }: ModelProps<"article", cnst.LightArticle>) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href={href}>{article.title}</Link>
      <Article.Util.Remove articleId={article.id} />
    </div>
  );
};

export const Gallery = ({ className, article, href }: ModelProps<"article", cnst.LightArticle>) => {
  return (
    <Link
      href={href}
      className={cn("block overflow-hidden rounded-md border", className)}
    >
      <Image file={article.cover} className="aspect-video w-full object-cover" />
      <div className="p-2">{article.title}</div>
    </Link>
  );
};
```

### apps/koyo/lib/article/Article.Unit.tsx

```ts
export const Card = ({ className, article, href }: ModelProps<"article", cnst.LightArticle>) => {
  return (
    <div className={cn("relative", className)}>
      <Layout.Unit className="rounded-lg border" href={href}>
        <div className="font-bold">{article.title}</div>
      </Layout.Unit>
      <div className="absolute top-2 right-2">
        <Article.Util.Remove articleId={article.id} />
      </div>
    </div>
  );
};
```

### apps/koyo/lib/article/Article.Util.tsx

```ts
"use client";
import { fetch, usePage } from "@apps/koyo/client";
import { Model } from "akanjs/ui";

interface RemoveProps {
  articleId: string;
}
export const Remove = ({ articleId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={articleId} slice={fetch.slice.article}>
      {l("base.remove")}
    </Model.Remove>
  );
};
```

### apps/koyo/lib/article/Article.Zone.tsx

```ts
"use client"; // [!code collapse:4]
import { Article, type cnst, fetch, usePage } from "@apps/koyo/client";
import type { ClientInit } from "akanjs/fetch";
import { buttonRecipe, Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"article", cnst.LightArticle>;
  projectId: string;
}
export const Card = ({ className, init, projectId }: CardProps) => {
  const { l } = usePage();
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderEmpty={() => (
          <Model.NewWrapper
            slice={fetch.slice.articleInProject}
            partial={{ projectId }}
          >
            <button className={buttonRecipe({ variant: "secondary" })}>
              {l("base.new")}
            </button>
          </Model.NewWrapper>
        )}
        renderItem={(article) => (
          <Article.Unit.Card
            key={article.id}
            href={`/article/${article.id}`}
            article={article}
          />
        )}
      />
      <Model.EditModal slice={fetch.slice.articleInProject}>
        <Article.Template.General />
      </Model.EditModal>
    </>
  );
};
```

### apps/koyo/page/project/[projectId]/_index.tsx

```ts
import { Article, fetch } from "@apps/koyo/client"; // [!code collapse:3]
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("projectId", ID)
  .render(async ({ projectId }) => {
    const [{ articleListInProject }] = await Promise.all([
      fetch.initArticleInProject(projectId),
    ]);
    return (
      <div className="flex flex-col gap-2">
        {articleListInProject.map((article) => (
          <Article.Unit.Card
            key={article.id}
            href={`/article/${article.id}`}
            article={article}
          />
        ))}
      </div>
    );
  });
```

### apps/koyo/page/project/[projectId]/_index.tsx

```ts
import { Article, fetch } from "@apps/koyo/client"; // [!code collapse:4]
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Load, Loading } from "akanjs/ui";

export default page()
  .param("projectId", ID)
  .render(({ projectId }) => {
    const { articleListInProject } = fetch.initArticleInProject(projectId);
    return (
      <Load.Stream
        of={articleListInProject}
        fallback={<Loading.Skeleton active />}
      >
        {(articleList) => (
          <div className="flex flex-col gap-2">
            {articleList.map((article) => (
              <Article.Unit.Card
                key={article.id}
                href={`/article/${article.id}`}
                article={article}
              />
            ))}
          </div>
        )}
      </Load.Stream>
    );
  });
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

