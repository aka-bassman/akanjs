/** A final result may still arrive after `stop`. */
export interface VoiceListener {
  stop: () => void;
}

/** `done` resolves when the utterance finished or was cancelled. */
export interface VoiceSpeech {
  cancel: () => void;
  done: Promise<void>;
}

export interface VoiceHandlers {
  /** Partial text while the user is still speaking; an engine without interim results never calls it. */
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
}

/** `listen` must run inside the click that starts it: mic permission and iOS's first utterance need a user gesture. */
export interface VoiceEngine {
  listen: (handlers: VoiceHandlers) => VoiceListener;
  /** Handed one markdown-free sentence at a time; the framework queues. */
  speak: (text: string) => VoiceSpeech;
  /** `false` hides the microphone. */
  available?: () => boolean;
}

const fenced = /^ {0,3}(?:```|~~~)/;
const tableRow = /^\s*\|/;
const horizontalRule = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const lineMarkers = /^\s*(?:#{1,6}\s+|>\s?|[-*+]\s+|\d{1,9}[.)]\s+)/;
const image = /!\[([^\]]*)\]\([^)]*\)/g;
const link = /\[([^\]]*)\]\([^)]*\)/g;
const emphasis = /(\*\*\*|\*\*|\*|___|__|_|~~)/g;
const inlineCode = /`([^`]*)`/g;

// Monotonic over a growing source (a fence marker precedes what it swallows), so the reader tracks one offset.
export const speechText = (markdown: string): string => {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const kept: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (fenced.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || tableRow.test(line) || horizontalRule.test(line)) continue;
    const plain = line
      .replace(lineMarkers, "")
      .replace(image, "$1")
      .replace(link, "$1")
      .replace(inlineCode, "$1")
      .replace(emphasis, "");
    kept.push(plain);
  }
  return kept.join("\n");
};

// A terminator counts only with whitespace behind it, so `1.5` is not a sentence and a stream is never cut early.
const sentenceEnd = /[.!?。！？…]+\s|\n/g;

export class VoiceReader {
  readonly #engine: () => VoiceEngine | undefined;
  #queue: string[] = [];
  #current: VoiceSpeech | null = null;
  #offset = 0;

  constructor(engine: () => VoiceEngine | undefined) {
    this.#engine = engine;
  }

  get speaking() {
    return !!this.#current;
  }

  /** Call with the whole answer so far, as often as it changes; already-spoken text is never repeated. */
  feed(source: string) {
    this.#chunk(source, false);
  }

  /** The turn ended: also speaks the last sentence, which has no whitespace behind it. */
  flush(source: string) {
    this.#chunk(source, true);
  }

  /** Queued behind the sentence in flight, outside the tracked answer; Stop still cancels it. */
  say(text: string) {
    this.#enqueue(speechText(text));
    this.#pump();
  }

  cancel() {
    this.#queue = [];
    this.#current?.cancel();
    this.#current = null;
  }

  reset() {
    this.cancel();
    this.#offset = 0;
  }

  #chunk(source: string, final: boolean) {
    const text = speechText(source);
    // A shorter answer than last time is a different answer: a retry, or a cleared transcript.
    if (text.length < this.#offset) this.reset();
    const pending = text.slice(this.#offset);
    sentenceEnd.lastIndex = 0;
    let cut = 0;
    for (let match = sentenceEnd.exec(pending); match; match = sentenceEnd.exec(pending)) {
      const end = match.index + match[0].length;
      this.#enqueue(pending.slice(cut, end));
      cut = end;
    }
    if (final) {
      this.#enqueue(pending.slice(cut));
      cut = pending.length;
    }
    this.#offset += cut;
    this.#pump();
  }

  #enqueue(chunk: string) {
    const text = chunk.trim();
    if (text) this.#queue.push(text);
  }

  #pump() {
    if (this.#current || !this.#queue.length) return;
    const engine = this.#engine();
    if (!engine) {
      this.#queue = [];
      return;
    }
    const next = this.#queue.shift() as string;
    const speech = engine.speak(next);
    this.#current = speech;
    void speech.done.then(() => {
      if (this.#current !== speech) return;
      this.#current = null;
      this.#pump();
    });
  }
}
