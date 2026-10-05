import { appCard, appNavClass, chatBubbleRecipe, gradientSurfaceRecipe, Screen } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { buttonRecipe, Layout } from "akanjs/ui";
import { AiOutlineSend } from "react-icons/ai";

const messages: { side: "incoming" | "outgoing"; text: string }[] = [
  {
    side: "incoming",
    text: "Hello. Check-in starts at 3 PM, and I will send the door lock instructions that morning.",
  },
  { side: "outgoing", text: "Thank you. Is there parking available nearby?" },
  {
    side: "incoming",
    text: "I recommend the public parking lot behind the building. It is a 2-minute walk away.",
  },
  { side: "outgoing", text: "Perfect. We might land late, around 11 PM. Is that okay?" },
  { side: "incoming", text: "No problem at all. The door code works any time, and the lounge stays open." },
  { side: "outgoing", text: "Great. Any dinner spots open that late?" },
  {
    side: "incoming",
    text: "The noodle bar across the street serves until 2 AM. I left a map with my favorites on the desk.",
  },
  { side: "outgoing", text: "You are the best. See you on the 28th!" },
];

export default page()
  .config({
    topInset: 48,
    bottomInset: 72,
    safeArea: true,
    transition: "stack",
  })
  .render(() => (
    <Screen>
      <Layout.Navbar className={appNavClass} back>
        <div className="flex items-center gap-3">
          <div className={gradientSurfaceRecipe({ tone: "duo" }, "h-9 w-9 rounded-2xl")} />
          <div>
            <div className="font-semibold">Seolleung host</div>
            <div className="text-success text-xs">online now</div>
          </div>
        </div>
      </Layout.Navbar>
      <div className="space-y-3 px-5 pt-5 md:mx-auto md:max-w-3xl">
        {messages.map((message, index) => (
          <div key={`${message.side}-${index}`} className={chatBubbleRecipe({ side: message.side })}>
            {message.text}
          </div>
        ))}
      </div>
      <Layout.BottomInset
        className="flex h-(--akan-bottom-inset) w-full bg-background/80 px-3 py-2 backdrop-blur"
        keyboardSticky
        contentAnchor="bottom"
      >
        <div className={appCard(undefined, "flex h-full w-full items-center justify-center gap-2 rounded-3xl px-3")}>
          <input
            className="h-10 w-full border-0 bg-transparent px-3 text-foreground text-sm placeholder:text-foreground/35 focus:outline-none"
            placeholder="Type message..."
          />
          <button className={buttonRecipe({ variant: "primary", size: "icon" }, "rounded-2xl border-0")}>
            <AiOutlineSend />
          </button>
        </div>
      </Layout.BottomInset>
    </Screen>
  ));
