import { usePage } from "@apps/akan/client";
import { Clipboard, Tab } from "akanjs/ui";
import { PromptCard } from "./PromptCard";
import { installCommand } from "./start.util";

const menuClassName = "rounded-full px-4 py-1.5 font-bold text-sm";
const activeMenuClassName = "jelly tint-secondary bg-secondary text-secondary-foreground";

interface StartTabsProps {
  className?: string;
}
export const StartTabs = ({ className }: StartTabsProps) => {
  const { l } = usePage();
  return (
    <Tab className={className} defaultMenu="agent">
      <Tab.Menus className="jelly-glass rounded-full p-1">
        <Tab.Menu menu="agent" className={menuClassName} activeClassName={activeMenuClassName}>
          Claude Code · Codex
        </Tab.Menu>
        <Tab.Menu menu="terminal" className={menuClassName} activeClassName={activeMenuClassName}>
          {l.trans({ en: "Terminal", ko: "터미널" })}
        </Tab.Menu>
      </Tab.Menus>
      <Tab.Panel className="mt-4" menu="agent">
        <PromptCard />
      </Tab.Panel>
      <Tab.Panel className="mt-4" menu="terminal">
        <div className="jelly-glass inline-flex max-w-full items-center gap-3 rounded-full py-2 pr-2 pl-6 font-mono text-sm sm:text-lg">
          <span className="select-none text-primary">$</span>
          <span className="truncate text-foreground/90">{installCommand}</span>
          <Clipboard className="relative shrink-0" text={installCommand} />
        </div>
        <p className="mt-3 text-foreground/50 text-sm leading-6">
          {l.trans({
            en: "It asks for a workspace and an app name, then installs the akan CLI and the workspace's dependencies.",
            ko: "워크스페이스와 앱 이름을 물은 뒤 akan CLI와 워크스페이스 의존성을 설치합니다.",
          })}
        </p>
      </Tab.Panel>
    </Tab>
  );
};
