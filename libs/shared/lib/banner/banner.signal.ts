import { Admin } from "@libs/shared/srvkit";
import { endpoint, internal, Public, slice } from "akanjs/signal";
import * as srv from "../srv";

export class BannerInternal extends internal(srv.banner, () => ({})) {}

// The one module in this library that opts into MCP, and it opts in only where the guard is already `Public`: an
// agent reads exactly what an anonymous browser reads, so exposure adds a transport rather than an audience. The
// root list stays off — it is `Admin` and takes a raw query descriptor. Exposing any other model is the mounting
// app's decision, not this library's.
export class BannerSlice extends slice(
  srv.banner,
  { guards: { root: Admin, get: Public, cru: Admin }, mcp: { get: true } },
  (init) => ({
    // `guards` on the slice call reaches the root slice and base CRUD, never a named slice — so `Public` here is
    // the difference between a decision and an omission, which is all that separates this from an unguarded read.
    inPublic: init({ guards: [Public], mcp: { expose: true } })
      .search("category", String)
      .exec(function (category) {
        return this.bannerService.queryInCategory(category);
      }),
  }),
) {}

export class BannerEndpoint extends endpoint(srv.banner, ({ pubsub, query, mutation }) => ({})) {}
