import { StToolBuilder, type StToolMeta } from "./StToolBuilder";

export class StToolDraft {
  readonly #name: string | null;
  readonly #meta: StToolMeta;

  constructor(name: string | null, meta: StToolMeta = {}) {
    this.#name = name;
    this.#meta = meta;
  }

  desc(text: string): StToolBuilder {
    return new StToolBuilder(this.#name, text, this.#meta);
  }
}
