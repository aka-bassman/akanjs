import { stays } from "@apps/minimal/common";
import { appCard, appNavClass, Screen } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { buttonRecipe, Image, Layout, Link } from "akanjs/ui";
import { AiFillStar, AiOutlineCalendar, AiOutlineHeart } from "react-icons/ai";

export default page()
  .search("stay", String)
  .config({ topInset: 48, bottomInset: 88, transition: "stack" })
  .render(({ stay }) => {
    const id = stay && stay in stays ? (stay as keyof typeof stays) : "skyline";
    const current = stays[id];
    return (
      <Screen className="pb-8">
        <Layout.Navbar className={appNavClass} back>
          <div className="font-semibold">Stay detail</div>
        </Layout.Navbar>
        <div className="px-5 pt-5 md:mx-auto md:max-w-3xl">
          <div className="relative h-80 overflow-hidden rounded-[2rem] md:h-[26rem]">
            <Image
              src={current.image}
              alt={current.title}
              width={1600}
              height={1000}
              priority
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <button className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30 text-white text-xl backdrop-blur">
              <AiOutlineHeart />
            </button>
            <div className="absolute right-5 bottom-5 left-5">
              <div className="flex items-center gap-1 text-sm text-warning">
                <AiFillStar /> {current.rating} · Super stay
              </div>
              <h1 className="mt-2 font-bold text-3xl text-white md:text-4xl">{current.title}</h1>
              <p className="text-sm text-white/70">{current.area}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              [String(current.guests), "guests"],
              [String(current.bedrooms), "bedrooms"],
              [current.view, "view"],
            ].map(([value, label]) => (
              <div className={appCard(undefined, "rounded-3xl p-4")} key={label}>
                <p className="font-bold text-xl">{value}</p>
                <p className="text-foreground/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
          <section className={appCard(undefined, "mt-5 rounded-[1.75rem] p-5")}>
            <h2 className="font-semibold text-xl">About this place</h2>
            <p className="mt-2 text-foreground/60 text-sm leading-6">{current.summary}</p>
          </section>
          <Image
            src="/stays/interior.webp"
            alt="Living room"
            width={1200}
            height={800}
            className="mt-5 h-56 w-full rounded-[1.75rem] object-cover md:h-72"
          />
        </div>
        <Layout.BottomInset className="flex h-full w-full items-center border-foreground/10 border-t bg-background/90 px-5 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">₩{current.nightly.toLocaleString("en-US")}</p>
              <p className="text-foreground/50 text-xs">per night</p>
            </div>
            <Link
              className={buttonRecipe({ variant: "primary" }, "h-12 rounded-2xl border-0 px-8")}
              href={`/explore/book?stay=${id}`}
            >
              <AiOutlineCalendar /> Book now
            </Link>
          </div>
        </Layout.BottomInset>
      </Screen>
    );
  });
