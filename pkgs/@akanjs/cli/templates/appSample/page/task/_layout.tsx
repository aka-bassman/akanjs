import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "_layout.tsx",
    content: `import { layout } from "akanjs/client";

export default layout().render(({ children }) => {
  return <div className="min-h-screen bg-muted">{children}</div>;
});
`,
  };
}
