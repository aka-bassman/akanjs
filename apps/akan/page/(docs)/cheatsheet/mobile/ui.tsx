import { usePage } from "@apps/akan/client";
import { Code, cardGridRecipe, Divider, Docs, DocsToc, panelRecipe } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const transitions = [
  {
    title: "stack",
    src: { en: "/csr/stack_en.mp4", ko: "/csr/stack_ko.mp4" },
    desc: {
      en: "Pushes a detail page over the current page. Use it for drill-down navigation such as detail, edit, or settings pages.",
      ko: "현재 페이지 위로 상세 페이지를 쌓습니다. 상세, 편집, 설정처럼 한 단계 깊게 들어가는 화면에 사용합니다.",
    },
  },
  {
    title: "bottomUp",
    src: { en: "/csr/bottomup_en.mp4", ko: "/csr/bottomup_ko.mp4" },
    desc: {
      en: "Opens a focused surface from the bottom, and drags back down to dismiss. Use it for compose, picker, camera, or modal-like flows.",
      ko: "하단에서 집중 화면을 열고, 아래로 끌어내리면 닫힙니다. 작성, 선택, 카메라, 모달형 흐름에 사용합니다.",
    },
  },
  {
    title: "fade",
    src: { en: "/csr/fade_en.mp4", ko: "/csr/fade_ko.mp4" },
    desc: {
      en: "Changes context without implying a deeper navigation stack.",
      ko: "더 깊은 계층으로 들어간다는 느낌 없이 맥락을 전환합니다.",
    },
  },
  {
    title: "scaleOut",
    src: { en: "/csr/scale_en.mp4", ko: "/csr/scale_ko.mp4" },
    desc: {
      en: "Uses a compact scale motion. This is the default Android-style transition for deeper routes.",
      ko: "작은 scale motion을 사용합니다. Android에서 깊은 경로에 기본으로 쓰는 전환입니다.",
    },
  },
];

const keyboardDemos = [
  {
    title: "Android",
    src: "/android_keyboard_sticky.mov",
    desc: {
      en: "The WebView keeps a stable frame while Akan applies the keyboard offset, so the composer stays attached to the keyboard instead of jumping above it.",
      ko: "WebView frame은 안정적으로 유지하고 Akan이 keyboard offset을 적용해, composer가 키보드 위로 과하게 튀지 않고 키보드에 붙어 이동합니다.",
    },
  },
  {
    title: "iOS",
    src: "/ios_keyboard_sticky.mov",
    desc: {
      en: "The BottomInset follows the native keyboard transition and the scroll content preserves its bottom distance from the composer.",
      ko: "BottomInset이 네이티브 키보드 전환을 따라가고, 스크롤 콘텐츠는 composer로부터의 하단 기준 거리를 보존합니다.",
    },
  },
];

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="page-transitions" title={l.trans({ en: "Page Transitions", ko: "페이지 전환" })}>
        <Docs.Title>{l.trans({ en: "Page Transitions", ko: "페이지 전환" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Your app runs inside a native shell and every screen change still lands like a web page swap. The reader cannot tell whether they went deeper or sideways, and the back button is the only way out.",
              ko: "네이티브 shell 안에서 돌아가는 앱인데, 화면이 바뀔 때마다 웹 페이지가 교체되듯 툭 바뀝니다. 사용자는 더 깊이 들어간 것인지 옆으로 간 것인지 알 수 없고, 빠져나오는 길은 뒤로 가기 버튼뿐입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A page opts into a native-feeling CSR transition with <code>.config({"{ transition }"})</code>. The
                  value also decides whether there is a drag to go with it — only <code>stack</code> and{" "}
                  <code>bottomUp</code> carry a real gesture.
                </span>
              ),
              ko: (
                <span>
                  페이지는 <code>.config({"{ transition }"})</code>로 네이티브 앱에 가까운 CSR 전환을 선택합니다. 이
                  값은 함께 붙는 드래그 동작도 정합니다. 실제 gesture가 달린 것은 <code>stack</code>과{" "}
                  <code>bottomUp</code> 둘뿐입니다.
                </span>
              ),
            })}
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {transitions.map((item) => (
              <div key={item.title} className="min-w-0">
                <div className="font-bold font-mono text-primary text-sm">{item.title}</div>
                <div className="mt-2 min-h-14 text-foreground/70 text-xs leading-5">{l.trans(item.desc)}</div>
                <video
                  src={l.trans(item.src)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="mt-4 aspect-9/16 max-h-[420px] w-full rounded-xl bg-foreground/5 object-contain shadow-foreground/10 shadow-lg"
                />
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/page/article/[articleId].tsx"
            code={`import { page } from "akanjs/client";

export default page()
  .config({ transition: "stack", gesture: true })
  .render(() => <ArticleDetail />);`}
          />
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="gesture-back" title={l.trans({ en: "The Back Gesture", ko: "뒤로 가기 Gesture" })}>
        <Docs.Title>{l.trans({ en: "The Back Gesture", ko: "뒤로 가기 Gesture" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Leave gesture to the platform default unless the page has a reason not to. iOS turns it on for a stack page below the root; Android and the web leave it off, matching what each platform's users already expect.",
              ko: "gesture는 페이지에 특별한 사정이 없으면 platform default에 맡기세요. iOS는 루트 아래의 stack 페이지에서 켜고, Android와 웹은 끕니다. 각 플랫폼 사용자가 이미 기대하는 동작에 맞춘 값입니다.",
            })}
          </div>
          <div className="my-4 space-y-3">
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">✍️</span>
                <strong className="text-primary">{l.trans({ en: "Written wins", ko: "직접 적으면 그게 우선" })}</strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: (
                    <span>
                      A <code>gesture</code> written anywhere in the layout chain is taken as-is. Left unwritten, a page
                      whose transition is <code>none</code> gets <code>false</code> — there is no animation for the drag
                      to scrub.
                    </span>
                  ),
                  ko: (
                    <span>
                      layout 체인 어디에든 <code>gesture</code>를 적었다면 그 값이 그대로 쓰입니다. 적지 않았고
                      transition이 <code>none</code>이면 <code>false</code>입니다. 드래그가 훑을 애니메이션 자체가 없기
                      때문입니다.
                    </span>
                  ),
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🎚️</span>
                <strong className="text-primary">
                  {l.trans({ en: "Intent before movement", ko: "움직이기 전에 의도부터" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A touch is pending until it travels 8px, then locks to gesture or scroll by which axis moved more. Nothing is dismissed and the keyboard is not hidden while the intent is still pending, so ordinary content scrolling costs nothing.",
                  ko: "터치는 8px을 움직이기 전까지 pending이고, 그다음 어느 축이 더 움직였는지로 gesture 또는 scroll에 고정됩니다. pending인 동안에는 아무것도 닫히지 않고 키보드도 내려가지 않으므로, 평범한 콘텐츠 스크롤은 아무 대가도 치르지 않습니다.",
                })}
              </div>
            </div>
            <div className={panelRecipe({ radius: "lg", padding: "sm" })}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-primary">🏁</span>
                <strong className="text-primary">
                  {l.trans({ en: "Distance or velocity", ko: "거리 또는 속도" })}
                </strong>
              </div>
              <div className="text-foreground/70 text-sm">
                {l.trans({
                  en: "A stack page goes back once the drag passes a third of the screen width, or when it is released fast enough — a flick counts even though it travelled less.",
                  ko: "stack 페이지는 드래그가 화면 너비의 3분의 1을 넘거나, 충분히 빠르게 놓이면 뒤로 갑니다. 적게 움직였어도 튕기듯 놓으면 인정됩니다.",
                })}
              </div>
            </div>
          </div>
          <Docs.Alert type="warning">
            {l.trans({
              en: (
                <span>
                  <code>gesture: true</code> on a <code>fade</code>, <code>scaleOut</code> or <code>none</code> page
                  does nothing. Those transitions bind no drag handler at all, so the flag is accepted, stored, and
                  never read.
                </span>
              ),
              ko: (
                <span>
                  <code>fade</code>, <code>scaleOut</code>, <code>none</code> 페이지에 <code>gesture: true</code>를
                  적어도 아무 일도 일어나지 않습니다. 이 전환들은 드래그 핸들러를 아예 붙이지 않으므로, 값은
                  받아들여지고 저장되지만 읽히지 않습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="frame-config" title={l.trans({ en: "The Frame Config", ko: "Frame Config" })}>
        <Docs.Title>{l.trans({ en: "The Frame Config", ko: "Frame Config" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "One .config() object covers the whole page frame, and a layout's config merges down into every route under it. An unknown key is not ignored — it throws at boot.",
              ko: ".config() 객체 하나가 페이지 frame 전체를 담당하고, layout의 config는 그 아래 모든 라우트로 병합됩니다. 모르는 키는 무시되지 않고 부팅 때 예외가 납니다.",
            })}
          </div>
          <Docs.OptionTable
            items={[
              {
                key: "transition",
                type: '"none" | "fade" | "bottomUp" | "stack" | "scaleOut"',
                default: "stack (iOS) · scaleOut (Android) · none (web, and at route depth ≤ 1)",
                desc: l.trans({
                  en: "The CSR animation played when this route is entered.",
                  ko: "이 라우트로 들어올 때 재생되는 CSR 애니메이션입니다.",
                }),
              },
              {
                key: "gesture",
                type: "boolean",
                default: "true (iOS, depth ≥ 2) · false",
                desc: l.trans({
                  en: "Edge-swipe back. Only stack and bottomUp bind a drag; on the other three it is stored and never read.",
                  ko: "edge-swipe 뒤로 가기입니다. 드래그를 붙이는 것은 stack과 bottomUp뿐이고, 나머지 셋에서는 저장만 되고 읽히지 않습니다.",
                }),
              },
              {
                key: "topInset",
                type: "number | boolean",
                default: "0",
                desc: l.trans({
                  en: "Top chrome reservation in px. true is the 48px default, false and absent are both 0.",
                  ko: "상단 chrome 예약 공간(px)입니다. true는 기본값 48px이고, false와 미지정은 둘 다 0입니다.",
                }),
              },
              {
                key: "bottomInset",
                type: "number | boolean",
                default: "0",
                desc: l.trans({
                  en: "Bottom chrome reservation in px, with the same 48px meaning for true.",
                  ko: "하단 chrome 예약 공간(px)이고, true의 의미는 똑같이 48px입니다.",
                }),
              },
              {
                key: "safeArea",
                type: 'boolean | "top" | "bottom" | { top?, bottom?, android? }',
                default: 'true (iOS) · { android: "auto" } (Android) · false (web)',
                desc: l.trans({
                  en: "Which device insets the page reserves. The android key picks how they are measured: auto takes the CSS insets only when non-zero, edge-to-edge takes the larger of device and CSS, none takes zero.",
                  ko: "페이지가 예약할 기기 inset입니다. android 키는 측정 방식을 고릅니다. auto는 CSS inset이 0이 아닐 때만, edge-to-edge는 기기값과 CSS 중 큰 쪽을, none은 0을 씁니다.",
                }),
              },
              {
                key: "cache",
                type: "boolean",
                default: "true at route depth ≤ 1, otherwise false",
                desc: l.trans({
                  en: "Keeps the page mounted in the cached layer after navigating away, so returning to it costs no re-render.",
                  ko: "다른 화면으로 나간 뒤에도 페이지를 캐시 레이어에 마운트된 채로 둡니다. 돌아올 때 다시 렌더링하지 않습니다.",
                }),
              },
            ]}
          />
          <div>
            {l.trans({
              en: "The resolved numbers are published as CSS custom properties on the frame, so a component can reserve the same space the page did without reading any of it in JavaScript:",
              ko: "계산된 값들은 frame에 CSS custom property로 게시됩니다. 컴포넌트는 JavaScript로 아무것도 읽지 않고 페이지와 같은 공간을 예약할 수 있습니다:",
            })}
          </div>
          <div className={cardGridRecipe({ cols: "three" })}>
            {[
              "--akan-top-safe-area",
              "--akan-bottom-safe-area",
              "--akan-top-inset",
              "--akan-bottom-inset",
              "--akan-page-padding-top",
              "--akan-page-padding-bottom",
            ].map((name) => (
              <div key={name} className={panelRecipe({ padding: "none" }, "px-4 py-3")}>
                <div className="font-mono text-primary text-sm">{name}</div>
              </div>
            ))}
          </div>
          <div>
            {l.trans({
              en: "The last two are the sums a page body actually wants: safe area plus inset, top and bottom.",
              ko: "마지막 둘이 페이지 본문이 실제로 필요로 하는 합계입니다. safe area에 inset을 더한 상단값과 하단값입니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="keyboard-inset" title={l.trans({ en: "The Keyboard Inset", ko: "키보드 Inset" })}>
        <Docs.Title>{l.trans({ en: "The Keyboard Inset", ko: "키보드 Inset" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  A chat input, a comment box, a live-support composer — anything pinned to the bottom has to move with
                  the software keyboard, and no platform reports that the same way. Wrap it in a{" "}
                  <code>Layout.BottomInset</code> marked <code>keyboardSticky</code> and Akan moves it into the keyboard
                  accessory layer for you.
                </span>
              ),
              ko: (
                <span>
                  채팅 입력창, 댓글 입력창, 라이브 상담 composer처럼 하단에 고정된 것은 소프트웨어 키보드를 따라
                  움직여야 하는데, 이를 알려주는 방식은 플랫폼마다 다릅니다. <code>keyboardSticky</code>를 붙인{" "}
                  <code>Layout.BottomInset</code>으로 감싸면 Akan이 keyboard accessory layer로 옮겨 줍니다.
                </span>
              ),
            })}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/page/chat/_index.tsx"
            code={`import { ChatMessage } from "@apps/myapp/client";
import { page } from "akanjs/client";
import { Layout } from "akanjs/ui";

export default page()
  .config({ topInset: true, bottomInset: 72, safeArea: true, transition: "stack" })
  .render(() => (
    <div>
      <div>{/* scrollable content */}</div>
      <Layout.BottomInset keyboardSticky contentAnchor="bottom">
        <ChatMessage.Zone.Composer />
      </Layout.BottomInset>
    </div>
  ));`}
          />
          <div>
            {l.trans({
              en: "Where the height comes from is not one thing, and which of the three answered decides how accurate the offset is:",
              ko: "높이를 어디서 얻는지는 한 가지가 아니며, 셋 중 무엇이 답했는지가 offset의 정확도를 좌우합니다:",
            })}
          </div>
          <Docs.IntroTable
            type={l.trans({ en: "Source", ko: "출처" })}
            items={[
              {
                name: "native",
                desc: l.trans({
                  en: "The Capacitor Keyboard plugin reported a height. The exact number, with the platform's own show and hide timing.",
                  ko: "Capacitor Keyboard 플러그인이 높이를 알려준 경우입니다. 정확한 값이고, 플랫폼 자신의 열림·닫힘 타이밍을 그대로 씁니다.",
                }),
              },
              {
                name: "visualViewport",
                desc: l.trans({
                  en: "Android shrank the visual viewport instead of reporting a keyboard. The height is derived from how much the viewport lost.",
                  ko: "Android가 키보드를 알려주는 대신 visual viewport를 줄인 경우입니다. 줄어든 만큼에서 높이를 계산합니다.",
                }),
              },
              {
                name: "fallback",
                desc: l.trans({
                  en: "Neither answered — mobile web without the plugin, most often. The layer still exists so the composer does not jump, but nothing measured it.",
                  ko: "둘 다 답하지 않은 경우입니다. 대개 플러그인 없는 모바일 웹입니다. composer가 튀지 않도록 레이어는 그대로 있지만, 실제로 잰 값은 없습니다.",
                }),
              },
            ]}
          />
          <div className={panelRecipe({ radius: "lg" }, "my-4")}>
            <div className="mb-2 font-semibold text-primary">
              {l.trans({ en: "The rest of the keyboard frame:", ko: "키보드 frame의 나머지 값:" })}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-foreground/70 text-sm">
              <li>
                {l.trans({
                  en: "sticky — this path registered at least one keyboardSticky slot. When it is false the whole keyboard layer is not rendered.",
                  ko: "sticky — 이 경로에 keyboardSticky 슬롯이 하나 이상 등록되어 있습니다. false면 키보드 레이어 자체가 렌더링되지 않습니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "frozen — a page transition is running. The offset is held at 0 so the accessory layer does not fight the transition.",
                  ko: "frozen — 페이지 전환이 진행 중입니다. accessory layer가 전환과 싸우지 않도록 offset을 0으로 붙잡아 둡니다.",
                })}
              </li>
              <li>
                {l.trans({
                  en: "visible — there is a height and nothing is frozen. This, not height alone, is what a component should branch on.",
                  ko: "visible — 높이가 있고 frozen이 아닙니다. 컴포넌트가 분기해야 하는 값은 height 단독이 아니라 이것입니다.",
                })}
              </li>
            </ul>
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="content-anchor" title={l.trans({ en: "Anchoring The Content", ko: "콘텐츠 고정하기" })}>
        <Docs.Title>{l.trans({ en: "Anchoring The Content", ko: "콘텐츠 고정하기" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  Moving the composer is half the job. The messages above it also have to stay where they were, and that
                  is <code>contentAnchor="bottom"</code>: it preserves the scroll container's distance from the bottom
                  while the content viewport resizes, which is how a messenger reflows.
                </span>
              ),
              ko: (
                <span>
                  composer를 옮기는 것은 절반입니다. 그 위의 메시지들도 있던 자리에 남아야 하고, 그 역할이{" "}
                  <code>contentAnchor="bottom"</code>입니다. content viewport가 리사이즈되는 동안 scroll container의
                  하단 기준 거리를 보존합니다. 메신저가 reflow되는 방식입니다.
                </span>
              ),
            })}
          </div>
          <div className={cardGridRecipe({ cols: "mdTwo" })}>
            {keyboardDemos.map((item) => (
              <div key={item.title} className={panelRecipe({ padding: "none" }, "overflow-hidden")}>
                <div className="border-border border-b px-4 py-3">
                  <div className="font-mono font-semibold text-primary text-sm">{item.title}</div>
                  <div className="mt-1 text-foreground/60 text-xs leading-5">{l.trans(item.desc)}</div>
                </div>
                <div className="bg-foreground/5 p-3">
                  <video
                    src={item.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="mx-auto aspect-9/16 max-h-[520px] w-full rounded-xl object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/lib/chatMessage/ChatMessage.Zone.tsx"
            code={`"use client";
import { st, usePage } from "@apps/myapp/client";
import { Field } from "akanjs/ui";

interface ComposerProps {
  className?: string;
}
export const Composer = ({ className }: ComposerProps) => {
  const { l } = usePage();
  const chatMessageForm = st.use.chatMessageForm();
  return (
    <Field.Text
      className={className}
      label={l("chatMessage.content")}
      value={chatMessageForm.content}
      onChange={st.do.setContentOnChatMessage}
    />
  );
};`}
          />
          <div className="space-y-1">
            {[
              {
                title: "keyboardSticky",
                desc: l.trans({
                  en: "Moves the BottomInset into the keyboard accessory layer so it follows the software keyboard.",
                  ko: "BottomInset을 keyboard accessory layer로 옮겨 소프트웨어 키보드를 따라 움직이게 합니다.",
                }),
              },
              {
                title: 'contentAnchor="bottom"',
                desc: l.trans({
                  en: "Preserves the scroll container's bottom distance while the content viewport resizes. bottom is the only value it takes.",
                  ko: "content viewport가 리사이즈되는 동안 scroll container의 하단 기준 거리를 보존합니다. 받는 값은 bottom 하나뿐입니다.",
                }),
              },
              {
                title: "Server component pages",
                desc: l.trans({
                  en: "Keep the page as a server component. If the app needs an initial scroll-to-bottom behavior, add a tiny client helper inside the page or Zone and target the Akan page content container.",
                  ko: "페이지는 server component로 유지하세요. 앱에서 진입 시 최초 scroll-to-bottom이 필요하면 page 또는 Zone 안에 작은 client helper를 넣고 Akan page content container를 대상으로 조작합니다.",
                }),
              },
            ].map(({ title, desc }) => (
              <div key={title} className={panelRecipe({ padding: "row" })}>
                <span className="font-mono font-semibold text-primary">{title}: </span>
                <span className="text-foreground/70 text-sm">{desc}</span>
              </div>
            ))}
          </div>
          <Code.Snippet
            className="w-full"
            title="apps/myapp/ui/Chat/ScrollToBottomOnMount.tsx"
            code={`"use client";

import { useLayoutEffect } from "react";

export const ScrollToBottomOnMount = () => {
  useLayoutEffect(() => {
    // Every mounted path route renders id="pageContent", so query the class of the one in this tree.
    const pageContent = document.querySelector(".akan-page-content");
    pageContent?.scrollTo({ top: pageContent.scrollHeight });
  }, []);

  return null;
};`}
          />
          <Docs.Alert type="info">
            {l.trans({
              en: (
                <span>
                  <code>contentAnchor</code> is intentionally a <code>BottomInset</code> option, not a{" "}
                  <code>.config()</code> option. General forms can keep the default keyboard behavior, while
                  messenger-style surfaces opt in locally.
                </span>
              ),
              ko: (
                <span>
                  <code>contentAnchor</code>는 <code>.config()</code>가 아니라 <code>BottomInset</code> 옵션입니다. 일반
                  form은 기본 키보드 동작을 유지하고, 메신저형 화면만 지역적으로 opt-in할 수 있습니다.
                </span>
              ),
            })}
          </Docs.Alert>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
