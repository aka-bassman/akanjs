import type { AppInfo, LibInfo } from "akanjs";

export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: { appName: string }) {
  return {
    filename: "noti.signal.ts",
    content: `import { dayjs } from "akanjs/base";
import { endpoint } from "akanjs/signal";

import * as srv from "../srv";

// ===== noti.signal.ts =====
// Convention: <module>.signal.ts for a pure service module.
// Extends endpoint(srv.<module>, ...) — pubsub endpoint for real-time server→client communication.
// pubsub() is the Akan.js convention for publish-subscribe: server publishes, all connected clients receive.
// Client subscribes via fetch.subscribeSend((data) => { ... }).
// Registered by akan scan into sig.ts barrel.

export class NotiEndpoint extends endpoint(srv.noti, ({ pubsub }) => ({

})) {}

// ---- Expandable additional fields: ----
//   history: query(NotiHistory)
//     .param("userId", String)
//     .exec(async function (userId) {
//       return await this.notiService.getHistory(userId);
//     }),
`,
  };
}
