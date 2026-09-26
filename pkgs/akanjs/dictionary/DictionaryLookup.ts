import { pathGetLoose } from "akanjs/common";
import { DictionaryRegistry } from "./dictionaryRegistry";
import type { DictionaryNode } from "./trans";

/** A missing key reads `undefined` (unlike `translate`, which echoes it); the root is snapshotted per instance. */
export class DictionaryLookup {
  readonly language: string;
  readonly #models: Record<string, DictionaryNode>;
  constructor(language?: string) {
    const root = DictionaryRegistry.getRoot();
    this.language = language && root[language] ? language : (Object.keys(root).at(0) ?? "en");
    this.#models = root[this.language] ?? {};
  }

  /** A bare refName names the model node itself, which holds no text of its own — its label is `<refName>.modelName`. */
  text(key: string): string | undefined {
    const [refName, ...rest] = key.split(".");
    if (!refName) return undefined;
    const model = this.#models[refName];
    const node = (rest.length ? pathGetLoose(rest, model) : model) as { t?: unknown } | null;
    const text = node?.t;
    return typeof text === "string" && text.length ? text : undefined;
  }
}
