import { getApiPrefix } from "akanjs/base";

const DEFAULT_DISALLOW_PATHS = ["/_akan", "/admin", "/manager", "/private"] as const;

export function createDefaultRobotsTxt(): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...[getApiPrefix(), ...DEFAULT_DISALLOW_PATHS].map((path) => `Disallow: ${path}`),
  ];
  return `${lines.join("\n")}\n`;
}
