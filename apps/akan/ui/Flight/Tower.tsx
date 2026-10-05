import { usePage } from "@apps/akan/client";
import { FlightCode } from "./FlightCode";
import { SheetLabel } from "./SheetLabel";
import { StepList } from "./StepList";
import { TowerLog } from "./TowerLog";

const serverCode = `serveIcecreamOrder: mutation(cnst.IcecreamOrder, {
  guards: [Admin], // [!code highlight]
})
  .param("icecreamOrderId", ID)
  .exec(async function (icecreamOrderId) {
    return await this.icecreamOrderService.serve(icecreamOrderId);
  }),
refundIcecreamOrder: mutation(cnst.IcecreamOrder, {
  guards: [Every, Person], // [!code highlight]
})
  .param("icecreamOrderId", ID)
  .with(Self)
  .exec(async function (icecreamOrderId, self) {
    return await this.icecreamOrderService.refund(icecreamOrderId, self.id);
  }),`;

export const Tower = () => {
  const { l } = usePage();
  const steps = [
    {
      title: l.trans({ en: "Point any MCP client at your app.", ko: "MCP 클라이언트에 앱 주소만 넣습니다." }),
      body: l.trans({
        en: "/mcp is on by default. Every endpoint whose guards admit the caller is a tool, described by the dictionary you already write.",
        ko: "/mcp는 기본으로 켜져 있습니다. 가드가 허용하는 엔드포인트는 모두 툴이 되고, 설명은 이미 쓰는 사전에서 옵니다.",
      }),
    },
    {
      title: l.trans({ en: "Sign-in and consent happen on your app.", ko: "로그인과 동의는 당신의 앱에서 합니다." }),
      body: l.trans({
        en: "OAuth 2.1 ships with libs/shared. The AI gets a token for this one user — exactly their rights, revocable at any time.",
        ko: "OAuth 2.1은 libs/shared에 들어 있습니다. AI는 이 사용자 한 명의 토큰을 받고, 권한도 딱 그 사용자만큼이며, 언제든 해지할 수 있습니다.",
      }),
    },
    {
      title: l.trans({ en: "Then it just works.", ko: "그다음엔 그냥 됩니다." }),
      body: l.trans({
        en: "Ask in plain words. It calls your endpoints through the same guards and services as your screens — and the board that's open updates live.",
        ko: "평범한 말로 부탁하면, 화면과 같은 가드와 서비스를 지나 엔드포인트를 부릅니다. 열려 있는 보드는 실시간으로 바뀝니다.",
      }),
    },
    {
      title: l.trans({ en: "And it can't do what it shouldn't.", ko: "해서는 안 되는 일은 못 합니다." }),
      body: l.trans({
        en: "refundIcecreamOrder is guarded by Person, so it never reaches the shelf. To the AI it looks exactly like a tool that doesn't exist.",
        ko: "refundIcecreamOrder에는 Person 가드가 걸려 있어 목록에 올라가지 않습니다. AI에게는 처음부터 없는 툴과 똑같아 보입니다.",
      }),
    },
  ];
  return (
    <section className="relative px-6 py-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-5 max-lg:order-last lg:sticky lg:top-24 lg:self-start">
          <TowerLog />
          <FlightCode code={serverCode} title="icecreamOrder.signal.ts" />
        </div>
        <div>
          <SheetLabel sheet="07">{l.trans({ en: "Tower · Server → AI", ko: "관제 · 서버 → AI" })}</SheetLabel>
          <h2 className="mt-6 text-balance font-black text-3xl leading-tight sm:text-5xl">
            {l.trans({ en: "Your server is already an MCP server.", ko: "당신의 서버는 이미 MCP 서버입니다." })}
          </h2>
          <p className="mt-5 max-w-xl text-foreground/65 leading-7 sm:text-lg sm:leading-8">
            {l.trans({
              en: "No tool schemas, no second server to write, no second permission model. Any AI calls in like traffic to a tower — and gets exactly the clearance its user has.",
              ko: "툴 스키마도, 따로 쓰는 서버도, 두 번째 권한 모델도 없습니다. 어떤 AI든 관제탑에 교신하듯 들어오고, 딱 그 사용자만큼의 허가를 받습니다.",
            })}
          </p>
          <StepList className="mt-12" sheet="07" steps={steps} />
        </div>
      </div>
    </section>
  );
};
