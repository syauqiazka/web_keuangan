"use client";

/**
 * VtuberGuide.tsx — Komponen Utama VTuber Turguide Bank Saku Digital
 * Menggabungkan Live2D Canvas, State Machine, Panduan Tutorial, AI Companion, dan Audio TTS.
 */

import React, { useReducer, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Bot } from "lucide-react";
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
  // Avatar selalu mengambang; panel panduan dibuka terpisah saat avatar ditekan.
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
        state.current === "minimized" ||
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
    [voiceEnabled, state.current]
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
    dispatch({ type: "FINISH_SPEAKING" });
  }, [pathname]);

  // Saat panel diminimalkan, hentikan suara agar tidak berbicara di latar belakang.
  useEffect(() => {
    if (state.current !== "minimized") return;
    synthRef.current?.cancel();
    setIsSpeaking(false);
    dispatch({ type: "FINISH_SPEAKING" });
    dispatch({ type: "FINISH_THINKING" });
    dispatch({ type: "FINISH_GREET" });
  }, [state.current]);

  // Toggle Suara
  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    if (!nextVal && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      dispatch({ type: "FINISH_SPEAKING" });
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
      // Selesaikan status berpikir walaupun suara dimatikan atau tidak didukung
      // browser. Jika TTS mulai setelah ini, START_SPEAKING akan mengambil alih.
      dispatch({ type: "FINISH_THINKING" });
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

  const handleOpenPanel = () => {
    if (state.current === "minimized") {
      dispatch({ type: "RESTORE" });
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    if (state.current !== "minimized") {
      dispatch({ type: "MINIMIZE" });
    }
  };

  // Karakter tetap mengambang di luar panel. Panel hanya berisi panduan / chat.
  return (
    <div className="pointer-events-none fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-40 flex max-w-[calc(100vw-16px)] items-end justify-end gap-1.5 sm:gap-3 font-sans">
      {isPanelOpen && (
        <aside
          aria-label="Panduan Interaktif VTuber"
          className="pointer-events-auto flex max-h-[min(76vh,680px)] w-[calc(100vw-126px)] max-w-[320px] flex-col overflow-hidden rounded-[8px] border border-line bg-canvas shadow-xl sm:w-[320px]"
        >
          <div className="flex items-center justify-between border-b border-line bg-panel px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-medium text-text">Turguide Digital</span>
              <span className="rounded border border-line px-1 py-0.5 font-mono text-[10px] text-text-3">
                v1.0
              </span>
            </div>
            <button
              type="button"
              onClick={handleClosePanel}
              className="rounded-[2px] p-1 text-text-3 transition-colors hover:bg-canvas hover:text-text"
              title="Tutup panel panduan"
              aria-label="Tutup panel panduan"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-canvas">
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

          <GuideControls
            activeTab={activeTab}
            voiceEnabled={voiceEnabled}
            onSelectTab={setActiveTab}
            onToggleVoice={handleToggleVoice}
            onMinimize={handleClosePanel}
          />
        </aside>
      )}

      <div className={`pointer-events-auto relative flex shrink-0 flex-col items-center justify-end ${isPanelOpen ? "w-[108px] sm:w-[160px]" : "w-[174px] sm:w-[230px]"}`}>
        <button
          type="button"
          onClick={isPanelOpen ? handleClosePanel : handleOpenPanel}
          aria-label={isPanelOpen ? "Tutup panduan VTuber" : "Buka panduan dan Tanya AI"}
          aria-expanded={isPanelOpen}
          className="group relative block w-full cursor-pointer rounded-t-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          title={isPanelOpen ? "Tutup panduan" : "Klik karakter untuk membuka panduan"}
        >
          {!isPanelOpen && (
            <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-canvas/95 px-3 py-1 text-[11px] font-medium text-text shadow-sm backdrop-blur-sm">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
              Turguide · Klik untuk bicara
            </span>
          )}
          <div
            className={`relative w-full overflow-visible ${isPanelOpen ? "h-[205px] sm:h-[260px]" : "h-[270px] sm:h-[350px]"}`}
          >
            <VtuberCanvas state={state.current} isSpeaking={isSpeaking} />
          </div>
        </button>

        {isPanelOpen && (
          <div className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-full border border-line bg-canvas/95 px-2 py-1.5 text-[10px] text-text-2 shadow-sm backdrop-blur-sm sm:text-xs">
            <Bot className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.5} />
            <span className="truncate">Turguide Digital</span>
          </div>
        )}
      </div>
    </div>
  );
}
