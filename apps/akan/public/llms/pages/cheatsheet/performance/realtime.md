# Realtime

- Source: /cheatsheet/performance/realtime
- Mirror: /llms/pages/cheatsheet/performance/realtime.md
- Section: cheatsheet
- Category: Performance
- Priority: P2

## Headings

- Realtime (#overview)
- Use message (#message)
- Use pubsub (#pubsub)
- Chat Flow (#flow)
- Design Rooms (#room)
- Tips (#tips)

## Content

Realtime

Realtime features keep a WebSocket connection open so the app can send small events quickly. Use it for chat, games, live editors, dashboards, and presence.

`message` is a client-to-server event.

`pubsub` is a server-to-room broadcast.

`room` decides who should receive the event.

Use message

Use `message` for small actions from the browser to the server: read receipt, cursor move, typing status, or game input.

Read receipt

Use pubsub

Use `pubsub` when the server needs to send one event to everyone in a room. A new chat message is the simplest example.

Chat Flow

For data that must be saved, write to the database first and publish after the service succeeds.

The browser never subscribes to get the list it already needs. The route loads the slice before the first byte and hands the snapshot down as an `init` prop, so the first paint is server HTML.

Design Rooms

Use a narrow room key such as `chatId`, `gameId`, or `documentId`.

Avoid one huge room for all users unless everyone truly needs the event.

Use guards so only allowed users can send or subscribe.

Tips

Keep payloads small. Send ids and small patches instead of full pages.

Use `message` for commands and `pubsub` for notifications.

If losing the event is dangerous, save it first and publish after saving.

For games or cursors, throttle very frequent events on the client.

## Code Examples

### Code

```ts
export class ChatEndpoint extends endpoint(srv.chat, ({ message }) => ({
  readMessage: message(Boolean, { guards: [User] })
    .msg("chatId", ID)
    .msg("messageId", ID)
    .exec(async function (chatId, messageId) {
      await this.chatService.markAsRead(chatId, messageId);
      return true;
    }),
})) {}
```

### apps/myapp/lib/chat/chat.signal.ts

```ts
export class ChatEndpoint extends endpoint(srv.chat, ({ pubsub }) => ({
  messageAdded: pubsub(cnst.ChatMessage, { guards: [User] })
    .room("chatId", ID)
    .with(Ws)
    .exec(async function (chatId, ws) {
      // The room key decides which connected users receive this event.
      const markAway = () => this.chatService.markAway(chatId, ws.socketId);
      ws.on("unsubscribe", markAway);
      ws.on("disconnect", markAway);
    }),
})) {}
```

### apps/myapp/lib/chat/chat.service.ts

```ts
async addMessage(chatId: string, content: string, senderId: string) {
  const message = await this.chatModel.createMessage({
    chat: chatId,
    sender: senderId,
    content,
  });
  await this.chatSignal.messageAdded(chatId, message);
  return message;
}
```

### apps/myapp/page/chat/[chatId]/_index.tsx

```ts
export default page()
  .param("chatId", ID)
  .render(async ({ chatId }) => {
    const { chatMessageInitInChat } = await fetch.initChatMessageInChat(chatId);
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
      renderItem={(chatMessage) => <ChatMessage.Unit.Row key={chatMessage.id} chatMessage={chatMessage} />}
    />
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

