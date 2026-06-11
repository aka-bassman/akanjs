import { type BenchOrg, type BenchUser, buildDataset, DATASET_SIZE, sampleCreatePayload } from "../shared/dataset.ts";
import { signBenchToken, verifyBenchToken } from "../shared/jwt.ts";

/**
 * Baseline: native Bun.serve with no framework. Represents the routing + serialization
 * ceiling that any framework on Bun is measured against.
 */
const { users, orgs } = buildDataset(DATASET_SIZE);
const userById = new Map<string, BenchUser>(users.map((u) => [u.id, u]));
const orgById = new Map<string, BenchOrg>(orgs.map((o) => [o.id, o]));
let createSeq = 0;

const port = Number(process.env.PORT ?? 4001);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

Bun.serve({
  port,
  routes: {
    "/ping": () => json({ ok: true }),
    "/login": {
      POST: async () => json({ token: await signBenchToken("usr_0000000") }),
    },
    "/users": {
      GET: async (req) => {
        if (!(await verifyBenchToken(req.headers.get("authorization")))) return json({ error: "unauthorized" }, 401);
        const url = new URL(req.url);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        const skip = Number(url.searchParams.get("skip") ?? 0);
        return json(users.slice(skip, skip + limit));
      },
      POST: async (req) => {
        if (!(await verifyBenchToken(req.headers.get("authorization")))) return json({ error: "unauthorized" }, 401);
        const body = sampleCreatePayload(createSeq++);
        const created: BenchUser = { ...body, id: `usr_new_${createSeq}`, createdAt: new Date().toISOString() };
        userById.set(created.id, created);
        return json(created, 201);
      },
    },
    "/users/:id": async (req) => {
      if (!(await verifyBenchToken(req.headers.get("authorization")))) return json({ error: "unauthorized" }, 401);
      const user = userById.get(req.params.id);
      return user ? json(user) : json({ error: "not found" }, 404);
    },
    "/users/:id/with-org": async (req) => {
      if (!(await verifyBenchToken(req.headers.get("authorization")))) return json({ error: "unauthorized" }, 401);
      const user = userById.get(req.params.id);
      if (!user) return json({ error: "not found" }, 404);
      return json({ ...user, org: orgById.get(user.orgId) ?? null });
    },
  },
  fetch: () => new Response("not found", { status: 404 }),
});

console.info(`[raw-bun] listening on :${port} (${users.length} users)`);
