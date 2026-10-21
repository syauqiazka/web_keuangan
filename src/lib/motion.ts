/**
 * Motion Presets — Bank Saku Digital
 * GSAP & Motion presets terinspirasi oleh kualitas motion design Atmos Gallery.
 * Responsif, halus, presisi, dan menghormati prefers-reduced-motion.
 */

import gsap from "gsap";
import type { Variants, Transition } from "motion/react";

// ─── GSAP Durasi & Easing Baku (Atmos Style) ────────────────────────────────

export const GSAP_DURATION = {
  micro: 0.18,
  fast: 0.28,
  base: 0.45,
  enter: 0.6,
  blurReveal: 0.75,
  slow: 0.85,
  counter: 0.8,
} as const;

export const GSAP_EASE = {
  /** Editorial curve - crisp entrance ala Atmos */
  atmos: "power3.out",
  /** Smooth standard UI easing */
  smooth: "power2.out",
  /** Precision exponential deceleration */
  editorial: "expo.out",
  /** Akselerasi saat keluar */
  exit: "power2.in",
  /** Subtle spring untuk hover/tap micro-interactions */
  spring: "back.out(1.4)",
} as const;

/**
 * Cek preferensi reduced-motion di browser secara aman (SSR-safe).
 */
export function checkReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Durasi & Easing Baku (Motion Library) ───────────────────────────────────

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  enter: 0.38,
  slow: 0.55,
} as const;

export const EASE = {
  /** Decelerate saat masuk — terasa "jatuh ke posisi" */
  decel: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Akselerasi saat keluar */
  accel: [0.4, 0, 1, 0.8] as [number, number, number, number],
  /** Standar transisi UI */
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Spring preset: responsif, sedikit bounce */
  spring: { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.8 },
  /** Spring lambat: untuk modal dan overlay */
  springGentle: { type: "spring" as const, stiffness: 280, damping: 30, mass: 1 },
};

// ─── Transition Baku ─────────────────────────────────────────────────────────

export const tBase: Transition = {
  duration: DURATION.base,
  ease: EASE.standard,
};

export const tEnter: Transition = {
  duration: DURATION.enter,
  ease: EASE.decel,
};

export const tFast: Transition = {
  duration: DURATION.fast,
  ease: EASE.standard,
};

// ─── Variants Entrance ───────────────────────────────────────────────────────

/** Fade + geser vertikal pendek — Atmos entrance */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: tEnter },
  exit: { opacity: 0, y: -8, transition: tFast },
};

/** Fade + geser dari kiri */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: tEnter },
  exit: { opacity: 0, x: -12, transition: tFast },
};

/** Fade sederhana — untuk overlay */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tBase },
  exit: { opacity: 0, transition: tFast },
};

/** Scale + fade — untuk modal/dialog */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...EASE.springGentle, duration: DURATION.enter },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: DURATION.fast, ease: EASE.accel },
  },
};

/** Slide dari kanan — untuk toast */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...EASE.spring, duration: DURATION.enter },
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.96,
    transition: { duration: DURATION.fast, ease: EASE.accel },
  },
};

/** Stagger container — set delay antar anak */
export function staggerContainer(delaySec = 0.06): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delaySec,
        delayChildren: 0.04,
      },
    },
  };
}

/** Stagger item — dipakai sebagai anak staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, ease: EASE.decel },
  },
};

// ─── Variants Bar Chart ──────────────────────────────────────────────────────

export const barGrow: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: (delay: number = 0) => ({
    scaleY: 1,
    opacity: 1,
    transition: {
      scaleY: {
        type: "spring",
        stiffness: 280,
        damping: 24,
        delay,
      },
      opacity: { duration: 0.2, delay },
    },
  }),
};

// ─── Variants Tombol ─────────────────────────────────────────────────────────

export const buttonTap = { scale: 0.98 } as const;
export const buttonHover = { scale: 1.01 } as const;
export const buttonTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
};

export { gsap };
