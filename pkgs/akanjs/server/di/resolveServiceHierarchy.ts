import { INJECT_META } from "akanjs/base";
import type { InjectInfo, ServiceCls } from "akanjs/service";
import { type DependencyNode, topologicalStages } from "./resolveHierarchy";

interface ServiceNode extends DependencyNode {
  service: ServiceCls;
}

export interface ServiceHierarchy {
  graph: Map<string, ServiceNode>;
  stages: string[][];
}

export function resolveServiceHierarchy(serviceMap: Map<string, ServiceCls>): ServiceHierarchy {
  const graph = new Map<string, ServiceNode>();

  for (const [key, service] of serviceMap) {
    const injectMap: Record<string, InjectInfo> = service[INJECT_META] ?? {};
    const dependencies: string[] = [];

    for (const [propKey, { type }] of Object.entries(injectMap)) {
      if (type !== "service" && type !== "database") continue;
      const depKey = propKey.replace(type === "service" ? /Service$/ : /Model$/, "");
      if (serviceMap.has(depKey) && depKey !== key) dependencies.push(depKey);
    }

    graph.set(key, { key, service, dependencies });
  }
  const stages = topologicalStages(graph);

  return { graph, stages };
}
