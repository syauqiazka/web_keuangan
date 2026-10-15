"use client";

/**
 * GuideChat.tsx — Antarmuka tanya-jawab AI Companion
 * Menjawab pertanyaan spesifik mengenai alur penggunaan Bank Saku Digital
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "./guide-types";

interface GuideChatProps {
  messages: ChatMessage[];
  isThinking: boolean;
  errorMessage: string | null;
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  "Bagaimana cara input pemasukan?",
  "Apa beda metode TF dan ST?",
  "Cara salin-tempel dari Excel?",
  "Kenapa nominal berwarna merah?",
];

export function GuideChat({
  messages,
  isThinking,
  errorMessage,
  onSendMessage,
}: GuideChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-[230px] text-xs">
      {/* Riwayat Percakapan */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-[4px] px-3 py-2 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-text text-on-ink"
                  : "bg-panel border border-line text-text"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-text-3 font-mono mt-0.5 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 p-2 rounded-[4px] bg-panel border border-line text-text-3 text-[11px] w-fit">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" strokeWidth={1.5} />
            <span>Sedang menganalisis jawaban...</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-1.5 p-2 rounded-[4px] bg-danger/10 border border-danger text-danger text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Prompts jika pesan masih sedikit */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isThinking}
              onClick={() => {
                if (!isThinking) onSendMessage(prompt);
              }}
              className="px-2 py-0.5 rounded-[2px] bg-panel border border-line text-[10px] text-text-3 hover:text-text hover:border-line-strong transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-line bg-canvas flex items-center gap-1.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan cara penggunaan..."
          disabled={isThinking}
          maxLength={300}
          className="flex-1 bg-panel border border-line px-2.5 py-1.5 rounded-[2px] text-xs text-text placeholder:text-text-3 focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-1.5 rounded-[2px] bg-text text-on-ink hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-opacity"
          aria-label="Kirim pertanyaan"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </form>
    </div>
  );
}
