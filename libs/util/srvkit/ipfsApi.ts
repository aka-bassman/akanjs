import { adapt } from "akanjs/service";

import type { ModulesOptions } from "../lib/option";

export interface IpfsApiOptions {
  endpoint: string;
}

export class IpfsApi extends adapt("ipfsApi", ({ env }) => ({
  endpoint: env((options: ModulesOptions) => options.ipfs?.endpoint),
})) {
  getHttpsUri(uri: string) {
    return uri.replace("ipfs://", `${this.endpoint}/`);
  }
}
