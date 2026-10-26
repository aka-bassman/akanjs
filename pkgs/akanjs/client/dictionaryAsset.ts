import { type Dictionary, TranslatorState } from "./translatorState";

interface DictionaryModule {
  lang: string;
  default: Dictionary;
}

export class DictionaryAsset {
  static readonly #loads = new Map<string, Promise<void>>();

  static load(url: string | null | undefined): Promise<void> {
    if (!url) return Promise.resolve();
    const loading = DictionaryAsset.#loads.get(url) ?? DictionaryAsset.#import(url);
    DictionaryAsset.#loads.set(url, loading);
    return loading;
  }

  static async #import(url: string): Promise<void> {
    try {
      const { lang, default: dictionary } = (await import(url)) as DictionaryModule;
      TranslatorState.replace(lang, dictionary);
    } catch (error) {
      DictionaryAsset.#loads.delete(url);
      throw error;
    }
  }
}
