# UI & Keyboard

- Source: /cheatsheet/mobile/ui
- Mirror: /llms/pages/cheatsheet/mobile/ui.md
- Section: cheatsheet
- Category: Mobile
- Priority: P2

## Headings

- Page Transitions (#page-transitions)
- The Back Gesture (#gesture-back)
- The Frame Config (#frame-config)
- The Keyboard Inset (#keyboard-inset)
- Anchoring The Content (#content-anchor)

## Content

UI & Keyboard

Page Transitions

Your app runs inside a native shell and every screen change still lands like a web page swap. The reader cannot tell whether they went deeper or sideways, and the back button is the only way out.

The Back Gesture

Leave gesture to the platform default unless the page has a reason not to. iOS turns it on for a stack page below the root; Android and the web leave it off, matching what each platform's users already expect.

Written wins

Intent before movement

A touch is pending until it travels 8px, then locks to gesture or scroll by which axis moved more. Nothing is dismissed and the keyboard is not hidden while the intent is still pending, so ordinary content scrolling costs nothing.

Distance or velocity

A stack page goes back once the drag passes a third of the screen width, or when it is released fast enough — a flick counts even though it travelled less.

The Frame Config

One .config() object covers the whole page frame, and a layout's config merges down into every route under it. An unknown key is not ignored — it throws at boot.

The CSR animation played when this route is entered.

Edge-swipe back. Only stack and bottomUp bind a drag; on the other three it is stored and never read.

Top chrome reservation in px. true is the 48px default, false and absent are both 0.

Bottom chrome reservation in px, with the same 48px meaning for true.

Which device insets the page reserves. The android key picks how they are measured: auto takes the CSS insets only when non-zero, edge-to-edge takes the larger of device and CSS, none takes zero.

Keeps the page mounted in the cached layer after navigating away, so returning to it costs no re-render.

The resolved numbers are published as CSS custom properties on the frame, so a component can reserve the same space the page did without reading any of it in JavaScript:

The last two are the sums a page body actually wants: safe area plus inset, top and bottom.

The Keyboard Inset

Where the height comes from is not one thing, and which of the three answered decides how accurate the offset is:

Source

The Capacitor Keyboard plugin reported a height. The exact number, with the platform's own show and hide timing.

Android shrank the visual viewport instead of reporting a keyboard. The height is derived from how much the viewport lost.

Neither answered — mobile web without the plugin, most often. The layer still exists so the composer does not jump, but nothing measured it.

The rest of the keyboard frame:

sticky — this path registered at least one keyboardSticky slot. When it is false the whole keyboard layer is not rendered.

frozen — a page transition is running. The offset is held at 0 so the accessory layer does not fight the transition.

visible — there is a height and nothing is frozen. This, not height alone, is what a component should branch on.

Anchoring The Content

Moves the BottomInset into the keyboard accessory layer so it follows the software keyboard.

Preserves the scroll container's bottom distance while the content viewport resizes. bottom is the only value it takes.

Keep the page as a server component. If the app needs an initial scroll-to-bottom behavior, add a tiny client helper inside the page or Zone and target the Akan page content container.

## Code Examples

### apps/myapp/page/article/[articleId].tsx

```ts
import { page } from "akanjs/client";

export default page()
  .config({ transition: "stack", gesture: true })
  .render(() => <ArticleDetail />);
```

### apps/myapp/page/chat/_index.tsx

```ts
import { ChatMessage } from "@apps/myapp/client";
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
  ));
```

### apps/myapp/lib/chatMessage/ChatMessage.Zone.tsx

```ts
"use client";
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
};
```

### apps/myapp/ui/Chat/ScrollToBottomOnMount.tsx

```ts
"use client";

import { useLayoutEffect } from "react";

export const ScrollToBottomOnMount = () => {
  useLayoutEffect(() => {
    // Every mounted path route renders id="pageContent", so query the class of the one in this tree.
    const pageContent = document.querySelector(".akan-page-content");
    pageContent?.scrollTo({ top: pageContent.scrollHeight });
  }, []);

  return null;
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

