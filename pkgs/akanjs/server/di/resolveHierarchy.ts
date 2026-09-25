export interface DependencyNode {
  key: string;
  dependencies: string[];
}

/**
 * Groups nodes into sequential stages where all nodes within a stage
 * can be initialized concurrently (all their dependencies are satisfied
 * by earlier stages).
 */
export function topologicalStages<T extends DependencyNode>(graph: Map<string, T>): string[][] {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const [key, node] of graph) {
    inDegree.set(key, node.dependencies.length);
    dependents.set(key, []);
  }

  for (const [, node] of graph) {
    for (const dep of node.dependencies) {
      dependents.get(dep)?.push(node.key);
    }
  }

  let queue: string[] = [];
  for (const [key, degree] of inDegree) {
    if (degree === 0) queue.push(key);
  }

  const stages: string[][] = [];
  let processed = 0;

  while (queue.length > 0) {
    stages.push(queue);
    processed += queue.length;

    const next: string[] = [];
    for (const key of queue) {
      for (const dependent of dependents.get(key) ?? []) {
        const newDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) next.push(dependent);
      }
    }
    queue = next;
  }

  if (processed !== graph.size) {
    const remaining = [...graph.keys()].filter((k) => (inDegree.get(k) ?? 0) > 0);
    const cycle = traceCycle(graph, remaining);
    throw new Error(`Circular dependency detected: ${cycle.join(" → ")}`);
  }

  return stages;
}

export function traceCycle<T extends DependencyNode>(graph: Map<string, T>, candidates: string[]): string[] {
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(key: string): string[] | null {
    if (path.includes(key)) {
      const cycleStart = path.indexOf(key);
      return [...path.slice(cycleStart), key];
    }
    if (visited.has(key)) return null;
    visited.add(key);
    path.push(key);

    const node = graph.get(key);
    if (node) {
      for (const dep of node.dependencies) {
        const cycle = dfs(dep);
        if (cycle) return cycle;
      }
    }

    path.pop();
    return null;
  }

  for (const key of candidates) {
    const cycle = dfs(key);
    if (cycle) return cycle;
  }

  return candidates;
}
