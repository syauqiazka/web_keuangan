/**
 * Motion Presets — Bank Saku Digital
 * Sumber tunggal untuk semua variant, durasi, dan easing animasi.
 * Diimpor oleh komponen motion; tidak berisi kode React.
 */

import type { Variants, Transition } from "motion/react";

// ─── Durasi & Easing Baku ────────────────────────────────────────────────────

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

/** Fade + geser dari bawah — default untuk elemen masuk */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: tEnter },
  exit: { opacity: 0, y: -8, transition: tFast },
};

/** Fade + geser dari kiri */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
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
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...EASE.springGentle, duration: DURATION.enter },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: DURATION.fast, ease: EASE.accel },
  },
};

/** Slide dari kanan — untuk toast */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...EASE.spring, duration: DURATION.enter },
  },
  exit: {
    opacity: 0,
    x: 48,
    scale: 0.96,
    transition: { duration: DURATION.fast, ease: EASE.accel },
  },
};

/** Stagger container — set delay antar anak */
export function staggerContainer(delayMs = 0.06): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delayMs,
        delayChildren: 0.05,
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

/** Batang grafik tumbuh dari bawah via scaleY */
export const barGrow: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: (delay: number = 0) => ({
    scaleY: 1,
    opacity: 1,
    transition: {
      scaleY: {
        type: "spring",
        stiffness: 280,
        damping: 22,
        delay,
      },
      opacity: { duration: 0.2, delay },
    },
  }),
};

// ─── Variants Tombol ─────────────────────────────────────────────────────────

export const buttonTap = { scale: 0.97 } as const;
export const buttonHover = { scale: 1.01 } as const;
export const buttonTransition: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
};
