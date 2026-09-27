"use client";
import { useEffect, useRef, useState } from "react";
import type { AgentSession } from "use-agentic";
import { type VoiceEngine, type VoiceListener, VoiceReader } from "./voice";

interface ChatVoiceSetup {
  session: AgentSession;
  engine?: VoiceEngine;
  version: number;
  onTranscript: (text: string) => void;
  onFailed: () => void;
}

// A reply, and a question or approval the loop parked on, is read aloud only when the ask arrived by voice.
export const useChatVoice = ({ session, engine, version, onTranscript, onFailed }: ChatVoiceSetup) => {
  const [listening, setListening] = useState(false);
  // Always-latest: the engine a hook returns may be a new object each render, and the reader outlives them all.
  const held = useRef<VoiceEngine | undefined>(engine);
  held.current = engine;
  const listener = useRef<VoiceListener | null>(null);
  const reader = useRef<VoiceReader | null>(null);
  reader.current ??= new VoiceReader(() => held.current);
  const byVoice = useRef(false);
  // The assistant message being read aloud and where its turn began; null when this turn is not read.
  const spoken = useRef<{ at: number; from: number } | null>(null);
  const announced = useRef<string | null>(null);
  const heard = useRef(0);
  useEffect(() => {
    const speaker = reader.current;
    // A shorter transcript is a cleared or retried one — /new must not leave the last answer still being read.
    if (session.messages.length < heard.current) {
      speaker?.reset();
      spoken.current = null;
    }
    heard.current = session.messages.length;
    if (!speaker) return;
    const parked = session.pendingQuestion ?? session.pendingApproval;
    if (!parked) announced.current = null;
    else if (spoken.current && announced.current !== parked.callId) {
      announced.current = parked.callId;
      speaker.say("question" in parked ? parked.question : parked.message);
    }
    const reading = spoken.current;
    if (!reading) return;
    const at = session.messages.findLastIndex(
      (message, idx) => idx >= reading.from && message.role === "assistant" && !message.local && !!message.text,
    );
    if (at < 0) return;
    if (at !== reading.at) {
      speaker.reset();
      reading.at = at;
    }
    const text = session.messages[at].text ?? "";
    if (session.isRunning) speaker.feed(text);
    else {
      speaker.flush(text);
      spoken.current = null;
    }
  }, [version]);
  useEffect(
    () => () => {
      listener.current?.stop();
      reader.current?.cancel();
    },
    [],
  );
  // One press is one utterance, so the engine is told to stop even after it reported a final result itself.
  const endListening = () => {
    const running = listener.current;
    listener.current = null;
    running?.stop();
    setListening(false);
  };
  const silence = () => {
    reader.current?.cancel();
    spoken.current = null;
  };
  const lift = () => {
    const was = byVoice.current;
    byVoice.current = false;
    return was;
  };
  return {
    listening,
    canListen: !!engine && (engine.available?.() ?? true),
    silence,
    lift,
    hold: (spokenAsk: boolean) => {
      byVoice.current ||= spokenAsk;
    },
    take: (spokenAsk = lift()) => {
      // From the transcript's current end: the last answer on screen belongs to the previous ask, not this one.
      spoken.current = spokenAsk ? { at: -1, from: session.messages.length } : null;
    },
    toggle: () => {
      if (listener.current) {
        endListening();
        return;
      }
      const voiceEngine = held.current;
      if (!voiceEngine) return;
      silence();
      listener.current = voiceEngine.listen({
        onInterim: onTranscript,
        onFinal: (text) => {
          onTranscript(text);
          byVoice.current = true;
          endListening();
        },
        onError: (message) => {
          console.warn(`[akan] voice input failed: ${message}`);
          onFailed();
          endListening();
        },
      });
      setListening(true);
    },
  };
};
