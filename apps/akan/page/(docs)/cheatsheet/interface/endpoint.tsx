import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Endpoint Actions", ko: "Endpoint action" })}>
        <Docs.Title>{l.trans({ en: "Endpoint Actions", ko: "Endpoint action" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "CRUD handles the common actions. Endpoint is for one clear business action, such as publish, approve, reject, archive, or send notification.",
              ko: "CRUD는 기본 동작을 처리합니다. Endpoint는 발행, 승인, 거절, 보관, 알림 발송처럼 분명한 업무 동작 하나를 만들 때 사용합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "A good rule is: one button action, one store action, one endpoint, one service method.",
              ko: "좋은 규칙은 이것입니다. 버튼 동작 하나, store action 하나, endpoint 하나, service method 하나로 맞추세요.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="flow" title={l.trans({ en: "The Flow", ko: "흐름 이해하기" })}>
        <Docs.Title>{l.trans({ en: "The Flow", ko: "흐름 이해하기" })}</Docs.Title>
        <Docs.Description>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              {l.trans({
                en: "User clicks a button in a Util component.",
                ko: "사용자가 Util component의 버튼을 클릭합니다.",
              })}
            </li>
            <li>{l.trans({ en: "The button calls a store action.", ko: "버튼은 store action을 호출합니다." })}</li>
            <li>
              {l.trans({
                en: "The store action calls the generated fetch endpoint.",
                ko: "Store action은 생성된 fetch endpoint를 호출합니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "The endpoint delegates real work to the service.",
                ko: "Endpoint는 실제 일을 service에 맡깁니다.",
              })}
            </li>
          </ol>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Button to service", ko: "버튼에서 service까지" })}
          code={`Post.Util.PublishButton
  -> st.do.publishPost(postId)
  -> fetch.publishPost(postId)
  -> postService.publishPost(postId)`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="endpoint" title={l.trans({ en: "Declare Endpoint", ko: "Endpoint 선언" })}>
        <Docs.Title>{l.trans({ en: "Declare Endpoint", ko: "Endpoint 선언" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Keep the endpoint thin. It receives parameters, names its guards, and calls the service method.",
              ko: "Endpoint는 얇게 유지하세요. 필요한 값을 받고, guard를 선언하고, service method를 호출하면 됩니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  Every custom mutation names its own <code>guards</code> array. A slice-level guard map never reaches a
                  custom endpoint, so one declared without guards is both unauthorized and silently refused from the MCP
                  catalogue.
                </span>
              ),
              ko: (
                <span>
                  모든 custom mutation은 자기 <code>guards</code> 배열을 직접 선언합니다. Slice의 guard map은 custom
                  endpoint까지 닿지 않기 때문에, guard 없이 선언한 endpoint는 인가가 비어 있을 뿐 아니라 MCP
                  카탈로그에서도 조용히 제외됩니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/post/post.signal.ts"
          code={`import { Owner } from "@libs/shared/srvkit";
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
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="service" title={l.trans({ en: "Put Rules In Service", ko: "규칙은 service에 두기" })}>
        <Docs.Title>{l.trans({ en: "Put Rules In Service", ko: "규칙은 service에 두기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "The service is where you write business rules. For example, a post can be published only when it has a title and content.",
              ko: "Service는 업무 규칙을 쓰는 곳입니다. 예를 들어 게시글은 제목과 내용이 있을 때만 발행할 수 있습니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A refusal is always <code>new Err("&lt;module&gt;.error.&lt;key&gt;")</code>. A raw{" "}
                  <code>throw new Error</code> breaks the build, and it also carries no key the dictionary could
                  translate for the reader.
                </span>
              ),
              ko: (
                <span>
                  거절은 항상 <code>new Err("&lt;module&gt;.error.&lt;key&gt;")</code>입니다.{" "}
                  <code>throw new Error</code>는 build를 깨뜨리고, dictionary가 번역할 key도 남기지 않습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/post/post.service.ts"
          code={`import { serve } from "akanjs/service";
import * as db from "../db";
import { Err } from "../dict";

export class PostService extends serve(db.post, () => ({})) {
  async publishPost(postId: string) {
    const post = await this.getPost(postId);
    if (!post.title || !post.content) throw new Err("post.error.notReady");
    return await post.set({ status: "published" }).save();
  }
}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The key only exists once the module dictionary registers it as an [en, ko] pair:",
              ko: "그 key는 module dictionary에 [en, ko] 쌍으로 등록해야 존재합니다:",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/post/post.dictionary.ts"
          code={`export const dictionary = modelDictionary(["en", "ko"])
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
  });`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="store" title={l.trans({ en: "Call It From Store", ko: "Store에서 호출하기" })}>
        <Docs.Title>{l.trans({ en: "Call It From Store", ko: "Store에서 호출하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Store actions make the UI code short. They can call fetch, show a message, close a modal, or refresh data after the endpoint succeeds.",
              ko: "Store action을 두면 UI 코드가 짧아집니다. Endpoint 성공 후 fetch 호출, 메시지 표시, modal 닫기, 데이터 갱신을 함께 처리할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Store action", ko: "Store action" })}
          code={`export class PostStore extends store(sig.post, () => ({})) {
  async publishPost(postId: string) {
    const post = await fetch.publishPost(postId);
    msg.success("post.publishSuccess");
    this.setPost(post);
  }
}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="util" title={l.trans({ en: "Make One Util", ko: "Util 하나로 만들기" })}>
        <Docs.Title>{l.trans({ en: "Make One Util", ko: "Util 하나로 만들기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Put the button in `Post.Util.tsx`. Then every card, detail page, or admin page can reuse the same action.",
              ko: "버튼은 `Post.Util.tsx`에 두세요. 그러면 카드, 상세 페이지, 관리자 페이지 어디서든 같은 action을 재사용할 수 있습니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/post/Post.Util.tsx"
          code={`"use client";
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
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Use endpoint names as verbs: `publishPost`, `approveTicket`, `archiveProject`.",
                ko: "Endpoint 이름은 `publishPost`, `approveTicket`, `archiveProject`처럼 동사로 시작하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Do not put business rules in the button. Put them in the service.",
                ko: "업무 규칙은 버튼에 두지 말고 service에 두세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "If the same action appears twice, make a Util component before copying the button.",
                ko: "같은 action이 두 번 보이면 버튼을 복사하기 전에 Util component로 만드세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
