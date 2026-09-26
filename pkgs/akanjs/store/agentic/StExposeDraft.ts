import type { AgentFieldType } from "./AgentValue";
import { StExposeBuilder, type StExposeMeta } from "./StExposeBuilder";

export class StExposeDraft<T extends AgentFieldType> {
  readonly #name: string | null;
  readonly #type: T;
  readonly #meta: StExposeMeta;

  constructor(name: string | null, type: T, meta: StExposeMeta = {}) {
    this.#name = name;
    this.#type = type;
    this.#meta = meta;
  }

  desc(text: string): StExposeBuilder<T> {
    return new StExposeBuilder(this.#name, this.#type, text, this.#meta);
  }
}
