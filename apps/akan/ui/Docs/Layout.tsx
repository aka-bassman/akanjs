import type { Audience } from "./Audience";
import { Shell } from "./Shell";

export interface DocsMenu {
  name: string;
  subMenus: {
    name: string;
    href: string;
    audience?: Audience;
  }[];
}

interface LayoutProps {
  children: React.ReactNode;
  menuMap: DocsMenu[];
}

export const Layout = ({ children, menuMap }: LayoutProps) => {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Shell menuMap={menuMap}>{children}</Shell>
    </main>
  );
};
