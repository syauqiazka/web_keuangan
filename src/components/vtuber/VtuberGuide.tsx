"use client";

/**
 * VtuberGuide.tsx — Komponen Utama VTuber Turguide Bank Saku Digital
 * Menggabungkan Live2D Canvas, State Machine, Panduan Tutorial, AI Companion, dan Audio TTS.
 */

import React, { useReducer, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AlyaAvatar } from "./AlyaAvatar";
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
  const [isPanelOpen, setIsPanelOpen] = useState(true);

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

  // Pola tourguide: kartu percakapan berada di kiri bawah, karakter berdiri
  // sendiri di kanan bawah dengan canvas transparan dan tanpa bingkai/widget.
  return (
    <>
      {isPanelOpen && (
        <aside
          aria-label="Panduan Interaktif VTuber"
          className="pointer-events-auto fixed bottom-3 left-3 z-40 flex max-h-[min(68vh,560px)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-[18px] border border-line bg-canvas shadow-[0_12px_36px_rgba(0,0,0,0.2)] sm:bottom-5 sm:left-5"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Panduan
              </span>
              <span className="font-mono text-[11px] text-text-3">
                {activeTab === "tutorial"
                  ? `${Math.min(state.tutorialStepIndex + 1, currentTutorial.steps.length)}/${currentTutorial.steps.length}`
                  : "Tanya AI"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className="rounded-full p-1.5 text-text-3 transition-colors hover:bg-panel hover:text-text"
                title={voiceEnabled ? "Matikan suara" : "Nyalakan suara"}
                aria-label={voiceEnabled ? "Matikan suara" : "Nyalakan suara"}
              >
                {voiceEnabled ? (
                  <span className="text-sm">♫</span>
                ) : (
                  <span className="text-sm">♩</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleClosePanel}
                className="rounded-full p-1.5 text-text-3 transition-colors hover:bg-panel hover:text-text"
                title="Tutup panduan"
                aria-label="Tutup panduan"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-1">
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

          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="px-2 py-1 text-[11px] font-medium text-text-3 transition-colors hover:text-text"
            >
              Lewati tur
            </button>
            <div className="flex items-center gap-1 rounded-full border border-line p-1">
              <button
                type="button"
                onClick={() => setActiveTab("tutorial")}
                aria-pressed={activeTab === "tutorial"}
                className={`rounded-full px-3 py-1 text-[11px] transition-colors ${activeTab === "tutorial" ? "bg-text text-on-ink" : "text-text-2 hover:bg-panel"}`}
              >
                Panduan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                aria-pressed={activeTab === "chat"}
                className={`rounded-full px-3 py-1 text-[11px] transition-colors ${activeTab === "chat" ? "bg-text text-on-ink" : "text-text-2 hover:bg-panel"}`}
              >
                Tanya AI
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className="pointer-events-none fixed right-0 bottom-0 z-40 flex items-end justify-end">
        <button
          type="button"
          onClick={isPanelOpen ? handleClosePanel : handleOpenPanel}
          aria-label={isPanelOpen ? "Tutup panduan VTuber" : "Buka panduan dan Tanya AI"}
          aria-expanded={isPanelOpen}
          className="pointer-events-auto relative block w-[132px] cursor-pointer appearance-none border-0 bg-transparent p-0 shadow-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-[208px] lg:w-[252px]"
          title={isPanelOpen ? "Tutup panduan" : "Buka panduan dan Tanya AI"}
        >
          <div className="relative h-[220px] w-full overflow-visible bg-transparent sm:h-[340px] lg:h-[415px]">
            <AlyaAvatar state={state.current} isSpeaking={isSpeaking} />
          </div>
        </button>
      </div>
    </>
  );
}
