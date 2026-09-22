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

Where A Turn Runs

You put a chat on the order screen, and a customer types “refund the last one”. A moment later the order is refunded. Now answer the question your security reviewer is going to ask first: which machine ran that refund, and what stopped the model from running it on somebody else's order?

The server ran nothing. runAgentTurn is a stateless relay: it forwards the transcript and the tool descriptions to the provider and hands back one answer. Every tool executes in the browser tab that asked, through the same handler the button beside it calls — so the call carries that user's own credential, passes the same guards any other call passes, and stops at the approval card in front of them.

One turn, end to end

Mounting The Chat

Mount it once, in the layout that wraps every screen the agent should reach. Conditional mounting is not a substitute for closing it — unmounting aborts the session and throws the conversation away — so an app that opens the chat from its own control passes the controlled pair instead.

Controlled open state. Pass it with onOpenChange to drive the panel from a header button or a menu item. Left off, the panel owns the state.

Left off while open is controlled, the panel cannot close itself — so it draws no close button rather than an inert one.

false draws no floating button, for an app whose shell already has an entry point.

Stands in for the empty-state line while the transcript is empty. Where starter questions go.

Extra controls in the header bar, left of the built-in clear and close buttons.

false draws no header bar at all — for an inline chat inside a panel the app already titles. The header prop goes with it, and clearing stays reachable as /new.

The composer's opening text, read once at mount — where a ?prompt= search value lands without being sent.

Renders in the page flow instead of floating above it — a zone chat that lives inside its own section.

Cmd+L on Apple platforms, Ctrl+L elsewhere. false gives the browser its own location-bar chord back.

One surface each, where className reaches both: launcherClassName is the closed button, panelClassName the open panel.

Which of the runtime's own tools this chat's agent gets. Withheld, not discouraged — a withheld name answers the same unknown-tool error a name that was never registered gets.

Keeps the transcript across reloads. See the last slide.

The five built-ins, and only five:

navigate and goBack drive the router. builtins={["readScreen", "readState", "highlight"]} is how a chat that must not leave the screen stops being able to.

readScreen, readState and highlight look and point. A tool the screen declared under one of these names is the screen's, not the runtime's, so withholding a built-in never withholds a tool a component published on purpose.

There is no general wait. One was built and removed: a tool reachable on every screen with no idea what any key means gets spent on whatever key looks promising, parking turns nobody asked to park. Declare a waiting tool beside the control that starts the work instead.

Every Part Is A Slot

A brand rarely wants the framework's bubble and always wants the framework's approval gate. So the chat is not one component to replace: twelve slots bind in a page/**/_overrides.tsx manifest and cascade down the route tree like layouts, and eleven of them export the default beside them so a replacement composes the one it is replacing.

Slot

AgentSteps is the one that is not a re-skin. A turn — everything the agent said and did between one user message and the next — is the grain a chat needs to fold its steps into a details and stand the final answer outside them, and it is the one boundary no per-message slot can see, because neither message on either side of it knows it is at an edge.

Two things the slot list is deliberate about:

only ever true of the last turn of a transcript the session is working on. Without it the same messages read the same whether the agent is mid-step or finished, and a scaffold cannot tell a live progress line from a completed turn's header.

The default adds nothing

DefaultSteps draws the same flat bubbles into a Fragment rather than a box, so it takes no className and no existing layout can tell the component is between the transcript and its bubbles.

A Tool The User Answers

Some arguments are not the model's to supply. A delivery address, a phone number, a date somebody has to look up — a model that fills those in has answered its own question, and no amount of prompting reliably stops it. So a tool chain has a second ending: .card() parks the call in the chat and renders the app's own form there.

Four things separate a card from an exec, and each of them is a decision rather than a detail:

What the form submits is the call's result — what the model reads back. cancel(reason) is the error it reads instead, so a dismissed card is something the agent can respond to rather than a silent empty answer.

Arguments are checked first

Before the card is parked, never while it renders. A bad argument has to reach the model as a refusal it can correct; a throw inside your component would take the chat panel down with it.

It waits outside the tool queue

A form parked in front of somebody is not work. Holding the execution lock across it would freeze every other agent on the page behind one unanswered card.

Not read for a card at all — the card in front of the user is already the asking. The frame draws its own dismiss even when your component does not, so a turn can never park on something the user cannot get out of.

The screen is still snapshotted around the wait, so a card that writes what it collected into the store reports what moved like any other call.

Pointing At Data

“Why was this one refunded?” is only answerable if the chat knows which one. Typing an id is not it, and letting the agent search for the order the user is already looking at spends a turn on a lookup they could have pointed at. The composer's @ menu is that pointer, and which documents it may offer is the app's answer, not the framework's — so a ReferenceSource brings its own query.

A field inside a document is the other entry point. The component drawing it already holds the value, so useAgentReference() hands that over with no round trip — and it is the only thing that knows a rich-text field stored as field(Any) reads as a paragraph rather than as the editor document it is stored as.

The Queue And The Slash Menu

A turn takes seconds, and a user who thinks of the next thing halfway through should not have to wait to type it. Enter during a turn parks the message and sends it the moment the turn ends. There is one slot: a second send joins the first on a new line, so the model is handed one user message rather than two.

It is shown rather than silently held, on the AgentQueued card above the composer. A send that vanished from the composer and has not appeared in the transcript reads as lost, and taking it back or dropping it needs somewhere to click. Stop hands a parked message back to the composer rather than opening the next turn with it — Stop means stop.

Command

These six are the whole / menu, beside whatever page().prompt() declarations the app publishes. An app writes none of them and cannot add one: the extension point for a product's own command is a prompt, which is guarded and server-side. A built-in wins a name collision, deliberately — a component's st.tool may shadow a built-in it means to replace, but no library's prompt may take /new away from the user who typed it.

Three session calls behind the menu:

session.note(text) writes a local message: rendered in the transcript, withheld from the wire. The transcript is the model's history, so /help text appended plainly would come back next turn as something the assistant believes it said.

session.report(error) is where a host-side failure lands — a command that threw, a reference whose resolve never answered. Same local shape, read as an error.

session.retry() replays only the trailing user message and leaves everything above it in place. ↑ and ↓ in the composer walk what was sent, seeded from the transcript, and the half-written draft they were walked away from comes back at the bottom of the walk.

Keeping The Transcript

The relay holds no session, so the conversation exists in one browser tab and nowhere else. persist is the one-word answer: sessionStorage by default, because surviving a refresh is the whole ask and a transcript that dies with the tab never lingers on a shared machine. { storage: "local" } is the explicit opt-up.

Keeping it on a server is a SessionHistory — three functions — and a function cannot cross the RSC boundary as a prop, which would make every ancestor up to whoever builds the session a client component. So it mounts instead, as a leaf, in the shape Agent.Guide already uses.

Four rules the store follows whichever backing you pick:

Restoring lands once

only while nothing has happened to the conversation yet. Mounting with the zone restores; mounting later saves from there on, and the store is never asked for a transcript that would be discarded.

Content never reaches storage

an attachment keeps its name, type and url; a reference keeps its pointer and a note saying to read it again with a tool. Web storage is a few megabytes and one screenshot fills a chunk of it, so persisting the bytes would quietly stop persisting the transcript.

The cap is applied before repair

web storage keeps the newest 50 messages, and that window can start between a tool call and the result answering it — a transcript restored in that state is refused by the provider on its first turn, so the pairing is repaired after the cut rather than before it.

called after a compaction replaced messages with one summary — where a host with its own server-side summary moves its watermark.

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
import { DefaultSteps, type StepsProps } from "akanjs/ui";

export const KoyoTurn = ({ messages, isRunning, progress, results }: StepsProps) => {
  const answer = messages.at(-1);
  const steps = isRunning ? messages : messages.slice(0, -1);
  return (
    <div className="flex flex-col gap-1">
      <details open={isRunning}>
        <summary className="cursor-pointer text-foreground/50 text-xs">
          {isRunning ? "working…" : `${steps.length} steps`}
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
import { cnst, fetch } from "@apps/koyo/client";
import { Agent } from "akanjs/ui";

export const KoyoAgentChat = () => (
  <Agent.Chat
    persist
    reference={[
      {
        refName: "icecreamOrder",
        label: "Order",
        type: cnst.IcecreamOrder,
        search: async (query, signal) => {
          const orders = await fetch.listIcecreamOrderBySearch(query);
          if (signal.aborted) return [];
          return orders.map((order) => ({ refId: order.id, label: order.code, description: order.status }));
        },
        resolve: async (refId) => (await fetch.viewIcecreamOrder(refId)).icecreamOrder,
      },
    ]}
  />
);
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

export const Desk = ({ className, children }: DeskProps) => (
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
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

