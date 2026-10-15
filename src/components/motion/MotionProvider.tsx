"use client";

/**
 * MotionProvider — menyediakan context prefers-reduced-motion
 * ke seluruh pohon komponen.
 *
 * Dipakai oleh komponen motion untuk menonaktifkan animasi
 * ketika pengguna mengaktifkan "Reduce motion" di OS.
 */

import * as React from "react";
import { useReducedMotion } from "motion/react";

interface MotionContextValue {
  reducedMotion: boolean;
}

const MotionContext = React.createContext<MotionContextValue>({
  reducedMotion: false,
});

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  const value = React.useMemo(
    () => ({ reducedMotion: Boolean(prefersReduced) }),
    [prefersReduced]
  );
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotionContext() {
  return React.useContext(MotionContext);
}
