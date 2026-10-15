"use client";

/**
 * AnimatedNumber — menampilkan angka dengan transisi counter.
 * Nilai akhir selalu tepat sama dengan prop `value`.
 * Angka diformat menggunakan fungsi `format` yang diberikan.
 */

import * as React from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "motion/react";
import { EASE, DURATION } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString("id-ID"),
  className,
  duration = DURATION.slow,
}: AnimatedNumberProps) {
  const prefersReduced = useReducedMotion();

  // MotionValue selalu dimulai dari 0; jika reduced-motion, mulai langsung dari value
  const motionVal = useMotionValue(prefersReduced ? value : 0);
  const rounded = useTransform(motionVal, (latest) =>
    format(Math.round(latest))
  );

  // Display state diupdate via subscription, bukan setState langsung di effect
  const [display, setDisplay] = React.useState(format(prefersReduced ? value : 0));

  // Langganan perubahan rounded untuk update display
  React.useEffect(() => {
    const unsub = rounded.on("change", setDisplay);
    return unsub;
  }, [rounded]);

  // Animasi counter saat value berubah
  React.useEffect(() => {
    if (prefersReduced) {
      // Langsung update via MotionValue agar subscription ter-trigger
      motionVal.set(value);
      return;
    }
    const controls = animate(motionVal, value, {
      duration,
      ease: EASE.decel,
    });
    return () => controls.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReduced]);

  return <span className={className}>{display}</span>;
}
