import { appCard, Screen } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { buttonRecipe, Image, Layout, Link } from "akanjs/ui";
import { AiOutlineCheckCircle, AiOutlineClose, AiOutlineCompass } from "react-icons/ai";

export default page()
  .config({
    topInset: 0,
    safeArea: {
      top: false,
      bottom: true,
    },
    bottomInset: 88,
    transition: "fade",
  })
  .render(() => (
    <Screen className="pb-8">
      <Link.Back>
        <div className="fixed top-12 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30 text-white backdrop-blur">
          <AiOutlineClose className="text-2xl" />
        </div>
      </Link.Back>
      <Image
        src="/stays/city.webp"
        alt="Seoul"
        width={1600}
        height={1000}
        priority
        className="h-96 w-full object-cover"
      />
      <div className="px-5 pt-6 md:mx-auto md:max-w-3xl">
        <p className="text-primary text-sm">May 28 - May 30</p>
        <h1 className="mt-1 font-bold text-3xl">Seoul City Stay</h1>
        <p className="mt-2 text-foreground/50 text-sm leading-6">
          Review check-in details, the stay address, and nearby recommendations in one place.
        </p>
        <section className="mt-5 grid gap-3">
          {[
            ["Check-in ready", "Reminder scheduled 2 hours before arrival"],
            ["Host confirmed", "Average response time is 5 minutes"],
            ["Route prepared", "4-minute walk from subway Line 2"],
          ].map(([title, desc]) => (
            <div className={appCard(undefined, "flex items-center gap-3 rounded-3xl p-4")} key={title}>
              <AiOutlineCheckCircle className="text-2xl text-success" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-foreground/50 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
      <Layout.BottomInset
        className="flex h-full w-full items-center bg-background/80 px-5 backdrop-blur"
        keyboardSticky
      >
        <Link
          className={buttonRecipe({ variant: "primary" }, "mx-auto h-12 w-full max-w-3xl rounded-2xl border-0")}
          href="/explore/detail?stay=skyline"
        >
          <AiOutlineCompass /> View stay again
        </Link>
      </Layout.BottomInset>
    </Screen>
  ));
