import type { AppInfo, LibInfo } from "akanjs";

interface Dict {
  appName: string;
}
export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: Dict, options: { libs: string[] }) {
  const isUsingShared = options.libs.includes("shared");
  return {
    filename: "_layout.tsx",
    content: `
import "./styles.css";
import { rootLayout } from "akanjs/client";
${isUsingShared ? "import { Auth } from '@shared/ui';" : ""}

export default rootLayout()
  .fonts([
    {
      name: "pretendard",
      default: true,
      paths: [
        { src: "/fonts/Pretendard-Thin.woff2", weight: 100 },
        { src: "/fonts/Pretendard-ExtraLight.woff2", weight: 200 },
        { src: "/fonts/Pretendard-Light.woff2", weight: 300 },
        { src: "/fonts/Pretendard-Regular.woff2", weight: 400 },
        { src: "/fonts/Pretendard-Medium.woff2", weight: 500 },
        { src: "/fonts/Pretendard-SemiBold.woff2", weight: 600 },
        { src: "/fonts/Pretendard-Bold.woff2", weight: 700 },
        { src: "/fonts/Pretendard-ExtraBold.woff2", weight: 800 },
        { src: "/fonts/Pretendard-Black.woff2", weight: 900 },
      ],
    },
  ])
  .head(
    <>
      <title>${dict.appName}</title>
      <link rel="icon" href="/favicon.ico" />
    </>,
  )
  .render(({ children }) => {
    return (
      <>
        {children}${isUsingShared ? "\n        <Auth.User />\n        <Auth.Admin />" : ""}
      </>
    );
  });
  `,
  };
}
