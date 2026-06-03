import type { AppScanResult } from "akanjs";
import { withBase } from "../../pkgs/akanjs/capacitor.base.config";
import appInfo from "./akan.app.json";

export default withBase(
  (config, target) => ({
    ...config,
    webDir: `.akan/mobile/${target.name}/www`,
    android: {
      ...config.android,
      path: "android",
    },
    ios: {
      ...config.ios,
      path: "ios",
    },
  }),
  appInfo as AppScanResult,
);
