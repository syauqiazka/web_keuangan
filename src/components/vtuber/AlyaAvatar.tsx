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
// Ganti versi ketika aset WebP resolusi tinggi dipasang agar cache lama tidak dipakai.
const ASSET_VERSION = "2";
const frameSrc = (frame: Frame) => `${BASE}/${frame}.webp?v=${ASSET_VERSION}`;
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
      image.src = frameSrc(frame);
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
      const phase = ((now - start) / 2100) * Math.PI * 2;
      const offset = Math.sin(phase) * 2.2;
      const sway = Math.sin(phase * 0.5) * 0.35;
      const breathe = 1 + Math.sin(phase) * 0.002;
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) rotate(${sway.toFixed(3)}deg) scale(${breathe.toFixed(4)})`;
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
        className="relative h-full w-full flex-none"
        style={{ willChange: reduceMotion.current ? "auto" : "transform" }}
      >
        {FRAMES.map((candidate) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={candidate}
            src={frameSrc(candidate)}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-100 ease-linear"
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
