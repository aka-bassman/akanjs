import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

/**
 * The engine's `Model` type lives in `@earendil-works/pi-ai` and is not re-exported from the package we depend
 * on, so it is recovered from the one public function that returns it rather than by adding a dependency on a
 * transitive package whose version we do not control.
 */
export type CodeAgentModel = NonNullable<ReturnType<ModelRegistry["find"]>>;

export interface CodeAgentModelRef {
  provider: string;
  id: string;
}

/** DeepSeek's million-token window is what makes a 26k-token `AGENTS.md` affordable on every turn. */
export const akanCodeDefaultModel: CodeAgentModelRef = { provider: "deepseek", id: "deepseek-v4-flash" };

/**
 * Resolves the model to run with, preferring an explicit request, then the default, then anything the user has
 * credentials for.
 *
 * An empty API key produces a request that succeeds with no content rather than an error, so a provider with no
 * configured auth is skipped here instead of answering with nothing three seconds later.
 */
export const akanCodeModel = async (registry: ModelRegistry, ref?: CodeAgentModelRef) => {
  if (ref) {
    const requested = registry.find(ref.provider, ref.id);
    if (!requested) throw new Error(`Unknown model: ${ref.provider}/${ref.id}`);
    if (!registry.hasConfiguredAuth(requested))
      throw new Error(`No API key configured for ${ref.provider}. Set ${ref.provider.toUpperCase()}_API_KEY.`);
    return requested;
  }
  const fallback = registry.find(akanCodeDefaultModel.provider, akanCodeDefaultModel.id);
  if (fallback && registry.hasConfiguredAuth(fallback)) return fallback;
  return registry.getAvailable()[0];
};

/** A screenshot is worth attaching only to a model that can see it; DeepSeek takes text only. */
export const akanCodeModelSupportsImages = (model: CodeAgentModel | undefined) => !!model?.input.includes("image");

/**
 * Says so when the chosen model's window is too small for the compaction policy to leave room for a
 * conversation.
 *
 * This is deliberately the **only** descriptor check. Two more obvious ones are wrong here: `maxTokens >=
 * contextWindow` matches 153 of the engine's own 1,057 catalogue entries (`gpt-4` is declared 8192/8192, and
 * several qwen models 262000/262000), and `reserveTokens > maxTokens` matches 145 — every model with a small
 * output cap, which is normal, because the reserve is context headroom and the cap is output length. Both
 * would cry wolf on one model in seven.
 *
 * ⚠️ **A wrong descriptor that is internally consistent cannot be detected here at all.** A custom model
 * declaring a 65k window for a provider that serves 1M is coherent and simply false, and the only thing that
 * catches it is a person seeing the number — which is why the session line prints it.
 */
export const akanCodeModelWarnings = (model: CodeAgentModel | undefined, compactionFloor: number) => {
  if (!model) return [];
  if (model.contextWindow >= compactionFloor) return [];
  return [
    `${model.provider}/${model.id} declares a ${model.contextWindow}-token context window, below the ${compactionFloor} the compaction policy needs, so every turn will compact immediately. Check the model entry in ~/.akan/code/models.json.`,
  ];
};
