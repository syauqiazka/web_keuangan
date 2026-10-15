"use client";

/**
 * GuideControls.tsx — Bilah kontrol interaktif VTuber Turguide
 * Sesuai design tokens Bank Saku Digital & DESIGN.md
 */

import React from "react";
import { BookOpen, MessageSquare, Volume2, VolumeX, Minimize2 } from "lucide-react";

interface GuideControlsProps {
  activeTab: "tutorial" | "chat";
  voiceEnabled: boolean;
  onSelectTab: (tab: "tutorial" | "chat") => void;
  onToggleVoice: () => void;
  onMinimize: () => void;
}

export function GuideControls({
  activeTab,
  voiceEnabled,
  onSelectTab,
  onToggleVoice,
  onMinimize,
}: GuideControlsProps) {
  return (
    <div className="flex items-center justify-between border-t border-line bg-canvas p-2 text-xs">
      {/* Tab Navigasi: Panduan vs Tanya AI */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectTab("tutorial")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border text-xs font-medium transition-colors ${
            activeTab === "tutorial"
              ? "bg-text text-on-ink border-text"
              : "bg-panel text-text-2 border-line hover:text-text hover:border-line-strong"
          }`}
          title="Panduan langkah demi langkah"
        >
          <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Panduan</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("chat")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border text-xs font-medium transition-colors ${
            activeTab === "chat"
              ? "bg-text text-on-ink border-text"
              : "bg-panel text-text-2 border-line hover:text-text hover:border-line-strong"
          }`}
          title="Tanya AI seputar penggunaan aplikasi"
        >
          <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Tanya AI</span>
        </button>
      </div>

      {/* Kontrol Utilitas: Suara & Minimize */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleVoice}
          className={`p-1.5 rounded-[4px] border transition-colors ${
            voiceEnabled
              ? "bg-accent/10 border-accent text-accent-text"
              : "bg-panel border-line text-text-3 hover:text-text"
          }`}
          title={voiceEnabled ? "Suara narasi aktif (klik untuk matikan)" : "Suara mati (klik untuk aktifkan)"}
          aria-label={voiceEnabled ? "Matikan suara" : "Aktifkan suara"}
        >
          {voiceEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
          ) : (
            <VolumeX className="w-3.5 h-3.5" strokeWidth={1.5} />
          )}
        </button>

        <button
          type="button"
          onClick={onMinimize}
          className="p-1.5 rounded-[4px] border border-line bg-panel text-text-3 hover:text-text hover:border-line-strong transition-colors"
          title="Perkecil panel panduan"
          aria-label="Perkecil panduan"
        >
          <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
