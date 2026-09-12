import { AkanjsFooter, AkanjsHeader, akanjsHomeHeaderLinks } from "@apps/akan/ui";
import { layout } from "akanjs/client";

export default layout().render(({ children }) => (
  <>
    <AkanjsHeader links={akanjsHomeHeaderLinks} mobileDrawerLinks={akanjsHomeHeaderLinks} />
    <div className="relative flex w-full">
      <div className="w-full">{children}</div>
    </div>
    <AkanjsFooter />
  </>
));
