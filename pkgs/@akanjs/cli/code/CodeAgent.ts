import type { Workspace } from "@akanjs/devkit/commandDecorators";
import {
  type AgentSession,
  createAgentSession,
  DEFAULT_COMPACTION_SETTINGS,
  DefaultResourceLoader,
  type ExtensionAPI,
  type InlineExtension,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import {
  type CodeAgentAnswer,
  type CodeAgentEvent,
  type CodeAgentEventBody,
  type CodeAgentImage,
  type CodeAgentProfile,
  type CodeAgentQuestion,
  type CodeAgentSessionInfo,
  type CodeAgentState,
  codeAgentClip,
  codeAgentLabelChars,
  codeAgentRenderAnswer,
} from "akanjs/common";
import { AkanCodePlugins } from "./AkanCodePlugins";
import { AkanCodeServices } from "./AkanCodeServices";
import {
  akanCodeModel,
  akanCodeModelSupportsImages,
  akanCodeModelWarnings,
  type CodeAgentModelRef,
} from "./akanCodeModel";
import { akanCodePaths } from "./akanCodePaths";
import { CodeAgentAsks } from "./CodeAgentAsks";
import { CodeAgentEventMapper } from "./CodeAgentEventMapper";
import { CodeAgentGate } from "./CodeAgentGate";
import { CodeAgentUi } from "./CodeAgentUi";

/**
 * What the engine calls a run mode. It is not re-exported from the package entry, so the literal set is
 * restated here; it is the whole type, and a mismatch is a type error at the one call site that uses it.
 */
export type CodeAgentHostMode = "tui" | "rpc" | "json" | "print";

export interface CodeAgentOptions {
  workspace: Workspace;
  cwd?: string;
  profile: CodeAgentProfile;
  model?: CodeAgentModelRef;
  /** Apps whose dev server and preview the turn-end feedback loop watches. */
  apps?: string[];
  /** Extra capability packs, layered on top of the profile gate and the akan pack. */
  extensions?: InlineExtension[];
  customTools?: ToolDefinition[];
  /** `print` for a one-shot stream, `rpc` when a host drives this process over stdio. */
  mode?: CodeAgentHostMode;
  /** How many `task` tools deep this agent already is. A sub-agent is created one level down. */
  depth?: number;
}

/**
 * The code agent core: one engine session, gated by a profile, emitting the akan wire.
 *
 * Nothing here knows what a host is. A host receives events, sends commands and injects a profile — which is
 * what lets one core serve a terminal, an RPC child and a browser without three copies of the loop.
 */
export class CodeAgent {
  readonly #profile: CodeAgentProfile;
  readonly #gate: CodeAgentGate;
  readonly #mapper = new CodeAgentEventMapper();
  readonly #asks = new CodeAgentAsks();
  readonly #listeners = new Set<(event: CodeAgentEvent) => void>();
  #session: AgentSession | undefined;
  #disposePlugins: (() => void) | undefined;
  #seq = 0;
  #disposed = false;
  /**
   * The frames of the turn in flight, so a host that reconnects mid-turn can be handed what it missed.
   *
   * Bounded and cleared at `idle`: the completed messages of an earlier turn are in the transcript, and the
   * only thing that exists nowhere else is the bubble still being written.
   */
  readonly #replay: CodeAgentEvent[] = [];
  #replayFrom = 0;
  #lastContextTokens: number | undefined;

  private constructor(profile: CodeAgentProfile) {
    this.#profile = profile;
    this.#gate = new CodeAgentGate(profile);
  }

  static async create(options: CodeAgentOptions) {
    const workspaceRoot = options.workspace.workspaceRoot;
    const cwd = options.cwd ?? workspaceRoot;
    const agent = new CodeAgent(options.profile);
    const settingsManager = AkanCodeServices.settings();
    const authStorage = AkanCodeServices.auth(workspaceRoot);
    const modelRegistry = AkanCodeServices.models(authStorage);
    const model = await akanCodeModel(modelRegistry, options.model);
    const compaction = DEFAULT_COMPACTION_SETTINGS;
    const modelWarnings = akanCodeModelWarnings(model, compaction.reserveTokens + compaction.keepRecentTokens);

    const akan = await AkanCodePlugins.build({
      workspace: options.workspace,
      cwd,
      profile: options.profile,
      apps: options.apps ?? [],
      canSeeImages: akanCodeModelSupportsImages(model),
      depth: options.depth ?? 0,
      currentSessionId: () => agent.sessionId,
      onNotice: (message) => agent.#emit({ type: "notice", level: "warning", message }),
    });

    const resourceLoader = new DefaultResourceLoader({
      cwd,
      agentDir: akanCodePaths.globalDir(),
      settingsManager,
      ...AkanCodeServices.resourceOptions({
        workspaceRoot,
        cwd,
        profile: options.profile,
        extensions: [agent.#gateExtension(), ...akan.extensions, ...(options.extensions ?? [])],
      }),
    });
    await resourceLoader.reload();

    const { session } = await createAgentSession({
      cwd,
      agentDir: akanCodePaths.globalDir(),
      authStorage,
      modelRegistry,
      settingsManager,
      resourceLoader,
      model,
      sessionManager: AkanCodeServices.sessions(workspaceRoot, cwd, options.profile),
      noTools: "builtin",
      tools: [...options.profile.tools.builtin, ...akan.toolNames],
      customTools: options.customTools,
    });
    agent.#disposePlugins = akan.dispose;
    await agent.#attach(session, options.mode ?? "print");
    for (const message of modelWarnings) agent.#emit({ type: "notice", level: "warning", message });
    return agent;
  }

  get profile() {
    return this.#profile;
  }

  get sessionId() {
    return this.#session?.sessionId ?? "";
  }

  get isStreaming() {
    return this.#session?.isStreaming ?? false;
  }

  /** Total tokens this session has spent, which is what a sub-agent budget is drawn down against. */
  get tokensUsed() {
    return this.#session?.getSessionStats().tokens.total ?? 0;
  }

  get info(): CodeAgentSessionInfo {
    const session = this.#require();
    const model = session.model;
    return {
      sessionId: session.sessionId,
      cwd: this.#profile.paths.root,
      profile: this.#profile.name,
      model: model ? { provider: model.provider, id: model.id, name: model.name } : undefined,
      tools: session.getActiveToolNames(),
      contextTokens: model?.contextWindow,
      interaction: this.#profile.interaction,
    };
  }

  /**
   * Emits the opening `session` frame through the same counter as everything else.
   *
   * A frame minted outside it would carry `seq: 0`, which every client drops — their watermark starts there.
   */
  announce() {
    this.#emit({ type: "session", info: this.info });
  }

  on(listener: (event: CodeAgentEvent) => void) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** One turn's worth of frames is kept for reconnection; a client further behind reloads the transcript. */
  static readonly replayLimit = 2_000;

  /**
   * Current state, and the frames after `sinceSeq` when a reconnecting host asks for them.
   *
   * `replayFrom` says how far back the buffer reaches. A client behind it cannot be caught up frame by frame
   * and has to reload — saying so is better than silently handing it a gap.
   */
  async state({ sinceSeq }: { sinceSeq?: number } = {}): Promise<CodeAgentState> {
    const base = { info: this.info, streaming: this.isStreaming, replayFrom: this.#replayFrom };
    if (sinceSeq === undefined) return base;
    return { ...base, frames: this.#replay.filter((event) => event.seq > sinceSeq) };
  }

  async prompt(message: string, images?: CodeAgentImage[]) {
    const session = this.#require();
    const attachments = await CodeAgent.#attachments(images);
    const options = attachments.length ? { images: attachments } : {};
    if (session.isStreaming) return await session.prompt(message, { ...options, streamingBehavior: "followUp" });
    await session.prompt(message, { ...options, source: "extension" });
  }

  async abort() {
    // The engine finalizes an interrupted message as an ordinary stop, so the only party that knows this was
    // an abort is the one that asked for it.
    this.#mapper.noteOutcome("aborted");
    this.#asks.clear();
    await this.#require().abort();
  }

  /**
   * Answering is not prompting. Routing an answer through `prompt` would open a turn while the question slot is
   * still filled, leaving a card on screen that still looks clickable — the library does not stop that.
   */
  async answer(questionId: string, answer: CodeAgentAnswer) {
    const question = this.#asks.questionOf(questionId);
    const rendered = question ? codeAgentRenderAnswer(question, answer) : (answer.text ?? "");
    if (this.#asks.answer(questionId, rendered)) {
      this.#emit({ type: "question_resolved", questionId, answer, rendered });
      return true;
    }
    if (this.#profile.interaction.question !== "suspend") return false;
    this.#emit({ type: "question_resolved", questionId, answer, rendered });
    // The answer has to reach the model as prose: compaction and the next turn read message content only, so
    // an answer that exists solely as structure is one the agent will not remember being given.
    await this.prompt(`The user answered: ${rendered}\nContinue the task.`);
    return true;
  }

  async approve(approvalId: string, approved: boolean) {
    if (this.#asks.resolveApproval(approvalId, approved)) {
      this.#emit({ type: "approval_resolved", approvalId, approved });
      return true;
    }
    if (this.#profile.interaction.approval !== "suspend") return false;
    this.#emit({ type: "approval_resolved", approvalId, approved });
    if (approved) await this.prompt("The user approved the pending action. Retry it and continue.");
    return true;
  }

  async compact(instructions?: string) {
    await this.#require().compact(instructions);
  }

  async setModel(ref: CodeAgentModelRef) {
    const session = this.#require();
    const model = await akanCodeModel(session.modelRegistry, ref);
    if (!model) throw new Error(`Unknown model: ${ref.provider}/${ref.id}`);
    await session.setModel(model);
    this.#emit({ type: "session", info: this.info });
  }

  async waitForIdle() {
    await this.#require().waitForIdle();
  }

  dispose() {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#asks.clear();
    this.#listeners.clear();
    this.#disposePlugins?.();
    this.#session?.dispose();
  }

  async #attach(session: AgentSession, mode: CodeAgentHostMode) {
    this.#session = session;
    session.subscribe((event) => {
      for (const body of this.#mapper.map(event)) this.#emit(body);
      this.#emitContextUsage(event.type);
    });
    await session.bindExtensions({
      mode,
      uiContext: this.#ui().context(),
      abortHandler: () => void session.abort(),
      onError: (error: unknown) => this.#emit({ type: "error", message: String(error), fatal: false }),
    });
  }

  /** A path is read here rather than by the host, so a browser and a terminal hand the core the same thing. */
  static async #attachments(images: CodeAgentImage[] | undefined) {
    if (!images?.length) return [];
    return await Promise.all(
      images.map(async (image) => {
        if ("data" in image) return { type: "image" as const, data: image.data, mimeType: image.mime };
        const file = Bun.file(image.path);
        return {
          type: "image" as const,
          data: Buffer.from(await file.arrayBuffer()).toString("base64"),
          mimeType: file.type || "image/png",
        };
      }),
    );
  }

  /**
   * Reports how full the window is, once per turn and after a compaction.
   *
   * Per turn rather than per delta: the number moves only when a provider response lands, and a frame per
   * token delta would be thousands of frames saying the same thing. `tokens` is null right after a compaction
   * and before the next response — that is "unknown", not zero, so nothing is emitted for it.
   */
  #emitContextUsage(eventType: string) {
    if (eventType !== "agent_end" && eventType !== "compaction_end") return;
    const usage = this.#session?.getContextUsage();
    // `== null`, not `=== null`: the field is typed `number | null`, and a strict null check sails straight
    // past an `undefined` the way the mirror of this bug does — which would emit `used: undefined`.
    if (usage?.tokens == null) return;
    if (usage.tokens === this.#lastContextTokens) return;
    this.#lastContextTokens = usage.tokens;
    this.#emit({ type: "context", used: usage.tokens, max: usage.contextWindow || undefined });
  }

  #require() {
    if (!this.#session) throw new Error("CodeAgent is not started");
    return this.#session;
  }

  #emit(body: CodeAgentEventBody) {
    this.#seq += 1;
    const event = { ...body, seq: this.#seq } as CodeAgentEvent;
    this.#remember(event);
    for (const listener of this.#listeners) listener(event);
  }

  #remember(event: CodeAgentEvent) {
    if (event.type === "idle") {
      this.#replay.length = 0;
      this.#replayFrom = event.seq;
      return;
    }
    this.#replay.push(event);
    while (this.#replay.length > CodeAgent.replayLimit) {
      const dropped = this.#replay.shift();
      this.#replayFrom = dropped?.seq ?? this.#replayFrom;
    }
  }

  #gateExtension(): InlineExtension {
    return {
      name: "akan-profile-gate",
      factory: (pi: ExtensionAPI) => {
        pi.on("tool_call", async (event) => {
          const verdict = this.#gate.verdict(event.toolName, event.input);
          if (verdict.block) return this.#refuse(event.toolCallId, event.toolName, event.input, verdict.block);
          if (!verdict.approval) return undefined;
          const approved = await this.#requestApproval(event.toolCallId, event.toolName, event.input, verdict.approval);
          if (approved) return undefined;
          return this.#refuse(event.toolCallId, event.toolName, event.input, "The user declined this action.");
        });
      },
    };
  }

  #refuse(toolCallId: string, toolName: string, args: unknown, reason: string) {
    for (const body of this.#mapper.markBlocked(toolCallId, toolName, args, reason)) this.#emit(body);
    return { block: true, reason };
  }

  async #requestApproval(toolCallId: string, name: string, args: unknown, summary: string) {
    // Nobody to ask means nobody to refuse: a pod would otherwise deny every write it was created to make.
    if (!this.#profile.ui.canPrompt) return true;
    const approvalId = this.#asks.nextId("a");
    this.#emit({
      type: "approval",
      request: {
        approvalId,
        toolCallId,
        name,
        summary: codeAgentClip(summary, codeAgentLabelChars),
        policy: this.#profile.approval,
      },
    });
    if (this.#profile.interaction.approval === "suspend") {
      this.#mapper.noteOutcome("awaiting");
      return false;
    }
    return await this.#asks.openApproval(approvalId);
  }

  #ui() {
    return new CodeAgentUi({
      ask: async (prompt, kind, choices) => {
        if (!this.#profile.ui.canPrompt) return undefined;
        const questionId = this.#asks.nextId("q");
        const question: CodeAgentQuestion = {
          questionId,
          prompt,
          kind,
          ...(choices ? { options: choices.map((label) => ({ key: label, label })) } : {}),
          freeText: kind === "text",
        };
        this.#emit({ type: "question", question });
        if (this.#profile.interaction.question === "suspend") {
          this.#mapper.noteOutcome("awaiting");
          return undefined;
        }
        return (await this.#asks.openQuestion(question)) || undefined;
      },
      notify: (level, message) => this.#emit({ type: "notice", level, message }),
    });
  }
}
