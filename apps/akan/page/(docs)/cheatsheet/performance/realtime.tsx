import { usePage } from "@apps/akan/client";
import { Code, Divider, Docs, DocsList, DocsToc } from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

export default page().render(() => {
  const { l } = usePage();

  return (
    <Scroll>
      <Scroll.Slide id="overview" title={l.trans({ en: "Realtime", ko: "실시간" })}>
        <Docs.Title>{l.trans({ en: "Realtime", ko: "실시간" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Realtime features keep a WebSocket connection open so the app can send small events quickly. Use it for chat, games, live editors, dashboards, and presence.",
              ko: "실시간 기능은 WebSocket 연결을 유지해 작은 이벤트를 빠르게 주고받게 합니다. 채팅, 게임, 라이브 에디터, 대시보드, 접속 상태에 사용하세요.",
            })}
          </div>
          <DocsList>
            <li>
              {l.trans({
                en: "`message` is a client-to-server event.",
                ko: "`message`는 client에서 server로 보내는 이벤트입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`pubsub` is a server-to-room broadcast.",
                ko: "`pubsub`은 server에서 room으로 보내는 broadcast입니다.",
              })}
            </li>
            <li>
              {l.trans({
                en: "`room` decides who should receive the event.",
                ko: "`room`은 누가 이벤트를 받을지 정합니다.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="message" title={l.trans({ en: "Use message", ko: "message 사용" })}>
        <Docs.Title>{l.trans({ en: "Use message", ko: "message 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use `message` for small actions from the browser to the server: read receipt, cursor move, typing status, or game input.",
              ko: "브라우저에서 서버로 보내는 작은 동작에는 `message`를 사용하세요. 읽음 처리, 커서 이동, 입력 중 표시, 게임 입력이 좋은 예입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title={l.trans({ en: "Read receipt", ko: "읽음 처리" })}
          code={`export class ChatEndpoint extends endpoint(srv.chat, ({ message }) => ({
  readMessage: message(Boolean, { guards: [User] })
    .msg("chatId", ID)
    .msg("messageId", ID)
    .exec(async function (chatId, messageId) {
      await this.chatService.markAsRead(chatId, messageId);
      return true;
    }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="pubsub" title={l.trans({ en: "Use pubsub", ko: "pubsub 사용" })}>
        <Docs.Title>{l.trans({ en: "Use pubsub", ko: "pubsub 사용" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Use `pubsub` when the server needs to send one event to everyone in a room. A new chat message is the simplest example.",
              ko: "서버가 room 안의 모든 사람에게 이벤트 하나를 보내야 한다면 `pubsub`을 사용합니다. 새 채팅 메시지가 가장 쉬운 예입니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: (
                <span>
                  A <code>pubsub</code> is unguarded unless it says so. The slice-level guard map reaches only the
                  generated query and mutation endpoints, so a room without its own <code>guards</code> array is open to
                  anyone who can open a socket.
                </span>
              ),
              ko: (
                <span>
                  <code>pubsub</code>은 스스로 선언하지 않으면 guard가 없습니다. Slice의 guard map은 생성된
                  query·mutation endpoint에만 적용되므로, <code>guards</code> 배열이 없는 room은 socket을 열 수 있는
                  누구에게나 열려 있습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/chat/chat.signal.ts"
          code={`export class ChatEndpoint extends endpoint(srv.chat, ({ pubsub }) => ({
  messageAdded: pubsub(cnst.ChatMessage, { guards: [User] })
    .room("chatId", ID)
    .with(Ws)
    .exec(async function (chatId, ws) {
      // The room key decides which connected users receive this event.
      const markAway = () => this.chatService.markAway(chatId, ws.socketId);
      ws.on("unsubscribe", markAway);
      ws.on("disconnect", markAway);
    }),
})) {}`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="flow" title={l.trans({ en: "Chat Flow", ko: "채팅 흐름" })}>
        <Docs.Title>{l.trans({ en: "Chat Flow", ko: "채팅 흐름" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "For data that must be saved, write to the database first and publish after the service succeeds.",
              ko: "저장되어야 하는 데이터라면 먼저 데이터베이스에 기록하고, service가 성공한 뒤 publish하세요.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/chat/chat.service.ts"
          code={`async addMessage(chatId: string, content: string, senderId: string) {
  const message = await this.chatModel.createMessage({
    chat: chatId,
    sender: senderId,
    content,
  });
  await this.chatSignal.messageAdded(chatId, message);
  return message;
}`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: "The browser never subscribes to get the list it already needs. The route loads the slice before the first byte and hands the snapshot down as an `init` prop, so the first paint is server HTML.",
              ko: "브라우저는 이미 필요한 목록을 받으려고 구독하지 않습니다. Route가 첫 바이트 전에 slice를 불러 snapshot을 `init` prop으로 넘기므로, 첫 화면은 서버 HTML입니다.",
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/page/chat/[chatId]/_index.tsx"
          code={`export default page()
  .param("chatId", ID)
  .render(async ({ chatId }) => {
    const { chatMessageInitInChat } = await fetch.initChatMessageInChat(chatId);
    return <ChatMessage.Zone.List init={chatMessageInitInChat} />;
  });`}
        />
        <Docs.Description>
          <div>
            {l.trans({
              en: (
                <span>
                  <code>Load.Units</code> seeds the store from that snapshot, and a slice that declared{" "}
                  <code>.live()</code> keeps the window in sync from there. Nothing in the Zone fetches, and no
                  <code>useState</code> holds server data.
                </span>
              ),
              ko: (
                <span>
                  <code>Load.Units</code>가 그 snapshot으로 store를 채우고, <code>.live()</code>를 선언한 slice는 그
                  뒤부터 목록을 직접 동기화합니다. Zone 안에서는 아무것도 fetch하지 않고, 서버 데이터를{" "}
                  <code>useState</code>에 담지도 않습니다.
                </span>
              ),
            })}
          </div>
        </Docs.Description>
        <Code.Snippet
          className="w-full"
          title="apps/myapp/lib/chatMessage/ChatMessage.Zone.tsx"
          code={`"use client";
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
};`}
        />
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="room" title={l.trans({ en: "Design Rooms", ko: "Room 설계" })}>
        <Docs.Title>{l.trans({ en: "Design Rooms", ko: "Room 설계" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Use a narrow room key such as `chatId`, `gameId`, or `documentId`.",
                ko: "`chatId`, `gameId`, `documentId`처럼 좁은 room key를 사용하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Avoid one huge room for all users unless everyone truly needs the event.",
                ko: "모든 사용자가 정말 필요한 이벤트가 아니라면 거대한 공용 room을 피하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Use guards so only allowed users can send or subscribe.",
                ko: "허용된 사용자만 보내거나 구독할 수 있도록 guard를 사용하세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />

      <Scroll.Slide id="tips" title={l.trans({ en: "Tips", ko: "꿀팁" })}>
        <Docs.Title>{l.trans({ en: "Tips", ko: "꿀팁" })}</Docs.Title>
        <Docs.Description>
          <DocsList>
            <li>
              {l.trans({
                en: "Keep payloads small. Send ids and small patches instead of full pages.",
                ko: "Payload는 작게 유지하세요. 전체 page보다 id와 작은 변경분을 보내세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "Use `message` for commands and `pubsub` for notifications.",
                ko: "명령에는 `message`, 알림에는 `pubsub`을 사용하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "If losing the event is dangerous, save it first and publish after saving.",
                ko: "이벤트 유실이 위험하다면 먼저 저장하고 저장 후 publish하세요.",
              })}
            </li>
            <li>
              {l.trans({
                en: "For games or cursors, throttle very frequent events on the client.",
                ko: "게임이나 커서는 너무 잦은 이벤트를 client에서 throttle하세요.",
              })}
            </li>
          </DocsList>
        </Docs.Description>
      </Scroll.Slide>
      <DocsToc />
    </Scroll>
  );
});
