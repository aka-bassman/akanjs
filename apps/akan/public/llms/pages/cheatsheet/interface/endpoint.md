# Endpoint

- Source: /cheatsheet/interface/endpoint
- Mirror: /llms/pages/cheatsheet/interface/endpoint.md
- Section: cheatsheet
- Category: Interface
- Priority: P2

## Headings

- Endpoint Actions (#overview)
- The Flow (#flow)
- Declare Endpoint (#endpoint)
- Put Rules In Service (#service)
- Call It From Store (#store)
- Make One Util (#util)
- Tips (#tips)

## Content

Endpoint

Endpoint Actions

CRUD handles the common actions. Endpoint is for one clear business action, such as publish, approve, reject, archive, or send notification.

A good rule is: one button action, one store action, one endpoint, one service method.

The Flow

User clicks a button in a Util component.

The button calls a store action.

The store action calls the generated fetch endpoint.

The endpoint delegates real work to the service.

Button to service

Declare Endpoint

Keep the endpoint thin. It receives parameters, names its guards, and calls the service method.

Put Rules In Service

The service is where you write business rules. For example, a post can be published only when it has a title and content.

The key only exists once the module dictionary registers it as an [en, ko] pair:

Call It From Store

Store actions make the UI code short. They can call fetch, show a message, close a modal, or refresh data after the endpoint succeeds.

Store action

Make One Util

Put the button in `Post.Util.tsx`. Then every card, detail page, or admin page can reuse the same action.

Tips

Use endpoint names as verbs: `publishPost`, `approveTicket`, `archiveProject`.

Do not put business rules in the button. Put them in the service.

If the same action appears twice, make a Util component before copying the button.

## Code Examples

### Code

```ts
Post.Util.PublishButton
  -> st.do.publishPost(postId)
  -> fetch.publishPost(postId)
  -> postService.publishPost(postId)
```

### apps/myapp/lib/post/post.signal.ts

```ts
import { Owner } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";
import * as cnst from "../cnst";
import * as srv from "../srv";

export class PostEndpoint extends endpoint(srv.post, ({ mutation }) => ({
  publishPost: mutation(cnst.Post, { guards: [Owner] })
    .param("postId", ID)
    .exec(async function (postId) {
      return await this.postService.publishPost(postId);
    }),
})) {}
```

### apps/myapp/lib/post/post.service.ts

```ts
import { serve } from "akanjs/service";
import * as db from "../db";
import { Err } from "../dict";

export class PostService extends serve(db.post, () => ({})) {
  async publishPost(postId: string) {
    const post = await this.getPost(postId);
    if (!post.title || !post.content) throw new Err("post.error.notReady");
    return await post.set({ status: "published" }).save();
  }
}
```

### apps/myapp/lib/post/post.dictionary.ts

```ts
export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Post", "게시글"]).desc(["A post a member writes", "회원이 작성하는 게시글"]))
  // [!code collapse:5]
  .model<Post>((t) => ({}))
  .insight<PostInsight>((t) => ({}))
  .query<PostFilter>((fn) => ({}))
  .sort<PostFilter>((t) => ({}))
  .slice<PostSlice>((fn) => ({}))
  .endpoint<PostEndpoint>((fn) => ({
    publishPost: fn(["Publish Post", "게시글 발행"]).desc([
      "Publish a draft post so readers can see it",
      "초안 게시글을 발행해 독자에게 공개합니다",
    ]),
  }))
  .error({
    notReady: ["Post is not ready to publish", "게시글을 발행할 준비가 되지 않았습니다"],
  });
```

### Code

```ts
export class PostStore extends store(sig.post, () => ({})) {
  async publishPost(postId: string) {
    const post = await fetch.publishPost(postId);
    msg.success("post.publishSuccess");
    this.setPost(post);
  }
}
```

### apps/myapp/lib/post/Post.Util.tsx

```ts
"use client";
import { st, usePage } from "@apps/myapp/client";
import { buttonRecipe } from "akanjs/ui";

interface PublishProps {
  className?: string;
  postId: string;
}

export const Publish = ({ className, postId }: PublishProps) => {
  const { l } = usePage();
  return (
    <button className={buttonRecipe({ variant: "primary" }, className)} onClick={() => st.do.publishPost(postId)}>
      {l("post.signal.publishPost")}
    </button>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

