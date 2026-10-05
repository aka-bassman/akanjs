import { usePage } from "@apps/akan/client";
import { Clipboard, Tab } from "akanjs/ui";
import { agentPrompt, installCommand } from "../Start/start.util";
import { FlightCopy } from "./FlightCopy";

const menuClassName = "px-4 py-1.5 font-hud text-[11px] uppercase tracking-[0.16em] text-foreground/60";
const activeMenuClassName = "bg-foreground text-background";

interface FlightStartProps {
  className?: string;
}
export const FlightStart = ({ className }: FlightStartProps) => {
  const { l } = usePage();
  return (
    <Tab className={className} defaultMenu="agent">
      <Tab.Menus className="inline-flex bg-card/70 p-1 ring-1 ring-border ring-inset">
        <Tab.Menu menu="agent" className={menuClassName} activeClassName={activeMenuClassName}>
          Claude Code · Codex
        </Tab.Menu>
        <Tab.Menu menu="terminal" className={menuClassName} activeClassName={activeMenuClassName}>
          {l.trans({ en: "Terminal", ko: "터미널" })}
        </Tab.Menu>
      </Tab.Menus>
      <Tab.Panel className="mt-4" menu="agent">
        <div className="flt-ticks bg-card/80 p-5 ring-1 ring-border ring-inset backdrop-blur-sm sm:p-6">
          <pre className="wrap-break-word whitespace-pre-wrap font-hud text-[11.5px] text-foreground/80 leading-6">
            {l.trans(agentPrompt)}
          </pre>
          <FlightCopy className="mt-5" size="md" tone="day" />
        </div>
      </Tab.Panel>
      <Tab.Panel className="mt-4" menu="terminal">
        <div className="inline-flex max-w-full items-center gap-3 bg-card/80 py-2 pr-2 pl-5 font-hud text-sm ring-1 ring-border ring-inset sm:text-base">
          <span className="select-none text-burn">$</span>
          <span className="truncate text-foreground/90">{installCommand}</span>
          <Clipboard className="relative shrink-0" text={installCommand} />
        </div>
        <p className="mt-3 text-muted-foreground text-sm leading-6">
          {l.trans({
            en: "It asks for a workspace and an app name, then installs the akan CLI and the workspace's dependencies.",
            ko: "워크스페이스와 앱 이름을 물은 뒤 akan CLI와 워크스페이스 의존성을 설치합니다.",
          })}
        </p>
      </Tab.Panel>
    </Tab>
  );
};
