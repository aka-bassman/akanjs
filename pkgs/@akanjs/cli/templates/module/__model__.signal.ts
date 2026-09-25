import type { AppInfo, LibInfo } from "akanjs";

interface Dict {
  Model: string;
  model: string;
  models: string;
  sysName: string;
}
interface Options {
  sharedGuards?: boolean;
}
export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: Dict, options: Options = {}) {
  // Admin lives in libs/shared; without it root and cru stay None, shut until the app names a guard of its own.
  const guardImports = options.sharedGuards
    ? `import { Admin } from "@libs/shared/srvkit";\nimport { endpoint, internal, Public, slice } from "akanjs/signal";`
    : `import { endpoint, internal, None, Public, slice } from "akanjs/signal";`;
  const writeGuard = options.sharedGuards ? "Admin" : "None";
  return `
${guardImports}

import * as srv from "../srv";

export class ${dict.Model}Internal extends internal(srv.${dict.model}, ({ interval }) => ({})) {}

export class ${dict.Model}Slice extends slice(srv.${dict.model}, { guards: { root: ${writeGuard}, get: Public, cru: ${writeGuard} } }, (init) => ({
  inPublic: init({ guards: [Public] })
    .exec(function () {
      return this.${dict.model}Service.queryAny();
    }),
})) {}

export class ${dict.Model}Endpoint extends endpoint(srv.${dict.model}, ({ query, mutation }) => ({})) {}
`;
}
