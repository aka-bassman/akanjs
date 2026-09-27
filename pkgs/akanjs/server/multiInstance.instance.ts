import type { BackendEnv } from "akanjs/base";
import { AkanServer } from "./akanServer";
import { createCrossLib } from "./multiInstance.fixture";

// Spawned by `multiInstance.conformance.test.ts`, which also sets `PORT` and `AKAN_DATABASE_MODE`.
const env = JSON.parse(process.env.AKAN_TEST_INSTANCE_ENV ?? "{}") as BackendEnv;
const server = new AkanServer("crossTest", env, "all", createCrossLib());
await server.start({ listen: true, web: false });
process.stdout.write("ready\n");
