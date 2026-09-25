# Realtime

- Source: /cheatsheet/performance/realtime
- Mirror: /llms/pages/cheatsheet/performance/realtime.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Realtime (#overview)
- Send With message (#message)
- Broadcast With pubsub (#pubsub)
- Chat Flow (#flow)
- Design Rooms (#room)
- Tips (#tips)

## Content

Realtime

Tool

Direction

Use it for

Browser → server

e.g. read receipts, cursor moves, typing status, game input

Server → everyone subscribed to the room

e.g. a new chat message, a notification

Database → every screen showing the list

e.g. a list of saved rows, such as a chat history

Sends the message and returns nothing.

Runs `fn` with each answer this browser gets and returns a function that stops listening.

Joins the chat's room, runs `fn` on every publish, and returns an unsubscribe function.

Realtime keeps one WebSocket open, so the server and the browser trade small events without a new request each time. Chat, games, live editors, dashboards and presence all run on it.

Send With message

Broadcast With pubsub

Calling From the Browser

Call

What it does

Chat Flow

A chat message reaches the screen in four steps. The list itself never needs a hand-written subscription.

1. Save, Then Publish

For data that must be saved, write to the database first and publish after the service succeeds:

2. Declare a Live Slice

3. Load the Snapshot in the Route

4. Draw It With Load.Units

Design Rooms

The room key decides who receives an event, so keep it as narrow as the audience.

Tips

## Code Examples

### apps/myapp/lib/chat/chat.signal.ts

```ts
import { Self, User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as srv from "../srv";

export class ChatEndpoint extends endpoint(srv.chat, ({ message }) => ({
  readMessage: message(Boolean, { guards: [User] })
    .msg("chatId", ID)
    .msg("messageId", ID)
    .with(Self)
    .exec(async function (chatId, messageId, self) {
      await this.chatService.markAsRead(chatId, messageId, self.id);
      return true;
    }),
})) {}
```

### apps/myapp/lib/chat/chat.signal.ts

```ts
import { User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { endpoint, Ws } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class ChatEndpoint extends endpoint(srv.chat, ({ pubsub }) => ({
  messageAdded: pubsub(cnst.ChatMessage, { guards: [User] })
    .room("chatId", ID)
    .with(Ws)
    .exec(async function (chatId, ws) {
      const markAway = () => this.chatService.markAway(chatId, ws.socketId);
      ws.on("unsubscribe", markAway);
      ws.on("disconnect", markAway);
    }),
})) {}
```

### apps/myapp/lib/chat/chat.service.ts

```ts
import { serve } from "akanjs/service";

import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class ChatService extends serve(db.chat, ({ service, signal }) => ({
  chatMessageService: service<srv.ChatMessageService>(),
  chatSignal: signal<sig.Chat>(),
})) {
  async addMessage(chatId: string, content: string, senderId: string) {
    const chatMessage = await this.chatMessageService.createChatMessage({
      chat: chatId,
      sender: senderId,
      content,
    });
    await this.chatSignal.messageAdded(chatId, chatMessage);
    return chatMessage;
  }
}
```

### apps/myapp/lib/chatMessage/chatMessage.signal.ts

```ts
import { Admin, User } from "@libs/shared/srvkit";
import { ID } from "akanjs/base";
import { slice } from "akanjs/signal";

import * as srv from "../srv";

export class ChatMessageSlice extends slice(
  srv.chatMessage,
  { guards: { root: Admin, get: User, cru: User } },
  (init) => ({
    inChat: init({ guards: [User] })
      .param("chatId", ID)
      .live()
      .exec(function (chatId) {
        return this.chatMessageService.queryInChat(chatId);
      }),
  }),
) {}
```

### apps/myapp/page/chat/[chatId]/_index.tsx

```ts
import { ChatMessage, fetch } from "@apps/myapp/client";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";

export default page()
  .param("chatId", ID)
  .render(async ({ chatId }) => {
    const [{ chatMessageInitInChat }] = await Promise.all([
      fetch.initChatMessageInChat(chatId),
    ]);
    return <ChatMessage.Zone.List init={chatMessageInitInChat} />;
  });
```

### apps/myapp/lib/chatMessage/ChatMessage.Zone.tsx

```ts
"use client";
import { ChatMessage, type cnst } from "@apps/myapp/client";
import type { ClientInit } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface ListProps {
  className?: string;
  init: ClientInit<"chatMessage", cnst.LightChatMessage>;
}
export const List = ({ className, init }: ListProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(chatMessage) => (
        <ChatMessage.Unit.Row key={chatMessage.id} chatMessage={chatMessage} />
      )}
    />
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

