import { stays } from "@apps/minimal/common";
import { appCard, appNavClass, Screen } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { buttonRecipe, Image, Layout, Link } from "akanjs/ui";
import { AiFillStar } from "react-icons/ai";

export default page()
  .search("stay", String)
  .config({ topInset: 48, bottomInset: 88, transition: "bottomUp" })
  .render(({ stay }) => {
    const current = stays[stay && stay in stays ? (stay as keyof typeof stays) : "skyline"];
    const [stayTotal, cleaning, service] = [current.nightly * 2, 20000, Math.round(current.nightly * 0.12)];
    return (
      <Screen className="pb-8">
        <Layout.Navbar className={appNavClass} back>
          <div className="font-semibold">Confirm and pay</div>
        </Layout.Navbar>
        <div className="space-y-5 px-5 pt-5 md:mx-auto md:max-w-2xl">
          <div className={appCard(undefined, "flex items-center gap-4 rounded-[1.75rem] p-3")}>
            <Image
              src={current.image}
              alt={current.title}
              width={256}
              height={192}
              className="h-24 w-28 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-lg">{current.title}</p>
              <p className="text-foreground/50 text-sm">{current.area}</p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <AiFillStar className="text-warning" /> {current.rating}
              </p>
            </div>
          </div>
          <section className={appCard(undefined, "divide-y divide-foreground/10 rounded-[1.75rem] px-5")}>
            {[
              ["Dates", "May 28 – May 30"],
              ["Guests", `${current.guests} ${current.guests === 1 ? "guest" : "guests"}`],
              ["Check-in", "After 3:00 PM · self check-in"],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between py-4" key={label}>
                <p className="text-foreground/50 text-sm">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </section>
          <section className={appCard(undefined, "rounded-[1.75rem] p-5")}>
            <h2 className="font-semibold text-lg">Price details</h2>
            <div className="mt-3 space-y-2 text-sm">
              {[
                [`₩${current.nightly.toLocaleString("en-US")} × 2 nights`, stayTotal],
                ["Cleaning fee", cleaning],
                ["Service fee", service],
              ].map(([label, amount]) => (
                <div className="flex justify-between text-foreground/70" key={label}>
                  <span>{label}</span>
                  <span>₩{amount.toLocaleString("en-US")}</span>
                </div>
              ))}
              <div className="flex justify-between border-foreground/10 border-t pt-3 font-bold text-base">
                <span>Total</span>
                <span>₩{(stayTotal + cleaning + service).toLocaleString("en-US")}</span>
              </div>
            </div>
          </section>
        </div>
        <Layout.BottomInset className="flex h-full w-full items-center border-foreground/10 border-t bg-background/90 px-5 backdrop-blur">
          <Link
            className={buttonRecipe({ variant: "primary" }, "mx-auto h-12 w-full max-w-2xl rounded-2xl border-0")}
            href="/trips/detail"
            replace
          >
            Reserve
          </Link>
        </Layout.BottomInset>
      </Screen>
    );
  });
