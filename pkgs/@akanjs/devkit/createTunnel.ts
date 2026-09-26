import { type AppExecutor, WorkspaceExecutor } from "./executors";
import { createSshTunnel } from "./sshTunnel";

interface TunnelOption {
  app: AppExecutor;
  environment: string;
  port?: number;
}
export const createTunnel = async (
  service: "redis" | "postgres",
  { app, environment, port = service === "postgres" ? 5432 : 6379 }: TunnelOption,
) => {
  const { serveDomain, repoName } = WorkspaceExecutor.getBaseDevEnv();
  await createSshTunnel({
    localHost: "0.0.0.0",
    localPort: port,
    srcHost: "0.0.0.0",
    srcPort: port,
    dstHost: `${service}-0.${service}-svc.${app.name}-${environment}.svc.cluster.local`,
    dstPort: service === "postgres" ? 5432 : 6379,
    sshOptions: {
      host: `${app.name}-${environment}.${serveDomain}`,
      port: process.env.SSH_TUNNEL_PORT ? parseInt(process.env.SSH_TUNNEL_PORT) : 32767,
      username: process.env.SSH_TUNNEL_USERNAME ?? "root",
      password: process.env.SSH_TUNNEL_PASSWORD ?? repoName,
    },
  });
  return `localhost:${port}`;
};
