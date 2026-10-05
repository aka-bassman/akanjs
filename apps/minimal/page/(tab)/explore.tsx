import { stays } from "@apps/minimal/common";
import { iconTileRecipe, StayCard } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { Image, Link } from "akanjs/ui";
import { AiFillStar, AiOutlineEnvironment } from "react-icons/ai";

export default page().render(() => (
  <div className="min-h-screen bg-background px-5 pt-6 pb-28 text-foreground md:mx-auto md:max-w-6xl md:px-10 md:pt-10 md:pb-12">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-primary text-sm">Good evening</p>
        <h1 className="mt-1 font-bold text-3xl tracking-tight md:text-4xl">Where are you headed today?</h1>
      </div>
      <div className={iconTileRecipe({ size: "lg" })}>
        <AiOutlineEnvironment />
      </div>
    </div>
    <Link
      className="relative mt-6 block h-80 overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/20 md:h-[26rem]"
      href="/explore/detail?stay=skyline"
    >
      <Image
        src={stays.skyline.image}
        alt={stays.skyline.title}
        width={1600}
        height={1000}
        priority
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute right-5 bottom-5 left-5 md:right-8 md:bottom-8 md:left-8">
        <p className="text-white/70 text-xs uppercase tracking-[0.3em]">Featured stay</p>
        <p className="mt-2 font-bold text-3xl text-white md:text-5xl">Skyline loft in Seolleung</p>
        <p className="mt-2 flex items-center gap-1 text-sm text-white/80">
          <AiFillStar className="text-warning" /> {stays.skyline.rating} · City night views from the 27th floor
        </p>
      </div>
    </Link>
    <section className="mt-8">
      <div className="mb-3">
        <p className="text-foreground/50 text-xs uppercase tracking-[0.24em]">Recommended</p>
        <h2 className="font-semibold text-xl">Popular stays right now</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(["river", "lounge", "terrace"] as const).map((id) => (
          <StayCard
            key={id}
            href={`/explore/detail?stay=${id}`}
            image={stays[id].image}
            title={stays[id].title}
            caption={stays[id].area}
            rating={stays[id].rating}
            price={`₩${stays[id].nightly.toLocaleString("en-US")}`}
          />
        ))}
      </div>
    </section>
  </div>
));
