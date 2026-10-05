import { stays } from "@apps/minimal/common";
import { appNavClass, Screen, StayCard } from "@apps/minimal/ui";
import { page } from "akanjs/client";
import { Layout } from "akanjs/ui";

export default page()
  .search("name", String)
  .config({ topInset: 48, transition: "scaleOut" })
  .render(({ name }) => (
    <Screen className="pb-10">
      <Layout.Navbar className={appNavClass} back>
        <div className="font-semibold">{name ?? "Wishlist"}</div>
      </Layout.Navbar>
      <div className="grid gap-4 px-5 pt-5 md:mx-auto md:max-w-5xl md:grid-cols-2">
        {(["terrace", "river", "skyline", "lounge"] as const).map((id) => (
          <StayCard
            key={id}
            href={`/explore/detail?stay=${id}`}
            image={stays[id].image}
            title={stays[id].title}
            caption={stays[id].summary}
            rating={stays[id].rating}
          />
        ))}
      </div>
    </Screen>
  ));
