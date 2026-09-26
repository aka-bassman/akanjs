import type { AgentFieldType } from "./AgentValue";
import { StStateBuilder, type StStateMeta } from "./StStateBuilder";

export class StStateDraft<T extends AgentFieldType> {
  readonly #name: string | null;
  readonly #type: T;
  readonly #meta: StStateMeta;

  constructor(name: string | null, type: T, meta: StStateMeta = {}) {
    this.#name = name;
    this.#type = type;
    this.#meta = meta;
  }

  desc(text: string): StStateBuilder<T> {
    return new StStateBuilder(this.#name, this.#type, text, this.#meta);
  }
}
