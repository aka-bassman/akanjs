import type { Head, ResolvedHead, ResolveHeadResult } from "akanjs/client";
import { AKAN_RSC_HEAD_SNAPSHOT_VERSION, type AkanHeadSnapshotV1 } from "./routeState";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function createAkanLocaleAlternateHeadSnapshot(languages: Record<string, string>): AkanHeadSnapshotV1 {
  return {
    version: AKAN_RSC_HEAD_SNAPSHOT_VERSION,
    nodes: Object.entries(languages).map(([lang, href]) => ({
      tag: "link",
      attrs: { rel: "alternate", hrefLang: lang, href },
    })),
  };
}

export function mergeAkanHeadSnapshots(
  ...snapshots: Array<AkanHeadSnapshotV1 | null | undefined>
): AkanHeadSnapshotV1 | undefined {
  const nodes = snapshots.flatMap((snapshot) => snapshot?.nodes ?? []);
  return snapshots.some(Boolean) ? { version: AKAN_RSC_HEAD_SNAPSHOT_VERSION, nodes } : undefined;
}

export function renderAkanHeadSnapshot(snapshot: AkanHeadSnapshotV1): Head {
  return (
    <>
      {snapshot.nodes.map((node, index) => {
        const marker = {
          "data-akan-head": "route",
          "data-akan-head-key": `${node.tag}:${index}`,
        };
        if (node.tag === "title") {
          return (
            <title key={`${node.tag}:${index}`} {...marker}>
              {node.text ?? ""}
            </title>
          );
        }
        if (node.tag === "meta") {
          return <meta key={`${node.tag}:${index}`} {...node.attrs} {...marker} />;
        }
        return <link key={`${node.tag}:${index}`} {...node.attrs} {...marker} />;
      })}
    </>
  );
}

export function shouldRenderLocaleAlternates(options: { isSpecialRoute?: boolean }): boolean {
  return options.isSpecialRoute !== true;
}

export function isResolvedHead(value: unknown): value is ResolvedHead {
  return isRecord(value) && "node" in value;
}

export function resolveHeadResult(value: ResolveHeadResult): ResolvedHead {
  if (isResolvedHead(value)) return value;
  return { node: value };
}
