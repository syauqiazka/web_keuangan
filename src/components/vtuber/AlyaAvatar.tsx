"use client";

/**
 * AlyaAvatar.tsx — PNGtuber Alya.
 * Ekspresi diambil dari aset WebP transparan beresolusi asli.
 * Animasi idle berjalan langsung di DOM agar tidak memaksa React render 60x/detik.
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

const CAN_BLINK: Frame[] = ["neutral", "smile", "talking", "blushing"];
const CAN_TALK: Frame[] = ["neutral", "smile"];

interface AlyaAvatarProps {
  state: GuideState;
  isSpeaking: boolean;
}

export function AlyaAvatar({ state, isSpeaking }: AlyaAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(false);

  // Muat dan cache seluruh ekspresi sebelum dibutuhkan.
  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    for (const frame of FRAMES) {
      const image = new Image();
      image.decoding = "async";
      image.src = `${BASE}/${frame}.webp`;
    }
  }, []);

  // Kedip acak. Timer dibersihkan saat komponen dilepas.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;

    const scheduleBlink = () => {
      timer = setTimeout(() => {
        setBlink(true);
        closeTimer = setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 115);
      }, 2600 + Math.random() * 2400);
    };

    scheduleBlink();
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, []);

  // Napas ringan via transform compositor; tidak membuat React render per frame.
  useEffect(() => {
    const node = avatarRef.current;
    if (!node || reduceMotion.current) return;

    let animationFrame = 0;
    const start = performance.now();

    const animate = (now: number) => {
      const offset = Math.sin(((now - start) / 1900) * Math.PI * 2) * 1.7;
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrame);
      node.style.transform = "";
    };
  }, []);

  // Irama mulut lebih natural dan interval berhenti ketika TTS selesai.
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }

    const interval = setInterval(() => {
      setMouthOpen((open) => !open);
    }, 115);

    return () => clearInterval(interval);
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
        ref={avatarRef}
        className="relative aspect-[432/579] h-full max-w-full flex-none"
        style={{ willChange: reduceMotion.current ? "auto" : "transform" }}
      >
        {FRAMES.map((candidate) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={candidate}
            src={`${BASE}/${candidate}.webp`}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-100 ease-out"
            style={{
              opacity: candidate === frame ? 1 : 0,
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
