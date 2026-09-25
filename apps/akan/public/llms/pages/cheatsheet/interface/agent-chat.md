# Agent Chat

- Source: /cheatsheet/interface/agent-chat
- Mirror: /llms/pages/cheatsheet/interface/agent-chat.md
- Section: cheatsheet
- Category: Interface
- Priority: P2

## Headings

- Where A Turn Runs (#one-turn)
- Mounting The Chat (#mount)
- Every Part Is A Slot (#slots)
- A Tool The User Answers (#card)
- Pointing At Data (#reference)
- The Queue And The Slash Menu (#queue)
- Keeping The Transcript (#transcript)

## Content

Agent Chat

turn

Everything the agent says and does between one user message and the next.

transcript

The conversation so far, kept in the browser tab and sent to the model every turn.

relay

The `runAgentTurn` endpoint, which passes the transcript to the LLM and never runs a tool.

tool

One action a component publishes with `st.tool`, usually the handler its button calls.

approval card

A card that holds a call until the user approves it.

slot

One part of the chat you can replace in `_overrides.tsx`.

reference

Data the user pointed at with `@`, carried inside their message.

A section wrapped in `Agent.Zone`, with a conversation of its own.

Which machine ran the refund?

The customer's browser tab, through the handler the Refund button calls.

Whose credential did it carry?

The signed-in user's own, exactly like a click on that page.

What kept it off someone else's order?

The guards every call passes, plus the approval card when the tool asks for one.

What did the server do?

`runAgentTurn` forwarded the transcript and tool descriptions and returned one answer.

What did the server keep?

Nothing: it holds no session and stores no transcript.

Opens an internal path through the same router `Link` uses.

Returns to the previous page in this session's history.

Reads the rendered screen as compact text.

Reads one store key the screen subscribed, masked by its model.

Scrolls one thing into view and flashes it, to show the user where it is.

Arguments Are Checked First

Before the card is parked, never while it renders. A bad argument reaches the model as a refusal it can fix; a throw in your component would take the chat panel down.

It Waits Outside The Tool Queue

A form in front of a person is not work. Holding the execution lock through it would freeze every other agent on the page behind one unanswered card.

Your own model name, the vocabulary your published tools already speak.

What this group of rows is called in the `@` menu, so pass it through `l()`.

The model class that masks the value before it leaves the browser.

Your query for the menu rows, whose `signal` aborts when the user keeps typing.

Loads the document, once, when the user picks a row.

Sends, parks the message during a turn, or picks the row when a menu is open.

Adds a new line.

Walks what was sent from the first or last line, or moves the selection in an open menu.

Completes the selected / command, or picks the selected @ row.

Hides an open menu; otherwise closes the panel.

Opens the chat and focuses the composer, unless `shortcut={false}`.

Writes a local note: shown in the transcript, never sent to the model.

Records a host-side failure, such as a command that threw, as an error in the transcript.

Resends only the last user message and keeps everything above it.

`sessionStorage`, which survives a refresh but dies with the tab, so no shared PC keeps it.

`localStorage`, for a conversation that should outlive the tab.

Your own storage key; the default is `akan.agent.<appName>`, plus the zone path in a zone.

Your own server, through three functions you write.

Every store

Restores into an untouched chat only

Mounted with the zone, it restores; mounted later, it only saves from then on.

Saves after every change

Debounced and one save at a time; a failed save is silent.

Web storage only

Keeps the newest 50 messages

Drops file bytes and reference values

A file keeps its name, type, url and ref; a reference keeps its pointer and a note to read it again.

Where A Turn Runs

Words used on this page

Term

One refund, traced

A customer on the order screen types “refund the last one”, and a moment later the order is refunded. These are the questions a security reviewer asks first:

Question

Answer

One turn, end to end

Screen

st.tool declarations · subscribed keys

the transcript lives in this tab

guarded by AgentRelayAccess

LLM provider

named in option.setLlm

The tool calls the model asked for

Approval card

confirm and guard

The tool runs in this browser

the handler the button calls

Change report

what moved on screen

Nothing is stored server-side

holds no session, runs no tool

Mounting The Chat

Props

Header text and the panel's accessible name.

App-wide guidance for the model, in English, which `Agent.Guide` adds route guidance to.

Opens the panel on first render while the panel owns its state.

Controlled open state, paired with `onOpenChange`; left off, the panel owns it.

Called on open and close; without it, a controlled panel draws no close button.

`false` draws no floating button, for a shell that already has its own entry point.

Replaces the empty-state line while the transcript is empty, where starter questions go.

Extra controls in the header bar, left of the built-in clear and close buttons.

`false` drops the header bar and `header` for an inline chat; `/new` still clears.

The composer's opening text, read once at mount and never sent, where a `?prompt=` value goes.

Renders in the page flow instead of floating, for a zone chat inside its own section.

⌘L on Apple platforms and Ctrl+L elsewhere; `false` gives the chord back to the browser.

Classes for the closed button only, where `className` reaches both surfaces.

Classes for the open panel only.

Which built-in tools this chat's agent gets: all, none, or exactly the ones listed.

Keeps the transcript across reloads, as the last section shows.

Five built-in tools

Tool

Every Part Is A Slot

Slot

Description and default export

Folding a turn with AgentSteps

Then bind it, with any other slots, in the route's manifest:

A Tool The User Answers

Some arguments are the user's to give: a delivery address, a phone number, a date someone has to look up. A model that fills them in has answered its own question, and prompting cannot reliably stop it.

Here the model asks the customer for an address, and the Deliver button stays off until one exists:

How a card differs from an exec

Pointing At Data

“Why was this one refunded?” can only be answered if the chat knows which one. The @ menu lets the user point at it, instead of typing an id or making the agent spend a turn searching.

A Whole Document

One Field On Screen

Called from the component that draws the field. It hands over the value it already holds, with no round trip.

Whole documents in the @ menu

Which documents a user may point at is the app's answer, not the framework's, so each source brings its own search:

One field with useAgentReference

In the composer

The Queue And The Slash Menu

A turn takes seconds, and a user who thinks of the next thing should not have to wait to type it. Enter during a turn parks the message and sends it the moment the turn ends.

Slash commands

The / menu lists these six commands and nothing else:

Command

Keys in the composer

Key

Session calls behind the menu

Call

Keeping The Transcript

Write

How it is kept

On your server: Agent.History

What each store keeps

Rule

Applies

Does not apply

Read next

In-Page Agent

The agent's surface: st.tool actions, readable keys, zones and LLM adaptors.

Agent UI Reference

Every prop of Agent.Chat, Agent.Zone, Agent.History and the rest.

## Code Examples

### apps/koyo/page/(shop)/_layout.tsx

```ts
import { usePage } from "@apps/koyo/client";
import { layout } from "akanjs/client";
import { Agent } from "akanjs/ui";

export default layout().render(({ children }) => {
  const { l } = usePage();
  return (
    <>
      {children}
      <Agent.Chat
        title={l("koyo.assistant")}
        instructions="This is a Korean-style yogurt ice cream shop. An order moves draft -> paid -> served."
        intro={<p className="py-6 text-center text-foreground/50 text-sm">{l("koyo.assistantIntro")}</p>}
        persist
      />
    </>
  );
});
```

### apps/koyo/ui/KoyoTurn.tsx

```ts
"use client";
import { usePage } from "@apps/koyo/client";
import { DefaultSteps, type StepsProps } from "akanjs/ui";

export const KoyoTurn = ({ messages, isRunning, progress, results }: StepsProps) => {
  const { l } = usePage();
  const answer = messages.at(-1);
  const steps = isRunning ? messages : messages.slice(0, -1);
  return (
    <div className="flex flex-col gap-1">
      <details open={isRunning}>
        <summary className="cursor-pointer text-foreground/50 text-xs">
          {isRunning ? l("koyo.turnWorking") : l("koyo.turnSteps", { count: steps.length })}
        </summary>
        <DefaultSteps isRunning={isRunning} messages={steps} progress={progress} results={results} />
      </details>
      {isRunning || !answer ? null : <DefaultSteps isRunning={false} messages={[answer]} results={results} />}
    </div>
  );
};
```

### apps/koyo/page/(shop)/_overrides.tsx

```ts
import { KoyoBubble, KoyoTurn } from "@apps/koyo/ui";
import { override } from "akanjs/ui";

export default override({ AgentBubble: KoyoBubble, AgentSteps: KoyoTurn });
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx

```ts
"use client";
import { IcecreamOrder, st, usePage } from "@apps/koyo/client";
import { ID } from "akanjs/base";
import { Button } from "akanjs/ui";

interface DeliveryProps {
  className?: string;
  icecreamOrderId: string;
}

export const Delivery = ({ className, icecreamOrderId }: DeliveryProps) => {
  const { l } = usePage();
  const address = st.use.deliveryAddress();
  st.tool("collectDeliveryAddress")
    .desc("Ask the customer for the address this order goes to. Never write an address the customer did not give.")
    .arg("icecreamOrderId", ID)
    .card(({ submit, cancel }, orderId) => (
      <IcecreamOrder.Template.Address
        icecreamOrderId={orderId}
        onCancel={() => cancel("the customer closed the address form")}
        onSubmit={submit}
      />
    ));
  const deliver = st.tool("deliverIcecreamOrder")
    .desc("Deliver this order to the address already on it.")
    .exec(() => st.do.deliverIcecreamOrder(icecreamOrderId));
  return (
    <div className={className}>
      <Button disabled={!address} onClick={deliver}>
        {l("icecreamOrder.deliverIcecreamOrder")}
      </Button>
    </div>
  );
};
```

### apps/koyo/ui/KoyoAgentChat.tsx

```ts
"use client";
import { cnst, fetch, usePage } from "@apps/koyo/client";
import { Agent } from "akanjs/ui";

export const KoyoAgentChat = () => {
  const { l } = usePage();
  return (
    <Agent.Chat
      persist
      reference={[
        {
          refName: "icecreamOrder",
          label: l("icecreamOrder.modelName"),
          type: cnst.IcecreamOrder,
          search: async (query, signal) => {
            const orders = await fetch.icecreamOrderListInMention(query, 0, 8, "relevance");
            if (signal.aborted) return [];
            return orders.map((order) => ({ refId: order.id, label: order.code, description: order.status }));
          },
          resolve: (refId) => fetch.icecreamOrder(refId),
        },
      ]}
    />
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Util.tsx

```ts
"use client";
import { usePage } from "@apps/koyo/client";
import { Button, useAgentReference } from "akanjs/ui";

interface ReferMemoProps {
  className?: string;
  icecreamOrderId: string;
  code: string;
  memo: string;
}

export const ReferMemo = ({ className, icecreamOrderId, code, memo }: ReferMemoProps) => {
  const { l } = usePage();
  const refer = useAgentReference();
  return (
    <Button
      className={className}
      onClick={() =>
        refer({
          refName: "icecreamOrder",
          refId: icecreamOrderId,
          label: code,
          path: "memo",
          type: String,
          value: memo,
        })
      }
      size="xs"
      variant="ghost"
    >
      {l("icecreamOrder.referMemo")}
    </Button>
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx

```ts
"use client";
import { fetch } from "@apps/koyo/client";
import { Agent } from "akanjs/ui";
import type { ReactNode } from "react";

interface DeskProps {
  className?: string;
  children: ReactNode;
}

export const Desk = ({ className, children }: DeskProps) => {
  return (
    <Agent.Zone className={className} id="orderDesk" instructions="Work the order desk." label="Order desk">
      <Agent.History
        clear={() => void fetch.clearIcecreamOrderChat()}
        load={async () => (await fetch.loadIcecreamOrderChat()).messages}
        save={(messages) => void fetch.saveIcecreamOrderChat(messages)}
      />
      {children}
      <Agent.Chat chrome={false} inline />
    </Agent.Zone>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

