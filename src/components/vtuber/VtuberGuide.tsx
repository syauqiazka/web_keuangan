"use client";

/**
 * VtuberGuide.tsx — Komponen Utama VTuber Turguide Bank Saku Digital
 * Menggabungkan Live2D Canvas, State Machine, Panduan Tutorial, AI Companion, dan Audio TTS.
 */

import React, { useReducer, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ChevronUp, Bot } from "lucide-react";
import { VtuberCanvas } from "./VtuberCanvas";
import { GuideControls } from "./GuideControls";
import { GuideTutorial } from "./GuideTutorial";
import { GuideChat } from "./GuideChat";
import { guideReducer, initialMachineState } from "./guide-machine";
import { getTutorialForPath } from "./guide-tutorials";
import { ChatMessage } from "./guide-types";

export function VtuberGuide() {
  const pathname = usePathname();
  const [state, dispatch] = useReducer(guideReducer, initialMachineState);

  // Tab aktif di panel bawah: "tutorial" atau "chat"
  const [activeTab, setActiveTab] = useState<"tutorial" | "chat">("tutorial");

  // TTS State
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakTextRef = useRef<(text: string) => void>(() => {});

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Tutorial kontekstual saat ini
  const currentTutorial = getTutorialForPath(pathname || "/dashboard");

  // Inisialisasi Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Fungsi Narasi Suara
  const speakText = useCallback(
    (text: string) => {
      const synth = synthRef.current;
      if (
        !voiceEnabled ||
        !synth ||
        typeof window === "undefined" ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        return;
      }

      synth.cancel();

      // Hapus karakter markdown atau simbol
      const cleanText = text.replace(/[*_#`~[\]]/g, "").trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Pilih suara Indonesia jika tersedia.
      const voices = synth.getVoices();
      const idVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("id"));
      if (idVoice) utterance.voice = idVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        dispatch({ type: "START_SPEAKING" });
      };

      const finishSpeaking = () => {
        setIsSpeaking(false);
        dispatch({ type: "FINISH_SPEAKING" });
      };
      utterance.onend = finishSpeaking;
      utterance.onerror = finishSpeaking;

      synth.speak(utterance);
    },
    [voiceEnabled]
  );

  // Referensi terbaru mencegah perubahan toggle suara mengulang greeting otomatis.
  speakTextRef.current = speakText;

  // Greeting otomatis saat halaman dibuka atau rute berubah.
  useEffect(() => {
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const greetingTimer = setTimeout(() => {
      const greetingMsg = `Halo! Selamat datang di Bank Saku Digital. Saya siap memandu Anda di halaman ${currentTutorial.pageTitle}.`;
      setMessages([
        {
          id: "msg-welcome",
          sender: "guide",
          text: greetingMsg,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      dispatch({ type: "GREET" });
      speakTextRef.current(greetingMsg);

      finishTimer = setTimeout(() => {
        dispatch({ type: "FINISH_GREET" });
      }, 3500);
    }, 1200);

    return () => {
      clearTimeout(greetingTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [currentTutorial.pageTitle]);

  // Hentikan narasi hanya saat rute berubah, bukan setiap state mesin berubah.
  useEffect(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, [pathname]);

  // Saat panel diminimalkan, hentikan suara agar tidak berbicara di latar belakang.
  useEffect(() => {
    if (state.current !== "minimized") return;
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, [state.current]);

  // Toggle Suara
  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    if (!nextVal && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Navigasi Tutorial
  const handleNextStep = () => {
    dispatch({ type: "NEXT_TUTORIAL_STEP" });
    const nextIdx = state.tutorialStepIndex + 1;
    if (nextIdx < currentTutorial.steps.length) {
      const step = currentTutorial.steps[nextIdx];
      speakText(`${step.title}. ${step.description}`);
    }
  };

  const handlePrevStep = () => {
    dispatch({ type: "PREV_TUTORIAL_STEP" });
    const prevIdx = Math.max(0, state.tutorialStepIndex - 1);
    const step = currentTutorial.steps[prevIdx];
    speakText(`${step.title}. ${step.description}`);
  };

  const handleResetTutorial = () => {
    dispatch({ type: "START_TUTORIAL" });
    const step = currentTutorial.steps[0];
    speakText(`${step.title}. ${step.description}`);
  };

  const handleFinishTutorial = () => {
    dispatch({ type: "EXIT_TUTORIAL" });
    speakText("Panduan selesai. Anda sekarang siap mencatat transaksi!");
  };

  // Kirim Pesan ke AI Server API
  const handleSendMessage = async (text: string) => {
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setChatError(null);
    dispatch({ type: "START_THINKING" });

    try {
      const res = await fetch("/api/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          currentPath: pathname || "/dashboard",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungi asisten AI.");
      }

      const guideMsg: ChatMessage = {
        id: `guide-${Date.now()}`,
        sender: "guide",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, guideMsg]);
      speakText(data.reply);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pertanyaan.";
      setChatError(errText);
      dispatch({ type: "SET_ERROR", message: errText });
    } finally {
      setIsThinking(false);
      if (state.current === "thinking") {
        dispatch({ type: "CLEAR_ERROR" });
      }
    }
  };

  // Tampilan Minimized (Floating Pill Button)
  if (state.current === "minimized") {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => dispatch({ type: "RESTORE" })}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-[4px] border border-line bg-canvas text-text shadow-sm hover:border-line-strong hover:bg-panel transition-colors group"
          title="Buka panduan VTuber"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <Bot className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <span className="text-xs font-medium">Turguide</span>
          <ChevronUp className="w-3.5 h-3.5 text-text-3 group-hover:text-text transition-colors" strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  // Tampilan Full Panel
  return (
    <aside
      aria-label="Panduan Interaktif VTuber"
      className="fixed bottom-4 right-4 z-40 w-[310px] sm:w-[330px] rounded-[8px] border border-line bg-canvas shadow-lg overflow-hidden flex flex-col font-sans transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-panel text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-medium text-text">Turguide Digital</span>
          <span className="text-[10px] text-text-3 font-mono px-1 py-0.5 rounded border border-line">
            v1.0
          </span>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "MINIMIZE" })}
          className="p-1 rounded-[2px] text-text-3 hover:text-text hover:bg-canvas transition-colors"
          title="Sembunyikan"
          aria-label="Sembunyikan panduan"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Area Canvas VTuber Live2D / Avatar */}
      <div className="relative w-full h-[180px] bg-panel/40 border-b border-line flex items-center justify-center">
        <VtuberCanvas
          state={state.current}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Konten Tab Aktif: Panduan atau Chat AI */}
      <div className="bg-canvas">
        {activeTab === "tutorial" ? (
          <GuideTutorial
            tutorial={currentTutorial}
            currentStepIndex={state.tutorialStepIndex}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onReset={handleResetTutorial}
            onFinish={handleFinishTutorial}
          />
        ) : (
          <GuideChat
            messages={messages}
            isThinking={isThinking}
            errorMessage={chatError}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>

      {/* Bilah Kontrol di Bagian Bawah */}
      <GuideControls
        activeTab={activeTab}
        voiceEnabled={voiceEnabled}
        onSelectTab={setActiveTab}
        onToggleVoice={handleToggleVoice}
        onMinimize={() => dispatch({ type: "MINIMIZE" })}
      />
    </aside>
  );
}
