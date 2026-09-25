import { AkanjsFooter, AkanjsHeader, akanjsV1DocsHeaderLinks } from "@apps/akan/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    <AkanjsHeader
      links={akanjsV1DocsHeaderLinks}
      logoLabel="(v1)"
      notice={{
        text: { en: "You are viewing the Akan.js v1 docs.", ko: "현재 Akan.js v1 문서를 보고 있습니다." },
        link: { href: "/docs", label: { en: "Go to the latest v2 docs", ko: "최신 v2 문서 보기" } },
      }}
      collapseMobileSubMenuOnScroll
    />
    {children}
    <AkanjsFooter />
  </>
));
