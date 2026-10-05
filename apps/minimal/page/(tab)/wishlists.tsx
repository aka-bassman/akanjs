import { appCard, iconTileRecipe, Screen } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { buttonRecipe, Image, Link } from "akanjs/ui";
import { AiOutlineCamera, AiOutlineHeart } from "react-icons/ai";

export default page()
  .search("deepLink", String)
  .render(({ deepLink }) => (
    <Screen className="px-5 pt-6 pb-28 md:mx-auto md:max-w-6xl md:px-10 md:pt-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground/40 text-xs uppercase tracking-[0.24em]">Saved places</p>
          <h1 className="font-bold text-3xl">Wishlists</h1>
        </div>
        <div className={iconTileRecipe({ size: "lg" })}>
          <AiOutlineHeart />
        </div>
      </div>
      {deepLink ? (
        <div className="mt-5 rounded-3xl border border-primary/20 bg-primary/10 p-4 text-primary text-sm">
          deep link: {deepLink}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["Weekend escapes", "4 stays", "/stays/fjord.webp"],
          ["City favorite", "7 stays", "/stays/canal.webp"],
          ["Quiet workcation", "3 stays", "/stays/lake.webp"],
        ].map(([title, count, image]) => (
          <Link
            className={appCard(undefined, "block overflow-hidden rounded-[1.75rem]")}
            href={`/wishlists/collection?name=${encodeURIComponent(title)}`}
            key={title}
          >
            <Image src={image} alt={title} width={1200} height={800} className="h-36 w-full object-cover md:h-48" />
            <div className="p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-foreground/50 text-sm">{count}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link
        className={buttonRecipe({ variant: "primary" }, "mt-5 w-full rounded-2xl border-0 md:w-auto")}
        href="/wishlists/camera?deepLink=true"
      >
        <AiOutlineCamera /> Capture a new place
      </Link>
    </Screen>
  ));
