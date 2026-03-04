"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VoiceState =
  | { status: "idle" }
  | { status: "listening" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

type SpeechRecognitionLike = any;

function getSpeechRecognitionCtor(): any {
  // Safari may expose webkitSpeechRecognition
  return (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition || null;
}

export function useVoiceInput(opts?: { lang?: string; maxMs?: number }) {
  const lang = opts?.lang ?? "en-US";
  const maxMs = opts?.maxMs ?? 30000;

  const [voice, setVoice] = useState<VoiceState>({ status: "idle" });
  const [transcript, setTranscript] = useState<string>("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);

  const supported = useMemo(() => !!getSpeechRecognitionCtor(), []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {}
    recRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVoice((v) => (v.status === "listening" ? { status: "idle" } : v));
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoice({ status: "unsupported" });
      return;
    }

    try {
      const rec = new Ctor();
      recRef.current = rec;
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => setVoice({ status: "listening" });

      rec.onerror = (e: any) => {
        const msg = e?.error || e?.message || "Voice error";
        setVoice({ status: "error", message: String(msg) });
        stop();
      };

      rec.onend = () => {
        setVoice((v) => (v.status === "listening" ? { status: "idle" } : v));
      };

      rec.onresult = (event: any) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript ?? "";
          if (res.isFinal) finalText += text;
          else interimText += text;
        }

        setTranscript((prev) => {
          const base = prev.replace(/\s+$/g, "");
          const add = (finalText || interimText).trim();
          if (!add) return prev;
          return (base ? base + " " : "") + add;
        });
      };

      rec.start();
      timerRef.current = window.setTimeout(() => stop(), maxMs) as unknown as number;
    } catch (e: any) {
      setVoice({ status: "error", message: e?.message || "Unable to start voice" });
      stop();
    }
  }, [lang, maxMs, stop]);

  useEffect(() => () => stop(), [stop]);

  const toggle = useCallback(() => {
    if (voice.status === "listening") stop();
    else start();
  }, [voice.status, start, stop]);

  return { supported, voice, transcript, setTranscript, start, stop, toggle };
}
