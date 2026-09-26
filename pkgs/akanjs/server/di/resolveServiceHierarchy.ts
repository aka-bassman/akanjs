import { INJECT_META } from "akanjs/base";
import type { InjectInfo, ServiceCls } from "akanjs/service";
import { type DependencyNode, topologicalStages } from "./resolveHierarchy";

interface ServiceNode extends DependencyNode {
  service: ServiceCls;
}

export interface ServiceHierarchy {
  graph: Map<string, ServiceNode>;
  classToKey: Map<ServiceCls, string>;
  stages: string[][];
}

export function resolveServiceHierarchy(serviceMap: Map<string, ServiceCls>): ServiceHierarchy {
  const classToKey = new Map<ServiceCls, string>();
  for (const [key, service] of serviceMap) {
    classToKey.set(service, key);
  }

  const graph = new Map<string, ServiceNode>();

  for (const [key, service] of serviceMap) {
    const injectMap: Record<string, InjectInfo> = service[INJECT_META] ?? {};
    const dependencies: string[] = [];

    for (const [propKey, injectInfo] of Object.entries(injectMap)) {
      if (injectInfo.type === "service") {
        const depKey = propKey.replace(/Service$/, "");
        if (serviceMap.has(depKey) && depKey !== key) {
          dependencies.push(depKey);
        }
      } else if (injectInfo.type === "database") {
        const depKey = propKey.replace(/Model$/, "");
        if (serviceMap.has(depKey) && depKey !== key) {
          dependencies.push(depKey);
        }
      }
    }

    graph.set(key, { key, service, dependencies });
  }
  const stages = topologicalStages(graph);

  return { graph, classToKey, stages };
}
