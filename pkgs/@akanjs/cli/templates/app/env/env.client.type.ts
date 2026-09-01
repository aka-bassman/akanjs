import type { AppInfo, LibInfo } from "akanjs";

interface Dict {
  [key: string]: string;
}
export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: Dict = {}) {
  return `
export type AppClientEnv = {
  // apply public envs here
};
  `;
}
