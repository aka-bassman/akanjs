import {
  diagramLineHeight,
  diagramMinBoxWidth,
  type FlowTone,
  measureBoxWidth,
  measureTextWidth,
} from "./diagram.util";

export interface SequenceActorInput {
  label: string;
  lines?: string[];
  tone?: FlowTone;
}

export interface SequenceMessageInput<K extends string> {
  from: K;
  to: K;
  label: string;
  lines?: string[];
  dashed?: boolean;
  note?: string;
}

export interface SequenceActor<K extends string> {
  id: K;
  label: string;
  lines: string[];
  tone: FlowTone;
  x: number;
  width: number;
}

export interface SequenceMessage {
  key: string;
  path: string;
  arrow: string;
  dashed: boolean;
  labelX: number;
  labelY: number;
  labelWidth: number;
  labelLines: string[];
  selfLoop: boolean;
}

export interface SequenceNote {
  y: number;
  height: number;
  text: string;
}

const headerPadding = 30;
const actorGap = 40;
const lineHeight = diagramLineHeight;
const labelRowPadding = 22;
const noteHeight = 32;
const noteGap = 10;
const arrowLength = 9;
const arrowHalf = 4.5;
const selfLoopWidth = 52;
const bottomPadding = 26;

export class SequenceLayout<K extends string> {
  readonly actors: SequenceActor<K>[];
  readonly messages: SequenceMessage[];
  readonly notes: SequenceNote[];
  readonly headerHeight: number;
  readonly width: number;
  readonly height: number;

  constructor(actors: Record<K, SequenceActorInput>, messages: SequenceMessageInput<K>[]) {
    const idList = Object.keys(actors) as K[];
    const widths = new Map<K, number>(idList.map((id) => [id, measureBoxWidth(actors[id].label, actors[id].lines)]));
    const widest = Math.max(diagramMinBoxWidth, ...widths.values());
    const pitch = widest + actorGap;
    const headerHeight = Math.max(
      headerPadding + lineHeight,
      ...idList.map((id) => headerPadding + (1 + (actors[id].lines?.length ?? 0)) * lineHeight),
    );
    this.headerHeight = headerHeight;

    this.actors = idList.map((id, index) => {
      const width = widths.get(id) ?? diagramMinBoxWidth;
      const center = widest / 2 + index * pitch;
      return {
        id,
        label: actors[id].label,
        lines: actors[id].lines ?? [],
        tone: actors[id].tone ?? "default",
        x: center - width / 2,
        width,
      };
    });

    const centerOf = new Map(this.actors.map((actor) => [actor.id, actor.x + actor.width / 2]));
    this.messages = [];
    this.notes = [];
    let cursor = headerHeight + labelRowPadding;

    for (const [index, message] of messages.entries()) {
      const lines = message.label ? [message.label, ...(message.lines ?? [])] : [];
      const labelHeight = lines.length * lineHeight;
      const from = centerOf.get(message.from) ?? 0;
      const to = centerOf.get(message.to) ?? 0;
      const selfLoop = from === to;
      const labelWidth = selfLoop
        ? Math.max(selfLoopWidth * 2, ...lines.map((line) => measureTextWidth(line) + 24))
        : Math.abs(to - from) + actorGap;
      const labelX = selfLoop ? from + 6 + labelWidth / 2 : (from + to) / 2;
      const arrowY = cursor + labelHeight + labelRowPadding - 6;

      this.messages.push({
        key: `${message.from}>${message.to}#${index}`,
        dashed: message.dashed ?? false,
        labelX,
        labelY: cursor,
        labelWidth,
        labelLines: lines,
        selfLoop,
        ...this.#arrow(from, to, arrowY),
      });

      cursor = arrowY + labelRowPadding;

      if (message.note) {
        this.notes.push({ y: cursor - 4, height: noteHeight, text: message.note });
        cursor += noteHeight + noteGap;
      }
    }

    this.width = Math.round(widest + pitch * (idList.length - 1));
    this.height = Math.round(Math.max(cursor + bottomPadding, headerHeight + bottomPadding));
  }

  #arrow(from: number, to: number, arrowY: number) {
    if (from === to) {
      const right = from + selfLoopWidth;
      return {
        path: `M ${from} ${arrowY - 12} L ${right} ${arrowY - 12} L ${right} ${arrowY + 12} L ${from} ${arrowY + 12}`,
        arrow: `M ${from} ${arrowY + 12} L ${from + arrowLength} ${arrowY + 12 - arrowHalf} L ${
          from + arrowLength
        } ${arrowY + 12 + arrowHalf} Z`,
      };
    }

    const direction = to > from ? 1 : -1;
    return {
      path: `M ${from} ${arrowY} L ${to} ${arrowY}`,
      arrow: `M ${to} ${arrowY} L ${to - arrowLength * direction} ${arrowY - arrowHalf} L ${
        to - arrowLength * direction
      } ${arrowY + arrowHalf} Z`,
    };
  }
}
