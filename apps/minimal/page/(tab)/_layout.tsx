import { gradientSurfaceRecipe, TabRail } from "@apps/minimal/ui";
import { layout } from "akanjs/client";
import { Layout } from "akanjs/ui";
import { AiOutlineCompass, AiOutlineHeart, AiOutlineHome, AiOutlineMessage, AiOutlineUser } from "react-icons/ai";

const tabs = [
  { name: "Explore", href: "/explore", icon: <AiOutlineCompass /> },
  { name: "Saved", href: "/wishlists", icon: <AiOutlineHeart /> },
  { name: "Trips", href: "/trips", icon: <AiOutlineHome /> },
  { name: "Inbox", href: "/inbox", icon: <AiOutlineMessage /> },
  { name: "Profile", href: "/profile", icon: <AiOutlineUser /> },
];

export default layout()
  .config({
    bottomInset: 64,
    safeArea: true,
    cache: true,
    transition: "none",
  })
  .render(({ children }) => (
    <div className="md:flex">
      <TabRail
        className="hidden md:flex"
        tabs={tabs}
        brand={
          <div className="flex items-center gap-3 font-bold text-xl">
            <div className={gradientSurfaceRecipe({ tone: "brand" }, "h-9 w-9 rounded-2xl")} />
            minimal
          </div>
        }
      />
      <div className="min-w-0 flex-1">{children}</div>
      <Layout.BottomTab className="md:hidden" tabs={tabs} />
    </div>
  ));
