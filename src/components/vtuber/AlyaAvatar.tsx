"use client";

/**
 * AlyaAvatar.tsx — Avatar Turguide "Alya" berbasis gambar ekspresi (PNGtuber).
 * Ekspresi diganti sesuai state guide; kedip dan napas otomatis; mulut berganti saat bicara.
 * Tanpa Live2D Cubism Core, jadi tidak ada ketergantungan lisensi runtime.
 */

import { useEffect, useRef, useState } from "react";
import type { GuideState } from "./guide-types";

type Frame =
  | "neutral"
  | "smile"
  | "happy"
  | "surprised"
  | "talking"
  | "blushing"
  | "laughing"
  | "blink";

const BASE = "/vtuber/alya";
const FRAMES: Frame[] = [
  "neutral",
  "smile",
  "happy",
  "surprised",
  "talking",
  "blushing",
  "laughing",
  "blink",
];

/** Ekspresi dasar per state guide (saat mulut tertutup). */
const EXPRESSION: Record<GuideState, Frame> = {
  idle: "neutral",
  greeting: "happy",
  tutorial: "smile",
  listening: "neutral",
  thinking: "neutral",
  speaking: "smile",
  error: "surprised",
  minimized: "neutral",
};

/** Ekspresi yang boleh diganti frame kedip / bicara tanpa terlihat janggal. */
const CAN_BLINK: Frame[] = ["neutral", "smile", "talking", "blushing"];
const CAN_TALK: Frame[] = ["neutral", "smile"];

interface AlyaAvatarProps {
  state: GuideState;
  isSpeaking: boolean;
}

export function AlyaAvatar({ state, isSpeaking }: AlyaAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [breathe, setBreathe] = useState(0);
  const reduceMotion = useRef(false);

  // Pramuat semua frame supaya tidak berkedip saat pertama berganti.
  useEffect(() => {
    for (const f of FRAMES) {
      const img = new Image();
      img.src = `${BASE}/${f}.webp`;
    }
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Kedip acak tiap 2,5–5 detik.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let inner: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        inner = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 130);
      }, 2500 + Math.random() * 2500);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(inner);
    };
  }, []);

  // Napas halus.
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (!reduceMotion.current) setBreathe(Math.sin((now - t0) / 800) * 2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mulut bergantian terbuka/tertutup selama bicara.
  useEffect(() => {
    if (!isSpeaking) return;
    const id = setInterval(() => setMouthOpen((v) => !v), 140);
    return () => clearInterval(id);
  }, [isSpeaking]);

  const base = EXPRESSION[state];
  let frame: Frame = base;
  if (isSpeaking && mouthOpen && CAN_TALK.includes(base)) frame = "talking";
  if (blink && CAN_BLINK.includes(frame)) frame = "blink";

  return (
    <div
      className="pointer-events-none relative flex h-full w-full select-none items-end justify-center bg-transparent"
      aria-hidden="true"
    >
      <div
        className="relative aspect-[144/193] h-full max-w-full"
        style={{ transform: `translateY(${breathe}px)` }}
      >
        {FRAMES.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={f}
            src={`${BASE}/${f}.webp`}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain object-bottom"
            style={{ opacity: f === frame ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}
