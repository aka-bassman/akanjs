import {
  diagramLineHeight,
  diagramMinBoxWidth,
  type FlowTone,
  measureBoxWidth,
  measureTextWidth,
} from "./diagram.util";

export type { FlowTone };
export type FlowDirection = "LR" | "TB";

export interface FlowNodeInput {
  label: string;
  lines?: string[];
  tone?: FlowTone;
}

export interface FlowEdgeOption {
  label?: string;
  dashed?: boolean;
}

export type FlowEdge<K extends string> = [K, K] | [K, K, FlowEdgeOption];

export interface FlowLayoutNode<K extends string> {
  id: K;
  label: string;
  lines: string[];
  tone: FlowTone;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlowLayoutEdge {
  key: string;
  path: string;
  arrow: string;
  dashed: boolean;
  label: string;
  labelX: number;
  labelY: number;
  labelWidth: number;
}

export const flowMinNodeWidth = diagramMinBoxWidth;

const lineHeight = diagramLineHeight;
const boxPadding = 24;
const inLevelGap = 18;
const horizontalLevelGap = 78;
const tightLevelGap = 48;
const verticalLevelGap = 60;
const labelPadding = 14;
const arrowLength = 9;
const arrowHalf = 4.5;

interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

const centerOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const heightOf = (node: FlowNodeInput) => boxPadding + (1 + (node.lines?.length ?? 0)) * lineHeight;

export class FlowLayout<K extends string> {
  readonly nodes: FlowLayoutNode<K>[];
  readonly edges: FlowLayoutEdge[];
  readonly width: number;
  readonly height: number;

  constructor(nodes: Record<K, FlowNodeInput>, edges: FlowEdge<K>[], direction: FlowDirection = "LR") {
    const idList = Object.keys(nodes) as K[];
    const heights = new Map<K, number>(idList.map((id) => [id, heightOf(nodes[id])]));
    const widths = new Map<K, number>(idList.map((id) => [id, measureBoxWidth(nodes[id].label, nodes[id].lines)]));
    const parents = new Map<K, K[]>();
    const childCount = new Map<K, number>();
    const accepted: { from: K; to: K; option: FlowEdgeOption }[] = [];

    for (const [from, to, option = {}] of edges) {
      // An id left out of the map is an authoring mistake the types already reject; the layout keeps going.
      if (from === to || !(from in nodes) || !(to in nodes)) continue;
      accepted.push({ from, to, option });
      parents.set(to, [...(parents.get(to) ?? []), from]);
      childCount.set(from, (childCount.get(from) ?? 0) + 1);
    }

    const placement = this.#place(
      idList,
      heights,
      widths,
      parents,
      childCount,
      direction,
      // The wider gap exists to hold an edge label; without one the columns can sit closer.
      accepted.some((edge) => edge.option.label) ? horizontalLevelGap : tightLevelGap,
    );
    const places = [...placement.values()];
    const shiftX = Math.min(0, ...places.map((place) => place.x));
    const shiftY = Math.min(0, ...places.map((place) => place.y));

    this.nodes = idList.map((id) => {
      const node = nodes[id];
      const place = placement.get(id) ?? { x: 0, y: 0, width: flowMinNodeWidth, height: 0 };
      return {
        id,
        label: node.label,
        lines: node.lines ?? [],
        tone: node.tone ?? "default",
        x: Math.round(place.x - shiftX),
        y: Math.round(place.y - shiftY),
        width: place.width,
        height: place.height,
      };
    });

    const geometry = new Map(this.nodes.map((node) => [node.id, node]));
    this.edges = accepted.map(({ from, to, option }) => {
      const source = geometry.get(from) ?? { x: 0, y: 0, width: 0, height: 0 };
      const target = geometry.get(to) ?? { x: 0, y: 0, width: 0, height: 0 };
      const label = option.label ?? "";
      const path = this.#connect(source, target, direction);
      return {
        key: `${from}>${to}`,
        dashed: option.dashed ?? false,
        label,
        labelWidth: label ? measureTextWidth(label) + labelPadding : 0,
        ...path,
      };
    });

    this.width = this.nodes.length ? Math.round(Math.max(...this.nodes.map((node) => node.x + node.width))) : 0;
    this.height = this.nodes.length ? Math.round(Math.max(...this.nodes.map((node) => node.y + node.height))) : 0;
  }

  #place(
    idList: K[],
    heights: Map<K, number>,
    widths: Map<K, number>,
    parents: Map<K, K[]>,
    childCount: Map<K, number>,
    direction: FlowDirection,
    levelGap: number,
  ): Map<K, Placement> {
    const levels = FlowLayout.levelsOf(idList, parents);
    const placement = new Map<K, Placement>();
    let levelOrigin = 0;

    for (const level of [...new Set(levels.values())].sort((a, b) => a - b)) {
      const members = idList.filter((id) => levels.get(id) === level);
      // One width per level keeps the columns aligned; the widest label in the level decides it.
      const levelWidth = Math.max(...members.map((id) => widths.get(id) ?? flowMinNodeWidth));
      // TB draws every node in a level at that width, so spacing has to use it too — spacing by a node's
      // own width lets two boxes in one row overlap once their labels differ in length.
      const crossSpan = (id: K) => (direction === "LR" ? (heights.get(id) ?? 0) : levelWidth);
      let slot = 0;
      const slots = new Map<K, number>();
      for (const id of members) {
        slots.set(id, slot + crossSpan(id) / 2);
        slot += crossSpan(id) + inLevelGap;
      }

      // Cross-axis first, laid out against the centers of already placed parents, then pushed apart in that order.
      const wanted = members
        .map((id) => {
          const from = (parents.get(id) ?? [])
            .map((parent) => placement.get(parent))
            .filter((parent): parent is Placement => !!parent)
            .map((parent) => (direction === "LR" ? parent.y + parent.height / 2 : parent.x + parent.width / 2));
          return { id, want: from.length ? centerOf(from) : (slots.get(id) ?? 0) };
        })
        // A node that continues the diagram takes the spot its parents point at; a terminal branch is pushed aside.
        .sort((a, b) => a.want - b.want || (childCount.get(b.id) ?? 0) - (childCount.get(a.id) ?? 0));

      let edge = Number.NEGATIVE_INFINITY;
      for (const item of wanted) {
        const span = crossSpan(item.id);
        const center = Math.max(item.want, edge + inLevelGap + span / 2);
        const height = heights.get(item.id) ?? 0;
        placement.set(item.id, {
          x: direction === "LR" ? levelOrigin : center - levelWidth / 2,
          y: direction === "LR" ? center - height / 2 : levelOrigin,
          width: levelWidth,
          height,
        });
        edge = center + span / 2;
      }

      // LR advances by the column width it just laid out; TB advances by the tallest node in the level.
      const levelSpan = Math.max(...members.map((id) => heights.get(id) ?? 0));
      levelOrigin += (direction === "LR" ? levelWidth : levelSpan) + (direction === "LR" ? levelGap : verticalLevelGap);
    }

    return placement;
  }

  static levelsOf<K extends string>(idList: K[], parents: Map<K, K[]>): Map<K, number> {
    const levels = new Map<K, number>(idList.map((id) => [id, 0]));
    const children = new Map<K, K[]>();

    for (const [child, from] of parents) {
      for (const parent of from) {
        children.set(parent, [...(children.get(parent) ?? []), child]);
      }
    }

    // An edge back into a node the walk is still inside is the one that closes a cycle: it constrains no level
    // and is drawn as the backward arrow it is.
    const backEdges = new Set<string>();
    const open = new Set<K>();
    const done = new Set<K>();
    const mark = (id: K) => {
      open.add(id);
      for (const child of children.get(id) ?? []) {
        if (open.has(child)) {
          backEdges.add(`${id}>${child}`);
          continue;
        }
        if (!done.has(child)) mark(child);
      }
      open.delete(id);
      done.add(id);
    };
    for (const id of idList) {
      if (!done.has(id)) mark(id);
    }

    const incoming = new Map<K, number>(idList.map((id) => [id, 0]));
    for (const [child, from] of parents) {
      for (const parent of from) {
        if (backEdges.has(`${parent}>${child}`)) continue;
        incoming.set(child, (incoming.get(child) ?? 0) + 1);
      }
    }

    const queue = idList.filter((id) => (incoming.get(id) ?? 0) === 0);
    for (let index = 0; index < queue.length; index += 1) {
      const id = queue[index];
      if (id === undefined) break;
      for (const child of children.get(id) ?? []) {
        if (backEdges.has(`${id}>${child}`)) continue;
        levels.set(child, Math.max(levels.get(child) ?? 0, (levels.get(id) ?? 0) + 1));
        const left = (incoming.get(child) ?? 1) - 1;
        incoming.set(child, left);
        if (left === 0) queue.push(child);
      }
    }

    return levels;
  }

  #connect(from: Placement, to: Placement, direction: FlowDirection) {
    if (direction === "LR") {
      const startX = from.x + from.width;
      const startY = from.y + from.height / 2;
      const endX = to.x;
      const endY = to.y + to.height / 2;
      const middleX = (startX + endX) / 2;
      const back = endX - arrowLength;
      return {
        path: `M ${startX} ${startY} C ${middleX} ${startY} ${middleX} ${endY} ${endX} ${endY}`,
        arrow: `M ${endX} ${endY} L ${back} ${endY - arrowHalf} L ${back} ${endY + arrowHalf} Z`,
        labelX: middleX,
        labelY: (startY + endY) / 2,
      };
    }

    const startX = from.x + from.width / 2;
    const startY = from.y + from.height;
    const endX = to.x + to.width / 2;
    const endY = to.y;
    const middleY = (startY + endY) / 2;
    const back = endY - arrowLength;
    return {
      path: `M ${startX} ${startY} C ${startX} ${middleY} ${endX} ${middleY} ${endX} ${endY}`,
      arrow: `M ${endX} ${endY} L ${endX - arrowHalf} ${back} L ${endX + arrowHalf} ${back} Z`,
      labelX: (startX + endX) / 2,
      labelY: middleY,
    };
  }
}
