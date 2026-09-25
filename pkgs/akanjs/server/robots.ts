import { getApiPrefix } from "akanjs/base";

const DEFAULT_DISALLOW_PATHS = ["/_akan", "/admin", "/manager", "/private"] as const;

const DEFAULT_AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Diffbot",
  "Omgilibot",
  "Omgili",
] as const;

export function createDefaultRobotsTxt(): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...[getApiPrefix(), ...DEFAULT_DISALLOW_PATHS].map((path) => `Disallow: ${path}`),
    "",
    ...DEFAULT_AI_CRAWLERS.flatMap((crawler) => [`User-agent: ${crawler}`, "Disallow: /", ""]),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}
