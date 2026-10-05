import { usePage } from "@apps/akan/client";
import { FlightCode } from "./FlightCode";
import { Mfd } from "./Mfd";
import { SheetLabel } from "./SheetLabel";
import { StepList } from "./StepList";

const screenCode = `export const Order = () => {
  const { l } = usePage();
  const icecreamOrderForm = st.use.icecreamOrderForm();
  const order = st.tool("createIcecreamOrder", { confirm: true }) // [!code highlight]
    .desc("Place the order in the form.")
    .exec(() => st.do.createIcecreamOrder());
  return (
    <>
      <Field.MultiToggleSelect
        label={l("icecreamOrder.toppings")}
        items={cnst.Topping}
        value={icecreamOrderForm.toppings}
        onChange={st.do.setToppingsOnIcecreamOrder} // [!code highlight]
      />
      <Button onClick={order}>{l("icecreamOrder.createIcecreamOrder")}</Button>
    </>
  );
};`;

export const Avionics = () => {
  const { l } = usePage();
  const steps = [
    {
      title: l.trans({ en: "Write the screen you were going to write.", ko: "원래 쓰려던 화면을 그대로 씁니다." }),
      body: l.trans({
        en: "A field handed its setter publishes it. A button's handler becomes a tool with one st.tool line — the same function the button calls.",
        ko: "setter를 넘겨받은 필드는 그 setter를 공개합니다. 버튼 핸들러는 st.tool 한 줄로 툴이 되고, 버튼이 부르는 바로 그 함수가 됩니다.",
      }),
    },
    {
      title: l.trans({ en: "An agent sees tools, not pixels.", ko: "에이전트에게는 픽셀이 아니라 도구가 보입니다." }),
      body: l.trans({
        en: "Like an autopilot on the data bus, it reads every control you wired by name, with the arguments it takes. What isn't on the screen isn't on the bus — no lever the user doesn't have.",
        ko: "데이터 버스에 물린 자동조종처럼, 연결한 컨트롤을 이름과 받는 인자로 읽습니다. 화면에 없는 것은 버스에도 없습니다. 사용자에게 없는 레버는 에이전트에게도 없습니다.",
      }),
    },
    {
      title: l.trans({ en: "Ask, and it works the screen.", ko: "부탁하면, 화면을 직접 다룹니다." }),
      body: l.trans({
        en: "It runs in the customer's own tab, with their session — exactly like a click. You watch the pointer land on every control it uses.",
        ko: "고객 자신의 탭에서, 고객의 세션으로 돕니다. 클릭과 똑같습니다. 포인터가 쓰는 컨트롤마다 내려앉는 모습이 그대로 보입니다.",
      }),
    },
    {
      title: l.trans({ en: "What matters waits for a yes.", ko: "중요한 일은 승인을 기다립니다." }),
      body: l.trans({
        en: "A tool declared with confirm stops on an approval card. Approve, and the handler the button calls runs — through the same guards.",
        ko: "confirm으로 선언한 툴은 승인 카드에서 멈춥니다. 승인하면 버튼이 부르는 핸들러가 같은 가드를 지나 실행됩니다.",
      }),
      note: (
        <p className="font-hud text-[11px] text-foreground/45 leading-5">
          {l.trans({
            en: "Setup: one <Agent.Chat /> in a layout, and your model's key.",
            ko: "설정: 레이아웃에 <Agent.Chat /> 하나, 그리고 모델 키.",
          })}
        </p>
      ),
    },
  ];
  return (
    <section className="relative px-6 pt-32 pb-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <SheetLabel sheet="06">
            {l.trans({ en: "Avionics · Screen → agent", ko: "항전 · 화면 → 에이전트" })}
          </SheetLabel>
          <p className="mt-6 font-semibold text-burn">
            {l.trans({ en: "Your next user doesn't click.", ko: "다음 사용자는 클릭하지 않습니다." })}
          </p>
          <h2 className="mt-3 text-balance font-black text-3xl leading-tight sm:text-5xl">
            {l.trans({
              en: "The cockpit you build is the agent's cockpit.",
              ko: "당신이 만든 조종석이 곧 에이전트의 조종석입니다.",
            })}
          </h2>
          <p className="mt-5 max-w-xl text-foreground/65 leading-7 sm:text-lg sm:leading-8">
            {l.trans({
              en: "Agents already read screens and call APIs for the people they work for. Getting an app ready for them is usually a second project. Here the avionics come with the airframe.",
              ko: "에이전트는 이미 사람을 대신해 화면을 읽고 API를 부릅니다. 앱을 여기에 맞추려면 보통 두 번째 프로젝트가 필요하지만, 여기서는 항전 장비가 기체와 함께 옵니다.",
            })}
          </p>
          <StepList className="mt-12" sheet="06" steps={steps} />
        </div>
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Mfd />
          <FlightCode code={screenCode} language="tsx" title="IcecreamOrder.Zone.tsx" />
        </div>
      </div>
    </section>
  );
};
